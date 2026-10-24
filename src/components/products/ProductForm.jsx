import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const emptyForm = {
  nome: "",
  categoria: "",
  categoria_tipo: "NPK",
  quantidade: 0,
  nivel_toxicidade: "Baixo",
  dasa_cor: "Verde",
  nome_cientifico: "",
  caracteristica: "",
  horario: "",
  embalagem_tipo: "kg",
  embalagem_quantidade: 0,
  preco: 0,
  estoque_minimo: 0,
};

export default function ProductForm({ open, onClose, onSave, product }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({ ...emptyForm, ...product });
    } else {
      setForm(emptyForm);
    }
  }, [product, open]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const preco = Number(form.preco) || 0;
    const quantidade = Number(form.quantidade) || 0;
    const preco_total = preco * quantidade;
    const payload = {
      ...form,
      quantidade,
      preco,
      embalagem_quantidade: Number(form.embalagem_quantidade) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      preco_total,
    };
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "h-12 text-base";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {product ? "Editar Produto" : "Cadastrar Novo Produto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-base">Nome do Produto *</Label>
              <Input
                className={inputClass}
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Categoria *</Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                value={form.categoria}
                onChange={(e) => update("categoria", e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                <option value="Fertilizante">Fertilizante</option>
                <option value="Herbicida">Herbicida</option>
                <option value="Inseticida">Inseticida</option>
                <option value="Fungicida">Fungicida</option>
                <option value="Acaricida">Acaricida</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-base">Tipo de Categoria *</Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                value={form.categoria_tipo}
                onChange={(e) => update("categoria_tipo", e.target.value)}
              >
                <option value="NPK">NPK</option>
                <option value="NFP">NFP</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-base">Quantidade em Estoque *</Label>
              <Input
                type="number"
                step="any"
                className={inputClass}
                value={form.quantidade}
                onChange={(e) => update("quantidade", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Estoque Mínimo (alerta)</Label>
              <Input
                type="number"
                step="any"
                className={inputClass}
                value={form.estoque_minimo}
                onChange={(e) => update("estoque_minimo", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Horário de Aplicação</Label>
              <Input
                type="time"
                className={inputClass}
                value={form.horario || ""}
                onChange={(e) => update("horario", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">
                Nível de Toxicidade (Perigo) *
              </Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                value={form.nivel_toxicidade}
                onChange={(e) => update("nivel_toxicidade", e.target.value)}
              >
                <option value="Baixo">Baixo</option>
                <option value="Médio">Médio</option>
                <option value="Alto">Alto</option>
                <option value="Extremo">Extremo</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-base">Classificação DASA (Cor) *</Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                value={form.dasa_cor}
                onChange={(e) => update("dasa_cor", e.target.value)}
              >
                <option value="Verde">Verde</option>
                <option value="Amarelo">Amarelo</option>
                <option value="Laranja">Laranja</option>
                <option value="Vermelho">Vermelho</option>
                <option value="Roxo">Roxo</option>
                <option value="Branco">Branco</option>
                <option value="Preto">Preto</option>
                <option value="Azul">Azul</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-base">Nome Científico</Label>
              <Input
                className={inputClass}
                value={form.nome_cientifico}
                onChange={(e) => update("nome_cientifico", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Tipo de Embalagem *</Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                value={form.embalagem_tipo}
                onChange={(e) => update("embalagem_tipo", e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="litro">litro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-base">Quantidade por Embalagem *</Label>
              <Input
                type="number"
                step="any"
                className={inputClass}
                value={form.embalagem_quantidade}
                onChange={(e) => update("embalagem_quantidade", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Preço Unitário (R$) *</Label>
              <Input
                type="number"
                step="any"
                className={inputClass}
                value={form.preco}
                onChange={(e) => update("preco", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-base">Características</Label>
              <Textarea
                className="text-base min-h-[80px]"
                value={form.caracteristica}
                onChange={(e) => update("caracteristica", e.target.value)}
                placeholder="Descreva as características do produto..."
              />
            </div>
          </div>
          <div className="bg-accent rounded-lg p-3 text-sm text-muted-foreground">
            Preço total calculado:{" "}
            <span className="font-bold text-foreground">
              R${" "}
              {(
                (Number(form.preco) || 0) * (Number(form.quantidade) || 0)
              ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            className="h-12 text-base"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="h-12 text-base bg-green-700 hover:bg-green-800"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            {product ? "Salvar Alterações" : "Cadastrar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
