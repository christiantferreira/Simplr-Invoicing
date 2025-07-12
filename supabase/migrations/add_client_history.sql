-- Adiciona as colunas 'history' e 'notes' à tabela 'clients'
-- para rastrear o histórico de atividades e permitir anotações internas.

ALTER TABLE public.clients
ADD COLUMN history JSONB,
ADD COLUMN notes TEXT;
