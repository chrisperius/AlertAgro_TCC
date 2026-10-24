import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/api/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import * as XLSX from "xlsx";

const moeda = (valor) =>
  (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatarData = (data) => {
  if (!data) return "";
  const texto = String(data).slice(0, 10);
  const partes = texto.split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : texto;
};

const obterArray = (resposta, chave) => {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.[chave])) return resposta[chave];
  return [];
};

export default function Reports() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [modoPlanilha, setModoPlanilha] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setLoading(true);
      setErro("");

      try {
        const [m, p] = await Promise.all([
          apiRequest("/movements"),
          apiRequest("/products"),
        ]);

        if (!ativo) return;

        setMovements(obterArray(m, "movements"));
        setProducts(obterArray(p, "products"));
      } catch (error) {
        if (ativo) {
          setErro(
            error.message ||
              "Não foi possível carregar os dados dos relatórios.",
          );
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  const produtosPorId = useMemo(
    () => new Map(products.map((p) => [String(p.id), p])),
    [products],
  );

  const movimentosNormalizados = useMemo(
    () =>
      movements.map((m) => ({
        ...m,
        produtos_lista: Array.isArray(m.produtos_lista)
          ? m.produtos_lista
          : Array.isArray(m.produtos)
            ? m.produtos
            : [],
      })),
    [movements],
  );

  const filteredMovs = useMemo(
    () =>
      movimentosNormalizados.filter((m) => {
        if (m.status_aprovado && m.status_aprovado !== "Aprovado") {
          return false;
        }

        const data = String(m.data || "").slice(0, 10);

        if (dataIni && (!data || data < dataIni)) return false;
        if (dataFim && (!data || data > dataFim)) return false;

        return true;
      }),
    [movimentosNormalizados, dataIni, dataFim],
  );

  const linhasRelatorio = useMemo(
    () =>
      filteredMovs.flatMap((m) => {
        const itens = m.produtos_lista;

        if (itens.length === 0) {
          return [
            {
              data: formatarData(m.data),
              tipo: m.tipo || "",
              usuario: m.usuario_nome || "",
              finalidade: m.finalidade || "",
              produto: "Sem itens detalhados",
              categoria: "",
              quantidade: 0,
              precoUnitario: 0,
              total: 0,
              status: m.status_aprovado || "Aprovado",
            },
          ];
        }

        return itens.map((item) => {
          const produto = produtosPorId.get(
            String(item.produto_id || item.id || ""),
          );
          const quantidade = Number(item.quantidade) || 0;
          const preco =
            Number(
              item.preco_unitario ?? item.preco ?? produto?.preco_unitario,
            ) || 0;

          return {
            data: formatarData(m.data),
            tipo: m.tipo || "",
            usuario: m.usuario_nome || "",
            finalidade: m.finalidade || "",
            produto:
              item.produto_nome || item.nome || produto?.nome || "Produto",
            categoria: produto?.categoria || item.categoria || "Sem categoria",
            quantidade,
            precoUnitario: preco,
            total: quantidade * preco,
            status: m.status_aprovado || "Aprovado",
          };
        });
      }),
    [filteredMovs, produtosPorId],
  );

  const consumoPorCategoria = useMemo(() => {
    const mapa = {};

    filteredMovs
      .filter((m) => m.tipo === "Saida")
      .forEach((m) => {
        m.produtos_lista.forEach((item) => {
          const produto = produtosPorId.get(String(item.produto_id || ""));
          const categoria =
            produto?.categoria || item.categoria || "Sem categoria";

          mapa[categoria] =
            (mapa[categoria] || 0) + (Number(item.quantidade) || 0);
        });
      });

    return Object.entries(mapa).map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
    }));
  }, [filteredMovs, produtosPorId]);

  const gastoPorCategoria = useMemo(() => {
    const mapa = {};

    filteredMovs
      .filter((m) => m.tipo === "Entrada")
      .forEach((m) => {
        m.produtos_lista.forEach((item) => {
          const produto = produtosPorId.get(String(item.produto_id || ""));
          const categoria =
            produto?.categoria || item.categoria || "Sem categoria";
          const quantidade = Number(item.quantidade) || 0;
          const preco =
            Number(
              item.preco_unitario ?? item.preco ?? produto?.preco_unitario,
            ) || 0;

          mapa[categoria] = (mapa[categoria] || 0) + quantidade * preco;
        });
      });

    return Object.entries(mapa).map(([categoria, valor]) => ({
      categoria,
      valor: Number(valor.toFixed(2)),
    }));
  }, [filteredMovs, produtosPorId]);

  const comparacaoPrecos = useMemo(() => {
    const mapa = {};

    filteredMovs
      .filter((m) => m.tipo === "Entrada")
      .forEach((m) => {
        m.produtos_lista.forEach((item) => {
          const id = String(item.produto_id || "");
          if (!id) return;

          const preco = Number(item.preco_unitario ?? item.preco) || 0;

          if (!mapa[id]) {
            mapa[id] = {
              nome: item.produto_nome || item.nome || "Produto",
              precos: [],
            };
          }

          mapa[id].precos.push({ data: m.data, preco });
        });
      });

    return Object.values(mapa)
      .filter((p) => p.precos.length >= 2)
      .map((p) => {
        const ordenados = [...p.precos].sort((a, b) =>
          String(a.data).localeCompare(String(b.data)),
        );
        const anterior = ordenados[ordenados.length - 2].preco;
        const ultimo = ordenados[ordenados.length - 1].preco;
        const variacao =
          anterior > 0 ? ((ultimo - anterior) / anterior) * 100 : 0;

        return {
          nome: p.nome,
          anterior,
          ultimo,
          variacao: Number(variacao.toFixed(1)),
        };
      });
  }, [filteredMovs]);

  const totalEntradas = filteredMovs.filter((m) => m.tipo === "Entrada").length;

  const totalSaidas = filteredMovs.filter((m) => m.tipo === "Saida").length;

  const valorGasto = linhasRelatorio
    .filter((linha) => linha.tipo === "Entrada")
    .reduce((soma, linha) => soma + linha.total, 0);

  const valorEstoque = products.reduce(
    (soma, produto) => soma + (Number(produto.preco_total) || 0),
    0,
  );

  function exportarExcel() {
    const dadosMovimentacoes = linhasRelatorio.map((linha) => ({
      Data: linha.data,
      Tipo: linha.tipo,
      Usuario: linha.usuario,
      Finalidade: linha.finalidade,
      Produto: linha.produto,
      Categoria: linha.categoria,
      Quantidade: linha.quantidade,
      "Preço unitário (R$)": linha.precoUnitario,
      "Valor total (R$)": linha.total,
      Status: linha.status,
    }));

    const resumo = [
      { Indicador: "Data inicial", Valor: dataIni || "Todas" },
      { Indicador: "Data final", Valor: dataFim || "Todas" },
      { Indicador: "Quantidade de entradas", Valor: totalEntradas },
      { Indicador: "Quantidade de saídas", Valor: totalSaidas },
      { Indicador: "Valor gasto em entradas (R$)", Valor: valorGasto },
      { Indicador: "Valor atual em estoque (R$)", Valor: valorEstoque },
    ];

    const planilhaMovimentos = XLSX.utils.json_to_sheet(dadosMovimentacoes);
    const planilhaResumo = XLSX.utils.json_to_sheet(resumo);
    const planilhaConsumo = XLSX.utils.json_to_sheet(consumoPorCategoria);
    const planilhaGastos = XLSX.utils.json_to_sheet(gastoPorCategoria);
    const planilhaPrecos = XLSX.utils.json_to_sheet(comparacaoPrecos);

    planilhaMovimentos["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 24 },
      { wch: 30 },
      { wch: 28 },
      { wch: 20 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, planilhaResumo, "Resumo");
    XLSX.utils.book_append_sheet(workbook, planilhaMovimentos, "Movimentações");
    XLSX.utils.book_append_sheet(workbook, planilhaConsumo, "Consumo");
    XLSX.utils.book_append_sheet(workbook, planilhaGastos, "Gastos");
    XLSX.utils.book_append_sheet(workbook, planilhaPrecos, "Preços");

    XLSX.writeFile(workbook, "Relatorio_AlertAgro.xlsx");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      label: "Entradas no período",
      value: totalEntradas,
      icon: TrendingUp,
      color: "bg-blue-700",
    },
    {
      label: "Saídas no período",
      value: totalSaidas,
      icon: TrendingDown,
      color: "bg-rose-700",
    },
    {
      label: "Valor gasto (entradas)",
      value: moeda(valorGasto),
      icon: DollarSign,
      color: "bg-amber-600",
    },
    {
      label: "Valor em estoque",
      value: moeda(valorEstoque),
      icon: Package,
      color: "bg-green-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-lg text-muted-foreground mt-1">
            Análise de consumo, gastos e movimentações.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModoPlanilha(!modoPlanilha)}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-accent"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {modoPlanilha ? "Ver gráficos" : "Modo planilha"}
          </button>

          <button
            type="button"
            onClick={exportarExcel}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
          {erro}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Filtrar por período</h2>
        <div className="grid max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dataIni">Data inicial</Label>
            <Input
              id="dataIni"
              type="date"
              max={dataFim || undefined}
              value={dataIni}
              onChange={(e) => setDataIni(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataFim">Data final</Label>
            <Input
              id="dataFim"
              type="date"
              min={dataIni || undefined}
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Os indicadores e resultados são atualizados automaticamente ao alterar
          as datas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
            >
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {modoPlanilha ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 text-xl font-bold">Planilha de movimentações</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {linhasRelatorio.length} linha(s) encontrada(s) no período.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-accent">
                <tr>
                  {[
                    "Data",
                    "Tipo",
                    "Usuário",
                    "Finalidade",
                    "Produto",
                    "Categoria",
                    "Quantidade",
                    "Preço unitário",
                    "Total",
                    "Status",
                  ].map((coluna) => (
                    <th key={coluna} className="whitespace-nowrap px-3 py-3">
                      {coluna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhasRelatorio.map((linha, indice) => (
                  <tr
                    key={`${linha.data}-${indice}`}
                    className="hover:bg-accent/50"
                  >
                    <td className="whitespace-nowrap px-3 py-3">
                      {linha.data}
                    </td>
                    <td className="px-3 py-3">{linha.tipo}</td>
                    <td className="px-3 py-3">{linha.usuario}</td>
                    <td className="px-3 py-3">{linha.finalidade}</td>
                    <td className="px-3 py-3">{linha.produto}</td>
                    <td className="px-3 py-3">{linha.categoria}</td>
                    <td className="px-3 py-3">{linha.quantidade}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {moeda(linha.precoUnitario)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {moeda(linha.total)}
                    </td>
                    <td className="px-3 py-3">{linha.status}</td>
                  </tr>
                ))}
                {linhasRelatorio.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      Nenhuma movimentação encontrada para esse período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">
              Consumo por categoria (saídas)
            </h2>
            {consumoPorCategoria.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={consumoPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="quantidade"
                    fill="#15803d"
                    name="Quantidade consumida"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma saída encontrada nesse período.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">
              Gasto por categoria (entradas)
            </h2>
            {gastoPorCategoria.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gastoPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(valor) => moeda(valor)} />
                  <Bar dataKey="valor" fill="#b45309" name="Valor gasto (R$)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">
                Nenhuma entrada com valores encontrada nesse período.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Comparação de preços</h2>
            {comparacaoPrecos.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum produto com histórico suficiente de compras para
                comparar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent text-left text-sm">
                    <tr>
                      <th className="px-4 py-3">Produto</th>
                      <th className="px-4 py-3">Preço anterior</th>
                      <th className="px-4 py-3">Último preço</th>
                      <th className="px-4 py-3">Variação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {comparacaoPrecos.map((p, indice) => (
                      <tr key={`${p.nome}-${indice}`}>
                        <td className="px-4 py-3">{p.nome}</td>
                        <td className="px-4 py-3">{moeda(p.anterior)}</td>
                        <td className="px-4 py-3">{moeda(p.ultimo)}</td>
                        <td className="px-4 py-3">
                          {p.variacao > 0 ? "▲" : p.variacao < 0 ? "▼" : "—"}{" "}
                          {Math.abs(p.variacao)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
