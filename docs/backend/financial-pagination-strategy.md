# Estratégia de ordenação e paginação financeira

## Estado atual

As seis coleções são carregadas integralmente e de forma independente. A paginação da tela Transactions é somente visual e ocorre em memória depois dos filtros e da ordenação. Portanto, Dashboard, Budgets, Goals, Insights e IA ainda recebem conjuntos completos.

| Coleção | Crescimento esperado | Ordem canônica | Consumidores e filtros | Risco de truncamento | Estratégia recomendada |
| --- | --- | --- | --- | --- | --- |
| `transactions` | Alto e contínuo | `date_iso DESC`, `created_at DESC`, `id ASC` | Transactions lista e importa; Dashboard, Budgets, Goals e Insights calculam por mês; IA consulta intervalos e resumos | Crítico: uma página parcial altera totais, categorias, projeções e tendências | Manter a hidratação completa agora. Futuramente separar lista paginada, consulta completa por intervalo e resumo agregado por período |
| `budgets` | Baixo a moderado, por mês/categoria | `month DESC`, `created_at DESC`, `id ASC` | Dashboard, Budgets, Goals, Insights e IA; normalmente filtrado por mês | Alto quando usado sem todos os budgets do período | Consultar coleção completa por mês; paginação apenas para histórico/listagem independente |
| `budget_adjustments` | Baixo, no máximo um por mês/usuário | `month DESC` | Dashboard, Budgets, Goals e Insights por chave mensal | Alto se o mês solicitado não estiver na página | Busca direta por mês; sem paginação na hidratação atual |
| `goals` | Baixo | `target_date ASC`, `created_at ASC`, `id ASC` | Dashboard seleciona a Goal principal; Goals lista/seleciona; Transactions mostra impacto; Insights e IA | Alto se a Goal principal for omitida | Manter completo; se crescer, separar consulta da principal e lista paginada |
| `goal_contribution_plans` | Baixo, no máximo um por Goal/usuário | `goal_id ASC` | Dashboard e Goals por vínculo com Goal; Insights e IA financeira | Alto se o plano da Goal selecionada for omitido | Buscar pelos IDs das Goals necessárias; manter completo enquanto o volume for baixo |
| `investments` | Moderado | `created_at ASC`, `id ASC` | Investments filtra em memória e renderiza na ordem de inclusão | Médio para listas; alto para futuros totais de carteira | Paginar somente a lista quando resumos completos/servidor existirem separadamente |

## Contratos futuros

- `TransactionDateRange` representa um intervalo civil inclusivo.
- `OffsetPagination` e `CursorPagination` tornam a estratégia e o tamanho explícitos.
- `PaginatedResult` sempre possui `completeness: "partial"` e total independente.
- `CompletePeriodResult` possui `completeness: "complete"` e é o único resultado aceito pelo guard de cálculos completos.

Nenhuma consulta paginada foi ligada nesta etapa. A evolução segura exige endpoints distintos: uma consulta paginada para listas, consultas completas filtradas por período para cálculos locais e, quando autorizada por migration, agregações SQL/RPC para resumos. Totais nunca devem ser derivados de `PaginatedResult`.
