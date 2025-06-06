# Correção do Problema do Prefixo de Invoice

## Problema
O usuário relatou que não conseguia salvar um prefixo de invoice vazio (sem "INV-"). O sistema sempre voltava o prefixo para "INV-" mesmo quando o usuário tentava deixar o campo vazio para ter apenas números nas invoices.

## Causa Raiz
O problema estava em múltiplos pontos do código onde valores padrão "INV-" estavam sendo forçados:

1. **Settings.tsx** - Estado inicial do formulário com valor padrão "INV-"
2. **Settings.tsx** - Função `loadCompanySettings` forçando "INV-" quando não havia dados
3. **useSupabaseInvoices.tsx** - Função `getNextInvoiceNumber` com fallback para "INV-"
4. **useSupabaseInvoices.tsx** - Lógica de filtro de invoices não funcionava corretamente com prefixo vazio

## Alterações Realizadas

### 1. Settings.tsx
- **Linha 47**: Alterado valor inicial de `invoice_prefix` de `'INV-'` para `''`
- **Linha 82**: Alterado fallback de `companyData.invoice_prefix || 'INV-'` para `companyData.invoice_prefix || ''`

### 2. useSupabaseInvoices.tsx
- **Linha 13**: Alterado fallback de `return 'INV-001'` para `return '001'`
- **Linha 21**: Alterado fallback de `const prefix = companyData?.invoice_prefix || 'INV-'` para `const prefix = companyData?.invoice_prefix || ''`
- **Linha 33-44**: Melhorada a lógica de filtro para lidar com prefixos vazios:
  - Se o prefixo estiver vazio, filtra apenas números puros usando regex `/^\d+$/`
  - Caso contrário, usa a lógica original de `startsWith(prefix)`
- **Linha 54**: Alterado fallback de erro de `return 'INV-001'` para `return '001'`

## Resultado
Agora o sistema permite:
- Salvar prefixos vazios (campo em branco)
- Gerar números de invoice apenas com números (ex: 001, 002, 003)
- Manter a funcionalidade original para prefixos personalizados (ex: FAT-001, BILL-001)
- Preview correto na interface mostrando como ficará o próximo número

## Teste
Para testar a correção:
1. Acesse as configurações da empresa
2. Limpe completamente o campo "Invoice Prefix"
3. Salve as configurações
4. Verifique que o preview mostra apenas números (ex: 001)
5. Crie uma nova invoice e confirme que o número gerado é apenas numérico

## Compatibilidade
As alterações são totalmente compatíveis com:
- Invoices existentes com prefixos
- Novos prefixos personalizados
- Sistema de numeração sequencial existente
