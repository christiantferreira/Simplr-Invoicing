-- =====================================================
-- UNIFICAÇÃO DO SISTEMA DE NUMERAÇÃO DE INVOICES
-- =====================================================
-- Este script garante consistência no sistema de numeração
-- e adiciona validações para evitar duplicação
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAR FUNÇÃO CENTRALIZADA PARA PRÓXIMO NÚMERO
-- =====================================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PARTE 2: ADICIONAR CONSTRAINT ÚNICA PARA EVITAR DUPLICAÇÃO
-- =====================================================
-- Primeiro remover constraint se existir
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS unique_invoice_number_per_user;

-- Adicionar constraint única por usuário
ALTER TABLE invoices 
ADD CONSTRAINT unique_invoice_number_per_user 
UNIQUE (user_id, invoice_number);

-- =====================================================
-- PARTE 3: CRIAR TRIGGER PARA AUTO-NUMERAÇÃO
-- =====================================================
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Se invoice_number for nulo ou vazio, gerar automaticamente
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := get_next_invoice_number(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se existir
DROP TRIGGER IF EXISTS before_insert_invoice_number ON invoices;

-- Criar trigger
CREATE TRIGGER before_insert_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_invoice_number();

-- =====================================================
-- PARTE 4: CRIAR ÍNDICE PARA PERFORMANCE
-- =====================================================
-- Índice para busca rápida de invoice_number por usuário
CREATE INDEX IF NOT EXISTS idx_invoices_user_invoice_number 
ON invoices(user_id, invoice_number);

-- Índice para ordenação por created_at
CREATE INDEX IF NOT EXISTS idx_invoices_created_at 
ON invoices(created_at DESC);

-- =====================================================
-- PARTE 5: VALIDAR E CORRIGIR DADOS EXISTENTES
-- =====================================================
DO $$
DECLARE
    v_record RECORD;
    v_new_number TEXT;
    v_duplicates INTEGER;
BEGIN
    -- Verificar duplicatas
    SELECT COUNT(*) INTO v_duplicates
    FROM (
        SELECT user_id, invoice_number, COUNT(*) as cnt
        FROM invoices
        WHERE invoice_number IS NOT NULL
        GROUP BY user_id, invoice_number
        HAVING COUNT(*) > 1
    ) dup;

    IF v_duplicates > 0 THEN
        RAISE NOTICE 'Encontradas % duplicatas de invoice_number. Corrigindo...', v_duplicates;
        
        -- Corrigir duplicatas
        FOR v_record IN 
            SELECT id, user_id, invoice_number, 
                   ROW_NUMBER() OVER (PARTITION BY user_id, invoice_number ORDER BY created_at) as rn
            FROM invoices
            WHERE (user_id, invoice_number) IN (
                SELECT user_id, invoice_number
                FROM invoices
                WHERE invoice_number IS NOT NULL
                GROUP BY user_id, invoice_number
                HAVING COUNT(*) > 1
            )
        LOOP
            IF v_record.rn > 1 THEN
                -- Gerar novo número para duplicata
                v_new_number := get_next_invoice_number(v_record.user_id);
                
                UPDATE invoices 
                SET invoice_number = v_new_number || '-DUP' || v_record.rn
                WHERE id = v_record.id;
                
                RAISE NOTICE 'Invoice % renumerado para %', v_record.id, v_new_number || '-DUP' || v_record.rn;
            END IF;
        END LOOP;
    END IF;
    
    RAISE NOTICE 'Validação e correção de invoice_numbers concluída!';
END $$;

-- =====================================================
-- PARTE 6: CRIAR VIEW PARA MONITORAMENTO
-- =====================================================
CREATE OR REPLACE VIEW invoice_numbering_status AS
SELECT 
    u.email,
    s.invoice_prefix,
    s.invoice_start_number,
    COUNT(i.id) as total_invoices,
    MIN(i.invoice_number) as first_invoice,
    MAX(i.invoice_number) as last_invoice,
    MAX(CAST(REGEXP_REPLACE(i.invoice_number, '[^0-9]', '', 'g') AS INTEGER)) as highest_number
FROM auth.users u
LEFT JOIN settings s ON s.user_id = u.id
LEFT JOIN invoices i ON i.user_id = u.id
GROUP BY u.id, u.email, s.invoice_prefix, s.invoice_start_number
ORDER BY u.email;

-- =====================================================
-- PARTE 7: DOCUMENTAÇÃO DA API
-- =====================================================
COMMENT ON FUNCTION get_next_invoice_number(UUID) IS 
'Retorna o próximo número de invoice para um usuário, respeitando o prefixo e número inicial configurados em settings.

Uso: SELECT get_next_invoice_number(user_id);

A função:
1. Busca configurações do usuário (prefixo e número inicial)
2. Encontra o maior número atual
3. Incrementa e formata com prefixo e padding
4. Garante unicidade por usuário';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
    'Sistema de numeração unificado!' as status,
    COUNT(DISTINCT user_id) as usuarios_com_invoices,
    COUNT(*) as total_invoices,
    COUNT(DISTINCT invoice_number) as numeros_unicos
FROM invoices;

-- =====================================================
-- INSTRUÇÕES PARA O FRONTEND
-- =====================================================
-- 1. Remover getNextInvoiceNumber de todos os componentes
-- 2. Usar apenas a função SQL: SELECT get_next_invoice_number(user_id)
-- 3. Ou deixar o campo vazio - o trigger gerará automaticamente
-- 4. A constraint única impedirá duplicatas
-- =====================================================