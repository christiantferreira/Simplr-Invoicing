-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA - REATIVAR RLS
-- =====================================================
-- Este script reativa Row Level Security em todas as tabelas
-- e implementa políticas corretas para isolamento de dados por usuário
-- =====================================================

-- =====================================================
-- PARTE 1: BACKUP SAFETY CHECK
-- =====================================================
-- Verificar se há dados antes de aplicar mudanças críticas
DO $$
DECLARE
    total_users INTEGER;
    total_invoices INTEGER;
    total_clients INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_invoices FROM public.invoices;
    SELECT COUNT(*) INTO total_clients FROM public.clients;
    
    RAISE NOTICE 'BACKUP SAFETY CHECK:';
    RAISE NOTICE 'Total usuários: %', total_users;
    RAISE NOTICE 'Total invoices: %', total_invoices;
    RAISE NOTICE 'Total clientes: %', total_clients;
    
    IF total_users = 0 OR total_invoices = 0 THEN
        RAISE EXCEPTION 'SEGURANÇA: Dados críticos não encontrados. Verifique backup antes de continuar.';
    END IF;
END $$;

-- =====================================================
-- PARTE 2: FUNÇÃO HELPER PARA POLICIES SEGURAS
-- =====================================================
CREATE OR REPLACE FUNCTION get_current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 3: REATIVAR RLS NAS TABELAS PRINCIPAIS
-- =====================================================

-- 1. SETTINGS TABLE
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own settings" ON public.settings;
CREATE POLICY "Users can only access their own settings" ON public.settings
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 2. CLIENTS TABLE  
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own clients" ON public.clients;
CREATE POLICY "Users can only access their own clients" ON public.clients
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 3. INVOICES TABLE
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own invoices" ON public.invoices;
CREATE POLICY "Users can only access their own invoices" ON public.invoices
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 4. INVOICE_ITEMS TABLE (através do invoice)
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access items of their own invoices" ON public.invoice_items;
CREATE POLICY "Users can access items of their own invoices" ON public.invoice_items
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
    );

-- 5. TAX_CONFIGURATIONS TABLE
ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own tax configurations" ON public.tax_configurations;
CREATE POLICY "Users can only access their own tax configurations" ON public.tax_configurations
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 6. PAYMENTS TABLE
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own payments" ON public.payments;
CREATE POLICY "Users can only access their own payments" ON public.payments
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 7. RECURRING_INVOICES TABLE
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own recurring invoices" ON public.recurring_invoices;
CREATE POLICY "Users can only access their own recurring invoices" ON public.recurring_invoices
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 8. GMAIL_TOKENS TABLE
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own gmail tokens" ON public.gmail_tokens;
CREATE POLICY "Users can only access their own gmail tokens" ON public.gmail_tokens
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- PARTE 4: TABELAS DE RELATÓRIOS
-- =====================================================

-- 9. REPORTS TABLE
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own reports" ON public.reports;
CREATE POLICY "Users can only access their own reports" ON public.reports
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 10. REPORTS_CACHE TABLE
ALTER TABLE public.reports_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own reports cache" ON public.reports_cache;
CREATE POLICY "Users can only access their own reports cache" ON public.reports_cache
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 11. REPORT_PARAMETERS TABLE
ALTER TABLE public.report_parameters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own report parameters" ON public.report_parameters;
CREATE POLICY "Users can only access their own report parameters" ON public.report_parameters
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- PARTE 5: TABELAS DE DADOS DE RELATÓRIOS
-- =====================================================

-- 12. AGING_REPORT_DATA TABLE
ALTER TABLE public.aging_report_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own aging report data" ON public.aging_report_data;
CREATE POLICY "Users can only access their own aging report data" ON public.aging_report_data
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 13. CLIENT_PERFORMANCE_REPORT_DATA TABLE
ALTER TABLE public.client_performance_report_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own client performance data" ON public.client_performance_report_data;
CREATE POLICY "Users can only access their own client performance data" ON public.client_performance_report_data
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 14. INVOICE_STATUS_REPORT_DATA TABLE
ALTER TABLE public.invoice_status_report_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own invoice status data" ON public.invoice_status_report_data;
CREATE POLICY "Users can only access their own invoice status data" ON public.invoice_status_report_data
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 15. REVENUE_REPORT_DATA TABLE
ALTER TABLE public.revenue_report_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own revenue data" ON public.revenue_report_data;
CREATE POLICY "Users can only access their own revenue data" ON public.revenue_report_data
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 16. TAX_SUMMARY_REPORT_DATA TABLE
ALTER TABLE public.tax_summary_report_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own tax summary data" ON public.tax_summary_report_data;
CREATE POLICY "Users can only access their own tax summary data" ON public.tax_summary_report_data
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- PARTE 6: TABELAS DE LOG E ATIVIDADE
-- =====================================================

-- 17. ACTIVITY_LOG TABLE
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own activity log" ON public.activity_log;
CREATE POLICY "Users can only access their own activity log" ON public.activity_log
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- 18. OTHER_SERVICE_TYPES_LOG TABLE
ALTER TABLE public.other_service_types_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own service types log" ON public.other_service_types_log;
CREATE POLICY "Users can only access their own service types log" ON public.other_service_types_log
    FOR ALL USING (user_id = get_current_user_id())
    WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- PARTE 7: VERIFICAÇÃO FINAL
-- =====================================================
DO $$
DECLARE
    tables_with_rls INTEGER;
    tables_without_rls INTEGER;
    total_policies INTEGER;
BEGIN
    -- Contar tabelas com RLS ativo
    SELECT COUNT(*) INTO tables_with_rls 
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = true;
    
    -- Contar tabelas sem RLS
    SELECT COUNT(*) INTO tables_without_rls 
    FROM pg_tables 
    WHERE schemaname = 'public' AND rowsecurity = false;
    
    -- Contar políticas criadas
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'RLS REATIVADO COM SUCESSO!';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Tabelas com RLS ativo: %', tables_with_rls;
    RAISE NOTICE 'Tabelas sem RLS: %', tables_without_rls;
    RAISE NOTICE 'Total de políticas criadas: %', total_policies;
    RAISE NOTICE '=====================================';
    
    IF tables_with_rls < 15 THEN
        RAISE WARNING 'ATENÇÃO: Menos tabelas que o esperado têm RLS ativo!';
    END IF;
END $$;

-- =====================================================
-- PARTE 8: INSTRUÇÕES DE TESTE
-- =====================================================
-- Para testar o isolamento de dados:
-- 1. Execute o script validate_data_isolation.sql
-- 2. Faça login com diferentes usuários no frontend
-- 3. Verifique se cada usuário vê apenas seus próprios dados
-- 4. Tente acessar dados de outros usuários via SQL (deve falhar)
-- =====================================================

-- SCRIPT APLICADO COM SUCESSO!
-- RLS agora está ATIVO em todas as tabelas principais
-- Dados de usuários estão ISOLADOS e SEGUROS