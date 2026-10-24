import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Sprout,
  ArrowLeftRight,
  Bell,
  FileBarChart,
  ClipboardList,
  Table,
  Users,
  LogOut,
  Menu,
  X,
  Leaf,
  ShieldCheck,
} from "lucide-react";

const roleLabels = {
  comum: "Comum",
  supervisor: "Supervisor",
  supervisor_geral: "Supervisor Geral",
};

const navItems = [
  {
    to: "/",
    label: "Início",
    icon: LayoutDashboard,
    roles: ["comum", "supervisor", "supervisor_geral"],
    end: true,
  },
  {
    to: "/produtos",
    label: "Produtos",
    icon: Package,
    roles: ["comum", "supervisor", "supervisor_geral"],
  },
  {
    to: "/culturas",
    label: "Culturas",
    icon: Sprout,
    roles: ["comum", "supervisor", "supervisor_geral"],
  },
  {
    to: "/movimentacoes",
    label: "Movimentações",
    icon: ArrowLeftRight,
    roles: ["supervisor", "supervisor_geral"],
  },
  {
    to: "/solicitacoes",
    label: "Minhas Solicitações",
    icon: ClipboardList,
    roles: ["supervisor"],
  },
  {
    to: "/aprovacoes",
    label: "Aprovações",
    icon: ShieldCheck,
    roles: ["supervisor_geral"],
  },
  {
    to: "/alertas",
    label: "Alertas",
    icon: Bell,
    roles: ["comum", "supervisor", "supervisor_geral"],
  },
  {
    to: "/relatorios",
    label: "Relatórios",
    icon: FileBarChart,
    roles: ["comum", "supervisor", "supervisor_geral"],
  },
  {
    to: "/planilha",
    label: "Modo Planilha",
    icon: Table,
    roles: ["comum", "supervisor", "supervisor_geral"],
  },
  {
    to: "/usuarios",
    label: "Usuários",
    icon: Users,
    roles: ["supervisor_geral"],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const rawRole = user?.role || "comum";
  // Papéis legados (admin/user) recebem acesso total para o construtor do app
  const role = ["comum", "supervisor", "supervisor_geral"].includes(rawRole)
    ? rawRole
    : "supervisor_geral";
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout(false);
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="w-11 h-11 rounded-xl bg-green-700 flex items-center justify-center shrink-0">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">
            AlertAgro
          </h1>
          <p className="text-sm text-muted-foreground">Controle de Insumos</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-lg text-base font-medium transition-colors ${
                isActive
                  ? "bg-green-700 text-white"
                  : "text-foreground hover:bg-accent"
              }`
            }
          >
            <item.icon className="w-6 h-6 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border space-y-3">
        <div className="px-2 py-2 rounded-lg bg-accent">
          <p className="text-sm font-semibold text-foreground truncate">
            {user?.full_name || user?.email || "Usuário"}
          </p>
          <p className="text-sm text-green-700 font-medium">
            {roleLabels[role]}
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full h-12 text-base font-medium"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 border-r border-border bg-sidebar flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-sidebar flex flex-col">
            <button
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
          <button
            className="p-2 rounded-lg hover:bg-accent"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">AlertAgro</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
