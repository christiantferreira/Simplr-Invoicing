import { conectarPostgres } from './postgres-direct.js';

async function verificarECorrigirConfiguracoesFiscais() {
  const client = await conectarPostgres();
  if (!client) {
    console.error('❌ Falha ao conectar ao banco de dados');
    return;
  }

  try {
    console.log('🏛️ VERIFICANDO E CORRIGINDO CONFIGURAÇÕES FISCAIS...\n');
    
    // PARTE 1: Verificar status atual
    console.log('📊 Status atual das configurações fiscais:');
    console.log('-'.repeat(70));
    
    const statusResult = await client.query(`
      SELECT 
        u.email,
        COUNT(tc.*) as total_configuracoes
      FROM auth.users u
      LEFT JOIN tax_configurations tc ON tc.user_id = u.id
      GROUP BY u.id, u.email
      ORDER BY u.email
    `);
    
    statusResult.rows.forEach(row => {
      const status = row.total_configuracoes >= 17 ? '✅' : '⚠️';
      console.log(`${status} ${row.email.padEnd(40)} ${row.total_configuracoes} configurações`);
    });
    
    // PARTE 2: Configurações esperadas
    console.log('\n📋 Configurações esperadas por província:');
    const configuracoesPadrao = [
      ['AB', 'GST', 5],
      ['BC', 'GST', 5],
      ['BC', 'PST', 7],
      ['MB', 'GST', 5],
      ['MB', 'PST', 7],
      ['NB', 'HST', 15],
      ['NL', 'HST', 15],
      ['NS', 'HST', 15],
      ['NT', 'GST', 5],
      ['NU', 'GST', 5],
      ['ON', 'HST', 13],
      ['PE', 'HST', 15],
      ['QC', 'GST', 5],
      ['QC', 'QST', 9.975],
      ['SK', 'GST', 5],
      ['SK', 'PST', 6],
      ['YT', 'GST', 5]
    ];
    
    console.log(`Total: ${configuracoesPadrao.length} configurações padrão\n`);
    
    // PARTE 3: Corrigir configurações faltantes
    console.log('🔧 Aplicando correções...\n');
    
    for (const user of statusResult.rows) {
      if (user.total_configuracoes < 17) {
        console.log(`Corrigindo configurações para: ${user.email}`);
        
        // Buscar user_id
        const userResult = await client.query(
          'SELECT id FROM auth.users WHERE email = $1',
          [user.email]
        );
        
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;
          
          // Inserir configurações faltantes
          for (const [province, taxName, rate] of configuracoesPadrao) {
            try {
              await client.query(`
                INSERT INTO tax_configurations (user_id, province_code, tax_name, tax_rate, is_enabled)
                VALUES ($1, $2, $3, $4, true)
                ON CONFLICT (user_id, province_code, tax_name) DO NOTHING
              `, [userId, province, taxName, rate]);
            } catch (error) {
              console.log(`  ⚠️ Erro ao inserir ${province}-${taxName}: ${error.message}`);
            }
          }
          
          console.log(`  ✅ Configurações aplicadas!`);
        }
      }
    }
    
    // PARTE 4: Verificar resultado final
    console.log('\n📊 Verificação final:');
    console.log('-'.repeat(70));
    
    const finalResult = await client.query(`
      SELECT 
        u.email,
        COUNT(tc.*) as total_configuracoes,
        COUNT(DISTINCT tc.province_code) as provincias_distintas
      FROM auth.users u
      LEFT JOIN tax_configurations tc ON tc.user_id = u.id
      GROUP BY u.id, u.email
      ORDER BY u.email
    `);
    
    let todosOk = true;
    finalResult.rows.forEach(row => {
      const status = row.total_configuracoes >= 17 ? '✅' : '❌';
      console.log(`${status} ${row.email.padEnd(40)} ${row.total_configuracoes} configs, ${row.provincias_distintas} províncias`);
      if (row.total_configuracoes < 17) todosOk = false;
    });
    
    // PARTE 5: Verificar integridade
    console.log('\n🔍 Verificando integridade dos dados:');
    
    const integridadeResult = await client.query(`
      SELECT 
        province_code,
        tax_name,
        COUNT(DISTINCT user_id) as usuarios_com_config,
        COUNT(DISTINCT tax_rate) as diferentes_rates,
        STRING_AGG(DISTINCT tax_rate::TEXT, ', ') as rates
      FROM tax_configurations
      GROUP BY province_code, tax_name
      ORDER BY province_code, tax_name
    `);
    
    console.log('\nConfiguração por província/imposto:');
    console.log('Province  Tax   Usuários  Rates');
    console.log('-'.repeat(40));
    
    integridadeResult.rows.forEach(row => {
      const alertaRate = row.diferentes_rates > 1 ? '⚠️' : '';
      console.log(
        `${row.province_code.padEnd(10)}${row.tax_name.padEnd(6)}${row.usuarios_com_config.toString().padEnd(10)}${row.rates} ${alertaRate}`
      );
    });
    
    if (todosOk) {
      console.log('\n✅ TODAS AS CONFIGURAÇÕES FISCAIS ESTÃO CORRETAS!');
    } else {
      console.log('\n⚠️ Algumas configurações ainda precisam de atenção.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  } finally {
    await client.end();
  }
}

// Executar
verificarECorrigirConfiguracoesFiscais();