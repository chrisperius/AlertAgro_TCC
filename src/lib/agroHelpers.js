export const dasaColorMap = {
  Verde: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-600" },
  Amarelo: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    dot: "bg-yellow-500",
  },
  Laranja: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    dot: "bg-orange-500",
  },
  Vermelho: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600" },
  Roxo: { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-600" },
  Branco: {
    bg: "bg-gray-100 border border-gray-300",
    text: "text-gray-800",
    dot: "bg-gray-400",
  },
  Preto: { bg: "bg-gray-900", text: "text-white", dot: "bg-gray-700" },
  Azul: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-600" },
};

export function normalizeRole(role) {
  if (["comum", "supervisor", "supervisor_geral"].includes(role)) return role;
  return "supervisor_geral";
}

export function canEdit(role) {
  const r = normalizeRole(role);
  return r === "supervisor" || r === "supervisor_geral";
}

export const toxicidadeColorMap = {
  Baixo: "bg-green-100 text-green-800",
  Médio: "bg-yellow-100 text-yellow-800",
  Alto: "bg-orange-100 text-orange-800",
  Extremo: "bg-red-100 text-red-800",
};

export function isLowStock(p) {
  return (
    (p.estoque_minimo || 0) > 0 &&
    (p.quantidade || 0) <= (p.estoque_minimo || 0)
  );
}

export function isZeroed(p) {
  return (p.quantidade || 0) <= 0;
}
