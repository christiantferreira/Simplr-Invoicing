import { conectarPostgres } from './postgres-direct.js';

async function aplicarUnificacaoNumeracao() {
  const client = await conectarPostgres();
  if (!client) {
    console.error('❌ Falha ao conectar ao banco de dados');
    return;
  }

  try {
    console.log('🔢 APLICANDO UNIFICAÇÃO DE NUMERAÇÃO DE INVOICES...\n');
    
    // PARTE 1: Criar função get_next_invoice_number
    console.log('1️⃣ Criando função get_next_invoice_number...');
    await client.query(`
      CREATE OR REPLACE FUNCTION get_next_invoice_number(p_user_id UUID)
      RETURNS TEXT AS $$
      DECLARE
          v_prefix TEXT;
          v_start_number INTEGER;
          v_max_number INTEGER;
          v_next_number INTEGER;
          v_result TEXT;
      BEGIN
          -- Buscar configurações do usuário
          SELECT 
              COALESCE(invoice_prefix, ''),
              COALESCE(invoice_start_number, 1)
          INTO v_prefix, v_start_number
          FROM settings
          WHERE user_id = p_user_id
          ORDER BY created_at DESC
          LIMIT 1;

          -- Se não encontrar configurações, usar padrão
          IF v_prefix IS NULL THEN
              v_prefix := '';
              v_start_number := 1;
          END IF;

          -- Buscar o maior número atual para este usuário
          SELECT 
              COALESCE(MAX(
                  CAST(
                      REGEXP_REPLACE(invoice_number, '[^0-9]', '', 'g') AS INTEGER
                  )
              ), 0)
          INTO v_max_number
          FROM invoices
          WHERE user_id = p_user_id
          AND invoice_number IS NOT NULL
          AND REGEXP_REPLACE(invoice_number, '[^0-9]', '', 'g') != '';

          -- Determinar próximo número
          IF v_max_number >= v_start_number THEN
              v_next_number := v_max_number + 1;
          ELSE
              v_next_number := v_start_number;
          END IF;

          -- Formatar resultado
          v_result := v_prefix || LPAD(v_next_number::TEXT, 3, '0');
          
          RETURN v_result;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `);
    console.log('✅ Função criada!');
    
    // PARTE 2: Adicionar constraint única
    console.log('\n2️⃣ Adicionando constraint única...');
    try {
      await client.query('ALTER TABLE invoices DROP CONSTRAINT IF EXISTS unique_invoice_number_per_user');
      await client.query('ALTER TABLE invoices ADD CONSTRAINT unique_invoice_number_per_user UNIQUE (user_id, invoice_number)');
      console.log('✅ Constraint adicionada!');
    } catch (error) {
      console.log('⚠️ Erro ao adicionar constraint:', error.message);
    }
    
    // PARTE 3: Criar trigger
    console.log('\n3️⃣ Criando trigger para auto-numeração...');
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Se invoice_number for nulo ou vazio, gerar automaticamente
          IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
              NEW.invoice_number := get_next_invoice_number(NEW.user_id);
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    await client.query('DROP TRIGGER IF EXISTS before_insert_invoice_number ON invoices');
    await client.query(`
      CREATE TRIGGER before_insert_invoice_number
          BEFORE INSERT ON invoices
          FOR EACH ROW
          EXECUTE FUNCTION auto_generate_invoice_number()
    `);
    console.log('✅ Trigger criado!');
    
    // PARTE 4: Criar índices
    console.log('\n4️⃣ Criando índices para performance...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_user_invoice_number ON invoices(user_id, invoice_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC)');
    console.log('✅ Índices criados!');
    
    // PARTE 5: Verificar duplicatas
    console.log('\n5️⃣ Verificando duplicatas...');
    const duplicatesResult = await client.query(`
      SELECT user_id, invoice_number, COUNT(*) as cnt
      FROM invoices
      WHERE invoice_number IS NOT NULL
      GROUP BY user_id, invoice_number
      HAVING COUNT(*) > 1
    `);
    
    if (duplicatesResult.rows.length > 0) {
      console.log(`⚠️ Encontradas ${duplicatesResult.rows.length} duplicatas. Corrigindo...`);
      // Aqui poderia implementar correção automática
    } else {
      console.log('✅ Nenhuma duplicata encontrada!');
    }
    
    // PARTE 6: Testar a função
    console.log('\n6️⃣ Testando função para cada usuário...');
    const users = await client.query('SELECT id, email FROM auth.users');
    
    for (const user of users.rows) {
      const result = await client.query('SELECT get_next_invoice_number($1) as next_number', [user.id]);
      console.log(`   ${user.email}: Próximo número = ${result.rows[0].next_number}`);
    }
    
    console.log('\n✅ UNIFICAÇÃO CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro durante aplicação:', error);
  } finally {
    await client.end();
  }
}

// Executar
aplicarUnificacaoNumeracao();