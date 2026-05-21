# My Consultorio - Front-end

Documentacao oficial do front-end para onboarding e manutencao.

## Documentacao de Integracao (Front + Back)

- Referencia implementada: **Especialidades**
- Guia didatico para repetir o padrao em outros modulos: [`docs/integracao-especialidades.md`](docs/integracao-especialidades.md)

## 1. Visao Geral do Projeto

Este sistema e um SaaS de gestao para **profissional autonomo da saude** (medico, psicologo, dentista, fisioterapeuta etc.).

Objetivo do produto no front-end:

- centralizar rotina diaria (agenda, consulta, pacientes e financeiro)
- manter interface simples e direta
- evitar complexidade de ERP/clinica grande
- permitir evolucao gradual para API de producao

Filosofia atual do codigo:

- simples, tipado e sem overengineering
- componentes reutilizaveis para UI
- validacao com Zod
- navegacao contextual (retorno para tela de origem)
- parte dos fluxos ainda roda com dados em memoria (`src/pages/**/data.ts`)

## 2. Tecnologias Utilizadas

Stack principal:

- `React 19` - UI
- `TypeScript` - tipagem estatica
- `Vite` - bundler/dev server
- `React Router DOM 7` - roteamento
- `CSS Modules` - estilos por componente/tela
- `React Hook Form` - formularios
- `Zod` + `@hookform/resolvers/zod` - validacao de formularios e payloads
- `react-icons` - icones da interface
- `bootstrap` (CSS global importado em `src/main.tsx`)

Infra de API:

- cliente HTTP custom (`src/services/api/http/http-client.ts`)
- normalizacao de erros (`src/services/api/errors`)
- schemas de contrato (`src/services/api/schemas/domain.schema.ts`)
- servicos por dominio (`src/services/api/services`)

## 3. Como Rodar o Projeto

### 3.1 Instalar dependencias

```bash
npm install
```

### 3.2 Configurar variaveis de ambiente

Crie `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Variaveis atuais:

- `VITE_API_BASE_URL` - base da API (aceita `{hostname}`, `{origin}`, `{tenant}` e `{subdomain}`)
- `VITE_APP_HOSTNAME_BASE` - dominio base para extrair tenant por subdominio (ex.: `localhost`)
- `VITE_API_PORT` - porta da API (aceita `same` para usar a mesma porta da UI)
- `VITE_API_BASE_PATH` - prefixo opcional de rota da API
- `VITE_API_TIMEOUT_MS` - timeout de requisicao
- `VITE_API_CREDENTIALS_MODE` - `omit|include|same-origin`
- `VITE_AUTH_TOKEN_STORAGE_KEY` - chave de token no `sessionStorage`
- `VITE_SUPPORT_WHATSAPP_NUMBER` - numero usado nos CTAs da landing de tenant inexistente

### 3.3 Rodar em desenvolvimento

```bash
npm run dev
```

### 3.4 Build de producao

```bash
npm run build
```

### 3.5 Preview local da build

```bash
npm run preview
```

### 3.6 Lint

```bash
npm run lint
```

## 4. Estrutura de Pastas (importante)

Estrutura raiz de `src`:

```text
src/
  assets/
  auth/
  components/
  domain/
  layout/
  pages/
  routes/
  schemas/
  services/
  App.tsx
  index.css
  main.tsx
