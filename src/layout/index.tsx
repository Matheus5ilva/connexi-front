import { useCallback, useState } from "react";
import { Header } from "../components/header";
import { Sidebar } from "../components/sidebar";
import { Outlet } from "react-router-dom";
import styles from "./styles.module.css";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar open={sidebarOpen} onClose={handleCloseSidebar} />

      <div className={styles.contentArea}>
        <Header onToggleSidebar={handleToggleSidebar} />

        <main className={styles.mainWrapper}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
