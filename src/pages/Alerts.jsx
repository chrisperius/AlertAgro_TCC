import React, { useEffect, useState } from "react";
import { apiRequest } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, PackageX, CheckCircle2 } from "lucide-react";
import { isLowStock, isZeroed, dasaColorMap } from "@/lib/agroHelpers";

export default function Alerts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest("/products");
        setProducts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const baixo = products.filter((p) => isLowStock(p) && !isZeroed(p));
  const zerados = products.filter((p) => isZeroed(p));
  const ok = products.filter((p) => !isLowStock(p) && !isZeroed(p));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alertas de Estoque</h1>
        <p className="text-lg text-muted-foreground mt-1">
          Produtos que precisam de atenção — estoque baixo ou zerado.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-3xl font-bold text-amber-800">
                {baixo.length}
              </p>
              <p className="text-base text-amber-700">Estoque baixo</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <PackageX className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-3xl font-bold text-red-800">
                {zerados.length}
              </p>
              <p className="text-base text-red-700">Zerados</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-3xl font-bold text-green-800">{ok.length}</p>
              <p className="text-base text-green-700">Em níveis normais</p>
            </div>
          </div>
        </div>
      </div>

      {baixo.length === 0 && zerados.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Bell className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-lg font-medium">
            Tudo certo! Nenhum produto com estoque baixo ou zerado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {zerados.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3 text-red-800">
                Produtos Zerados
              </h2>
              <div className="space-y-2">
                {zerados.map((p) => {
                  const dasa = dasaColorMap[p.dasa_cor] || dasaColorMap.Verde;
                  return (
                    <div
                      key={p.id}
                      className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <PackageX className="w-6 h-6 text-red-600" />
                        <div>
                          <p className="text-base font-bold">{p.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.categoria} • Estoque atual: 0
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-sm font-medium ${dasa.bg} ${dasa.text}`}
                      >
                        {p.dasa_cor}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {baixo.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3 text-amber-800">
                Produtos com Estoque Baixo
              </h2>
              <div className="space-y-2">
                {baixo.map((p) => {
                  const dasa = dasaColorMap[p.dasa_cor] || dasaColorMap.Verde;
                  return (
                    <div
                      key={p.id}
                      className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                        <div>
                          <p className="text-base font-bold">{p.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.categoria} • Atual: {p.quantidade} / Mínimo:{" "}
                            {p.estoque_minimo}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-sm font-medium ${dasa.bg} ${dasa.text}`}
                      >
                        {p.dasa_cor}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-accent rounded-2xl p-5 text-base text-muted-foreground">
        💡 Dica: defina o "Estoque Mínimo" em cada produto para receber alertas
        automáticos quando o estoque ficar baixo.{" "}
        <Link to="/produtos" className="text-green-700 font-semibold underline">
          Ir para produtos
        </Link>
      </div>
    </div>
  );
}
