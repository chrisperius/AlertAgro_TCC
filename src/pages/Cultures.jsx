import React, { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2, Sprout, Calculator } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { canEdit } from "@/lib/agroHelpers";

export default function Cultures() {
  const { user } = useAuth();
  const editable = canEdit(user?.role);

  const [cultures, setCultures] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    area_hectares: 0,
    produtos_quantidade: [],
  });

  const load = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        apiRequest("/cultures"),
        apiRequest("/products"),
      ]);

      setCultures(c);
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

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "", area_hectares: 0, produtos_quantidade: [] });
    setOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      nome: c.nome,
      area_hectares: c.area_hectares,
      produtos_quantidade: c.produtos_quantidade || [],
    });
    setOpen(true);
  };

  const addRow = () =>
    setForm((f) => ({
      ...f,
      produtos_quantidade: [
        ...f.produtos_quantidade,
        { produto_id: "", produto_nome: "", quantidade_por_hectare: 0 },
      ],
    }));
  const updateRow = (i, field, value) =>
    setForm((f) => {
      const rows = [...f.produtos_quantidade];
      rows[i] = { ...rows[i], [field]: value };
      if (field === "produto_id") {
        const prod = products.find((p) => p.id === value);
        rows[i].produto_nome = prod?.nome || "";
      }
      return { ...f, produtos_quantidade: rows };
    });
  const removeRow = (i) =>
    setForm((f) => ({
      ...f,
      produtos_quantidade: f.produtos_quantidade.filter((_, idx) => idx !== i),
    }));

  const handleSave = async () => {
    if (!form.nome) {
      toast({
        title: "Informe o nome da cultura",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...form,
      area_hectares: Number(form.area_hectares) || 0,
    };

    try {
      if (editing) {
        await apiRequest(`/cultures/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast({ title: "Cultura atualizada" });
      } else {
        await apiRequest("/cultures", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({ title: "Cultura cadastrada" });
      }

      setOpen(false);
      load();
    } catch (err) {
      toast({
        title: "Erro ao salvar cultura",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Excluir a cultura "${c.nome}"?`)) return;

    try {
      await apiRequest(`/cultures/${c.id}`, {
        method: "DELETE",
      });

      toast({ title: "Cultura excluída" });
      load();
    } catch (err) {
      toast({
        title: "Erro ao excluir cultura",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const calcTotal = (c) => {
    const area = c.area_hectares || 0;
    return (c.produtos_quantidade || []).reduce(
      (s, item) => s + (item.quantidade_por_hectare || 0) * area,
      0,
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Culturas</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Cadastre culturas e a quantidade de insumos usada por hectare.
          </p>
        </div>
        {editable && (
          <Button
            className="h-12 text-base bg-green-700 hover:bg-green-800"
            onClick={openNew}
          >
            <Plus className="w-5 h-5 mr-2" /> Nova Cultura
          </Button>
        )}
      </div>

      {cultures.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Sprout className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg text-muted-foreground">
            Nenhuma cultura cadastrada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cultures.map((c) => (
            <div
              key={c.id}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{c.nome}</h3>
                  <p className="text-base text-muted-foreground">
                    {c.area_hectares} hectare(s)
                  </p>
                </div>
                {editable && (
                  <div className="flex gap-2">
                    <button
                      className="p-2 rounded-lg hover:bg-accent"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="w-5 h-5 text-blue-700" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-accent"
                      onClick={() => handleDelete(c)}
                    >
                      <Trash2 className="w-5 h-5 text-red-700" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {(c.produtos_quantidade || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto vinculado.
                  </p>
                ) : (
                  (c.produtos_quantidade || []).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent"
                    >
                      <span className="text-base font-medium">
                        {item.produto_nome || "—"}
                      </span>
                      <span className="text-base text-muted-foreground">
                        {item.quantidade_por_hectare} /hectare
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-base">
                <Calculator className="w-5 h-5 text-green-700" />
                <span className="font-semibold">
                  Consumo total estimado: {calcTotal(c)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editing ? "Editar Cultura" : "Nova Cultura"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base">Nome da Cultura *</Label>
                <Input
                  className="h-12 text-base"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Milho, Soja..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Área (hectares)</Label>
                <Input
                  type="number"
                  step="any"
                  className="h-12 text-base"
                  value={form.area_hectares}
                  onChange={(e) =>
                    setForm({ ...form, area_hectares: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base">
                  Produtos e Quantidade por Hectare
                </Label>
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
                {form.produtos_quantidade.map((row, i) => (
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
                      placeholder="Qtd/ha"
                      value={row.quantidade_por_hectare}
                      onChange={(e) =>
                        updateRow(i, "quantidade_por_hectare", e.target.value)
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
                {form.produtos_quantidade.length === 0 && (
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
            >
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
