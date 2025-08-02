-- =====================================================
-- SCRIPT DE VALIDAÇÃO DE ISOLAMENTO DE DADOS
-- =====================================================
-- Este script verifica se o RLS está funcionando corretamente
-- e se os dados estão devidamente isolados por usuário
-- =====================================================

-- =====================================================
-- PARTE 1: VERIFICAR STATUS DO RLS
-- =====================================================
SELECT '===== STATUS DO RLS POR TABELA =====' AS secao;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ATIVO' 
        ELSE '❌ INATIVO' 
    END as rls_status,
    CASE
        WHEN rowsecurity THEN 'SEGURO'
        ELSE '⚠️ VULNERÁVEL!'
    END as status_seguranca
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'settings', 'clients', 'invoices', 'invoice_items',
    'tax_configurations', 'payments', 'recurring_invoices',
    'gmail_tokens', 'reports', 'activity_log'
)
ORDER BY 
    CASE WHEN rowsecurity THEN 1 ELSE 0 END,
    tablename;

-- =====================================================
-- PARTE 2: VERIFICAR POLÍTICAS ATIVAS
-- =====================================================
SELECT '===== POLÍTICAS DE SEGURANÇA ATIVAS =====' AS secao;

SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd as comando_sql
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- PARTE 3: TESTE DE ISOLAMENTO - DADOS POR USUÁRIO
-- =====================================================
SELECT '===== DISTRIBUIÇÃO DE DADOS POR USUÁRIO =====' AS secao;

-- Resumo de dados por usuário
WITH user_data AS (
    SELECT 
        u.id,
        u.email,
        (SELECT COUNT(*) FROM settings s WHERE s.user_id = u.id) as total_settings,
        (SELECT COUNT(*) FROM clients c WHERE c.user_id = u.id) as total_clients,
        (SELECT COUNT(*) FROM invoices i WHERE i.user_id = u.id) as total_invoices,
        (SELECT COUNT(*) FROM payments p WHERE p.user_id = u.id) as total_payments,
        (SELECT COUNT(*) FROM tax_configurations tc WHERE tc.user_id = u.id) as total_tax_configs
    FROM auth.users u
)
SELECT 
    email,
    total_settings,
    total_clients,
    total_invoices,
    total_payments,
    total_tax_configs,
    CASE 
        WHEN total_settings > 0 THEN '✅' 
        ELSE '❌' 
    END as tem_configuracao
FROM user_data
ORDER BY email;

-- =====================================================
-- PARTE 4: VERIFICAR INTEGRIDADE REFERENCIAL
-- =====================================================
SELECT '===== INTEGRIDADE REFERENCIAL =====' AS secao;

-- Verificar se há dados órfãos
SELECT 
    'Invoices sem cliente válido' as tipo_problema,
    COUNT(*) as quantidade
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'Invoice items sem invoice válido' as tipo_problema,
    COUNT(*) as quantidade
FROM invoice_items ii
LEFT JOIN invoices i ON ii.invoice_id = i.id
WHERE i.id IS NULL

UNION ALL

SELECT 
    'Payments sem invoice válido' as tipo_problema,
    COUNT(*) as quantidade
FROM payments p
LEFT JOIN invoices i ON p.invoice_id = i.id
WHERE i.id IS NULL;

-- =====================================================
-- PARTE 5: TESTE DE CROSS-USER ACCESS (CRÍTICO)
-- =====================================================
SELECT '===== TESTE DE ACESSO CRUZADO =====' AS secao;

-- Este teste verifica se um usuário consegue ver dados de outro
-- RESULTADO ESPERADO: 0 registros (nenhum acesso cruzado)
WITH cross_check AS (
    SELECT 
        'Clientes' as tabela,
        c1.user_id as usuario_dono,
        u1.email as email_dono,
        COUNT(DISTINCT c2.id) as registros_visiveis_de_outros
    FROM clients c1
    JOIN auth.users u1 ON c1.user_id = u1.id
    LEFT JOIN clients c2 ON c2.user_id != c1.user_id
    GROUP BY c1.user_id, u1.email
    
    UNION ALL
    
    SELECT 
        'Invoices' as tabela,
        i1.user_id as usuario_dono,
        u1.email as email_dono,
        COUNT(DISTINCT i2.id) as registros_visiveis_de_outros
    FROM invoices i1
    JOIN auth.users u1 ON i1.user_id = u1.id
    LEFT JOIN invoices i2 ON i2.user_id != i1.user_id
    GROUP BY i1.user_id, u1.email
)
SELECT 
    tabela,
    email_dono,
    registros_visiveis_de_outros,
    CASE 
        WHEN registros_visiveis_de_outros = 0 THEN '✅ SEGURO'
        ELSE '❌ VAZAMENTO DE DADOS!'
    END as status_seguranca
FROM cross_check
WHERE registros_visiveis_de_outros > 0;

-- =====================================================
-- PARTE 6: RESUMO EXECUTIVO DE SEGURANÇA
-- =====================================================
SELECT '===== RESUMO DE SEGURANÇA =====' AS secao;

WITH security_summary AS (
    SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tabelas_com_rls,
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as tabelas_sem_rls,
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
        (SELECT COUNT(DISTINCT user_id) FROM clients) as usuarios_ativos
)
SELECT 
    tabelas_com_rls,
    tabelas_sem_rls,
    total_policies,
    usuarios_ativos,
    CASE 
        WHEN tabelas_sem_rls = 0 THEN '✅ SISTEMA SEGURO'
        ELSE '⚠️ SISTEMA VULNERÁVEL'
    END as status_geral,
    CASE 
        WHEN tabelas_com_rls >= 15 THEN '✅ RLS adequadamente implementado'
        ELSE '❌ RLS insuficiente'
    END as avaliacao_rls
FROM security_summary;

-- =====================================================
-- INSTRUÇÕES PARA TESTE MANUAL
-- =====================================================
-- 1. Execute este script como superuser para ver visão completa
-- 2. Depois, execute partes específicas como usuário normal
-- 3. Usuário normal NÃO deve ver dados de outros usuários
-- 4. Se houver vazamento, revise as políticas RLS imediatamente
-- =====================================================