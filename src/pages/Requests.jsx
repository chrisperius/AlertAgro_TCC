import React, { useEffect, useState } from "react";
import { apiRequest } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Plus,
  Trash2,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { toast } from "@/components/ui/use-toast";

const statusInfo = {
  Pendente: {
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  Aprovado: {
    icon: CheckCircle2,
    color: "bg-green-100 text-green-800",
  },
  Recusado: {
    icon: XCircle,
    color: "bg-red-100 text-red-800",
  },
};

const getToday = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const emptyForm = () => ({
  tipo: "Saida",
  finalidade: "",
  data_solicitacao: getToday(),
  produtos_lista: [],
});

export default function Requests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const [requestsData, productsData] = await Promise.all([
        apiRequest("/requests"),
        apiRequest("/products"),
      ]);

      const allRequests = Array.isArray(requestsData)
        ? requestsData
        : requestsData?.requests || [];

      const allProducts = Array.isArray(productsData)
        ? productsData
        : productsData?.products || [];

      setRequests(
        allRequests.filter(
          (request) => String(request.usuario_id) === String(user?.id),
        ),
      );

      setProducts(allProducts);
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);

      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const addRow = () => {
    setForm((current) => ({
      ...current,
      produtos_lista: [
        ...current.produtos_lista,
        {
          produto_id: "",
          produto_nome: "",
          quantidade: "",
        },
      ],
    }));
  };

  const updateRow = (index, field, value) => {
    setForm((current) => {
      const rows = [...current.produtos_lista];

      rows[index] = {
        ...rows[index],
        [field]: value,
      };

      if (field === "produto_id") {
        const product = products.find(
          (item) => String(item.id) === String(value),
        );

        rows[index].produto_nome = product?.nome || "";
      }

      return {
        ...current,
        produtos_lista: rows,
      };
    });
  };

  const removeRow = (index) => {
    setForm((current) => ({
      ...current,
      produtos_lista: current.produtos_lista.filter(
        (_, rowIndex) => rowIndex !== index,
      ),
    }));
  };

  const handleSave = async () => {
    if (!form.finalidade.trim()) {
      toast({
        title: "Informe a finalidade",
        description: "Explique para que os produtos serão utilizados.",
        variant: "destructive",
      });
      return;
    }

    if (form.produtos_lista.length === 0) {
      toast({
        title: "Adicione ao menos um produto",
        variant: "destructive",
      });
      return;
    }

    const invalidRow = form.produtos_lista.some(
      (item) =>
        !item.produto_id ||
        !Number.isFinite(Number(item.quantidade)) ||
        Number(item.quantidade) <= 0,
    );

    if (invalidRow) {
      toast({
        title: "Confira os produtos",
        description:
          "Selecione um produto e informe uma quantidade maior que zero em cada linha.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await apiRequest("/requests", {
        method: "POST",
        body: JSON.stringify({
          tipo: form.tipo,
          finalidade: form.finalidade.trim(),
          data_solicitacao: form.data_solicitacao,
          produtos_lista: form.produtos_lista.map((item) => ({
            produto_id: item.produto_id,
            quantidade: Number(item.quantidade),
          })),
        }),
      });

      toast({
        title: "Solicitação enviada para aprovação",
      });

      setOpen(false);
      setForm(emptyForm());

      await load();
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minhas Solicitações</h1>

          <p className="text-lg text-muted-foreground mt-1">
            Solicite retiradas e entradas de produtos para aprovação do
            supervisor geral.
          </p>
        </div>

        <Button
          className="h-12 text-base bg-green-700 hover:bg-green-800"
          onClick={() => {
            setForm(emptyForm());
            setOpen(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

          <p className="text-lg text-muted-foreground">
            Você ainda não fez solicitações.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const status = statusInfo[request.status] || statusInfo.Pendente;

            const StatusIcon = status.icon;

            return (
              <div
                key={request.id}
                className="bg-card rounded-2xl border border-border p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        request.tipo === "Entrada"
                          ? "bg-blue-100"
                          : "bg-rose-100"
                      }`}
                    >
                      <span className="text-base font-bold text-blue-700">
                        {request.tipo === "Entrada" ? "↓" : "↑"}
                      </span>
                    </div>

                    <div>
                      <p className="text-lg font-bold">
                        Solicitação de {request.tipo}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Solicitado em {request.data_solicitacao}
                        {request.finalidade ? ` • ${request.finalidade}` : ""}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    {request.status}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                  {(request.produtos_lista || []).map((item, index) => (
                    <span
                      key={`${request.id}-${item.produto_id}-${index}`}
                      className="px-3 py-1.5 rounded-lg bg-accent text-sm font-medium"
                    >
                      {item.produto_nome}: {item.quantidade}
                    </span>
                  ))}
                </div>

                {request.resposta_observacao && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Observação do supervisor: {request.resposta_observacao}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Nova Solicitação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-base">Tipo *</Label>

                <select
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base"
                  value={form.tipo}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tipo: event.target.value,
                    }))
                  }
                >
                  <option value="Saida">Saída (retirada)</option>
                  <option value="Entrada">Entrada</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-base">Finalidade *</Label>

                <Input
                  className="h-12 text-base"
                  value={form.finalidade}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      finalidade: event.target.value,
                    }))
                  }
                  placeholder="Ex: Aplicação na lavoura de milho"
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
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {form.produtos_lista.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      className="flex h-11 flex-1 rounded-md border border-input bg-background px-3 text-base"
                      value={row.produto_id}
                      onChange={(event) =>
                        updateRow(index, "produto_id", event.target.value)
                      }
                    >
                      <option value="">Selecione o produto...</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.nome}
                        </option>
                      ))}
                    </select>

                    <Input
                      type="number"
                      min="0"
                      step="any"
                      className="h-11 w-32 text-base"
                      placeholder="Qtd"
                      value={row.quantidade}
                      onChange={(event) =>
                        updateRow(index, "quantidade", event.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-accent"
                      onClick={() => removeRow(index)}
                      aria-label="Remover produto"
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

                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto disponível para seleção.
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
              disabled={saving}
            >
              Cancelar
            </Button>

            <Button
              className="h-12 text-base bg-green-700 hover:bg-green-800"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
