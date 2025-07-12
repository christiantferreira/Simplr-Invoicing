# Relatório de Correções de Estabilidade do Sistema

Este documento resume uma série de correções críticas implementadas para resolver problemas de sincronização entre o código do frontend, o schema do banco de dados Supabase e as políticas de segurança em nível de linha (RLS).

## 1. Problema Inicial: Falhas de Acesso e Salvamento (Erros 404)

- **Sintoma:** A aplicação falhava ao carregar ou salvar dados em várias seções, mais notavelmente na página de Configurações. O console do navegador exibia erros `404 Not Found` ao tentar acessar recursos do Supabase.
- **Causa Raiz:** As políticas de Segurança em Nível de Linha (RLS) estavam habilitadas nas tabelas, mas não havia políticas `SELECT`, `INSERT`, ou `UPDATE` definidas para o `role` de usuário `authenticated`. Por padrão, a RLS bloqueia todo o acesso, e o Supabase retorna um 404 para não vazar a existência da tabela.
- **Solução:**
  - Foi criado e executado um script SQL abrangente que:
    1.  Concedeu permissões (`GRANT`) de `SELECT, INSERT, UPDATE, DELETE` para o `role` `authenticated` em todas as tabelas de dados do usuário.
    2.  Implementou políticas de RLS `FOR ALL` em cada tabela, usando a condição `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`. Isso garante que um usuário só possa acessar e modificar as linhas que lhe pertencem.

## 2. Problema Secundário: Inconsistência de Nomes de Tabelas e Colunas

- **Sintoma:** Mesmo após a correção da RLS, os erros persistiram, mas mudaram para "tabela não encontrada" ou "coluna não encontrada".
- **Causa Raiz:** O código do frontend continha referências a nomes de tabelas e colunas que não correspondiam ao schema real do banco de dados.
  - Exemplo 1: O código chamava a tabela `company_info`, mas no banco de dados ela se chamava `settings`.
  - Exemplo 2: O código tentava salvar colunas como `address` e `company_name` na tabela `settings`, mas elas não existiam.
  - Exemplo 3: O código tentava ordenar `tax_configurations` pela coluna `province_code`, mas a coluna se chamava `province`.
- **Solução:**
  - Foi realizada uma auditoria completa, comparando o código com o schema do banco de dados.
  - **No Banco de Dados:** Adicionamos as colunas que faltavam à tabela `settings` (`company_name`, `email`, `phone_number`, `primary_color`, etc.) e à tabela `tax_configurations` (`is_enabled`) para corresponder à funcionalidade desejada na UI.
  - **No Código:** Corrigimos todas as referências de `company_info` para `settings` e de `province_code` para `province` em todos os arquivos relevantes (`Settings.tsx`, `InvoiceContext.tsx`, `useSupabaseInvoices.tsx`).

## 3. Problema de Tipos: Inconsistência entre `camelCase` e `snake_case`

- **Sintoma:** Após corrigir os nomes das tabelas, surgiram erros de TypeScript indicando que propriedades não existiam em determinados tipos.
- **Causa Raiz:** As interfaces TypeScript no arquivo `src/types/index.ts` usavam `camelCase` (ex: `invoiceNumber`), enquanto o schema do banco de dados e as respostas da API do Supabase usam `snake_case` (ex: `invoice_number`).
- **Solução:**
  - O arquivo `src/types/index.ts` foi completamente refatorado. Todas as interfaces que representam tabelas do banco de dados foram atualizadas para usar `snake_case`, alinhando os tipos do frontend com a fonte da verdade (o banco de dados).
  - Todos os arquivos que consumiam esses tipos (principalmente `InvoiceContext.tsx` e `useSupabaseInvoices.tsx`) foram corrigidos para usar os nomes de propriedade corretos.

## 4. Refatoração do Sistema de Impostos

- **Sintoma:** A configuração de impostos era manual e propensa a erros.
- **Causa Raiz:** A lógica dependia de uma tabela `tax_configurations` que o usuário precisava gerenciar.
- **Solução:**
  - A tabela `tax_configurations` foi removida do banco de dados.
  - Uma estrutura de dados estática com as taxas de GST/HST atuais do Canadá foi adicionada a `src/constants/serviceTypes.ts`.
  - A lógica foi movida para o frontend:
    - A cobrança de imposto agora é ativada automaticamente se um `gst_number` for fornecido nas configurações.
    - A taxa correta é determinada pela `province` do usuário.
    - A UI foi atualizada para remover a configuração manual e, em vez disso, exibir um feedback informativo sobre a taxa que será aplicada.

Essas correções estabilizaram o sistema, alinharam o código com o banco de dados e melhoraram a experiência do usuário ao automatizar a lógica de impostos.
