import React, { useEffect, useState } from "react";
import { apiRequest } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Table as TableIcon, Pencil, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { isLowStock, isZeroed, dasaColorMap, canEdit } from "@/lib/agroHelpers";

export default function Spreadsheet() {
  const { user } = useAuth();
  const editable = canEdit(user?.role);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const resposta = await apiRequest("/products");
      const data = Array.isArray(resposta)
        ? resposta
        : Array.isArray(resposta?.products)
          ? resposta.products
          : [];

      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar planilha:", error);
      toast({
        title: "Erro ao carregar produtos",
        description: error.message || "Não foi possível carregar o estoque.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditValues({
      quantidade: p.quantidade ?? 0,
      preco: p.preco ?? 0,
      estoque_minimo: p.estoque_minimo ?? 0,
    });
  };

  const saveEdit = async (p) => {
    const quantidade = Number(editValues.quantidade);
    const preco = Number(editValues.preco);
    const estoqueMinimo = Number(editValues.estoque_minimo);

    if (
      !Number.isFinite(quantidade) ||
      !Number.isFinite(preco) ||
      !Number.isFinite(estoqueMinimo) ||
      quantidade < 0 ||
      preco < 0 ||
      estoqueMinimo < 0
    ) {
      toast({
        title: "Valores inválidos",
        description:
          "Informe quantidades, preços e estoque mínimo iguais ou maiores que zero.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/products/${p.id}`, {
        method: "PUT",
        body: JSON.stringify({
          quantidade,
          preco,
          estoque_minimo: estoqueMinimo,
          preco_total: preco * quantidade,
        }),
      });

      setEditingId(null);
      await load();

      toast({
        title: "Produto atualizado",
        description: "As alterações foram salvas.",
      });
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast({
        title: "Não foi possível salvar",
        description:
          error.message || "Verifique a API de produtos e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    "Nome",
    "Categoria",
    "Tipo",
    "Qtd.",
    "Mínimo",
    "DASA",
    "Toxicidade",
    "Embalagem",
    "Preço Unit.",
    "Total",
  ];

  const exportToCSV = () => {
    const headers = [
      "Nome",
      "Categoria",
      "Tipo",
      "Quantidade",
      "Estoque Minimo",
      "DASA",
      "Toxicidade",
      "Embalagem Tipo",
      "Embalagem Qtd",
      "Preco Unitario",
      "Preco Total",
    ];

    const escaparCSV = (valor) =>
      `"${String(valor ?? "").replace(/"/g, '""')}"`;

    const rows = products.map((p) =>
      [
        escaparCSV(p.nome),
        escaparCSV(p.categoria),
        escaparCSV(p.categoria_tipo),
        p.quantidade ?? 0,
        p.estoque_minimo ?? 0,
        escaparCSV(p.dasa_cor),
        escaparCSV(p.nivel_toxicidade),
        escaparCSV(p.embalagem_tipo),
        p.embalagem_quantidade ?? 0,
        (Number(p.preco) || 0).toFixed(2).replace(".", ","),
        (Number(p.preco_total) || 0).toFixed(2).replace(".", ","),
      ].join(";"),
    );

    const csv = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `alertagro_estoque_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast({ title: "Planilha exportada" });
  };

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
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TableIcon className="w-8 h-8 text-green-700" />
          Modo Planilha
        </h1>

        <p className="text-lg text-muted-foreground mt-1">
          Visualização em formato de planilha, como no Excel.{" "}
          {editable
            ? "Edite os campos de quantidade, preço e estoque mínimo diretamente na tabela."
            : "Visualização somente leitura."}
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="h-12 text-base"
          onClick={exportToCSV}
          disabled={products.length === 0}
        >
          <Download className="w-5 h-5 mr-2" />
          Exportar para Excel
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent sticky top-0">
              <tr className="text-left">
                {columns.map((coluna) => (
                  <th
                    key={coluna}
                    className="px-3 py-3 font-semibold whitespace-nowrap"
                  >
                    {coluna}
                  </th>
                ))}

                {editable && (
                  <th className="px-3 py-3 font-semibold text-right">Editar</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const dasa = dasaColorMap[p.dasa_cor] || dasaColorMap.Verde;
                const isEditing = editingId === p.id;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-accent/30 ${
                      isZeroed(p)
                        ? "bg-red-50"
                        : isLowStock(p)
                          ? "bg-amber-50"
                          : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {p.nome}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      {p.categoria}
                    </td>

                    <td className="px-3 py-2">{p.categoria_tipo}</td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="w-20 h-9 border border-input rounded px-2 text-sm"
                          value={editValues.quantidade}
                          onChange={(e) =>
                            setEditValues((old) => ({
                              ...old,
                              quantidade: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="font-medium">{p.quantidade}</span>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="w-20 h-9 border border-input rounded px-2 text-sm"
                          value={editValues.estoque_minimo}
                          onChange={(e) =>
                            setEditValues((old) => ({
                              ...old,
                              estoque_minimo: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        p.estoque_minimo
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${dasa.bg} ${dasa.text}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${dasa.dot}`} />
                        {p.dasa_cor}
                      </span>
                    </td>

                    <td className="px-3 py-2">{p.nivel_toxicidade}</td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      {p.embalagem_quantidade} {p.embalagem_tipo}
                    </td>

                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="w-24 h-9 border border-input rounded px-2 text-sm"
                          value={editValues.preco}
                          onChange={(e) =>
                            setEditValues((old) => ({
                              ...old,
                              preco: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        `R$ ${(Number(p.preco) || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}`
                      )}
                    </td>

                    <td className="px-3 py-2 font-semibold whitespace-nowrap">
                      R${" "}
                      {(Number(p.preco_total) || 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {editable && (
                      <td className="px-3 py-2 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-accent disabled:opacity-50"
                              disabled={saving}
                              title="Salvar alterações"
                              onClick={() => saveEdit(p)}
                            >
                              <Check className="w-4 h-4 text-green-700" />
                            </button>

                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-accent"
                              disabled={saving}
                              title="Cancelar edição"
                              onClick={() => {
                                setEditingId(null);
                                setEditValues({});
                              }}
                            >
                              <X className="w-4 h-4 text-red-700" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="p-1.5 rounded hover:bg-accent"
                            title="Editar produto"
                            onClick={() => startEdit(p)}
                          >
                            <Pencil className="w-4 h-4 text-blue-700" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={editable ? 11 : 10}
                    className="px-3 py-8 text-center text-muted-foreground"
                  >
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        💡 Linhas em vermelho = estoque zerado; em amarelo = estoque baixo.
      </p>
    </div>
  );
}
