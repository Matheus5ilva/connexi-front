import type { IconType } from "react-icons";
import {
  FaBriefcase,
  FaClipboardList,
  FaFileMedical,
  FaMagic,
  FaPaw,
  FaSpa,
  FaStethoscope,
  FaUser,
} from "react-icons/fa";
import { SEGMENTO_PADRAO, isSegmento, type Segmento } from "./segmento-labels";

export type SegmentoIconKey = "pessoa" | "atendimento" | "historico" | "servico";
export type SegmentoIcons = Record<SegmentoIconKey, IconType>;

export const SEGMENTO_ICONS = {
  SAUDE: {
    pessoa: FaUser,
    atendimento: FaFileMedical,
    historico: FaClipboardList,
    servico: FaStethoscope,
  },
  ESTETICA: {
    pessoa: FaUser,
    atendimento: FaSpa,
    historico: FaClipboardList,
    servico: FaMagic,
  },
  PET: {
    pessoa: FaUser,
    atendimento: FaFileMedical,
    historico: FaClipboardList,
    servico: FaPaw,
  },
  SERVICOS: {
    pessoa: FaUser,
    atendimento: FaBriefcase,
    historico: FaClipboardList,
    servico: FaBriefcase,
  },
} satisfies Record<Segmento, SegmentoIcons>;

export function getSegmentoIcons(segmento?: string | null): SegmentoIcons {
  return isSegmento(segmento)
    ? SEGMENTO_ICONS[segmento]
    : SEGMENTO_ICONS[SEGMENTO_PADRAO];
}
