import type { PaginationRequest } from "./common";
import type { Segmento } from "../../../config/segmento-labels";

export type PerfilUsuario = "MASTER" | "PROFISSIONAL";

export interface TokensAutenticacao {
  accessToken: string;
  expiresIn: number;
}

export interface IniciarSessaoRequest {
  email: string;
  password: string;
}

export interface SolicitarRecuperacaoSenhaRequest {
  email: string;
}

export interface RedefinirSenhaRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface RespostaLogin {
  accessToken: string;
  expiresIn: number;
  usuario: {
    name: string;
    email: string;
    role: PerfilUsuario;
    deveTrocarSenha: boolean;
    tenantId: string;
  };
}

export interface RespostaMinhaContaAutenticada {
  id: string;
  name: string;
  email: string;
  role: PerfilUsuario;
  profissionalId?: number | null;
  deveTrocarSenha: boolean;
  tenantId: string;
  ultimoLoginEm?: string | null;
}

export interface MinhaConta {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  profissionalId?: number | null;
  deveTrocarSenha: boolean;
  tenantId: string;
  ultimoLoginEm?: string | null;
}

export interface AlterarSenhaRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface Tenant {
  id: string;
  slug: string;
  nome: string;
  nicho?: Segmento;
  ativo: boolean;
  createdAt: string;
}

export interface Contato {
  telefone: string;
  whatsapp?: string;
  email?: string;
}

export type ContatoInput = Contato;

export interface Endereco {
  logradouro?: string;
  numero?: number;
  complemento?: string;
  bairro?: string;
  cep?: string;
}

export type EnderecoInput = Endereco;

export interface Estado {
  id: number;
  nome: string;
  sigla: string;
}

export interface Cidade {
  id: number;
  nome: string;
  codigoIbge?: string;
  estado?: Estado;
  siglaEstado?: string;
}

export interface Pessoa {
  id: number;
  nome: string;
  ativo: boolean;
  contato: Contato;
  endereco?: Endereco;
  cidade?: Cidade;
}

export interface PessoaInput {
  nome: string;
  ativo?: boolean;
  contato: ContatoInput;
  endereco?: EnderecoInput;
  cidade?: {
    codigoIbge: string;
  };
}

export interface PacienteListaItem {
  id: number;
  nome: string;
  ativo: boolean;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  email?: string;
}

export interface Paciente extends PacienteListaItem {
  pessoa: Pessoa;
  nomeMae?: string;
  sexo?: "MASCULINO" | "FEMININO" | "OUTRO";
  genero?:
    | "Cisgênero Masculino"
    | "Cisgênero Feminino"
    | "Transgênero Masculino"
    | "Transgênero Feminino"
    | "Não Binário"
    | "Outro"
    | "Prefiro não informar";
  convenio?: string;
  convenioId?: number | null;
  numeroCarteirinha?: string;
}

export interface CriarPacienteRequest {
  pessoa: PessoaInput;
  ativo?: boolean;
  cpf?: string;
  dataNascimento?: string;
  nomeMae?: string;
  sexo?: Paciente["sexo"];
  genero?: Paciente["genero"];
  convenioId?: number | null;
  numeroCarteirinha?: string;
}

export interface AtualizarPacienteRequest
  extends Partial<Omit<CriarPacienteRequest, "convenioId" | "numeroCarteirinha">> {
  convenioId?: number | null;
  numeroCarteirinha?: string | null;
}

export interface ListarPacientesRequest extends PaginationRequest {
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  ativo?: boolean;
}

export interface EspecialidadeListaItem {
  id: number;
  nome: string;
}

export interface Especialidade extends EspecialidadeListaItem {
  descricao?: string;
}

export interface CriarEspecialidadeRequest {
  nome: string;
  descricao?: string;
}

export type AtualizarEspecialidadeRequest = CriarEspecialidadeRequest;

export interface ProfissionalListaItem {
  id: number;
  nome: string;
  ativo: boolean;
  tipoProfissional?: string;
  numeroRegistro?: string;
  especialidade?: string;
  conselho?: string;
}

export interface Profissional extends ProfissionalListaItem {
  pessoa: Pessoa;
  especialidadeDetalhe?: Especialidade;
}

