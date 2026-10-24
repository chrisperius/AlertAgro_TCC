import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { apiRequest } from "../api/apiClient";
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Sprout,
} from "lucide-react";

const roleLabels = {
  comum: "Comum",
  supervisor: "Supervisor",
  supervisor_geral: "Supervisor Geral",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [cultures, setCultures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prods, movs, cults] = await Promise.all([
          apiRequest("/products"),
          apiRequest("/movements"),
          apiRequest("/cultures"),
        ]);

        setProducts(prods);
        setMovements(movs);
        setCultures(cults);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalProdutos = products.length;
  const baixoEstoque = products.filter(
    (p) =>
      (p.estoque_minimo || 0) > 0 &&
      (p.quantidade || 0) <= (p.estoque_minimo || 0),
  ).length;
  const entradas = movements.filter((m) => m.tipo === "Entrada").length;
  const saidas = movements.filter((m) => m.tipo === "Saida").length;
  const valorTotal = products.reduce((s, p) => {
    const precoTotal = Number(p.preco_total);
    const preco = Number(p.preco) || 0;
    const quantidade = Number(p.quantidade) || 0;

    const valor =
      Number.isFinite(precoTotal) && precoTotal > 0
        ? precoTotal
        : preco * quantidade;

    return s + valor;
  }, 0);

  const cards = [
    {
      label: "Produtos Cadastrados",
      value: totalProdutos,
      icon: Package,
      color: "bg-green-700",
      to: "/produtos",
    },
    {
      label: "Alertas de Estoque Baixo",
      value: baixoEstoque,
      icon: AlertTriangle,
      color: "bg-amber-600",
      to: "/alertas",
    },
    {
      label: "Entradas Registradas",
      value: entradas,
      icon: ArrowDownToLine,
      color: "bg-blue-700",
      to: "/movimentacoes",
    },
    {
      label: "Saídas Registradas",
      value: saidas,
      icon: ArrowUpFromLine,
      color: "bg-rose-700",
      to: "/movimentacoes",
    },
    {
      label: "Culturas",
      value: cultures.length,
      icon: Sprout,
      color: "bg-emerald-700",
      to: "/culturas",
    },
    {
      label: "Valor em Estoque",
      value: valorTotal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      icon: TrendingUp,
      color: "bg-slate-800",
      to: "/relatorios",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Olá, {user?.full_name?.split(" ")[0] || user?.email || "Usuário"}!
        </h1>
        <p className="text-lg text-muted-foreground mt-1">
          Você está logado como{" "}
          <span className="font-semibold text-green-700">
            {roleLabels[user?.role || "comum"]}
          </span>
          . Veja o resumo do seu estoque agrícola.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-green-300 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-xl ${card.color} flex items-center justify-center`}
              >
                <card.icon className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{card.value}</p>
            <p className="text-base text-muted-foreground mt-1">{card.label}</p>
          </Link>
        ))}
      </div>

      {baixoEstoque > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-amber-800">
                Atenção: {baixoEstoque} produto(s) com estoque baixo
              </h2>
              <p className="text-base text-amber-700 mt-1">
                Alguns insumos estão abaixo do estoque mínimo. Verifique a lista
                de alertas para repor.
              </p>
              <Link
                to="/alertas"
                className="inline-block mt-3 text-base font-semibold text-amber-800 underline"
              >
                Verificar alertas →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-xl font-bold mb-4">Movimentações Recentes</h2>
        {movements.length === 0 ? (
          <p className="text-base text-muted-foreground">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {movements.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.tipo === "Entrada" ? "bg-blue-100" : "bg-rose-100"}`}
                  >
                    {m.tipo === "Entrada" ? (
                      <ArrowDownToLine className="w-5 h-5 text-blue-700" />
                    ) : (
                      <ArrowUpFromLine className="w-5 h-5 text-rose-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-base font-medium">
                      {m.tipo} — {m.usuario_nome || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {m.finalidade || "Sem finalidade"}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {m.data || ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