```

### `src/main.tsx` e `src/App.tsx`

- bootstrap da aplicacao
- `RouterProvider(router)` em `App.tsx`

### `src/layout/`

- layout principal autenticado
- compoe `Sidebar + Header + Outlet`

### `src/routes/`

- `router.tsx`: arvore de rotas
- `auth-guards.tsx`: `RequireAuth` e `RedirectAuthenticated`
- `return-to.ts`: resolve retorno seguro com `location.state.returnTo`

### `src/components/`

- `header/`, `sidebar/`
- `ui/`: biblioteca interna reutilizavel (cards, tabela, modal, filtros, badges, etc.)

### `src/pages/`

Telas organizadas por dominio:

- `home`
- `agenda` + `agenda/agendamento` (modais e tipos do agendamento)
- `consulta`
- `pacientes` (listar, novo, editar, visualizar, prontuarios)
- `profissionais` (perfil unico + especialidades)
- `consultorio` (dados do consultorio principal)
- `documentos-pagar` (contas a pagar)
- `contas-receber`
- `fluxo-caixa`
- `formas-pagamento`
- `convenios`
- `servicos`
- `configuracoes`
- `auth` (login/esqueci senha)
- `not-found`

Observacao importante: varios modulos usam `data.ts` local (store em memoria) dentro da propria pasta de pagina.

### `src/schemas/`

Schemas Zod de formularios/dominios de tela:

- paciente, agendamento, financeiro, configuracao, profissional, consultorio, auth etc.

### `src/domain/`

- regras compartilhadas de negocio/estado
- destaque: `atendimento-status.ts` (maquina de status de agenda/consulta/prontuario/recebimento)

### `src/services/api/`

Camada de integracao com backend:

- `config/` (env)
- `http/` (cliente HTTP)
- `errors/` (normalizacao de erro)
- `auth/` (token store)
- `schemas/` (contratos)
- `services/` (auth, patient, appointment, financial, clinic, professional, specialty, tenant)
- `mappers/` (map de formulario para payload de API)

## 5. Padroes do Projeto (essencial)

### 5.1 Componentes

Padrao predominante:

- arquivo `index.tsx`
- estilo em `styles.module.css`
- props tipadas em TypeScript
- sem estado global para UI simples

Quando criar componente novo:

- quando bloco visual/comportamento se repete em 2+ telas
- quando componente representa padrao de sistema (header, tabela, filtro, badge)

Quando reutilizar:

- sempre que o caso encaixar no componente `ui` existente

### 5.2 Layout/UI

Padroes usados no sistema:

- pagina: `PageLayout` + `PageHeader`
- resumo: `SummaryMetrics` ou `Card`
- listagem: `Table` + `TableTextCell` + `TableActionButton`
- filtros compactos: `CompactFilters`
- formularios: `FormField` + RHF + Zod
- status: `StatusBadge`
- confirmacao: `Modal`

### 5.3 Estilo de codigo

- tipagem forte (interfaces/types)
- validacao defensiva em borda (formulario, rota, API)
- funcoes utilitarias pequenas por dominio
- evitar duplicacao de regra de status (centralizar em `domain/atendimento-status.ts`)

## 6. Componentes Reutilizaveis

Principais componentes de `src/components/ui`:

### `PageLayout`

Uso: wrapper padrao de conteudo da tela.

```tsx
<PageLayout>
  {/* conteudo da tela */}
</PageLayout>
```

### `PageHeader`

Uso: titulo/subtitulo + acoes no topo.

```tsx
<PageHeader
  title="Pacientes"
  subtitle="Gestao de pacientes cadastrados"
  right={<button type="button">Novo</button>}
/>
```

### `Table<T>`

Uso: listagens padrao com colunas tipadas e render custom.

```tsx
<Table
  data={rows}
  columns={[
    { key: "nome", label: "Nome" },
    { key: "status", label: "Status", render: (row) => <StatusBadge label={row.status} variant="info" /> },
  ]}
/>
```

### `FormField`

Uso: campo padrao com `label`, `hint`, `error` e acessibilidade.

```tsx
<FormField id="paciente-nome" label="Nome" required error={errors.nome?.message}>
  <input {...register("nome")} />
</FormField>
```

### `Modal`

Uso: dialogo de confirmacao/formulario.

```tsx
<Modal open={open} onClose={onClose} title="Excluir" subtitle="Acao irreversivel">
  {/* conteudo */}
</Modal>
```

### `CompactFilters` + `CompactFilterField`

Uso: filtros compactos com opcao avancada.

```tsx
<CompactFilters
  fields={<CompactFilterField label="Buscar"><input /></CompactFilterField>}
  showClear
  onClear={resetFilters}
