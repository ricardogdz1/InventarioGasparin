# Prompt: Sistema Desktop de Inventário com Localização Visual 2D

## Contexto e Objetivo

Desenvolva um programa desktop de controle e inventário para empresas, cujo diferencial é a **localização visual dos itens**: o usuário busca um produto e o sistema exibe uma planta 2D (vista de cima) da sala ou armazém, destacando exatamente onde o item está — incluindo salas de escritório com mesas, mostrando qual computador/equipamento está designado para cada funcionário.

O software será vendido por **assinatura mensal**, com dados armazenados em **banco de dados na nuvem**, permitindo que várias filiais/usuários da mesma empresa acessem o mesmo inventário.

## Stack Tecnológica (obrigatória)

- **Desktop:** Tauri 2.x (escolhido por gerar executáveis leves e de baixo consumo de RAM/CPU, essencial pois os computadores das fábricas no Brasil têm hardware modesto)
- **Front-end:** React 18+ com TypeScript e Vite
- **Visualização 2D:** Konva.js (react-konva) para renderizar as plantas interativas em canvas
- **Estilização:** Tailwind CSS
- **Banco de dados em nuvem:** Supabase (PostgreSQL) — usar também Supabase Auth para login de usuários e Row Level Security para isolar os dados de cada empresa cliente (multi-tenant)
- **Pagamentos:** Stripe para gerenciar assinaturas mensais (planos, cobrança recorrente, bloqueio de acesso em caso de inadimplência)
- **Estado global:** Zustand (leve e simples)
- **Cache/sincronização de dados:** TanStack Query (React Query), com estratégia de cache para reduzir chamadas ao banco e manter o app rápido mesmo com internet lenta

## Requisitos de Performance (crítico)

- O app deve rodar bem em máquinas com 4 GB de RAM e processadores antigos
- Renderização 2D otimizada: desenhar apenas o que está visível na tela (viewport culling), limitar redesenhos do canvas
- Listas grandes de produtos devem usar virtualização (renderizar só as linhas visíveis)
- Funcionar com internet instável: exibir dados do cache e sincronizar quando a conexão voltar, com indicador visual de status de sincronização

## Funcionalidades

### 1. Autenticação e Assinatura
- Login com e-mail/senha (Supabase Auth)
- Cada empresa é um "tenant" isolado: usuários de uma empresa nunca veem dados de outra
- Perfis de acesso: **Administrador** (tudo), **Gestor** (cadastra e move itens), **Consulta** (apenas busca e visualiza)
- Integração com Stripe: tela de assinatura, aviso de vencimento, bloqueio suave (modo somente-leitura) se o pagamento atrasar

### 2. Cadastro de Estruturas Físicas
- Cadastro de **Unidades** (prédios/filiais) → **Salas/Armazéns** → **Posições** (mesas, prateleiras, estantes)
- **Editor de planta 2D:** o administrador monta o desenho da sala arrastando elementos prontos de uma biblioteca (mesas, cadeiras, estantes, prateleiras, portas, paredes, computadores, impressoras, caixas). Deve suportar: arrastar e soltar, girar, redimensionar, encaixe em grade (snap to grid), desfazer/refazer
- **Divisórias internas:** além do contorno externo da sala, o editor deve permitir desenhar paredes/divisórias internas para subdividir o ambiente em áreas (ex.: recepção, corredor, setor de expedição), cada uma podendo receber um rótulo de nome
- **Agrupamentos:** mesas e prateleiras podem ser organizadas em blocos/ilhas (ex.: ilha com 6 mesas, fileira com 4 prateleiras), tratados como um conjunto nomeado (ex.: "Ilha Financeiro", "Estante A")
- As plantas são salvas como dados estruturados (JSON) no banco, não como imagens

### 3. Cadastro de Itens e Pessoas
- **Produtos/Ativos:** nome, código/patrimônio, categoria, foto, número de série, data de aquisição, valor, estado de conservação, quantidade (para itens de estoque)
- **Funcionários:** nome, foto, cargo, setor
- **Vínculos:** cada item pode estar vinculado a uma posição na planta (ex.: prateleira B3 do armazém) OU a um funcionário (ex.: notebook designado ao João, que aparece na mesa dele na planta do escritório)
- Geração de **etiquetas com QR Code** para colar nos itens (opcional, mas incluir): escanear o código abre a ficha do item