export interface ConsultorioListaItem {
  id: number;
  nome: string;
  ativo: boolean;
  cnpj?: string;
  razaoSocial?: string;
}

export interface Consultorio {
  id: number;
  pessoa: Pessoa;
  ativo: boolean;
  razaoSocial?: string;
  cnpj?: string;
}

export interface CriarConsultorioRequest {
  pessoa: PessoaInput;
  razaoSocial?: string;
  cnpj?: string;
}

export type AtualizarConsultorioRequest = Partial<CriarConsultorioRequest> & {
  ativo?: boolean;
};

export type DiaSemana =
  | "SEGUNDA"
  | "TERCA"
  | "QUARTA"
  | "QUINTA"
  | "SEXTA"
  | "SABADO"
  | "DOMINGO";

export interface ConfiguracaoPausa {
  id: number;
  inicio: string;
  fim: string;
}

export interface Configuracao {
  id: number;
  horaInicio: string;
  horaFim: string;
  intervaloMinutos: number;
  diasAtendimento: DiaSemana[];
  pausas: ConfiguracaoPausa[];
}

export interface SalvarConfiguracaoRequest {
  horaInicio: string;
  horaFim: string;
  intervaloMinutos: number;
  diasAtendimento: DiaSemana[];
  pausas?: Array<{
    inicio: string;
    fim: string;
  }>;
}

export type AtualizarConfiguracaoRequest = SalvarConfiguracaoRequest;

export interface ContatoProfissionalInput extends Omit<ContatoInput, "email"> {
  email: string;
}

export interface PessoaProfissionalInput extends Omit<PessoaInput, "contato"> {
  contato: ContatoProfissionalInput;
}

export interface CriarProfissionalRequest {
  pessoa: PessoaProfissionalInput;
  tipoProfissional?: string;
  numeroRegistro?: string;
  especialidade: {
    id: number;
  };
}

export type AtualizarProfissionalRequest = Partial<CriarProfissionalRequest> & {
  ativo?: boolean;
};

export interface ListarProfissionaisRequest extends PaginationRequest {
  ativo?: boolean;
  especialidadeId?: number;
  especialidade?: string;
}

export type AbrangenciaConvenio = "Nacional" | "Regional" | "Municipal";

export interface ContatoConvenioInput extends Omit<ContatoInput, "email"> {
  email: string;
}

export interface ConvenioListaItem {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface Convenio extends ConvenioListaItem {
  cnpj: string;
  diasPagamento: number;
  abrangencia: AbrangenciaConvenio;
  contato: Contato;
}

export interface CriarConvenioRequest {
  nome: string;
  cnpj: string;
  ativo?: boolean;
  diasPagamento?: number;
  abrangencia: AbrangenciaConvenio;
  contato: ContatoConvenioInput;
}

export type AtualizarConvenioRequest = CriarConvenioRequest;

export type RecebimentoTipo = "na_hora" | "prazo";

export interface FormaPagamento {
  id: number;
  nome: string;
  taxaPercentual: number;
  recebimentoTipo: RecebimentoTipo;
  prazoRecebimentoDias?: number | null;
  observacoes?: string | null;
  dataCadastro: string;
}

export interface CriarFormaPagamentoRequest {
  nome: string;
  taxaPercentual: number;
  recebimentoTipo: RecebimentoTipo;
  prazoRecebimentoDias?: number;
  observacoes?: string;
}

export type AtualizarFormaPagamentoRequest = CriarFormaPagamentoRequest;

export interface ServicoConvenio {
  convenioId: number;
  valor: number;
  convenioNome: string;
}

export interface ServicoConvenioInput {
  convenioId: number;
  valor: number;
}

export interface ServicoListaItem {
  id: number;
  nome: string;
  ativo: boolean;
  valorParticular: number;
  servicosConvenios: ServicoConvenio[];
}

export interface Servico extends ServicoListaItem {
  descricao?: string | null;
  servicosConvenios: ServicoConvenio[];
}

export interface CriarServicoRequest {
  nome: string;
  descricao: string;
  ativo: boolean;
  valorParticular: number;
  convenios?: ServicoConvenioInput[];
}

export interface AtualizarServicoRequest {
  nome: string;
  descricao: string;
  ativo: boolean;
  valorParticular: number;
  convenios?: ServicoConvenioInput[];
}

export type TipoAtendimento = "PARTICULAR" | "CONVENIO";

export type TipoConsulta = "Consulta" | "Retorno" | "Primeira Vez" | "Urgência";

export type StatusAgendamento =
  | "AGUARDANDO"
  | "CONFIRMADO"
  | "CANCELADO"
  | "EM_ATENDIMENTO"
  | "REALIZADO"
  | "FALTOU";

export interface Agendamento {
  id: string;
  agendaId: number;
  data: string;
  horario: string;
  horarioFim: string;
  inicio: string;
  fim: string;
  duracaoMinutos: number;
  status: StatusAgendamento;
  tipoAtendimento: TipoAtendimento;
  tipoConsulta: TipoConsulta;
  valorServico: number;
  observacao?: string | null;

