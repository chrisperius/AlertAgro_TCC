import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "../api/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function Movements() {
  const { user } = useAuth();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: "Entrada",
    finalidade: "",
    data: new Date().toISOString().slice(0, 10),
    produtos_lista: [],
  });
  const [saving, setSaving] = useState(false);

  // filtros
  const [fTipo, setFTipo] = useState("");
  const [fSearch, setFSearch] = useState("");
  const [fDataIni, setFDataIni] = useState("");
  const [fDataFim, setFDataFim] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        apiRequest("/movements"),
        apiRequest("/products"),
      ]);
      setMovements(m);
      setProducts(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addRow = () =>
    setForm((f) => ({
      ...f,
      produtos_lista: [
        ...f.produtos_lista,
        { produto_id: "", produto_nome: "", quantidade: 0, preco_unitario: 0 },
      ],
    }));
  const updateRow = (i, field, value) =>
    setForm((f) => {
      const rows = [...f.produtos_lista];
      rows[i] = { ...rows[i], [field]: value };
      if (field === "produto_id") {
        const prod = products.find((p) => p.id === value);
        rows[i].produto_nome = prod?.nome || "";
        rows[i].preco_unitario = prod?.preco || 0;
      }
      return { ...f, produtos_lista: rows };
    });
  const removeRow = (i) =>
    setForm((f) => ({
      ...f,
      produtos_lista: f.produtos_lista.filter((_, idx) => idx !== i),
    }));

  const filtered = useMemo(
    () =>
      movements.filter((m) => {
        if (fTipo && m.tipo !== fTipo) return false;
        if (fSearch) {
          const q = fSearch.toLowerCase();
          const inProdutos = (m.produtos_lista || []).some((p) =>
            (p.produto_nome || "").toLowerCase().includes(q),
          );
          if (
            !`${m.usuario_nome} ${m.finalidade || ""}`
              .toLowerCase()
              .includes(q) &&
            !inProdutos
          )
            return false;
        }
        if (fDataIni && m.data && m.data < fDataIni) return false;
        if (fDataFim && m.data && m.data > fDataFim) return false;
        return true;
      }),
    [movements, fTipo, fSearch, fDataIni, fDataFim],
  );

  const handleSave = async () => {
    if (form.produtos_lista.length === 0) {
      toast({
        title: "Adicione ao menos um produto",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await apiRequest("/movements", {
        method: "POST",
        body: JSON.stringify({
          usuario_id: user?.id,
          usuario_nome: user?.full_name || user?.email || "—",
          produtos_lista: form.produtos_lista,
          data: form.data,
          tipo: form.tipo,
          finalidade: form.finalidade,
          status_aprovado: "Aprovado",
        }),
      });

      toast({ title: "Movimentação registrada" });
      setOpen(false);

      setForm({
        tipo: "Entrada",
        finalidade: "",
        data: new Date().toISOString().slice(0, 10),
        produtos_lista: [],
      });

      load();
    } catch (err) {
      toast({
        title: "Erro ao registrar",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    if (!confirm("Excluir esta movimentação? O estoque não será revertido."))
      return;
    await base44.entities.Movement.delete(m.id);
    toast({ title: "Movimentação excluída" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Movimentações / Histórico</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Registre entradas e saídas de insumos.
          </p>
        </div>
        <Button
          className="h-12 text-base bg-green-700 hover:bg-green-800"
          onClick={() => {
            setForm({
              tipo: "Entrada",
              finalidade: "",
              data: new Date().toISOString().slice(0, 10),
              produtos_lista: [],
            });
            setOpen(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" /> Nova Movimentação
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Buscar e Filtrar</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Tipo</Label>
            <select
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base"
              value={fTipo}
              onChange={(e) => setFTipo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Entrada">Entrada</option>
              <option value="Saida">Saída</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Buscar</Label>
            <Input
              className="h-11 text-base"
              placeholder="Produto, usuário, finalidade..."
              value={fSearch}
              onChange={(e) => setFSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Data inicial</Label>
            <Input
              type="date"
              className="h-11 text-base"
              value={fDataIni}
              onChange={(e) => setFDataIni(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Data final</Label>
            <Input
              type="date"
              className="h-11 text-base"
              value={fDataFim}
              onChange={(e) => setFDataFim(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-lg text-muted-foreground">
            Nenhuma movimentação encontrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-card rounded-2xl border border-border p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.tipo === "Entrada" ? "bg-blue-100" : "bg-rose-100"}`}
                  >
                    {m.tipo === "Entrada" ? (
                      <ArrowDownToLine className="w-6 h-6 text-blue-700" />
                    ) : (
                      <ArrowUpFromLine className="w-6 h-6 text-rose-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{m.tipo}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.status_aprovado === "Aprovado" ? "bg-green-100 text-green-800" : m.status_aprovado === "Recusado" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {m.status_aprovado}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Por {m.usuario_nome} • {m.data}
                    </p>
                    {m.finalidade && (
                      <p className="text-sm text-muted-foreground">
                        Finalidade: {m.finalidade}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-accent self-start"
                  onClick={() => handleDelete(m)}
                >
                  <Trash2 className="w-5 h-5 text-red-700" />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                {(m.produtos_lista || []).map((item, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-accent text-sm font-medium"
                  >
                    {item.produto_nome}: {item.quantidade}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nova Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-base">Tipo *</Label>
                <select
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Saida">Saída</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-base">Data *</Label>
                <Input
                  type="date"
                  className="h-12 text-base"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Finalidade</Label>
                <Input
                  className="h-12 text-base"
                  value={form.finalidade}
                  onChange={(e) =>
                    setForm({ ...form, finalidade: e.target.value })
                  }
                  placeholder="Ex: Plantio do milho"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base">Produtos</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 text-sm"
                  onClick={addRow}
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {form.produtos_lista.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      className="flex h-11 flex-1 rounded-md border border-input bg-background px-3 text-base"
                      value={row.produto_id}
                      onChange={(e) =>
                        updateRow(i, "produto_id", e.target.value)
                      }
                    >
                      <option value="">Selecione o produto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      step="any"
                      className="h-11 w-32 text-base"
                      placeholder="Qtd"
                      value={row.quantidade}
                      onChange={(e) =>
                        updateRow(i, "quantidade", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-accent"
                      onClick={() => removeRow(i)}
                    >
                      <Trash2 className="w-5 h-5 text-red-700" />
                    </button>
                  </div>
                ))}
                {form.produtos_lista.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto adicionado.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-12 text-base"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-12 text-base bg-green-700 hover:bg-green-800"
              onClick={handleSave}
              disabled={saving}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
