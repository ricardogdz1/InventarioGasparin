-- =============================================================================
-- Migração 0001 — Fundação multi-tenant (Fase 1)
--
-- Por quê: cada empresa cliente é um "tenant" isolado. O isolamento é feito
-- no banco via Row Level Security (RLS), e não na aplicação, para que nenhum
-- bug de front-end consiga vazar dados entre empresas.
-- =============================================================================

-- Perfis de acesso do sistema (ver especificação):
--   administrador → tudo | gestor → cadastra e move itens | consulta → somente leitura
create type public.perfil_acesso as enum ('administrador', 'gestor', 'consulta');

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.empresas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  cnpj       text,
  criado_em  timestamptz not null default now()
);

-- Perfil de usuário: liga o usuário do Supabase Auth à sua empresa e ao seu
-- nível de acesso. A PK referencia auth.users para garantir 1 perfil por login.
create table public.perfis (
  id          uuid primary key references auth.users (id) on delete cascade,
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  nome        text not null,
  acesso      public.perfil_acesso not null default 'consulta',
  criado_em   timestamptz not null default now()
);

create table public.unidades (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  nome        text not null,
  endereco    text,
  criado_em   timestamptz not null default now()
);

create table public.salas (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  unidade_id  uuid not null references public.unidades (id) on delete cascade,
  nome        text not null,
  descricao   text,
  criado_em   timestamptz not null default now()
);

-- Índices nos campos de tenant e de junção: toda consulta filtra por empresa_id.
create index idx_perfis_empresa   on public.perfis (empresa_id);
create index idx_unidades_empresa on public.unidades (empresa_id);
create index idx_salas_empresa    on public.salas (empresa_id);
create index idx_salas_unidade    on public.salas (unidade_id);

-- ---------------------------------------------------------------------------
-- Funções auxiliares de RLS
--
-- Por quê security definer: as políticas de RLS de outras tabelas precisam
-- consultar public.perfis; fazer isso diretamente na política criaria
-- recursão de RLS. A função roda como dona (bypassa RLS) e é estável
-- dentro da transação, então o Postgres pode cacheá-la por consulta.
-- ---------------------------------------------------------------------------

create or replace function public.empresa_do_usuario()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select empresa_id from public.perfis where id = auth.uid()
$$;

create or replace function public.acesso_do_usuario()
returns public.perfil_acesso
language sql stable security definer
set search_path = ''
as $$
  select acesso from public.perfis where id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- RPC de cadastro: cria a empresa e o primeiro usuário (administrador).
--
-- Por quê RPC: no momento do cadastro o usuário ainda não tem perfil,
-- então as políticas de RLS o impediriam de inserir em empresas/perfis.
-- A função security definer executa esse bootstrap de forma atômica.
-- ---------------------------------------------------------------------------

create or replace function public.registrar_empresa(nome_empresa text, nome_usuario text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  nova_empresa uuid;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado para registrar uma empresa.';
  end if;

  if exists (select 1 from public.perfis where id = auth.uid()) then
    raise exception 'Este usuário já está vinculado a uma empresa.';
  end if;

  insert into public.empresas (nome)
  values (nome_empresa)
  returning id into nova_empresa;

  insert into public.perfis (id, empresa_id, nome, acesso)
  values (auth.uid(), nova_empresa, nome_usuario, 'administrador');

  return nova_empresa;
end;
$$;

revoke execute on function public.registrar_empresa(text, text) from public, anon;
grant  execute on function public.registrar_empresa(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Regra geral: membros do tenant podem ler; escrita em estruturas físicas é
-- exclusiva do administrador (o gestor cadastra/move ITENS, não estruturas).
-- ---------------------------------------------------------------------------

alter table public.empresas enable row level security;
alter table public.perfis   enable row level security;
alter table public.unidades enable row level security;
alter table public.salas    enable row level security;

-- empresas: leitura pelo próprio tenant; só o administrador altera os dados.
create policy "empresas_select" on public.empresas
  for select to authenticated
  using (id = public.empresa_do_usuario());

create policy "empresas_update" on public.empresas
  for update to authenticated
  using (id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador')
  with check (id = public.empresa_do_usuario());

-- perfis: todos do tenant se enxergam (necessário para exibir responsáveis).
-- Inserção acontece apenas via registrar_empresa (e, futuramente, convites).
create policy "perfis_select" on public.perfis
  for select to authenticated
  using (empresa_id = public.empresa_do_usuario());

-- unidades: leitura pelo tenant; escrita somente administrador.
create policy "unidades_select" on public.unidades
  for select to authenticated
  using (empresa_id = public.empresa_do_usuario());

create policy "unidades_insert" on public.unidades
  for insert to authenticated
  with check (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');

create policy "unidades_update" on public.unidades
  for update to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador')
  with check (empresa_id = public.empresa_do_usuario());

create policy "unidades_delete" on public.unidades
  for delete to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');

-- salas: mesmas regras de unidades.
create policy "salas_select" on public.salas
  for select to authenticated
  using (empresa_id = public.empresa_do_usuario());

create policy "salas_insert" on public.salas
  for insert to authenticated
  with check (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');

create policy "salas_update" on public.salas
  for update to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador')
  with check (empresa_id = public.empresa_do_usuario());

create policy "salas_delete" on public.salas
  for delete to authenticated
  using (empresa_id = public.empresa_do_usuario() and public.acesso_do_usuario() = 'administrador');
