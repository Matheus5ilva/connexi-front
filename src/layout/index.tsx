import { useCallback, useEffect, useState } from "react";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { Outlet } from "react-router-dom";
import styles from "./styles.module.css";
import { tenantService } from "../services/api";
import {
  isSegmento,
  SEGMENTO_PADRAO,
  type Segmento,
} from "../config/segmento-labels";

export type LayoutOutletContext = {
  segmento: Segmento;
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [segmento, setSegmento] = useState<Segmento>(SEGMENTO_PADRAO);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarSegmentoTenant() {
      try {
        const tenantAtual = await tenantService.obterAtual();

        if (ativo) {
          setSegmento(
            isSegmento(tenantAtual.nicho) ? tenantAtual.nicho : SEGMENTO_PADRAO,
          );
        }
      } catch {
        if (ativo) {
          setSegmento(SEGMENTO_PADRAO);
        }
      }
    }

    void carregarSegmentoTenant();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        segmento={segmento}
      />

      <div className={styles.contentArea}>
        <Header onToggleSidebar={handleToggleSidebar} />

        <main className={styles.mainWrapper}>
          <Outlet context={{ segmento } satisfies LayoutOutletContext} />
        </main>
      </div>
    </div>
  );
}
