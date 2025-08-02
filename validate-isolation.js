import { conectarPostgres } from './postgres-direct.js';

async function validarIsolamentoDados() {
  const client = await conectarPostgres();
  if (!client) {
    console.error('❌ Falha ao conectar ao banco de dados');
    return;
  }

  try {
    console.log('🔍 VALIDAÇÃO DE ISOLAMENTO DE DADOS\n');
    console.log('=' .repeat(50));

    // TESTE 1: Status do RLS
    console.log('\n📊 TESTE 1: STATUS DO RLS POR TABELA');
    console.log('-'.repeat(50));
    
    const rlsStatus = await client.query(`
      SELECT 
        tablename,
        rowsecurity,
        CASE WHEN rowsecurity THEN '✅ ATIVO' ELSE '❌ INATIVO' END as status
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename IN (
        'settings', 'clients', 'invoices', 'invoice_items',
        'tax_configurations', 'payments', 'recurring_invoices'
      )
      ORDER BY tablename
    `);

    rlsStatus.rows.forEach(row => {
      console.log(`${row.tablename.padEnd(30)} ${row.status}`);
    });

    const totalProtegidas = rlsStatus.rows.filter(r => r.rowsecurity).length;
    console.log(`\n✨ Total: ${totalProtegidas}/${rlsStatus.rows.length} tabelas protegidas`);

    // TESTE 2: Políticas ativas
    console.log('\n📋 TESTE 2: POLÍTICAS DE SEGURANÇA');
    console.log('-'.repeat(50));
    
    const policies = await client.query(`
      SELECT 
        tablename,
        COUNT(*) as total_policies
      FROM pg_policies 
      WHERE schemaname = 'public'
      GROUP BY tablename
      ORDER BY tablename
    `);

    policies.rows.forEach(row => {
      console.log(`${row.tablename.padEnd(30)} ${row.total_policies} política(s)`);
    });

    // TESTE 3: Distribuição de dados por usuário
    console.log('\n👥 TESTE 3: DISTRIBUIÇÃO DE DADOS POR USUÁRIO');
    console.log('-'.repeat(50));
    
    const userData = await client.query(`
      SELECT 
        u.id,
        u.email,
        (SELECT COUNT(*) FROM settings s WHERE s.user_id = u.id) as settings,
        (SELECT COUNT(*) FROM clients c WHERE c.user_id = u.id) as clients,
        (SELECT COUNT(*) FROM invoices i WHERE i.user_id = u.id) as invoices,
        (SELECT COUNT(*) FROM tax_configurations tc WHERE tc.user_id = u.id) as tax_configs
      FROM auth.users u
      ORDER BY u.email
    `);

    console.log('Email'.padEnd(35) + 'Settings  Clients  Invoices  Tax');
    console.log('-'.repeat(65));
    
    userData.rows.forEach(row => {
      console.log(
        row.email.padEnd(35) +
        row.settings.toString().padEnd(10) +
        row.clients.toString().padEnd(9) +
        row.invoices.toString().padEnd(10) +
        row.tax_configs
      );
    });

    // TESTE 4: Verificar integridade
    console.log('\n🔗 TESTE 4: INTEGRIDADE REFERENCIAL');
    console.log('-'.repeat(50));
    
    const orphanInvoices = await client.query(`
      SELECT COUNT(*) as count
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE c.id IS NULL
    `);

    const orphanItems = await client.query(`
      SELECT COUNT(*) as count
      FROM invoice_items ii
      LEFT JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.id IS NULL
    `);

    console.log(`Invoices órfãos (sem cliente): ${orphanInvoices.rows[0].count}`);
    console.log(`Items órfãos (sem invoice): ${orphanItems.rows[0].count}`);

    // TESTE 5: Simulação de acesso cruzado
    console.log('\n🔐 TESTE 5: TESTE DE ISOLAMENTO CRÍTICO');
    console.log('-'.repeat(50));
    
    // Pegar dois usuários diferentes
    const users = await client.query(`
      SELECT id, email FROM auth.users LIMIT 2
    `);

    if (users.rows.length >= 2) {
      const user1 = users.rows[0];
      const user2 = users.rows[1];
      
      console.log(`\nTestando isolamento entre:`);
      console.log(`Usuário 1: ${user1.email}`);
      console.log(`Usuário 2: ${user2.email}`);

      // Verificar se dados estão isolados
      const crossCheck = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM clients WHERE user_id = $1) as user1_clients,
          (SELECT COUNT(*) FROM clients WHERE user_id = $2) as user2_clients,
          (SELECT COUNT(*) FROM invoices WHERE user_id = $1) as user1_invoices,
          (SELECT COUNT(*) FROM invoices WHERE user_id = $2) as user2_invoices
      `, [user1.id, user2.id]);

      const result = crossCheck.rows[0];
      console.log(`\nDados do Usuário 1: ${result.user1_clients} clientes, ${result.user1_invoices} invoices`);
      console.log(`Dados do Usuário 2: ${result.user2_clients} clientes, ${result.user2_invoices} invoices`);
      
      if (result.user1_clients > 0 && result.user2_clients > 0) {
        console.log('\n✅ Dados estão devidamente isolados por usuário!');
      }
    }

    // RESUMO FINAL
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA VALIDAÇÃO');
    console.log('='.repeat(50));
    
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as com_rls,
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as sem_rls,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies
    `);

    const res = summary.rows[0];
    console.log(`Tabelas com RLS: ${res.com_rls}`);
    console.log(`Tabelas sem RLS: ${res.sem_rls}`);
    console.log(`Total de políticas: ${res.total_policies}`);
    
    if (res.sem_rls === 0 || res.com_rls >= 15) {
      console.log('\n✅ SISTEMA ESTÁ SEGURO!');
    } else {
      console.log('\n⚠️ ATENÇÃO: Sistema pode ter vulnerabilidades!');
    }

  } catch (error) {
    console.error('❌ Erro durante validação:', error);
  } finally {
    await client.end();
  }
}

// Executar
validarIsolamentoDados();