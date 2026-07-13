# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Desktop inventory system for Brazilian companies whose differentiator is 2D visual item location on floor plans. Sold as monthly SaaS, multi-tenant, cloud-backed. The full spec is the source of truth: @prompt-sistema-inventario-2d.md

The project is greenfield — development follows the 6 phases at the end of the spec, in order. **Complete a phase and wait for the user's validation before starting the next.**

## Mandated stack (do not substitute)

Tauri 2.x · React 18+ · TypeScript · Vite · Konva.js (react-konva) · Tailwind CSS · Supabase (Postgres + Auth + RLS) · Stripe · Zustand · TanStack Query · Lucide icons

## Architecture rules

- Feature-based layout: `src/features/{inventario,plantas,funcionarios,autenticacao,assinatura}/`, plus `src/components/` (reusable UI), `src/lib/` (Supabase client, utils), `src/stores/` (Zustand).
- Screen components NEVER access the database directly — always go through a service/hooks layer inside the feature.
- Multi-tenant isolation via Supabase Row Level Security: every table and every query must enforce tenant isolation. Treat this as security-critical on all schema work.
- Database migrations are versioned SQL files committed to the repo.
- Floor plans are stored as structured JSON in the database, never as images.

## Language conventions

- Variable/function names: English, camelCase.
- Comments and JSDoc/TSDoc: Portuguese, explaining the "why". JSDoc required on all public functions.
- All UI text: Brazilian Portuguese (pt-BR).
- Light mode only in v1, but structure CSS so dark mode can be added later.

## Performance constraints (target: 4 GB RAM, old CPUs)

- Canvas: viewport culling, limit redraws.
- Large lists: virtualization.
- Offline-first: show cached data when the connection drops, sync when it returns, with a visible sync-status indicator.

## Business rules to keep in mind

- Roles: Administrador (everything), Gestor (create + move items), Consulta (read-only).
- Overdue Stripe subscription = soft lock (read-only mode), not a hard block.

## Infra

- GitHub: https://github.com/ricardogdz1/InventarioGasparin (branch `master`).
- Supabase project: `ydftbrzcwbhtjhdtukmf` (InventarioGasparin, sa-east-1). Every schema change: write the SQL to `supabase/migrations/` AND apply it to the project (keep both in sync).
- Windows build gotcha: if `cargo`/`tauri` fails with `LNK1104: cannot open msvcrt.lib`, run the command inside the VS environment: `cmd /c '"C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" && <command>'`.
