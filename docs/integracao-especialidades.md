# Integracao Front + Back (Referencia: Especialidades)

Guia oficial para entender como a conexao real com backend foi implementada no modulo **Especialidades** e como repetir o mesmo padrao nos demais modulos.

## 1. Visao geral da integracao

CRUD integrado com backend:

- listar
- criar
- visualizar
- editar
- excluir

Padrao tecnico aplicado:

- service dedicado por modulo
- validacao de entrada e saida com Zod
- tipagem centralizada em `types/domain.ts`
- loading e erro por tela
- UI mantendo o padrao visual existente

## 2. Arquitetura multi-tenant por subdominio

O backend identifica tenant pelo **Host header** (subdominio), por exemplo:

- `psi-matheus.localhost:3000/especialidades`

No frontend, isso foi tratado em:

- `src/services/api/config/api.config.ts`

### Como o frontend identifica o tenant atual

1. Le `window.location.hostname`
2. Usa `VITE_APP_HOSTNAME_BASE` (default `localhost`)
3. Extrai subdominio valido (`tenantSubdomain`) com as mesmas regras do backend (regex + labels reservados)

### Como a base URL da API e montada

Prioridade:

1. `VITE_API_BASE_URL` (aceita placeholders)
2. fallback automatico por hostname atual + porta configurada

Placeholders suportados em `VITE_API_BASE_URL`:

- `{hostname}` -> hostname atual (mantem subdominio)
- `{origin}` -> origem atual completa
- `{tenant}` / `{subdomain}` -> tenant extraido

Exemplo recomendado para local:

```env
VITE_API_BASE_URL=http://{hostname}:3000
VITE_APP_HOSTNAME_BASE=localhost
VITE_API_PORT=3000
VITE_API_BASE_PATH=
```

Com isso, se a UI estiver em `psi-matheus.localhost`, as chamadas vao para `psi-matheus.localhost:3000`, preservando tenant.

## 3. Contrato real do backend (especialidades)

Rotas backend:

- `GET /especialidades`
- `GET /especialidades/:id`
- `POST /especialidades`
- `PUT /especialidades/:id`
- `DELETE /especialidades/:id`

DTO:

- `id: number`
- `nome: string`
- `descricao?: string`

Envelope de resposta:

```json
{ "data": ... }
```

## 4. Estrutura de arquivos da integracao

### Tipos

- `src/services/api/types/domain.ts`

Adicionados:

- `Specialty`
- `CreateSpecialtyRequest`
- `UpdateSpecialtyRequest`

### Schemas Zod

- `src/services/api/schemas/domain.schema.ts`

Adicionados:

- `specialtySchema`
- `specialtyRequestSchema`

### Service

- `src/services/api/services/specialty.service.ts`

Metodos:

- `list()`
- `getById(id)`
- `create(payload)`
- `update(id, payload)`
- `remove(id)`

### Exports globais

- `src/services/api/services/index.ts`
- `src/services/api/index.ts`

## 5. Como a tela chama o backend

## 5.1 Listagem (`/profissional/especialidades`)

Arquivo:

- `src/pages/profissionais/especialidades/index.tsx`

Fluxo:

1. `useEffect` chama `specialtyService.list()`
2. `isLoading` controla carregamento inicial
3. `loadError` mostra falha de `GET`
4. exclusao usa `specialtyService.remove(id)` e atualiza estado local da tabela

## 5.2 Criacao (`/profissional/especialidades/nova`)

Arquivo:

- `src/pages/profissionais/especialidades/nova/index.tsx`

Fluxo:

1. formulario valida com Zod
2. submit chama `specialtyService.create(...)`
3. sucesso redireciona para visualizacao do item criado

## 5.3 Visualizacao (`/profissional/especialidades/:id`)

Arquivo:

- `src/pages/profissionais/especialidades/visualizar/index.tsx`

Fluxo:

1. le `id` da rota
2. busca `specialtyService.getById(id)`
3. controla `isLoading` + `loadError`
4. exclusao no modal chama `specialtyService.remove(id)` com `deleteError` dedicado

## 5.4 Edicao (`/profissional/especialidades/:id/editar`)

Arquivo:

- `src/pages/profissionais/especialidades/editar/index.tsx`

Fluxo:

1. carrega dados por id
2. preenche formulario
3. submit chama `specialtyService.update(id, payload)`
4. volta para tela de visualizacao

## 6. Loading e tratamento de erro

Padrao adotado nas telas:

- `isLoading` para carregamento
- `loadError` para falha de consulta
- `submitError` (form)
- `deleteError` (modal de exclusao)

Padrao adotado na camada de API:

- `parseWithSchema(...)` para validar entrada e resposta
- `unwrapEnvelope(...)` para converter `{ data }` em payload direto
- `toErrorMessage(...)` para feedback amigavel ao usuario

## 7. Padrao oficial para repetir em outros modulos

Checklist:

1. mapear rotas + DTO reais do backend
2. criar tipos em `types/domain.ts`
3. criar schemas em `schemas/domain.schema.ts`
4. criar `<modulo>.service.ts` em `services/`
5. exportar no barrel (`services/index.ts` e `api/index.ts`)
6. conectar telas com loading e erro explicitos
7. remover dependencia de `data.ts` local naquele modulo
8. validar com `npm run build` e `npm run lint`

## 8. Template minimo de service

```ts
const MODULO_BASE_PATH = "/modulo";

export const moduloService = {
  async list() {
    const response = await httpClient.get(MODULO_BASE_PATH);
    return parseWithSchema(moduloListSchema, unwrapEnvelope(response), {
      context: "modulo.list.response",
      message: "Resposta inesperada ao listar modulo.",
      code: "INVALID_MODULO_LIST_RESPONSE",
    });
  },
};
```

## 9. Principais cuidados

- nao hardcodar tenant no frontend
- preservar subdominio atual ao montar base URL
- manter schemas de contrato sincronizados com DTO do backend
- manter erro amigavel na UI (sem stack trace)
- nao espalhar fetch direto nas paginas: sempre via service

## 10. Fluxo de entrada antes do login (tenant check)

Arquivos:

- `src/routes/auth-guards.tsx`
- `src/pages/auth/tenant-not-found/index.tsx`
- `src/services/api/services/tenant.service.ts`
- `src/services/api/errors/error-helpers.ts`

Fluxo implementado:

1. o frontend **nao valida tenant no bootstrap** nem antes de renderizar o login
2. a validacao acontece **sob demanda**, no primeiro fluxo que realmente precisa do backend
3. no login, a propria chamada de autenticacao funciona como validacao real do tenant atual
4. se a API responder `422` com tenant inexistente, o front redireciona para `/tenant-inexistente`
5. na landing de tenant inexistente, a revalidacao passou a ser **manual** pelo botao "Tentar novamente"
6. outros erros nao sao mascarados como tenant inexistente

Regra de produto aplicada:

- **tenant valido** -> login normal e acesso ao backend apenas quando a funcionalidade exigir
- **tenant inexistente (422)** -> tela dedicada, sem flood de chamadas em segundo plano
