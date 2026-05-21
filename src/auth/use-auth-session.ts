import { useSyncExternalStore } from "react";
import {
  inscreverSessaoAutenticada,
  obterSnapshotSessaoAutenticada,
  type SnapshotSessaoAutenticada,
} from "./session";

const getServerSnapshot = (): SnapshotSessaoAutenticada => ({
  accessToken: null,
  isAuthenticated: false,
  user: null,
});

export function useSessaoAutenticada(): SnapshotSessaoAutenticada {
  return useSyncExternalStore(
    inscreverSessaoAutenticada,
    obterSnapshotSessaoAutenticada,
    getServerSnapshot,
  );
}
