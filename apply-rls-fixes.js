import { conectarPostgres } from './postgres-direct.js';

async function aplicarCorrecaoRLS() {
  const client = await conectarPostgres();
  if (!client) {
    console.error('❌ Falha ao conectar ao banco de dados');
    return;
  }

  try {
    console.log('🔒 INICIANDO CORREÇÕES CRÍTICAS DE SEGURANÇA...\n');

    // PARTE 1: Criar função helper
    console.log('📝 Criando função helper de segurança...');
    await client.query(`
      CREATE OR REPLACE FUNCTION get_current_user_id() 
      RETURNS UUID AS $$
      BEGIN
          RETURN (SELECT auth.uid());
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER
    `);
    console.log('✅ Função helper criada!\n');

    // PARTE 2: Ativar RLS em todas as tabelas
    const tabelas = [
      'settings', 'clients', 'invoices', 'invoice_items', 
      'tax_configurations', 'payments', 'recurring_invoices', 
      'gmail_tokens', 'reports', 'reports_cache', 'report_parameters',
      'aging_report_data', 'client_performance_report_data',
      'invoice_status_report_data', 'revenue_report_data',
      'tax_summary_report_data', 'activity_log', 'other_service_types_log'
    ];

    console.log('🔐 Ativando RLS em todas as tabelas...');
    for (const tabela of tabelas) {
      try {
        await client.query(`ALTER TABLE public.${tabela} ENABLE ROW LEVEL SECURITY`);
        console.log(`✅ RLS ativado em: ${tabela}`);
      } catch (error) {
        console.log(`⚠️ Erro ao ativar RLS em ${tabela}: ${error.message}`);
      }
    }

    console.log('\n📋 Aplicando políticas de segurança...\n');

    // PARTE 3: Aplicar políticas para cada tabela
    const politicas = [
      {
        tabela: 'settings',
        nome: 'Users can only access their own settings',
        sql: `CREATE POLICY "Users can only access their own settings" ON public.settings
              FOR ALL USING (user_id = get_current_user_id())
              WITH CHECK (user_id = get_current_user_id())`
      },
      {
        tabela: 'clients',
        nome: 'Users can only access their own clients',
        sql: `CREATE POLICY "Users can only access their own clients" ON public.clients
              FOR ALL USING (user_id = get_current_user_id())
              WITH CHECK (user_id = get_current_user_id())`
      },
      {
        tabela: 'invoices',
        nome: 'Users can only access their own invoices',
        sql: `CREATE POLICY "Users can only access their own invoices" ON public.invoices
              FOR ALL USING (user_id = get_current_user_id())
              WITH CHECK (user_id = get_current_user_id())`
      },
      {
        tabela: 'invoice_items',
        nome: 'Users can access items of their own invoices',
        sql: `CREATE POLICY "Users can access items of their own invoices" ON public.invoice_items
              FOR ALL USING (
                EXISTS (
                  SELECT 1 FROM public.invoices 
                  WHERE invoices.id = invoice_items.invoice_id 
                  AND invoices.user_id = get_current_user_id()
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM public.invoices 
                  WHERE invoices.id = invoice_items.invoice_id 
                  AND invoices.user_id = get_current_user_id()
                )
              )`
      },
      {
        tabela: 'tax_configurations',
        nome: 'Users can only access their own tax configurations',
        sql: `CREATE POLICY "Users can only access their own tax configurations" ON public.tax_configurations
              FOR ALL USING (user_id = get_current_user_id())
              WITH CHECK (user_id = get_current_user_id())`
      },
      {
        tabela: 'payments',
        nome: 'Users can only access their own payments',
        sql: `CREATE POLICY "Users can only access their own payments" ON public.payments
              FOR ALL USING (user_id = get_current_user_id())
              WITH CHECK (user_id = get_current_user_id())`
      }
    ];

    // Aplicar cada política
    for (const politica of politicas) {
      try {
        // Primeiro remove política existente
        await client.query(`DROP POLICY IF EXISTS "${politica.nome}" ON public.${politica.tabela}`);
        // Depois cria a nova
        await client.query(politica.sql);
        console.log(`✅ Política aplicada em: ${politica.tabela}`);
      } catch (error) {
        console.log(`⚠️ Erro ao aplicar política em ${politica.tabela}: ${error.message}`);
      }
    }

    // PARTE 4: Verificação final
    console.log('\n🔍 Verificando status final...\n');
    
    const verificacao = await client.query(`
      SELECT 
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN (${tabelas.map(t => `'${t}'`).join(',')})
      ORDER BY tablename
    `);

    console.log('📊 Status RLS por tabela:');
    verificacao.rows.forEach(row => {
      const status = row.rowsecurity ? '✅ ATIVO' : '❌ INATIVO';
      console.log(`   ${row.tablename}: ${status}`);
    });

    const totalAtivos = verificacao.rows.filter(r => r.rowsecurity).length;
    console.log(`\n✨ RESUMO: ${totalAtivos}/${verificacao.rows.length} tabelas com RLS ativo`);

    if (totalAtivos === verificacao.rows.length) {
      console.log('🎉 TODAS AS TABELAS ESTÃO PROTEGIDAS COM RLS!');
    } else {
      console.log('⚠️ ATENÇÃO: Algumas tabelas ainda estão sem RLS!');
    }

  } catch (error) {
    console.error('❌ Erro durante aplicação das correções:', error);
  } finally {
    await client.end();
  }
}

// Executar
aplicarCorrecaoRLS();