/>
```

### `SummaryMetrics`

Uso: cards de resumo no topo de telas operacionais/financeiras.

### `StatusBadge`

Uso: badge com variantes (`success|warning|danger|neutral|info`).

### `TableTextCell` e `TableActionButton`

Uso: padronizar celula textual e botoes de acao em tabela.

### `Card`, `FormPageHeader`, `NotFoundCard`

Uso: dashboard, cabecalho de formularios com botao voltar e estados de nao encontrado.

## 7. Telas do Sistema

### Autenticacao

- `/login`: login com validacao Zod, integra `authService.login`, fallback local se API indisponivel
- `/esqueci-senha`: envio de recuperacao via `authService.forgotPassword`

### Home (`/`)

- resumo financeiro do mes
- operacao de hoje (consultas, pendentes, em atendimento)
- card de proxima consulta (card clicavel)
- fila de atendimento com acoes operacionais

### Agenda (`/agenda`)

- navegacao por dia
- novo agendamento
- consulta avulsa
- visualizar/remarcar/cancelar/faltou
- acao principal por linha baseada em status
- slots livres clicaveis

### Consulta (`/consultas/:agendamentoId`)

- cabecalho com dados do atendimento
- registro da consulta atual
- anexos (upload/abrir/baixar/remover)
- exportar PDF
- historico do paciente (lateral)
- salvar registro e finalizar consulta

### Pacientes

- `/pacientes`: listagem com filtros compactos, resumo e acoes
- `/pacientes/novo`: cadastro validado por Zod + RHF, tentativa de create via API
- `/pacientes/:id`: detalhe operacional (acoes rapidas, contexto clinico/financeiro, resumo de prontuarios)
- `/pacientes/:id/editar`: edicao validada
- `/pacientes/:id/prontuarios`: historico em painel lateral + detalhe da consulta selecionada

### Profissional (perfil unico)

- `/profissional`: detalhe do perfil principal
- `/profissional/editar`: edicao do perfil
- `/profissional/especialidades/*`: CRUD de especialidades vinculadas ao contexto do perfil

### Consultorio (unico)

- `/consultorio`: detalhe do consultorio principal
- `/consultorio/editar`: edicao de dados, contato, endereco e funcionamento

### Financeiro

- `/financeiro/contas-a-receber`: receitas derivadas da agenda com taxa/prazo/valor liquido
- `/financeiro/contas-a-receber/:id`: visualizacao de conta a receber
- `/financeiro/contas-a-pagar`: despesas com filtros, resumo, marcar pago e excluir
- `/financeiro/contas-a-pagar/novo|:id|:id/editar`: CRUD de contas a pagar (inclui parcelamento)
- `/financeiro/fluxo-caixa`: entradas + saidas com saldo acumulado
- `/financeiro/formas-pagamento/*`: CRUD de formas com taxa e prazo de recebimento
- `/financeiro/convenios/*`: CRUD de convenios
- `/financeiro/servicos/*`: CRUD de servicos e valores por convenio

### Configuracoes

- `/configuracoes`: tela de detalhes (agenda, funcionamento, usuario, acesso)
- `/configuracoes/editar`: fluxo unico de edicao com validacao

### Not Found

- fallback `*` para pagina 404 (`/src/pages/not-found`)

## 8. Fluxos Importantes (visao de produto)

### 8.1 Agendamento -> Consulta -> Prontuario

1. Agendamento criado na agenda
2. Status evolui (`Aguardando` -> `Confirmado` -> `Em atendimento`)
3. Ao abrir consulta em status operacional, fluxo pode auto-iniciar para `Em atendimento`
4. Registro salvo em prontuario
5. Finalizacao da consulta marca status `Realizado` e prontuario `Finalizado`

### 8.2 Consulta -> Financeiro (contas a receber)

1. Conta a receber e derivada de `listAgendamentos()` (nao ha cadastro manual na tela)
2. Agendamentos `Cancelado` e `Faltou` nao entram em contas a receber
3. Forma de pagamento define taxa e prazo de recebimento
4. Conta exibe bruto, taxa e liquido
5. Fluxo de caixa usa valor liquido e data prevista de recebimento

### 8.3 Paciente -> Historico

1. Tela de paciente mostra resumo clinico + financeiro
2. Acoes rapidas: novo atendimento, agendar, prontuarios, financeiro
3. Historico completo em `/pacientes/:id/prontuarios`
4. Se prontuario estiver em andamento e consulta elegivel, acao "Abrir consulta" fica disponivel

### 8.4 Navegacao contextual

- o sistema usa `location.state.returnTo`
- `resolveReturnTo` + `parseReturnToPath` evitam retorno inconsistente
- botoes voltar/cancelar/concluir respeitam origem quando informada

## 9. Consistencia de UX/UI (regras do projeto)

- manter UI simples e escaneavel
- usar padroes de componente (`PageHeader`, `Table`, `FormField`, `StatusBadge`, `Modal`)
- evitar excesso de informacao por celula de tabela
- acao principal clara por contexto (agenda e consulta)
- manter termos e status consistentes entre modulos
- seguir mesma linguagem visual (espacamento, tons, hierarquia)

## 10. Como Evoluir o Projeto sem Quebrar Tudo

### 10.1 Adicionar nova tela

1. Criar pasta em `src/pages/<modulo>`
2. Implementar `index.tsx` + `styles.module.css`
3. Envolver conteudo em `PageLayout`
4. Usar `PageHeader`
5. Registrar rota em `src/routes/router.tsx`
6. Se for navegavel pelo menu, adicionar item na `Sidebar`
7. Se tiver retorno contextual, usar `resolveReturnTo`

### 10.2 Criar novo formulario

1. Criar schema Zod em `src/schemas`
2. Integrar com RHF (`zodResolver`)
3. Usar `FormField` para todos os campos
4. Centralizar map para payload (quando necessario) em `services/api/mappers`
5. Tratar erro de API com `toErrorMessage` e `fieldErrors`

### 10.3 Criar/ajustar listagem

1. Usar `Table`
2. Reutilizar `TableTextCell` e `TableActionButton`
3. Filtros com `CompactFilters`
4. Resumo com `SummaryMetrics` quando fizer sentido

### 10.4 Regras de status

- toda regra de status compartilhada deve passar por `src/domain/atendimento-status.ts`
- evitar duplicar `if` de status em varios modulos sem reutilizar as funcoes de dominio

## 11. Boas Praticas Obrigatorias

- nao duplicar regra de negocio
- reutilizar componentes UI existentes antes de criar novos
- manter validacao com Zod nas entradas
- manter navegacao previsivel com `returnTo` seguro
- evitar overengineering
- manter nomenclatura e experiencia voltadas a profissional autonomo
- tratar erros com mensagem amigavel (sem expor detalhe tecnico interno)

## 12. Pontos de Atencao

1. **Dados em memoria em varios modulos**  
   Muitos CRUDs de tela usam `data.ts` local. Ao recarregar a pagina, o estado volta para os seeds.

2. **Integracao API parcial no fluxo atual de UI**  
   A camada de API esta pronta e tipada, mas boa parte das telas de dominio ainda usa stores locais.  
   Uso direto de API no fluxo principal atual: autenticacao, create de paciente e CRUD completo de especialidades.

3. **Nomenclatura de pasta vs rota em contas a pagar**  
   Rotas usam "contas a pagar", mas a pasta ainda e `src/pages/documentos-pagar`.

4. **Sessao em `sessionStorage`**  
   Token e user de sessao ficam em `sessionStorage` (`src/auth/session.ts` e `src/services/api/auth/token-store.ts`).

5. **Fallback local de login**  
   Em erro de rede/timeout/404, login pode abrir sessao local para manter uso offline/desacoplado da API.

6. **Conexao com backend sob demanda**  
   O frontend nao valida tenant nem faz pre-carga global no bootstrap. As chamadas de API acontecem quando a tela ou a acao realmente precisa do backend.

7. **ViaCEP em formularios de paciente**  
   `novo/editar paciente` tentam auto-preencher endereco via `https://viacep.com.br/ws/...`.

8. **Aliases configurados no Vite**  
   Existem aliases (`schemas`, `components`, `pages`, `hooks`, `services`, `api`) em `vite.config.ts`.  
   No codigo atual ainda ha mistura de import relativo e alias.

---

## Referencia Rapida de Rotas

Rotas principais ativas:

- `/login`
- `/esqueci-senha`
- `/tenant-inexistente`
- `/`
- `/agenda`
- `/consultas/:agendamentoId`
- `/pacientes`
- `/pacientes/novo`
- `/pacientes/:id`
- `/pacientes/:id/editar`
- `/pacientes/:id/prontuarios`
- `/profissional`
- `/profissional/editar`
- `/profissional/especialidades`
- `/profissional/especialidades/nova`
- `/profissional/especialidades/:id`
- `/profissional/especialidades/:id/editar`
- `/consultorio`
- `/consultorio/editar`
- `/financeiro/contas-a-receber`
- `/financeiro/contas-a-receber/:id`
- `/financeiro/contas-a-pagar`
- `/financeiro/contas-a-pagar/novo`
- `/financeiro/contas-a-pagar/:id`
- `/financeiro/contas-a-pagar/:id/editar`
- `/financeiro/formas-pagamento`
- `/financeiro/formas-pagamento/novo`
- `/financeiro/formas-pagamento/:id`
- `/financeiro/formas-pagamento/:id/editar`
- `/financeiro/fluxo-caixa`
- `/financeiro/convenios`
- `/financeiro/convenios/novo`
- `/financeiro/convenios/:id`
- `/financeiro/convenios/:id/editar`
- `/financeiro/servicos`
- `/financeiro/servicos/novo`
- `/financeiro/servicos/:id`
- `/financeiro/servicos/:id/editar`
- `/configuracoes`
- `/configuracoes/editar`

---

## Resumo para onboarding rapido

Se voce esta chegando agora, siga esta ordem:

1. leia `src/routes/router.tsx`
2. leia `src/layout/index.tsx` e `src/components/sidebar/index.tsx`
3. leia `src/components/ui/*` (biblioteca base)
4. leia `src/domain/atendimento-status.ts`
5. leia os modulos `agenda`, `consulta`, `pacientes`, `contas-receber`, `documentos-pagar`
6. leia `src/services/api/*` para contratos e integracao com backend

Com isso, em poucas horas voce entende estrutura, fluxo e padrao do front-end atual.
