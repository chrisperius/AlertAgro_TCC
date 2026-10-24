import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "../api/apiClient";
import {
  Plus,
  Search,
  Upload,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
} from "lucide-react";
import ProductForm from "@/components/products/ProductForm";
import ProductImport from "@/components/products/ProductImport";
import {
  dasaColorMap,
  toxicidadeColorMap,
  isLowStock,
  isZeroed,
  canEdit,
} from "@/lib/agroHelpers";
import { toast } from "@/components/ui/use-toast";

export default function Products() {
  const { user } = useAuth();
  const role = user?.role || "comum";
  const editable = canEdit(role);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // filtros
  const [search, setSearch] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [fDasa, setFDasa] = useState("");
  const [fDispo, setFDispo] = useState("");
  const [fCaracteristica, setFCaracteristica] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/products");
      setProducts(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Erro ao carregar produtos",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categorias = [
    "Fertilizante",
    "Herbicida",
    "Inseticida",
    "Fungicida",
    "Acaricida",
    "Outros",
  ];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!`${p.nome} ${p.nome_cientifico || ""}`.toLowerCase().includes(q))
          return false;
      }
      if (fCategoria && p.categoria !== fCategoria) return false;
      if (fDasa && p.dasa_cor !== fDasa) return false;
      if (
        fCaracteristica &&
        !(p.caracteristica || "")
          .toLowerCase()
          .includes(fCaracteristica.toLowerCase())
      )
        return false;
      if (fDispo === "zerado" && !isZeroed(p)) return false;
      if (fDispo === "disponivel" && isZeroed(p)) return false;
      if (fDispo === "baixo" && !isLowStock(p)) return false;
      return true;
    });
  }, [products, search, fCategoria, fDasa, fDispo, fCaracteristica]);

  const handleSave = async (payload) => {
    const url = editing ? `/products/${editing.id}` : "/products";

    await apiRequest(url, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });

    toast({
      title: editing ? "Produto atualizado" : "Produto cadastrado",
    });

    setFormOpen(false);
    load();
  };
  const handleDelete = async (p) => {
    if (!confirm(`Excluir o produto "${p.nome}"?`)) return;

    try {
      await apiRequest(`/products/${p.id}`, {
        method: "DELETE",
      });

      toast({ title: "Produto excluído" });
      load();
    } catch (e) {
      toast({
        title: "Erro ao excluir produto",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFCategoria("");
    setFDasa("");
    setFDispo("");
    setFCaracteristica("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-lg text-muted-foreground mt-1">
            {editable
              ? "Cadastre, edite e acompanhe seus insumos agrícolas."
              : "Visualize os insumos cadastrados."}
          </p>
        </div>
        {editable && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 text-base"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="w-5 h-5 mr-2" /> Importar Planilha
            </Button>
            <Button
              className="h-12 text-base bg-green-700 hover:bg-green-800"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-5 h-5 mr-2" /> Novo Produto
            </Button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Buscar e Filtrar</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Buscar por nome</Label>
            <Input
              className="h-11 text-base"
              placeholder="Nome do produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Característica</Label>
            <Input
              className="h-11 text-base"
              placeholder="Ex: sistêmico..."
              value={fCaracteristica}
              onChange={(e) => setFCaracteristica(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Categoria</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              value={fCategoria}
              onChange={(e) => setFCategoria(e.target.value)}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Classificação DASA (Cor)</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              value={fDasa}
              onChange={(e) => setFDasa(e.target.value)}
            >
              <option value="">Todas</option>
              {Object.keys(dasaColorMap).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Disponibilidade</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              value={fDispo}
              onChange={(e) => setFDispo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="disponivel">Disponível (com estoque)</option>
              <option value="zerado">Zerado (sem estoque)</option>
              <option value="baixo">Estoque baixo</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="h-11 text-base"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="text-base text-muted-foreground">
        {filtered.length} produto(s) encontrado(s)
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg text-muted-foreground">
            Nenhum produto encontrado.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Qtd.</th>
                  <th className="px-4 py-3 font-semibold">DASA</th>
                  <th className="px-4 py-3 font-semibold">Toxicidade</th>
                  <th className="px-4 py-3 font-semibold">Embalagem</th>
                  <th className="px-4 py-3 font-semibold">Preço Unit.</th>
                  <th className="px-4 py-3 font-semibold">Preço Total</th>
                  {editable && (
                    <th className="px-4 py-3 font-semibold text-right">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const dasa = dasaColorMap[p.dasa_cor] || dasaColorMap.Verde;
                  const low = isLowStock(p);
                  const zero = isZeroed(p);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-accent/50 ${zero ? "bg-red-50" : low ? "bg-amber-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-base">{p.nome}</div>
                        {p.nome_cientifico && (
                          <div className="text-sm text-muted-foreground italic">
                            {p.nome_cientifico}
                          </div>
                        )}
                        {low && !zero && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium mt-1">
                            <AlertTriangle className="w-3 h-3" /> Estoque baixo
                          </span>
                        )}
                        {zero && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium mt-1">
                            <AlertTriangle className="w-3 h-3" /> Zerado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-base">
                        {p.categoria}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({p.categoria_tipo})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base font-medium">
                        {p.quantidade}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${dasa.bg} ${dasa.text}`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${dasa.dot}`}
                          />
                          {p.dasa_cor}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-sm font-medium ${toxicidadeColorMap[p.nivel_toxicidade] || ""}`}
                        >
                          {p.nivel_toxicidade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-base">
                        {p.embalagem_quantidade} {p.embalagem_tipo}
                      </td>
                      <td className="px-4 py-3 text-base">
                        R${" "}
                        {(p.preco || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-base font-semibold">
                        R${" "}
                        {(p.preco_total || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      {editable && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              className="p-2 rounded-lg hover:bg-accent"
                              onClick={() => {
                                setEditing(p);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="w-5 h-5 text-blue-700" />
                            </button>
                            <button
                              className="p-2 rounded-lg hover:bg-accent"
                              onClick={() => handleDelete(p)}
                            >
                              <Trash2 className="w-5 h-5 text-red-700" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        product={editing}
      />
      <ProductImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={load}
      />
    </div>
  );
}
