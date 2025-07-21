import { ReactNode } from "react";
import { SidebarProvider } from "@/hooks/use-sidebar";
import SidebarNew from "./SidebarNew";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-white">
        <SidebarNew />
        <div className="lg:pl-64">
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
