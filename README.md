# Inventário Gasparin

Sistema desktop de controle e inventário para empresas, com **localização visual 2D** dos itens em plantas de salas e armazéns. Multi-tenant, vendido por assinatura mensal, com dados na nuvem (Supabase).

A especificação completa está em [`prompt-sistema-inventario-2d.md`](./prompt-sistema-inventario-2d.md).

## Stack

- [Tauri 2](https://tauri.app/) — shell desktop leve (roda bem em máquinas com 4 GB de RAM)
- [React](https://react.dev/) + TypeScript + [Vite](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/) — estilização
- [Supabase](https://supabase.com/) — PostgreSQL + Auth + Row Level Security (isolamento multi-tenant)
- [TanStack Query](https://tanstack.com/query) — cache e sincronização de dados (funciona offline)
- [Zustand](https://zustand.docs.pmnd.rs/) — estado global
- [Konva.js](https://konvajs.org/) / react-konva — plantas 2D interativas (Fase 3+)
- [Lucide](https://lucide.dev/) — ícones

## Como rodar

### Pré-requisitos

- Node.js 20+
- Rust (via [rustup](https://rustup.rs/)) + Visual Studio Build Tools com C++ — necessários apenas para rodar como app desktop
- Um projeto no Supabase

### Passos

```bash
npm install
cp .env.example .env   # preencha com a URL e a chave do seu projeto Supabase
npm run dev            # desenvolvimento no navegador (http://localhost:1420)
npm run tauri dev      # desenvolvimento como app desktop (exige Rust)
```

### Banco de dados

As migrações SQL ficam versionadas em [`supabase/migrations/`](./supabase/migrations/). Aplique-as em ordem no SQL Editor do painel do Supabase (ou via CLI `supabase db push`).

## Scripts

| Comando               | O que faz                              |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Vite em modo desenvolvimento (browser) |
| `npm run tauri dev`   | App desktop em modo desenvolvimento    |
| `npm run build`       | Type-check + build de produção         |
| `npm run tauri build` | Gera o instalador desktop              |
| `npm run lint`        | ESLint                                 |
| `npm run format`      | Prettier (escreve)                     |

## Estrutura do projeto

```
src/
  features/            # arquitetura por funcionalidade
    autenticacao/      # login, cadastro e onboarding da empresa
    estruturas/        # unidades e salas (Fase 1)
    inventario/        # produtos e vínculos (Fase 2)
    plantas/           # visualizador e editor 2D (Fases 3–4)
    funcionarios/      # (Fase 2)
    assinatura/        # Stripe (Fase 6)
  components/          # componentes de UI reutilizáveis
  lib/                 # cliente Supabase, TanStack Query
  stores/              # estado global (Zustand)
supabase/migrations/   # migrações SQL versionadas
src-tauri/             # código do shell Tauri (Rust)
```

## Decisões de arquitetura

- **Componentes de tela nunca acessam o banco diretamente** — toda chamada passa pela camada de serviços da feature (`features/*/services/`).
- **Isolamento multi-tenant no banco** via Row Level Security: as políticas garantem que usuários de uma empresa jamais leiam/escrevam dados de outra, independentemente de bugs no front-end.
- **Offline-first:** o TanStack Query exibe o cache imediatamente e sincroniza em segundo plano; o indicador na barra lateral mostra o status.
- **Perfis de acesso:** Administrador (tudo), Gestor (cadastra e move itens), Consulta (somente leitura) — aplicados no banco (RLS) e refletidos na interface.

## Fases de desenvolvimento

1. ✅ **Fase 1 — Fundação:** Tauri + React + Supabase, autenticação, multi-tenant, CRUD de unidades e salas
2. ⬜ **Fase 2 — Inventário básico:** produtos, funcionários, busca, vínculos
3. ⬜ **Fase 3 — Visualização 2D:** plantas com Konva, destaque de item, callouts
4. ⬜ **Fase 4 — Editor de plantas:** drag-and-drop, snap to grid, desfazer/refazer
5. ⬜ **Fase 5 — Movimentações e relatórios:** histórico, PDF/Excel, QR Codes
6. ⬜ **Fase 6 — Assinatura:** Stripe, bloqueio por inadimplência, instalador Windows
