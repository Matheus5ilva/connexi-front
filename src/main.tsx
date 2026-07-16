import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { apiConfig } from "./services/api/config/api.config";

const root = createRoot(document.getElementById("root")!);
const deveCarregarLandingPublica =
  !apiConfig.tenantSubdomain && window.location.pathname === "/";

async function iniciarAplicacao() {
  if (deveCarregarLandingPublica) {
    const { PaginaInicialPublica } = await import("./pages/inicio-publico");

    root.render(
      <StrictMode>
        <PaginaInicialPublica />
      </StrictMode>,
    );
    return;
  }

  await import("bootstrap/dist/css/bootstrap.min.css");
  await import("./index.css");

  const [{ default: App }, { ErrorBoundary }] = await Promise.all([
    import("./App.tsx"),
    import("./components/error-boundary"),
  ]);

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

void iniciarAplicacao();
