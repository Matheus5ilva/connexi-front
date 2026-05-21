# Testes automatizados do frontend

Esta base usa Vitest, React Testing Library e jsdom para validar os pontos críticos do frontend sem depender de dados reais do backend.

## Ferramentas

- Vitest para testes unitários e de componentes.
- React Testing Library para renderização e asserções de UI.
- user-event disponível para testes de interação.
- jsdom para ambiente de navegador.

## Comandos

Rodar todos os testes:

```bash
npm run test
```

Rodar em modo watch:

```bash
npm run test:watch
```

Rodar cobertura:

```bash
npm run test:coverage
```

Rodar um arquivo específico:

```bash
npx vitest run src/schemas/paciente.schema.test.ts
```

## Testes implementados

- `src/schemas/texto-seguro.schema.test.ts`: bloqueia HTML/script e comandos SQL evidentes, aceitando nomes legítimos com acento, hífen e apóstrofo.
- `src/schemas/paciente.schema.test.ts`: valida campos obrigatórios, e-mail inválido, texto inseguro e e-mail opcional vazio.
- `src/schemas/agendamento.schema.test.ts`: valida agendamento particular, convênio obrigatório para atendimento por convênio e observação insegura.
- `src/schemas/consulta.schema.test.ts`: valida tempo da consulta, finalização com registro mínimo e texto clínico livre.
- `src/services/api/errors/api-error.test.ts`: garante mensagem amigável para erro de contrato e preserva mensagens úteis do backend.
- `src/components/ui/aviso-erro-formulario/index.test.tsx`: valida renderização de mensagens e erros de campo.

## Estratégia

Os testes priorizam os pontos que mais geravam instabilidade no MVP:

- Schemas Zod desalinhados.
- Mensagens técnicas exibidas ao usuário.
- Campos `null`, opcionais e strings vazias.
- Validação de textos cadastrais contra HTML/script e SQL evidente.
- Componentes de erro usados em formulários e modais.

## Próximos testes recomendados

- Teste de integração do modal da Agenda com mocks dos services.
- Teste de upload de anexo garantindo que o texto digitado no prontuário é preservado.
- Teste do relógio da consulta com fake timers.
- E2E leve com Playwright para login, criar paciente, criar agendamento e abrir consulta.
