-- =============================================================================
-- Migração 0003 — Visualização 2D (Fase 3)
--
-- Plantas das salas armazenadas como JSON estruturado (nunca como imagem,
-- regra da especificação). Cada sala tem no máximo uma planta. Os produtos
-- ganham `posicao_id`: o id do elemento da planta (mesa, estante…) onde o
-- item está — válido apenas junto com o vínculo de sala.
-- =============================================================================

create table public.plantas (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references public.empresas (id) on delete cascade,
  sala_id        uuid not null unique references public.salas (id) on delete cascade,
  -- Estrutura: { largura, altura, elementos: [{ id, tipo, x, y, largura,
  -- altura, rotacao, rotulo, funcionario_id }] }
  dados          jsonb not null default '{"largura": 800, "altura": 600, "elementos": []}',
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create index idx_plantas_empresa on public.plantas (empresa_id);

alter table public.produtos add column posicao_id text;

alter table public.plantas enable row level security;

-- Leitura pelo tenant; escrita somente administrador (planta é estrutura física).
create policy "plantas_select" on public.plantas
  for select to authenticated
  using (empresa_id = public.empresa_do_usuario());

create policy "plantas_insert" on public.plantas
  for insert to authenticated
  with check (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');

create policy "plantas_update" on public.plantas
  for update to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador')
  with check (empresa_id = public.empresa_do_usuario());

create policy "plantas_delete" on public.plantas
  for delete to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');
