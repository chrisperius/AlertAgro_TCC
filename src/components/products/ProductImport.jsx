import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

const jsonSchema = {
  type: "object",
  properties: {
    produtos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          categoria: { type: "string" },
          categoria_tipo: { type: "string" },
          quantidade: { type: "number" },
          nivel_toxicidade: { type: "string" },
          dasa_cor: { type: "string" },
          nome_cientifico: { type: "string" },
          caracteristica: { type: "string" },
          embalagem_tipo: { type: "string" },
          embalagem_quantidade: { type: "number" },
          preco: { type: "number" },
          estoque_minimo: { type: "number" },
        },
      },
    },
  },
};

export default function ProductImport({ open, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;
      const extractRes =
        await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: fileUrl,
          json_schema: jsonSchema,
        });
      if (extractRes.status !== "success" || !extractRes.output) {
        throw new Error(
          extractRes.details || "Não foi possível ler os dados do arquivo.",
        );
      }
      const produtos = Array.isArray(extractRes.output)
        ? extractRes.output
        : extractRes.output.produtos || [];
      if (produtos.length === 0)
        throw new Error("Nenhum produto encontrado no arquivo.");

      const cleaned = produtos
        .map((p) => ({
          nome: p.nome || "Sem nome",
          categoria: p.categoria || "Geral",
          categoria_tipo: (p.categoria_tipo || "NPK")
            .toUpperCase()
            .includes("NFP")
            ? "NFP"
            : "NPK",
          quantidade: Number(p.quantidade) || 0,
          nivel_toxicidade: p.nivel_toxicidade || "Baixo",
          dasa_cor: p.dasa_cor || "Verde",
          nome_cientifico: p.nome_cientifico || "",
          caracteristica: p.caracteristica || "",
          embalagem_tipo: (p.embalagem_tipo || "kg")
            .toLowerCase()
            .includes("litro")
            ? "litro"
            : "kg",
          embalagem_quantidade: Number(p.embalagem_quantidade) || 0,
          preco: Number(p.preco) || 0,
          estoque_minimo: Number(p.estoque_minimo) || 0,
        }))
        .map((p) => ({
          ...p,
          preco_total: (p.preco || 0) * (p.quantidade || 0),
        }));

      await base44.entities.Product.bulkCreate(cleaned);
      setResult({ total: cleaned.length });
      toast({
        title: "Importação concluída",
        description: `${cleaned.length} produto(s) cadastrado(s).`,
      });
      onDone?.();
    } catch (err) {
      toast({
        title: "Erro na importação",
        description: err.message || "Falha ao importar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Importar Produtos por Planilha
          </DialogTitle>
        </DialogHeader>
        <p className="text-base text-muted-foreground">
          Envie um arquivo Excel (.xlsx) ou CSV com as colunas: nome, categoria,
          categoria_tipo, quantidade, nivel_toxicidade, dasa_cor,
          nome_cientifico, caracteristica, embalagem_tipo, embalagem_quantidade,
          preco, estoque_minimo.
        </p>
        <div className="space-y-3">
          <Label className="text-base">Selecione o arquivo</Label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent">
              <div className="flex flex-col items-center gap-2">
                {file ? (
                  <FileSpreadsheet className="w-10 h-10 text-green-700" />
                ) : (
                  <Upload className="w-10 h-10 text-muted-foreground" />
                )}
                <span className="text-base text-muted-foreground">
                  {file ? file.name : "Clique para escolher o arquivo"}
                </span>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
            </label>
          </div>
          {result && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-base font-medium">
                {result.total} produto(s) importado(s) com sucesso!
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="h-12 text-base"
            onClick={handleClose}
          >
            Fechar
          </Button>
          <Button
            className="h-12 text-base bg-green-700 hover:bg-green-800"
            onClick={handleImport}
            disabled={!file || loading}
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
