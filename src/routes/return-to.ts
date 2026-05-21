import type { Location } from "react-router-dom";
import { parseReturnToPath } from "../schemas/runtime-input.schema";

export type ReturnToState = {
  returnTo?: string;
};

export function resolveReturnTo(location: Location, fallback: string): string {
  const state = location.state as ReturnToState | null;
  return parseReturnToPath(state?.returnTo, fallback);
}
