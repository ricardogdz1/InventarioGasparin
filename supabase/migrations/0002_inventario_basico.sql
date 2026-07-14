-- =============================================================================
-- Migração 0002 — Inventário básico (Fase 2)
--
-- Produtos/ativos, funcionários, vínculos item↔funcionário ou item↔sala e
-- armazenamento de fotos. Escrita de produtos é liberada também ao gestor
-- (a especificação define: gestor cadastra e move ITENS); funcionários e
-- estruturas continuam exclusivos do administrador.
-- =============================================================================

create type public.estado_conservacao as enum ('novo', 'otimo', 'bom', 'regular', 'ruim');

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.funcionarios (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  nome        text not null,
  cargo       text,
  setor       text,
  foto_path   text,
  criado_em   timestamptz not null default now()
);

create table public.produtos (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references public.empresas (id) on delete cascade,
  nome            text not null,
  codigo          text,
  categoria       text,
  numero_serie    text,
  data_aquisicao  date,
  valor           numeric(12,2),
  estado          public.estado_conservacao not null default 'bom',
  quantidade      integer not null default 1 check (quantidade >= 0),
  foto_path       text,
  -- Vínculo: o item fica com um funcionário OU numa sala (ou sem vínculo).
  -- Vínculo a posições específicas da planta chega nas Fases 3–4.
  funcionario_id  uuid references public.funcionarios (id) on delete set null,
  sala_id         uuid references public.salas (id) on delete set null,
  criado_em       timestamptz not null default now(),
  constraint vinculo_unico check (funcionario_id is null or sala_id is null)
);

-- Código/patrimônio único por empresa (quando informado).
create unique index idx_produtos_codigo_unico
  on public.produtos (empresa_id, codigo) where codigo is not null;

create index idx_funcionarios_empresa on public.funcionarios (empresa_id);
create index idx_produtos_empresa     on public.produtos (empresa_id);
create index idx_produtos_funcionario on public.produtos (funcionario_id);
create index idx_produtos_sala        on public.produtos (sala_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.funcionarios enable row level security;
alter table public.produtos     enable row level security;

-- funcionarios: leitura pelo tenant; escrita somente administrador.
create policy "funcionarios_select" on public.funcionarios
  for select to authenticated
  using (empresa_id = public.empresa_do_usuario());

create policy "funcionarios_insert" on public.funcionarios
  for insert to authenticated
  with check (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');

create policy "funcionarios_update" on public.funcionarios
  for update to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador')
  with check (empresa_id = public.empresa_do_usuario());

create policy "funcionarios_delete" on public.funcionarios
  for delete to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');

-- produtos: leitura pelo tenant; escrita para administrador E gestor.
create policy "produtos_select" on public.produtos
  for select to authenticated
  using (empresa_id = public.empresa_do_usuario());

create policy "produtos_insert" on public.produtos
  for insert to authenticated
  with check (
    empresa_id = public.empresa_do_usuario()
    and public.acesso_do_usuario() in ('administrador', 'gestor')
  );

create policy "produtos_update" on public.produtos
  for update to authenticated
  using (
    empresa_id = public.empresa_do_usuario()
    and public.acesso_do_usuario() in ('administrador', 'gestor')
  )
  with check (empresa_id = public.empresa_do_usuario());

create policy "produtos_delete" on public.produtos
  for delete to authenticated
  using (
    empresa_id = public.empresa_do_usuario()
    and public.acesso_do_usuario() in ('administrador', 'gestor')
  );

-- ---------------------------------------------------------------------------
-- Armazenamento de fotos (bucket privado, isolado por tenant)
--
-- Convenção de caminho: {empresa_id}/{produtos|funcionarios}/{uuid}.{ext}
-- O primeiro segmento do caminho é a empresa — as políticas exigem que ele
-- seja o tenant do usuário, garantindo o isolamento também nos arquivos.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

create policy "fotos_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = public.empresa_do_usuario()::text
  );

create policy "fotos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = public.empresa_do_usuario()::text
    and public.acesso_do_usuario() in ('administrador', 'gestor')
  );

create policy "fotos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = public.empresa_do_usuario()::text
    and public.acesso_do_usuario() in ('administrador', 'gestor')
  );

create policy "fotos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = public.empresa_do_usuario()::text
    and public.acesso_do_usuario() in ('administrador', 'gestor')
  );
