# Saldo inicial geral por usuário

## Arquitetura

`account_balance_settings` armazena uma única configuração por usuário. A chave primária é `user_id`; não há conta bancária, instituição, IBAN, credencial, moeda duplicada ou saldo atual persistido. A moeda continua sendo `profiles.currency_code`.

O cálculo puro é:

`currentBalance = openingBalance + income - expenses`

Somente transações cuja `dateISO >= openingDate` participam. `dateISO` é a data canônica, valores não são arredondados e nenhuma conversão monetária é feita.

## Integração pendente

A migration ainda não existe no ambiente remoto e `src/lib/supabase/database.types.ts` não contém `account_balance_settings`. Por isso, repository, `FinanceLoadResult` e `FinanceDataProvider` não consultam a tabela nesta etapa. Isso evita editar tipos oficiais manualmente ou afirmar que o schema remoto já está disponível.

Depois da aplicação autorizada da migration:

1. regenerar `database.types.ts` com o projeto vinculado;
2. criar mapper banco ↔ domínio;
3. adicionar leitura opcional, upsert e delete ao repository com projeção e filtro explícitos;
4. incorporar `accountBalanceSettings` ao carregamento resiliente;
5. manter `null` como sucesso quando não existir configuração;
6. expor o valor no provider e somente então integrar uma etapa visual separada.

## `availableToSpend`

O cálculo permanece indefinido. Antes de implementá-lo, o produto precisa definir horizonte temporal, transações pendentes, contas a pagar futuras, compromissos recorrentes, reservas para Goals, tratamento de cartões e se limites de Budget representam reserva ou apenas planejamento. Sem essas regras, derivá-lo do saldo atual produziria um valor enganoso.
