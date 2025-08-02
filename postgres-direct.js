// CONEXÃO DIRETA AO POSTGRESQL DO SUPABASE
// Isso contorna completamente as limitações da API REST

import pg from 'pg'
const { Client } = pg

// CONFIGURAÇÃO DA CONEXÃO DIRETA
// Você precisa pegar essas informações no dashboard do Supabase:
// Dashboard -> Settings -> Database -> Connection string

const config = {
  host: 'db.qvxrcjpvoieboiykflnv.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'DqQFOjzszRrVod1c',
  ssl: {
    rejectUnauthorized: false
  }
}

// FUNÇÕES PARA ACESSAR O BANCO DIRETAMENTE

export async function conectarPostgres() {
  const client = new Client(config)
  
  try {
    console.log('🔌 Conectando diretamente ao PostgreSQL...')
    await client.connect()
    console.log('✅ Conexão PostgreSQL estabelecida!')
    return client
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message)
    return null
  }
}

export async function listarTabelasPostgres() {
  const client = await conectarPostgres()
  if (!client) return
  
  try {
    console.log('📋 Listando tabelas via PostgreSQL direto...')
    
    const result = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('✅ Tabelas encontradas:')
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name} (${row.table_type})`)
    })
    
    return result.rows
  } catch (error) {
    console.log('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

export async function consultarTabelaPostgres(tabela, limite = 5) {
  const client = await conectarPostgres()
  if (!client) return
  
  try {
    console.log(`📊 Consultando ${tabela} via PostgreSQL direto...`)
    
    // Primeiro, contar registros
    const countResult = await client.query(`SELECT COUNT(*) FROM ${tabela}`)
    const totalRegistros = countResult.rows[0].count
    
    console.log(`📈 Total de registros em ${tabela}: ${totalRegistros}`)
    
    if (totalRegistros > 0) {
      // Buscar alguns registros
      const dataResult = await client.query(`SELECT * FROM ${tabela} LIMIT $1`, [limite])
      
      console.log(`📄 Primeiros ${limite} registros:`)
      console.log(JSON.stringify(dataResult.rows, null, 2))
      
      if (dataResult.rows.length > 0) {
        console.log('📋 Colunas disponíveis:')
        Object.keys(dataResult.rows[0]).forEach((col, index) => {
          console.log(`${index + 1}. ${col}`)
        })
      }
      
      return dataResult.rows
    }
  } catch (error) {
    console.log(`❌ Erro ao consultar ${tabela}:`, error.message)
  } finally {
    await client.end()
  }
}

export async function inserirRegistroPostgres(tabela, dados) {
  const client = await conectarPostgres()
  if (!client) return
  
  try {
    console.log(`➕ Inserindo registro em ${tabela} via PostgreSQL...`)
    
    const colunas = Object.keys(dados)
    const valores = Object.values(dados)
    const placeholders = valores.map((_, index) => `$${index + 1}`).join(', ')
    
    const query = `
      INSERT INTO ${tabela} (${colunas.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `
    
    const result = await client.query(query, valores)
    
    console.log('✅ Registro inserido com sucesso!')
    console.log(JSON.stringify(result.rows[0], null, 2))
    
    return result.rows[0]
  } catch (error) {
    console.log('❌ Erro ao inserir:', error.message)
  } finally {
    await client.end()
  }
}

export async function atualizarRegistroPostgres(tabela, id, dados) {
  const client = await conectarPostgres()
  if (!client) return
  
  try {
    console.log(`📝 Atualizando registro em ${tabela} via PostgreSQL...`)
    
    const colunas = Object.keys(dados)
    const valores = Object.values(dados)
    const setClause = colunas.map((col, index) => `${col} = $${index + 1}`).join(', ')
    
    const query = `
      UPDATE ${tabela} 
      SET ${setClause} 
      WHERE id = $${valores.length + 1} 
      RETURNING *
    `
    
    const result = await client.query(query, [...valores, id])
    
    console.log('✅ Registro atualizado com sucesso!')
    console.log(JSON.stringify(result.rows[0], null, 2))
    
    return result.rows[0]
  } catch (error) {
    console.log('❌ Erro ao atualizar:', error.message)
  } finally {
    await client.end()
  }
}

export async function executarQueryPostgres(query, params = []) {
  const client = await conectarPostgres()
  if (!client) return
  
  try {
    console.log(`🔧 Executando query via PostgreSQL...`)
    if (query && query.length) {
      console.log(`Query: ${query.substring(0, 100)}...`)
    }
    
    const result = await client.query(query, params)
    
    console.log(`✅ Query executada! ${result.rows ? result.rows.length : 0} linhas retornadas`)
    
    if (result.rows && result.rows.length > 0) {
      console.log('📄 Resultado:')
      console.log(JSON.stringify(result.rows, null, 2))
    }
    
    return result.rows || []
  } catch (error) {
    console.log('❌ Erro na query:', error.message)
    throw error
  } finally {
    await client.end()
  }
}

export async function explorarBancoPostgres() {
  console.log('🚀 EXPLORANDO BANCO VIA POSTGRESQL DIRETO!\n')
  
  // 1. Listar tabelas
  const tabelas = await listarTabelasPostgres()
  
  // 2. Consultar tabelas principais
  const tabelasPrincipais = ['settings', 'clients', 'invoices', 'tax_configurations']
  
  for (const tabela of tabelasPrincipais) {
    console.log(`\n--- ${tabela.toUpperCase()} ---`)
    await consultarTabelaPostgres(tabela, 3)
  }
  
  console.log('\n✅ Exploração completa via PostgreSQL!')
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  explorarBancoPostgres()
}