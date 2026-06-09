import type { IconType } from "react-icons";
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaClipboardList,
  FaCog,
  FaFileMedical,
  FaFileInvoiceDollar,
  FaIdCard,
  FaMagic,
  FaPaw,
  FaSpa,
  FaStethoscope,
  FaUser,
  FaUserMd,
  FaUsers,
} from "react-icons/fa";
import { SEGMENTO_PADRAO, isSegmento, type Segmento } from "./segmento-labels";

export type SegmentoIconKey =
  | "agenda"
  | "pessoa"
  | "profissional"
  | "negocio"
  | "financeiro"
  | "parceria"
  | "atendimento"
  | "historico"
  | "servico"
  | "configuracao";
export type SegmentoIcons = Record<SegmentoIconKey, IconType>;

export const SEGMENTO_ICONS = {
  SAUDE: {
    agenda: FaCalendarAlt,
    pessoa: FaUser,
    profissional: FaUserMd,
    negocio: FaBuilding,
    financeiro: FaFileInvoiceDollar,
    parceria: FaIdCard,
    atendimento: FaFileMedical,
    historico: FaClipboardList,
    servico: FaStethoscope,
    configuracao: FaCog,
  },
  ESTETICA: {
    agenda: FaCalendarAlt,
    pessoa: FaUser,
    profissional: FaUserMd,
    negocio: FaBuilding,
    financeiro: FaFileInvoiceDollar,
    parceria: FaUsers,
    atendimento: FaSpa,
    historico: FaClipboardList,
    servico: FaMagic,
    configuracao: FaCog,
  },
  PET: {
    agenda: FaCalendarAlt,
    pessoa: FaUser,
    profissional: FaUserMd,
    negocio: FaBuilding,
    financeiro: FaFileInvoiceDollar,
    parceria: FaIdCard,
    atendimento: FaFileMedical,
    historico: FaClipboardList,
    servico: FaPaw,
    configuracao: FaCog,
  },
  SERVICOS: {
    agenda: FaCalendarAlt,
    pessoa: FaUser,
    profissional: FaUserMd,
    negocio: FaBriefcase,
    financeiro: FaFileInvoiceDollar,
    parceria: FaIdCard,
    atendimento: FaBriefcase,
    historico: FaClipboardList,
    servico: FaBriefcase,
    configuracao: FaCog,
  },
} satisfies Record<Segmento, SegmentoIcons>;

export function getSegmentoIcons(segmento?: string | null): SegmentoIcons {
  return isSegmento(segmento)
    ? SEGMENTO_ICONS[segmento]
    : SEGMENTO_ICONS[SEGMENTO_PADRAO];
}
