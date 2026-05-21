import {
  FaCalendarAlt,
  FaClock,
  FaDownload,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileMedicalAlt,
  FaPaperclip,
  FaPhone,
  FaPlay,
  FaStethoscope,
  FaUser,
} from "react-icons/fa";
import { StatusBadge } from "../../../../components/ui/status-badge";
import type {
  ConsultaResumo,
  ProntuarioAnexo,
  ProntuarioDetalhe,
  ProntuarioPacienteResumo,
  StatusConsulta,
} from "../../../../services/api";
import { SecaoCartao } from "./secao-cartao";
import styles from "./visualizacao-prontuario.module.css";

type VisualizacaoProntuarioProps = {
  prontuario: ProntuarioDetalhe;
  paciente: ProntuarioPacienteResumo;
  consulta: ConsultaResumo;
  formatarData: (isoDate?: string) => string;
  formatarDataHora: (isoDate?: string) => string;
  formatarTamanhoArquivo: (bytes: number) => string;
  aoAbrirPaciente: () => void;
  aoAbrirConsulta?: () => void;
  aoAbrirAnexo: (anexo: ProntuarioAnexo) => void;
  aoBaixarAnexo: (anexo: ProntuarioAnexo) => void;
};

function toStatusVariant(status: StatusConsulta) {
  switch (status) {
    case "FINALIZADO":
      return "success" as const;
    case "CANCELADO":
      return "danger" as const;
    default:
      return "info" as const;
  }
}

function formatConsultaStatus(status: StatusConsulta): string {
  switch (status) {
    case "EM_ATENDIMENTO":
      return "Em atendimento";
    case "FINALIZADO":
      return "Finalizado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status;
  }
}

export function VisualizacaoProntuario({
  prontuario,
  paciente,
  consulta,
  formatarData,
  formatarDataHora,
  formatarTamanhoArquivo,
  aoAbrirPaciente,
  aoAbrirConsulta,
  aoAbrirAnexo,
  aoBaixarAnexo,
}: VisualizacaoProntuarioProps) {
  return (
    <section className={styles.detailPanel} aria-label="Detalhe do prontuário">
      <div className={styles.headerSummary}>
        <div className={styles.headerMetaItem}>
          <span>Data</span>
          <strong>
            <FaCalendarAlt /> {formatarData(consulta.dataConsulta)}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Horário</span>
          <strong>
            <FaClock /> {consulta.horaConsulta}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Profissional</span>
          <strong>
            <FaUser /> {consulta.profissionalNome}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Serviço</span>
          <strong>
            <FaStethoscope /> {consulta.servicoNome}
          </strong>
        </div>
        <div className={styles.headerMetaItem}>
          <span>Atendimento</span>
          <strong>
            <FaFileMedicalAlt />{" "}
            {consulta.tipoConsulta
              ? `${consulta.tipoAtendimento} • ${consulta.tipoConsulta}`
              : consulta.tipoAtendimento}
          </strong>
        </div>
        <div className={styles.headerStatus}>
          <span>Status</span>
          <StatusBadge
            label={formatConsultaStatus(prontuario.statusConsulta)}
            variant={toStatusVariant(prontuario.statusConsulta)}
          />
        </div>
      </div>

      <div className={styles.detailLayout}>
        <div className={styles.mainColumn}>
          <SecaoCartao titulo="Registro da consulta">
            <div className={styles.readBlock}>
              <h4>Queixa principal</h4>
              <p>{prontuario.queixaPrincipal || "Sem queixa principal registrada."}</p>
            </div>

            <div className={styles.readBlock}>
              <h4>Registro da consulta</h4>
              <p>{prontuario.registroConsulta || "Sem registro da consulta."}</p>
            </div>

            <div className={styles.readBlock}>
              <h4>Conduta</h4>
              <p>{prontuario.conduta || "Sem conduta registrada."}</p>
            </div>
          </SecaoCartao>

          <SecaoCartao titulo="Observações e receita">
            <div className={styles.readBlock}>
              <h4>Observações</h4>
              <p>{prontuario.observacoes || "Sem observações adicionais."}</p>
            </div>

            <div className={styles.readBlock}>
              <h4>Receita digitada</h4>
              <p>{prontuario.receitaDigitada || "Sem receita digitada."}</p>
            </div>

            <div className={styles.readBlock}>
              <h4>Última atualização</h4>
              <p>{formatarDataHora(prontuario.updatedAt)}</p>
            </div>
          </SecaoCartao>

          <SecaoCartao
            titulo="Anexos"
            acao={
              aoAbrirConsulta ? (
                <button
                  type="button"
                  className={styles.sectionAction}
                  onClick={aoAbrirConsulta}
                >
                  <FaPlay />
                  <span>Abrir consulta</span>
                </button>
              ) : undefined
            }
          >
            {!prontuario.anexos.length ? (
              <div className={styles.emptyAttachments}>
                <FaPaperclip />
                <p>Sem anexos vinculados a este prontuário.</p>
              </div>
            ) : (
              <ul className={styles.attachmentList}>
                {prontuario.anexos.map((anexo) => (
                  <li key={anexo.id} className={styles.attachmentItem}>
                    <div className={styles.attachmentMeta}>
                      <strong>{anexo.nomeArquivo}</strong>
                      <span>
                        {anexo.mimeType} • {formatarTamanhoArquivo(anexo.tamanhoBytes)}
                      </span>
                      <span>{formatarDataHora(anexo.dataUpload)}</span>
                    </div>
                    <div className={styles.attachmentActions}>
                      <button
                        type="button"
                        className={styles.attachmentBtn}
                        onClick={() => aoAbrirAnexo(anexo)}
                      >
                        <FaExternalLinkAlt />
                        <span>Visualizar</span>
                      </button>
                      <button
                        type="button"
                        className={styles.attachmentBtn}
                        onClick={() => aoBaixarAnexo(anexo)}
                      >
                        <FaDownload />
                        <span>Baixar</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SecaoCartao>
        </div>

        <aside className={styles.sideColumn}>
          <SecaoCartao titulo="Paciente">
            <strong className={styles.patientName}>{paciente.nome}</strong>
            <p className={styles.patientMeta}>CPF {paciente.cpf || "não informado"}</p>
            <p className={styles.patientMeta}>
              <FaPhone /> {paciente.telefone}
            </p>
            <p className={styles.patientMeta}>
              <FaEnvelope /> {paciente.email || "E-mail não informado"}
            </p>
            <button
              type="button"
              className={styles.patientAction}
              onClick={aoAbrirPaciente}
            >
              Ver ficha do paciente
            </button>
          </SecaoCartao>
        </aside>
      </div>
    </section>
  );
}
