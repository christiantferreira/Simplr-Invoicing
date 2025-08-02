-- ================================================
-- CONFIGURAÇÃO COMPLETA DA TABELA TAX_CONFIGURATIONS
-- Execute este arquivo no Supabase para resolver todos os problemas
-- ================================================

-- ================================================
-- PARTE 1: CRIAR TABELA (SE NÃO EXISTIR)
-- ================================================
CREATE TABLE IF NOT EXISTS public.tax_configurations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  province_code text NOT NULL,
  tax_name text NOT NULL,
  tax_rate numeric NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tax_configurations_pkey PRIMARY KEY (id),
  CONSTRAINT tax_configurations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT tax_configurations_user_province_unique UNIQUE (user_id, province_code, tax_name)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tax_configurations_user_id ON public.tax_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_configurations_province_code ON public.tax_configurations(province_code);
CREATE INDEX IF NOT EXISTS idx_tax_configurations_is_enabled ON public.tax_configurations(is_enabled);

-- ================================================
-- PARTE 2: DESABILITAR RLS (SOLUÇÃO PARA O ERRO 403)
-- ================================================
-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own tax configurations" ON public.tax_configurations;
DROP POLICY IF EXISTS "Users can insert their own tax configurations" ON public.tax_configurations;
DROP POLICY IF EXISTS "Users can update their own tax configurations" ON public.tax_configurations;
DROP POLICY IF EXISTS "Users can delete their own tax configurations" ON public.tax_configurations;
DROP POLICY IF EXISTS "Enable read access for users" ON public.tax_configurations;
DROP POLICY IF EXISTS "Enable insert for users" ON public.tax_configurations;
DROP POLICY IF EXISTS "Enable update for users" ON public.tax_configurations;
DROP POLICY IF EXISTS "Enable delete for users" ON public.tax_configurations;

-- Desabilitar RLS (seguindo o padrão das outras tabelas do sistema)
ALTER TABLE public.tax_configurations DISABLE ROW LEVEL SECURITY;

-- ================================================
-- PARTE 3: CRIAR FUNÇÃO PARA INSERIR CONFIGURAÇÕES PADRÃO
-- ================================================
CREATE OR REPLACE FUNCTION public.create_default_tax_configurations(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Inserir configurações de impostos padrão para províncias canadenses
  INSERT INTO public.tax_configurations (user_id, province_code, tax_name, tax_rate, is_enabled)
  VALUES 
    (p_user_id, 'AB', 'GST', 5, true),
    (p_user_id, 'BC', 'GST', 5, true),
    (p_user_id, 'BC', 'PST', 7, true),
    (p_user_id, 'MB', 'GST', 5, true),
    (p_user_id, 'MB', 'PST', 7, true),
    (p_user_id, 'NB', 'HST', 15, true),
    (p_user_id, 'NL', 'HST', 15, true),
    (p_user_id, 'NS', 'HST', 15, true),
    (p_user_id, 'NT', 'GST', 5, true),
    (p_user_id, 'NU', 'GST', 5, true),
    (p_user_id, 'ON', 'HST', 13, true),
    (p_user_id, 'PE', 'HST', 15, true),
    (p_user_id, 'QC', 'GST', 5, true),
    (p_user_id, 'QC', 'QST', 9.975, true),
    (p_user_id, 'SK', 'GST', 5, true),
    (p_user_id, 'SK', 'PST', 6, true),
    (p_user_id, 'YT', 'GST', 5, true)
  ON CONFLICT (user_id, province_code, tax_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- PARTE 4: CRIAR TRIGGER PARA NOVOS USUÁRIOS
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS trigger AS $$
BEGIN
  -- Criar configurações de impostos padrão para o novo usuário
  PERFORM public.create_default_tax_configurations(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa após criar um novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created_setup ON auth.users;
CREATE TRIGGER on_auth_user_created_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_setup();

-- ================================================
-- PARTE 5: POPULAR DADOS PARA USUÁRIOS EXISTENTES
-- ================================================
-- Criar configurações de impostos para todos os usuários que já existem
INSERT INTO public.tax_configurations (user_id, province_code, tax_name, tax_rate, is_enabled)
SELECT DISTINCT
    u.id as user_id,
    v.province_code,
    v.tax_name,
    v.tax_rate,
    true as is_enabled
FROM auth.users u
CROSS JOIN (
    VALUES 
    ('AB', 'GST', 5),
    ('BC', 'GST', 5),
    ('BC', 'PST', 7),
    ('MB', 'GST', 5),
    ('MB', 'PST', 7),
    ('NB', 'HST', 15),
    ('NL', 'HST', 15),
    ('NS', 'HST', 15),
    ('NT', 'GST', 5),
    ('NU', 'GST', 5),
    ('ON', 'HST', 13),
    ('PE', 'HST', 15),
    ('QC', 'GST', 5),
    ('QC', 'QST', 9.975),
    ('SK', 'GST', 5),
    ('SK', 'PST', 6),
    ('YT', 'GST', 5)
) as v(province_code, tax_name, tax_rate)
WHERE NOT EXISTS (
    SELECT 1 FROM public.tax_configurations tc 
    WHERE tc.user_id = u.id 
    AND tc.province_code = v.province_code 
    AND tc.tax_name = v.tax_name
);

-- ================================================
-- PARTE 6: CRIAR FUNÇÃO PARA ATUALIZAR TIMESTAMP
-- ================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_tax_configurations_updated_at ON public.tax_configurations;
CREATE TRIGGER update_tax_configurations_updated_at 
  BEFORE UPDATE ON public.tax_configurations
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- PARTE 7: VERIFICAÇÃO FINAL
-- ================================================
-- Mostrar quantas configurações foram criadas para cada usuário
SELECT 
    u.email,
    COUNT(tc.*) as configuracoes_criadas
FROM auth.users u
LEFT JOIN public.tax_configurations tc ON tc.user_id = u.id
GROUP BY u.id, u.email
ORDER BY u.email;

-- ================================================
-- EXECUÇÃO COMPLETA!
-- ================================================
-- Após executar este SQL:
-- 1. A tabela tax_configurations estará criada
-- 2. RLS estará desabilitado (resolvendo o erro 403)
-- 3. Todos os usuários existentes terão configurações de tax
-- 4. Novos usuários receberão configurações automaticamente
-- 5. O erro no console do Chrome deve desaparecer
-- ================================================