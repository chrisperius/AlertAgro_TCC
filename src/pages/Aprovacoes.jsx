import React, { useEffect, useState } from "react";
import { apiRequest } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

import { toast } from "@/components/ui/use-toast";

export default function Aprovacoes() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [observacao, setObservacao] = useState("");
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const r = await apiRequest("/requests");
      setRequests(r);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao carregar solicitações",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendentes = requests.filter((r) => r.status === "Pendente");

  const respondidas = requests.filter((r) => r.status !== "Pendente");

  const handleReview = async (aprovar) => {
    if (!reviewing) return;

    setActing(true);

    try {
      const today = new Date().toISOString().slice(0, 10);

      await apiRequest(`/requests/${reviewing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: aprovar ? "Aprovado" : "Recusado",
          data_resposta: today,
          resposta_observacao: observacao,
        }),
      });

      toast({
        title: aprovar
          ? "Solicitação aprovada e estoque atualizado"
          : "Solicitação recusada",
      });

      setReviewing(null);
      setObservacao("");
      await load();
    } catch (err) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprovações</h1>
        <p className="text-lg text-muted-foreground mt-1">
          Aprove ou recuse as solicitações dos supervisores.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold">
                Pendentes ({pendentes.length})
              </h2>
            </div>

            {pendentes.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <ShieldCheck className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <p className="text-base text-muted-foreground">
                  Nenhuma solicitação pendente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendentes.map((r) => (
                  <div
                    key={r.id}
                    className="bg-card rounded-2xl border-2 border-amber-200 p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            r.tipo === "Entrada" ? "bg-blue-100" : "bg-rose-100"
                          }`}
                        >
                          <span className="text-base font-bold text-blue-700">
                            {r.tipo === "Entrada" ? "↓" : "↑"}
                          </span>
                        </div>

                        <div>
                          <p className="text-lg font-bold">
                            Solicitação de {r.tipo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Por {r.usuario_nome} • {r.data_solicitacao}
                            {r.finalidade ? ` • ${r.finalidade}` : ""}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="h-11 text-base bg-green-700 hover:bg-green-800"
                        onClick={() => {
                          setReviewing(r);
                          setObservacao("");
                        }}
                      >
                        Analisar
                      </Button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                      {(r.produtos_lista || []).map((item, i) => (
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
          </div>

          {respondidas.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-3">Já Respondidas</h2>

              <div className="space-y-3">
                {respondidas.map((r) => (
                  <div
                    key={r.id}
                    className="bg-card rounded-2xl border border-border p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            r.tipo === "Entrada" ? "bg-blue-100" : "bg-rose-100"
                          }`}
                        >
                          <span className="font-bold text-blue-700">
                            {r.tipo === "Entrada" ? "↓" : "↑"}
                          </span>
                        </div>

                        <div>
                          <p className="text-base font-bold">
                            {r.tipo} — {r.usuario_nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {r.data_solicitacao}
                            {r.finalidade ? ` • ${r.finalidade}` : ""}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                          r.status === "Aprovado"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {r.status === "Aprovado" ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {r.status}
                      </span>
                    </div>

                    {r.resposta_observacao && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Observação: {r.resposta_observacao}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!reviewing}
        onOpenChange={(open) => {
          if (!open && !acting) setReviewing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Analisar Solicitação</DialogTitle>
          </DialogHeader>

          {reviewing && (
            <div className="space-y-4">
              <div className="bg-accent rounded-lg p-4 space-y-1">
                <p className="text-base">
                  <strong>Tipo:</strong> {reviewing.tipo}
                </p>

                <p className="text-base">
                  <strong>Solicitante:</strong> {reviewing.usuario_nome}
                </p>

                <p className="text-base">
                  <strong>Finalidade:</strong> {reviewing.finalidade || "—"}
                </p>

                <div className="pt-2">
                  <strong className="text-base">Produtos:</strong>
                  <ul className="mt-1 space-y-1">
                    {(reviewing.produtos_lista || []).map((item, i) => (
                      <li key={i} className="text-base">
                        • {item.produto_nome}: {item.quantidade}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Observação (opcional)</Label>
                <Textarea
                  className="text-base min-h-[80px]"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Justificativa da decisão..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="h-12 text-base border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => handleReview(false)}
              disabled={acting}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Recusar
            </Button>

            <Button
              className="h-12 text-base bg-green-700 hover:bg-green-800"
              onClick={() => handleReview(true)}
              disabled={acting}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