### 4. Busca e Localização (funcionalidade principal)
- Barra de busca global sempre visível, com resultados instantâneos ao digitar (busca por nome, código, categoria, funcionário responsável)
- Ao selecionar um item: o sistema abre a planta 2D da sala correspondente com **animação de destaque** no local exato (pulso/brilho ao redor do móvel ou mesa)
- **Cartões flutuantes sobre o mapa (callouts):** ao clicar (ou passar o mouse) em uma mesa, estante ou bloco, um cartão de resumo aparece sobreposto à planta, **ancorado ao local por uma linha indicadora** (estilo balão de anotação). O cartão mostra uma lista compacta dos itens naquela posição (ícone + nome + código) e, se for uma mesa de funcionário, o nome e a foto do responsável. Vários cartões podem ficar abertos ao mesmo tempo, e devem se reposicionar automaticamente para não sair da tela nem cobrir o ponto que indicam
- Clicar em um item dentro do cartão flutuante abre um painel lateral com a ficha completa: foto, dados, funcionário responsável, histórico de movimentações
- Filtros: por sala, categoria, funcionário, estado

### 5. Movimentações e Histórico
- Registrar transferência de itens entre posições, salas ou funcionários
- Histórico completo por item: quem moveu, quando, de onde para onde
- Relatórios exportáveis (PDF/Excel): inventário geral, itens por funcionário, itens por sala, movimentações no período

## Identidade Visual

- Estilo **flat design cartunizado e sóbrio**: móveis e objetos com formas arredondadas, cantos suaves e leve sombra projetada — nada de retângulos crus e sem graça, mas também nada infantil ou exageradamente colorido
- Paleta de cores discreta e profissional: tons neutros claros de fundo (cinza-claro/bege suave), 4 a 6 cores de destaque suaves para categorias de objetos, e uma cor vibrante única (ex.: laranja ou azul) reservada para o destaque do item buscado
- Os cartões flutuantes do mapa devem ter cantos arredondados, sombra suave e a linha indicadora na mesma cor de destaque, lembrando um post-it/balão de anotação elegante
- Ícones consistentes (usar biblioteca Lucide)
- Interface em **português do Brasil**
- Modo claro apenas na primeira versão (estruturar o CSS para permitir modo escuro no futuro)

## Padrões de Código e Manutenibilidade (obrigatório)

Repositorio github: https://github.com/ricardogdz1/InventarioGasparin

O projeto será mantido futuramente por outros desenvolvedores. Portanto:

- **Comentários** em português explicando o "porquê" das decisões, e JSDoc/TSDoc em todas as funções públicas
- **Convenções da linguagem:** ESLint + Prettier configurados; nomes de variáveis/funções em inglês seguindo camelCase (padrão da comunidade), textos da interface em português
- **Arquitetura por funcionalidade (feature-based):** estrutura de pastas do tipo:
  ```
  src/
    features/
      inventario/     (componentes, hooks, serviços e tipos do inventário)
      plantas/        (editor e visualizador 2D)
      funcionarios/
      autenticacao/
      assinatura/
    components/       (componentes de UI reutilizáveis)
    lib/              (cliente Supabase, utilitários)
    stores/           (estado global Zustand)
  ```
- **Camadas separadas:** componentes de tela nunca acessam o banco diretamente — sempre passam por uma camada de serviços/hooks
- **README.md completo:** como instalar, rodar, estrutura do projeto, decisões de arquitetura e como fazer deploy
- Migrações do banco versionadas (SQL do Supabase no repositório)
- Testes unitários para as regras de negócio principais (movimentação, vínculos, permissões)

## Fases de Desenvolvimento (entregar nesta ordem)

1. **Fase 1 — Fundação:** setup do Tauri + React + Supabase, autenticação, estrutura multi-tenant, CRUD de unidades e salas
2. **Fase 2 — Inventário básico:** CRUD de produtos e funcionários, busca com filtros, vínculos item↔funcionário
3. **Fase 3 — Visualização 2D:** visualizador de plantas com Konva.js, destaque animado do item buscado, cartões flutuantes ancorados (callouts) e painel lateral de detalhes
4. **Fase 4 — Editor de plantas:** editor drag-and-drop com biblioteca de móveis, snap to grid, desfazer/refazer
5. **Fase 5 — Movimentações e relatórios:** histórico, transferências, exportação PDF/Excel, QR Codes
6. **Fase 6 — Assinatura:** integração Stripe, planos, bloqueio por inadimplência, empacotamento do instalador para Windows

Comece pela Fase 1 e aguarde validação antes de avançar para a próxima fase.