  pacienteId: string;
  paciente: string;
  servicoId: number;
  servico: string;
  procedimento: string;
  convenioId?: number | null;
  convenio?: string | null;
  formaPagamentoId: number;
  formaPagamento: string;
  profissionalId: string;
  profissional?: string;
}

export interface CriarAgendamentoRequest {
  agendaId?: number;
  data?: string;
  profissionalId?: number;
  pacienteId: number;
  servicoId: number;
  tipoAtendimento: TipoAtendimento;
  convenioId?: number;
  formaPagamentoId?: number;
  horario: string;
  duracaoMinutos: number;
  tipoConsulta?: TipoConsulta;
  observacao?: string;
}

export type AtualizarAgendamentoRequest = Partial<CriarAgendamentoRequest>;

export interface ListarAgendamentosRequest extends PaginationRequest {
  agendaId?: number;
  data?: string;
  profissionalId?: number;
  pacienteId?: number;
  status?: StatusAgendamento;
  tipoAtendimento?: TipoAtendimento;
  busca?: string;
}

export interface ConsultarPainelRequest {
  mes?: number;
  ano?: number;
}

export interface ResumoFinanceiroPainel {
  entradas: number;
  saidas: number;
  saldoDoMes: number;
  saldoAtual: number;
  mesReferencia: number;
  anoReferencia: number;
}

export interface ProximaConsultaPainel {
  horario: string;
  nomePaciente: string;
  nomeServico: string;
  status: StatusAgendamento;
}

export interface OperacaoDeHojePainel {
  consultasHoje: number;
  pendentes: number;
  emAtendimento: number;
  proximaConsulta: ProximaConsultaPainel | null;
}

export interface ItemFilaAtendimentoPainel {
  id: string;
  horario: string;
  nomePaciente: string;
  nomeServico: string;
  status: StatusAgendamento;
}

export interface Painel {
  resumoFinanceiro: ResumoFinanceiroPainel;
  operacaoDeHoje: OperacaoDeHojePainel;
  filaDeAtendimento: ItemFilaAtendimentoPainel[];
}

export interface AtualizarStatusAgendamentoRequest {
  status: StatusAgendamento;
  recebimento?: RegistrarRecebimentoAgendamentoRequest;
}

export type StatusDocumentoPagar = "PENDENTE" | "PAGO" | "CANCELADO";

export type SituacaoDocumentoPagar =
  | "PENDENTE"
  | "PAGO"
  | "ATRASADO"
  | "CANCELADO";

export type OrigemDocumentoPagar = "MANUAL";

export interface DocumentoPagar {
  id: number;
  descricao: string;
  valor: number;
  valorParcela: number;
  valorTotal: number;
  dataVencimento: string;
  status: StatusDocumentoPagar;
  situacao: SituacaoDocumentoPagar;
  atrasado: boolean;
  diasAtraso: number;
  categoria?: string | null;
  observacao?: string | null;
  dataPagamento?: string | null;
  dataCancelamento?: string | null;
  motivoCancelamento?: string | null;
  origem: OrigemDocumentoPagar;
  lancamentoId?: string | null;
  parcelaNumero: number;
  totalParcelas: number;
  parcelado: boolean;
}

export interface CriarDocumentoPagarRequest {
  descricao: string;
  valor: number;
  vencimento?: string;
  dataVencimento?: string;
  statusInicial?: StatusDocumentoPagar;
  statusBase?: StatusDocumentoPagar;
  categoria?: string;
  observacao?: string;
  observacoes?: string;
  parcelado?: boolean;
  quantidadeParcelas?: number;
}

export interface AtualizarDocumentoPagarRequest {
  descricao?: string;
  valor?: number;
  vencimento?: string;
  dataVencimento?: string;
  status?: StatusDocumentoPagar;
  statusBase?: StatusDocumentoPagar;
  categoria?: string;
  observacao?: string;
  observacoes?: string;
}

export interface ListarDocumentosPagarRequest extends PaginationRequest {
  busca?: string;
  status?: StatusDocumentoPagar;
  situacao?: SituacaoDocumentoPagar;
  categoria?: string;
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataPagamentoInicio?: string;
  dataPagamentoFim?: string;
  somenteAtrasados?: boolean;
}

export interface MarcarDocumentoPagarPagoRequest {
  dataPagamento?: string;
  observacao?: string;
}

export interface CancelarDocumentoPagarRequest {
  motivo: string;
}

export type StatusDocumentoReceber = "PREVISTO" | "RECEBIDO" | "CANCELADO";

export type SituacaoDocumentoReceber =
  | "PREVISTO"
  | "RECEBIDO"
  | "CANCELADO"
  | "ATRASADO";

export interface DocumentoReceber {
  id: number;
  agendamentoId: number;
  pacienteId: number;
  pacienteNome: string;
  servicoId: number;
  servicoNome: string;
  convenioId?: number | null;
  convenioNome?: string | null;
  descricao: string;
  tipoAtendimento: TipoAtendimento;
  formaPagamentoId: number;
  formaPagamento: string;
  recebimentoTipo: RecebimentoTipo;
  prazoRecebimentoDias: number;
  status: StatusDocumentoReceber;
  situacao: SituacaoDocumentoReceber;
  atrasado: boolean;
  parcelaNumero: number;
  totalParcelas: number;
  dataAtendimento: string;
  dataPrevistaRecebimento: string;
  dataRecebimento?: string | null;
  dataCancelamento?: string | null;
  valorOriginal: number;
  valorDesconto: number;
  valorBruto: number;
  percentualTaxa: number;
  valorTaxa: number;
  valorLiquido: number;
  observacao?: string | null;
  motivoCancelamento?: string | null;
}

export interface ListarDocumentosReceberRequest extends PaginationRequest {
  busca?: string;
  agendamentoId?: number;
  pacienteId?: number;
  convenioId?: number;
  status?: StatusDocumentoReceber;
  formaPagamentoId?: number;
  recebimentoTipo?: RecebimentoTipo;
  dataAtendimentoInicio?: string;
  dataAtendimentoFim?: string;
  dataPrevistaInicio?: string;
  dataPrevistaFim?: string;
  somenteAtrasados?: boolean;
}

export interface MarcarDocumentoRecebidoRequest {
  dataRecebimento?: string;
  observacao?: string;
}

export interface CancelarDocumentoReceberRequest {
  motivo: string;
}

export type OrigemFluxoCaixa = "CONTA_RECEBER" | "CONTA_PAGAR";

export type TipoMovimentacaoFluxoCaixa = "ENTRADA" | "SAIDA";

export type StatusFluxoCaixa = "LIQUIDADO" | "PENDENTE" | "ATRASADO";

export type TipoFiltroFluxoCaixa = "TODOS" | "ENTRADA" | "SAIDA";

export type StatusFiltroFluxoCaixa =
  | "TODOS"
  | "LIQUIDADO"
  | "PENDENTE"
  | "ATRASADO";

export interface ConsultarFluxoCaixaRequest {
  busca?: string;
  dataInicio?: string;
  dataFim?: string;
  tipo?: TipoFiltroFluxoCaixa;
  status?: StatusFiltroFluxoCaixa;
  categoria?: string;
  formaPagamentoId?: number;
  origemTipo?: OrigemFluxoCaixa;
}

export interface ResumoFluxoCaixa {
  saldoInicial: number;
  saldoPeriodo: number;
  entradasLiquidasPeriodo: number;
  saidasPeriodo: number;
  saldoLiquidado: number;
  atrasadoPeriodo: number;
}

export interface FiltrosAplicadosFluxoCaixa {
  dataInicio?: string | null;
  dataFim?: string | null;
  busca?: string | null;
  tipo: TipoFiltroFluxoCaixa;
  status: StatusFiltroFluxoCaixa;
  categoria?: string | null;
  formaPagamentoId?: number | null;
  origemTipo?: OrigemFluxoCaixa | null;
}

export interface MovimentacaoFluxoCaixa {
  id: string;
  origemId: number;
  origemTipo: OrigemFluxoCaixa;
  dataMovimentacao: string;
  dataVencimento: string;
  dataLiquidacao?: string | null;
  descricao: string;
  descricaoSecundaria?: string;
  tipoMovimentacao: TipoMovimentacaoFluxoCaixa;
  valor: number;
  status: StatusFluxoCaixa;
  saldoAcumulado: number;
  formaPagamentoId?: number;
  categoria?: string;
  grupoFinanceiro?: string;
  formaPagamentoDescricao?: string;
  observacaoResumida?: string;
  valorBruto?: number;
  valorDesconto?: number;
  valorTaxa?: number;
  valorLiquido?: number;
  indicaAtraso: boolean;
  indicaLiquidado: boolean;
}

export interface FluxoCaixa {
  resumo: ResumoFluxoCaixa;
  filtros: FiltrosAplicadosFluxoCaixa;
  movimentacoes: MovimentacaoFluxoCaixa[];
}

export type StatusConsulta = "EM_ATENDIMENTO" | "FINALIZADO" | "CANCELADO";

export interface RegistrarRecebimentoAgendamentoRequest {
  formaPagamentoId?: number;
  numeroParcelas?: number;
  intervaloParcelasDias?: number;
  descontoValor?: number;
  observacao?: string;
}

export interface SalvarConsultaRequest {
  tempoConsultaMinutos?: number;
  queixaPrincipal?: string;
  registroConsulta?: string;
  conduta?: string;
  observacoes?: string;
  receitaDigitada?: string;
}

export interface FinalizarConsultaRequest extends Partial<SalvarConsultaRequest> {
  recebimento?: RegistrarRecebimentoAgendamentoRequest;
}

export interface ProntuarioAnexo {
  id: number;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  dataUpload: string;
  visualizacaoUrl: string;
  downloadUrl: string;
}

export interface ProntuarioPacienteResumo {
  id: number;
  nome: string;
  cpf?: string | null;
  telefone: string;
  email?: string | null;
}

export interface ProntuarioHistoricoItem {
  id: number;
  agendamentoId: number;
  dataConsulta: string;
  horaConsulta: string;
  statusConsulta: StatusConsulta;
  resumo: string;
  profissionalNome: string;
  servicoNome: string;
  tipoAtendimento: string;
}

export interface ConsultaResumo {
  agendamentoId: number;
  dataConsulta: string;
  horaConsulta: string;
  tempoConsultaMinutos: number;
  statusConsulta: StatusConsulta;
  agendamentoStatus?: string;
  profissionalId: number;
  profissionalNome: string;
  servicoId: number;
  servicoNome: string;
  tipoAtendimento: string;
  tipoConsulta?: string | null;
}

export interface ProntuarioDetalhe {
  id: number;
  statusConsulta: StatusConsulta;
  registroConsulta: string;
  observacoes?: string | null;
  receitaDigitada?: string | null;
  queixaPrincipal?: string | null;
  conduta?: string | null;
  createdAt: string;
  updatedAt: string;
  anexos: ProntuarioAnexo[];
}

export interface ContextoConsulta {
  paciente: ProntuarioPacienteResumo;
  consulta: ConsultaResumo;
  prontuario: ProntuarioDetalhe | null;
  historico: ProntuarioHistoricoItem[];
}

export interface RespostaProntuariosPaciente {
  paciente: ProntuarioPacienteResumo;
  prontuarios: ProntuarioHistoricoItem[];
}

export interface RespostaDetalheProntuarioPaciente {
  paciente: ProntuarioPacienteResumo;
  consulta: ConsultaResumo;
  prontuario: ProntuarioDetalhe;
}
