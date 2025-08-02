-- =====================================================
-- OTIMIZAÇÃO DE PERFORMANCE - ÍNDICES E MELHORIAS
-- =====================================================
-- Este script adiciona índices estratégicos para melhorar
-- a performance das queries mais comuns do sistema
-- =====================================================

-- =====================================================
-- PARTE 1: ANÁLISE DE QUERIES LENTAS
-- =====================================================
-- Primeiro, vamos identificar as tabelas mais acessadas
SELECT '===== TABELAS MAIS ACESSADAS =====' AS analise;

SELECT 
    schemaname,
    tablename,
    n_tup_ins + n_tup_upd + n_tup_del as total_writes,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as total_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY total_writes DESC
LIMIT 10;

-- =====================================================
-- PARTE 2: ÍNDICES PARA QUERIES DE BUSCA FREQUENTES
-- =====================================================

-- 2.1 INVOICES - Queries mais comuns
-- Busca por user_id + status
CREATE INDEX IF NOT EXISTS idx_invoices_user_status 
ON invoices(user_id, status) 
WHERE status IN ('draft', 'sent', 'paid', 'overdue');

-- Busca por user_id + due_date (para cálculo de overdue)
CREATE INDEX IF NOT EXISTS idx_invoices_user_due_date 
ON invoices(user_id, due_date) 
WHERE status != 'paid';

-- Busca por user_id + created_at (para relatórios mensais)
CREATE INDEX IF NOT EXISTS idx_invoices_user_created 
ON invoices(user_id, created_at DESC);

-- 2.2 CLIENTS - Queries mais comuns
-- Busca por user_id + company (para autocomplete)
CREATE INDEX IF NOT EXISTS idx_clients_user_company 
ON clients(user_id, company);

-- Busca por user_id + name (para pesquisa)
CREATE INDEX IF NOT EXISTS idx_clients_user_name 
ON clients(user_id, name);

-- 2.3 INVOICE_ITEMS - Join com invoices
-- Índice para join rápido
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
ON invoice_items(invoice_id);

-- 2.4 SETTINGS - Busca por user_id
-- Já existe foreign key, mas vamos adicionar índice específico
CREATE INDEX IF NOT EXISTS idx_settings_user_id 
ON settings(user_id);

-- 2.5 TAX_CONFIGURATIONS - Busca por user + province
CREATE INDEX IF NOT EXISTS idx_tax_config_user_province 
ON tax_configurations(user_id, province_code, is_enabled)
WHERE is_enabled = true;

-- =====================================================
-- PARTE 3: ÍNDICES PARA RELATÓRIOS
-- =====================================================

-- 3.1 Para Dashboard - Cálculo de totais por período
CREATE INDEX IF NOT EXISTS idx_invoices_status_dates 
ON invoices(status, issue_date, due_date, total);

-- 3.2 Para Relatório de Aging
CREATE INDEX IF NOT EXISTS idx_invoices_aging 
ON invoices(user_id, status, due_date)
WHERE status != 'paid';

-- 3.3 Para Relatório de Revenue
CREATE INDEX IF NOT EXISTS idx_invoices_revenue 
ON invoices(user_id, status, issue_date, total)
WHERE status = 'paid';

-- =====================================================
-- PARTE 4: ÍNDICES COMPOSTOS PARA VIEWS
-- =====================================================

-- Para view clients_with_metrics
CREATE INDEX IF NOT EXISTS idx_invoices_client_metrics 
ON invoices(client_id, status, total);

-- Para view invoices_with_dynamic_status
CREATE INDEX IF NOT EXISTS idx_invoices_dynamic_status 
ON invoices(status, due_date, created_at);

-- =====================================================
-- PARTE 5: OTIMIZAÇÃO DE TABELAS DE LOG
-- =====================================================

-- Activity log - busca por user e data
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created 
ON activity_log(user_id, created_at DESC);

-- Gmail tokens - busca por user
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user 
ON gmail_tokens(user_id);

-- =====================================================
-- PARTE 6: PARTIAL INDEXES PARA CASOS ESPECÍFICOS
-- =====================================================

-- Índice parcial para invoices não pagas (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_invoices_unpaid 
ON invoices(user_id, due_date, total)
WHERE status IN ('draft', 'sent', 'viewed');

-- Índice parcial para clientes ativos (com invoices)
CREATE INDEX IF NOT EXISTS idx_clients_active 
ON clients(user_id, created_at)
WHERE EXISTS (SELECT 1 FROM invoices WHERE invoices.client_id = clients.id);

-- =====================================================
-- PARTE 7: ESTATÍSTICAS E VACUUM
-- =====================================================

-- Atualizar estatísticas das tabelas principais
ANALYZE invoices;
ANALYZE invoice_items;
ANALYZE clients;
ANALYZE settings;
ANALYZE tax_configurations;

-- =====================================================
-- PARTE 8: VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- =====================================================
SELECT '===== ÍNDICES CRIADOS =====' AS verificacao;

SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- PARTE 9: SUGESTÕES DE MANUTENÇÃO
-- =====================================================
SELECT '===== SUGESTÕES DE MANUTENÇÃO =====' AS manutencao;

-- Tabelas que precisam de VACUUM
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND n_dead_tup > 100
ORDER BY dead_percent DESC;

-- =====================================================
-- RESUMO DE OTIMIZAÇÕES
-- =====================================================
DO $$
DECLARE
    total_indices INTEGER;
    total_size TEXT;
BEGIN
    SELECT COUNT(*) INTO total_indices
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    SELECT pg_size_pretty(SUM(pg_relation_size(indexrelid))) INTO total_size
    FROM pg_indexes
    JOIN pg_class ON pg_class.relname = indexname
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '===== RESUMO DE OTIMIZAÇÕES =====';
    RAISE NOTICE 'Total de índices criados: %', total_indices;
    RAISE NOTICE 'Tamanho total dos índices: %', total_size;
    RAISE NOTICE '=================================';
END $$;

-- =====================================================
-- PERFORMANCE OTIMIZADA!
-- Os índices criados vão acelerar:
-- 1. Listagem de invoices por status
-- 2. Cálculo de invoices overdue
-- 3. Dashboard e relatórios
-- 4. Pesquisa de clientes
-- 5. Joins entre tabelas
-- =====================================================