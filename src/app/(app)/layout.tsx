import type { ReactNode } from "react";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
