# Simplr Invoicing - AI Dev Task List (Revisão Pós-Análise do Supabase)

Este documento foi completamente revisado após uma análise detalhada da infraestrutura de backend existente no Supabase. O foco principal agora é a implementação da Interface de Usuário (UI) e do aplicativo móvel para consumir as funcionalidades de backend já existentes.

## Relevant Files

- `src/features/clients/` - Implementação da UI para histórico e notas.
- `src/features/invoices/` - Implementação da UI para faturas recorrentes.
- `src/features/reports/` - Implementação da UI para o sistema de relatórios.
- `src/features/settings/` - Implementação da UI para integração com o Gmail.
- `mobile/` - Novo diretório para o projeto React Native/Expo.

### Notes
- O fluxo de trabalho de banco de dados foi atualizado: não usamos mais migrações locais. Para tarefas de banco de dados, eu fornecerei o script SQL, e o usuário o executará diretamente no SQL Editor do painel online do Supabase.
- As tarefas marcadas com **[AÇÃO MANUAL]** requerem intervenção humana.
- Todas as tarefas foram quebradas em passos simples com dificuldade estimada de 1 a 3.

---

## Tasks

- [x] **1.0 Finalizar a UI de Gestão de Clientes**
  - [x] 1.1 **[Dificuldade: 3]** Criar o script de migração SQL (`add_client_history.sql`) para adicionar as colunas `history` (JSONB) e `notes` (TEXT) à tabela `clients`.
  - [x] 1.2 **[AÇÃO MANUAL]** **[Dificuldade: 2]** Executar o script SQL gerado na tarefa 1.1 no SQL Editor do painel online do Supabase.
  - [x] 1.3 **[Dificuldade: 3]** Na UI do cliente (`ClientDetails.tsx`), adicionar uma seção para exibir o histórico de atividades e as notas.
  - [x] 1.4 **[Dificuldade: 3]** Criar um formulário simples para adicionar novas notas a um cliente.
  - [x] 1.5 **[Dificuldade: 3]** Implementar a chamada à API para salvar as novas notas no banco de dados.

- [x] **2.0 Implementar a UI para Faturas Recorrentes**
  - [x] 2.1 **[Dificuldade: 3]** Criar o componente de formulário `RecurringInvoiceForm.tsx` usando `React Hook Form` e `Zod`.
  - [x] 2.2 **[Dificuldade: 3]** Adicionar campos ao formulário para selecionar o cliente, a fatura modelo, a frequência e as datas de início/fim.
  - [x] 2.3 **[Dificuldade: 3]** Implementar a lógica de submissão do formulário para salvar os dados na tabela `recurring_invoices`.
  - [x] 2.4 **[Dificuldade: 3]** Criar um novo componente `RecurringInvoiceList.tsx` para listar as faturas recorrentes ativas.
  - [x] 2.5 **[Dificuldade: 3]** Adicionar botões na lista para pausar, editar ou excluir uma fatura recorrente.

- [x] **3.0 Implementar a UI do Sistema de Relatórios**
  - [x] 3.1 **[Dificuldade: 3]** Criar o componente `ReportParameterSelection.tsx`.
  - [x] 3.2 **[Dificuldade: 3]** Adicionar um seletor (Dropdown) para escolher o tipo de relatório (Receita, Impostos, etc.).
  - [x] 3.3 **[Dificuldade: 3]** Adicionar um seletor de intervalo de datas (`DateRangePicker`) para os parâmetros do relatório.
  - [x] 3.4 **[Dificuldade: 3]** Implementar a chamada à função de banco de dados correspondente (`calculate_..._report`) ao gerar o relatório.
  - [x] 3.5 **[Dificuldade: 3]** Criar um componente de visualização de tabela para exibir os dados do relatório gerado.
  - [x] 3.6 **[Dificuldade: 3]** Instalar `Recharts` e criar um componente de gráfico para visualizar os dados do relatório.
  - [x] 3.7 **[Dificuldade: 3]** Adicionar um botão "Exportar para CSV" que utiliza os dados em cache para gerar o arquivo.
  - [x] 3.8 **[Dificuldade: 3]** Adicionar um botão "Exportar para PDF" que utiliza os dados em cache para gerar o arquivo.

- [x] **4.0 Implementar a UI para Integração com Gmail**
  - [x] 4.1 **[Dificuldade: 3]** Criar uma página em "Configurações" para a integração com o Gmail.
  - [x] 4.2 **[Dificuldade: 3]** Adicionar um botão "Conectar com Google" que inicia o fluxo de autenticação OAuth do Supabase para o escopo do Gmail.
  - [x] 4.3 **[Dificuldade: 3]** Exibir um status de "Conectado" ou "Desconectado" com base na existência de um token na tabela `gmail_tokens`.

- [x] **4.A Criar o Modal de Envio de Fatura**
  - [x] 4.A.1 **[Dificuldade: 3]** Criar o componente `SendInvoiceModal.tsx` com um formulário básico (email do destinatário, assunto, corpo).
  - [x] 4.A.2 **[Dificuldade: 3]** Adicionar um botão "Enviar Fatura" em um local apropriado (ex: `InvoiceList.tsx`) que abre este modal.

- [x] **4.B Finalizar a Integração com Gmail**
  - [x] 4.B.1 **[Dificuldade: 3]** No `SendInvoiceModal.tsx`, adicionar a opção "Enviar usando meu Gmail" se o usuário estiver conectado.
  - [x] 4.B.2 **[Dificuldade: 3]** Implementar a chamada à Edge Function `send-gmail` ao usar esta opção.

- [ ] **5.0 Iniciar o Desenvolvimento do Aplicativo Móvel (React Native + Expo)**
  - [ ] 5.1 **[AÇÃO MANUAL]** **[Dificuldade: 2]** Executar `npx create-expo-app mobile` para inicializar o projeto.
  - [ ] 5.2 **[AÇÃO MANUAL]** **[Dificuldade: 2]** Organizar a estrutura de pastas dentro de `mobile/` (components, screens, hooks, etc.).
  - [ ] 5.3 **[Dificuldade: 3]** Instalar e configurar o cliente Supabase JS e o React Navigation no projeto móvel.
  - [ ] 5.4 **[Dificuldade: 3]** Implementar a tela de Login, replicando o fluxo de autenticação da web.
  - [ ] 5.5 **[Dificuldade: 3]** Criar uma tela simples para listar as faturas, buscando os dados da tabela `invoices`.
  - [ ] 5.6 **[Dificuldade: 3]** Instalar e configurar uma biblioteca de componentes nativa como o Tamagui.
  - [ ] 5.7 **[Dificuldade: 3]** Converter um componente de UI simples (ex: `Button`) para sua versão nativa do Tamagui.
