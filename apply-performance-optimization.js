import { conectarPostgres } from './postgres-direct.js';

async function aplicarOtimizacoesPerformance() {
  const client = await conectarPostgres();
  if (!client) {
    console.error('❌ Falha ao conectar ao banco de dados');
    return;
  }

  try {
    console.log('⚡ APLICANDO OTIMIZAÇÕES DE PERFORMANCE...\n');
    
    // Lista de índices a criar
    const indices = [
      {
        nome: 'idx_invoices_user_status',
        tabela: 'invoices',
        colunas: '(user_id, status)',
        condicao: "WHERE status IN ('draft', 'sent', 'paid', 'overdue')",
        descricao: 'Busca por status'
      },
      {
        nome: 'idx_invoices_user_due_date',
        tabela: 'invoices',
        colunas: '(user_id, due_date)',
        condicao: "WHERE status != 'paid'",
        descricao: 'Cálculo de overdue'
      },
      {
        nome: 'idx_invoices_user_created',
        tabela: 'invoices',
        colunas: '(user_id, created_at DESC)',
        condicao: '',
        descricao: 'Relatórios mensais'
      },
      {
        nome: 'idx_clients_user_company',
        tabela: 'clients',
        colunas: '(user_id, company)',
        condicao: '',
        descricao: 'Autocomplete empresa'
      },
      {
        nome: 'idx_clients_user_name',
        tabela: 'clients',
        colunas: '(user_id, name)',
        condicao: '',
        descricao: 'Pesquisa por nome'
      },
      {
        nome: 'idx_invoice_items_invoice_id',
        tabela: 'invoice_items',
        colunas: '(invoice_id)',
        condicao: '',
        descricao: 'Join com invoices'
      },
      {
        nome: 'idx_settings_user_id',
        tabela: 'settings',
        colunas: '(user_id)',
        condicao: '',
        descricao: 'Busca configurações'
      },
      {
        nome: 'idx_tax_config_user_province',
        tabela: 'tax_configurations',
        colunas: '(user_id, province_code, is_enabled)',
        condicao: 'WHERE is_enabled = true',
        descricao: 'Configurações ativas'
      },
      {
        nome: 'idx_invoices_status_dates',
        tabela: 'invoices',
        colunas: '(status, issue_date, due_date, total)',
        condicao: '',
        descricao: 'Dashboard totais'
      },
      {
        nome: 'idx_invoices_aging',
        tabela: 'invoices',
        colunas: '(user_id, status, due_date)',
        condicao: "WHERE status != 'paid'",
        descricao: 'Relatório aging'
      },
      {
        nome: 'idx_invoices_revenue',
        tabela: 'invoices',
        colunas: '(user_id, status, issue_date, total)',
        condicao: "WHERE status = 'paid'",
        descricao: 'Relatório revenue'
      },
      {
        nome: 'idx_activity_log_user_created',
        tabela: 'activity_log',
        colunas: '(user_id, created_at DESC)',
        condicao: '',
        descricao: 'Log de atividades'
      }
    ];
    
    // PARTE 1: Criar índices
    console.log('📊 Criando índices de performance...\n');
    let sucessos = 0;
    let falhas = 0;
    
    for (const indice of indices) {
      try {
        const sql = `CREATE INDEX IF NOT EXISTS ${indice.nome} ON ${indice.tabela}${indice.colunas} ${indice.condicao}`;
        await client.query(sql);
        console.log(`✅ ${indice.nome.padEnd(35)} - ${indice.descricao}`);
        sucessos++;
      } catch (error) {
        console.log(`❌ ${indice.nome.padEnd(35)} - Erro: ${error.message}`);
        falhas++;
      }
    }
    
    console.log(`\n📊 Resumo: ${sucessos} índices criados, ${falhas} falhas`);
    
    // PARTE 2: Atualizar estatísticas
    console.log('\n📈 Atualizando estatísticas das tabelas...');
    const tabelas = ['invoices', 'invoice_items', 'clients', 'settings', 'tax_configurations'];
    
    for (const tabela of tabelas) {
      try {
        await client.query(`ANALYZE ${tabela}`);
        console.log(`✅ Estatísticas atualizadas: ${tabela}`);
      } catch (error) {
        console.log(`⚠️ Erro ao analisar ${tabela}: ${error.message}`);
      }
    }
    
    // PARTE 3: Verificar índices criados
    console.log('\n🔍 Verificando índices criados...');
    const indicesResult = await client.query(`
      SELECT 
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as tamanho
      FROM pg_indexes
      JOIN pg_class ON pg_class.relname = indexname
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 10
    `);
    
    console.log('\nTop 10 índices por tamanho:');
    console.log('Tabela'.padEnd(25) + 'Índice'.padEnd(35) + 'Tamanho');
    console.log('-'.repeat(70));
    
    indicesResult.rows.forEach(row => {
      console.log(
        row.tablename.padEnd(25) +
        row.indexname.padEnd(35) +
        row.tamanho
      );
    });
    
    // PARTE 4: Verificar performance das queries principais
    console.log('\n🚀 Testando performance de queries principais...');
    
    // Teste 1: Buscar invoices por status
    console.time('Query: Invoices por status');
    await client.query(`
      SELECT COUNT(*) FROM invoices 
      WHERE user_id = '2334ee7b-ac33-4220-8448-96f4fd629b49' 
      AND status = 'sent'
    `);
    console.timeEnd('Query: Invoices por status');
    
    // Teste 2: Buscar invoices overdue
    console.time('Query: Invoices overdue');
    await client.query(`
      SELECT COUNT(*) FROM invoices 
      WHERE user_id = '2334ee7b-ac33-4220-8448-96f4fd629b49' 
      AND status != 'paid' 
      AND due_date < CURRENT_DATE
    `);
    console.timeEnd('Query: Invoices overdue');
    
    // Teste 3: Dashboard totals
    console.time('Query: Dashboard totals');
    await client.query(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total) as total
      FROM invoices 
      WHERE user_id = '2334ee7b-ac33-4220-8448-96f4fd629b49'
      GROUP BY status
    `);
    console.timeEnd('Query: Dashboard totals');
    
    console.log('\n✅ OTIMIZAÇÕES DE PERFORMANCE APLICADAS COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro durante aplicação:', error);
  } finally {
    await client.end();
  }
}

// Executar
aplicarOtimizacoesPerformance();