export { apiConfig } from "./config/api.config";

export {
  ApiError,
  isApiError,
  normalizeApiError,
  toErrorMessage,
} from "./errors/api-error";

export {
  ehErroTenantInexistente,
} from "./errors/error-helpers";

export { httpClient } from "./http/http-client";
export { LIMITE_MAXIMO_PAGINACAO } from "./utils/paginacao";

export {
  mapPacienteFormToCreateRequest,
  mapPacienteFormToUpdateRequest,
  mapPacienteToFormData,
} from "./mappers/paciente.mapper";

export {
  mapAgendamentoParaFormularioRemarcacao,
  mapFormularioAgendamentoParaCriarRequest,
  mapFormularioRemarcacaoParaAtualizarRequest,
  mapStatusAgendamentoParaAtualizarRequest,
} from "./mappers/agendamento.mapper";

export {
  mapFinalizarConsultaRequest,
  mapSalvarConsultaRequest,
} from "./mappers/consulta.mapper";

export {
  mapFormularioEsqueciSenhaParaRequest,
  mapFormularioLoginParaIniciarSessaoRequest,
  mapFormularioRedefinirSenhaParaRequest,
} from "./mappers/auth.mapper";

export {
  mapFormularioAlterarSenhaParaRequest,
  mapRespostaMinhaContaParaMinhaConta,
} from "./mappers/minha-conta.mapper";

export {
  mapConfiguracaoParaFormulario,
  mapFormularioConfiguracaoParaAtualizarRequest,
  mapFormularioConfiguracaoParaSalvarRequest,
} from "./mappers/configuracao.mapper";

export {
  mapConsultorioParaFormulario,
  mapFormularioConsultorioParaAtualizarRequest,
  mapFormularioConsultorioParaCriarRequest,
} from "./mappers/consultorio.mapper";

export {
  mapConvenioParaFormulario,
  mapFormularioConvenioParaAtualizarRequest,
  mapFormularioConvenioParaCriarRequest,
} from "./mappers/convenio.mapper";

export {
  mapEspecialidadeParaFormulario,
  mapFormularioEspecialidadeParaAtualizarRequest,
  mapFormularioEspecialidadeParaCriarRequest,
} from "./mappers/especialidade.mapper";

export {
  mapFormaPagamentoParaFormulario,
  mapFormularioFormaPagamentoParaAtualizarRequest,
  mapFormularioFormaPagamentoParaCriarRequest,
} from "./mappers/forma-pagamento.mapper";

export {
  mapCancelarDocumentoPagarFormToRequest,
  mapFiltrosDocumentoPagarToListRequest,
  mapDocumentoPagarFormToCreateRequest,
  mapDocumentoPagarFormToUpdateRequest,
  mapDocumentoPagarToFormData,
  mapMarcarDocumentoPagarPagoFormToRequest,
} from "./mappers/documento-pagar.mapper";

export {
  mapCancelarDocumentoReceberFormToRequest,
  mapFiltrosDocumentoReceberToListRequest,
  mapMarcarDocumentoRecebidoFormToRequest,
} from "./mappers/documento-receber.mapper";

export { mapFiltrosFluxoCaixaParaRequest } from "./mappers/fluxo-caixa.mapper";

export {
  mapProfissionalFormToCreateRequest,
  mapProfissionalFormToUpdateRequest,
  mapProfissionalToFormData,
} from "./mappers/profissional.mapper";

export {
  mapFormularioSecretariaParaAtualizarRequest,
  mapFormularioSecretariaParaCriarRequest,
  mapSecretariaParaFormulario,
} from "./mappers/secretaria.mapper";

export {
  mapFormularioServicoParaAtualizarRequest,
  mapFormularioServicoParaCriarRequest,
  mapServicoParaFormulario,
} from "./mappers/servico.mapper";

export {
  agendamentoService,
  adminTenantLogsService,
  adminTenantsService,
  authService,
  consultorioService,
  configuracaoService,
  consultaService,
  convenioService,
  documentoPagarService,
  documentoReceberService,
  fluxoCaixaService,
  formaPagamentoService,
  painelService,
  pacienteService,
  profissionalService,
  secretariaService,
  servicoService,
  especialidadeService,
  tenantService,
} from "./services";

export type {
  CredencialAdministrativa,
  AtualizarTenantAdministrativoRequest,
  CriarTenantAdministrativoRequest,
  NichoTenant,
  PlanoTenant,
  TenantAdministrativo,
} from "./services/admin-tenants.service";

export type {
  ApiErrorResponse,
  ApiListResponse,
  ApiEnvelope,
  FieldErrors,
  PaginatedResponse,
  PaginationRequest,
} from "./types/common";

export type {
  AlterarSenhaRequest,
  AbrangenciaConvenio,
  Agendamento,
  AtualizarAgendamentoRequest,
  AtualizarConfiguracaoRequest,
  AtualizarConsultorioRequest,
  AtualizarConvenioRequest,
  AtualizarStatusAgendamentoRequest,
  AtualizarDocumentoPagarRequest,
  AtualizarEspecialidadeRequest,
  AtualizarPacienteRequest,
  AtualizarProfissionalRequest,
  AtualizarSecretariaRequest,
  AtualizarStatusSecretariaRequest,
  AtualizarServicoRequest,
  CancelarDocumentoPagarRequest,
  CancelarDocumentoReceberRequest,
  Cidade,
  ConsultarPainelRequest,
  ConsultarFluxoCaixaRequest,
  Contato,
  ContatoConvenioInput,
  ContatoInput,
  ContatoProfissionalInput,
  CriarAgendamentoRequest,
  CriarConsultorioRequest,
  CriarConvenioRequest,
  CriarDocumentoPagarRequest,
  CriarEspecialidadeRequest,
  CriarPacienteRequest,
  CriarProfissionalRequest,
  CriarSecretariaRequest,
  CriarServicoRequest,
  ContextoConsulta,
  ConsultaResumo,
  Configuracao,
  Consultorio,
  ConsultorioListaItem,
  Convenio,
  ConvenioListaItem,
  DocumentoPagar,
  DocumentoReceber,
  DiaSemana,
  FiltrosAplicadosFluxoCaixa,
  FluxoCaixa,
  Endereco,
  EnderecoInput,
  Especialidade,
  EspecialidadeListaItem,
  Estado,
  FinalizarConsultaRequest,
  AtualizarFormaPagamentoRequest,
  FormaPagamento,
  CriarFormaPagamentoRequest,
  ItemFilaAtendimentoPainel,
  ListarAgendamentosRequest,
  ListarDocumentosPagarRequest,
  ListarDocumentosReceberRequest,
  ListarPacientesRequest,
  ListarProfissionaisRequest,
  MarcarDocumentoPagarPagoRequest,
  MarcarDocumentoRecebidoRequest,
  MinhaConta,
  IniciarSessaoRequest,
  MovimentacaoFluxoCaixa,
  OrigemFluxoCaixa,
  OperacaoDeHojePainel,
  Paciente,
  PacienteListaItem,
  Painel,
  PerfilUsuario,
  Pessoa,
  PessoaInput,
  PessoaProfissionalInput,
  Profissional,
  ProfissionalListaItem,
  ProntuarioAnexo,
  ProntuarioDetalhe,
  ProntuarioHistoricoItem,
  ProntuarioPacienteResumo,
  ProximaConsultaPainel,
  RespostaDetalheProntuarioPaciente,
  RespostaProntuariosPaciente,
  RedefinirSenhaRequest,
  RedefinirSenhaSecretariaRequest,
  RegistrarRecebimentoAgendamentoRequest,
  RespostaLogin,
  RespostaMinhaContaAutenticada,
  RecebimentoTipo,
  ResumoFinanceiroPainel,
  ResumoFluxoCaixa,
  SalvarConsultaRequest,
  SalvarConfiguracaoRequest,
  SolicitarRecuperacaoSenhaRequest,
  Secretaria,
  Servico,
  ServicoConvenio,
  ServicoConvenioInput,
  ServicoListaItem,
  SituacaoDocumentoPagar,
  SituacaoDocumentoReceber,
  StatusFiltroFluxoCaixa,
  StatusAgendamento,
  StatusConsulta,
  StatusDocumentoPagar,
  StatusDocumentoReceber,
  StatusFluxoCaixa,
  TokensAutenticacao,
  TipoFiltroFluxoCaixa,
  TipoAtendimento,
  TipoConsulta,
  TipoMovimentacaoFluxoCaixa,
} from "./types/domain";
