/* ============================================================
   AlertAgro - Resumo do Código JavaScript
   Plataforma de Controle de Estoque de Insumos Agrícolas
   Data: 28/09/2026
   ============================================================
   Este arquivo é um RESUMO comentado de toda a lógica da
   aplicação React. O app real é modular (múltiplos arquivos).
   ============================================================ */

// ============================================================
// 1. SDK E INICIALIZAÇÃO (src/api/base44Client.js)
// ============================================================
import { base44 } from "@/api/base44Client";
// base44.entities.<Entity>.list / filter / create / update / delete
// base44.auth.me / loginViaEmailPassword / register / verifyOtp
// base44.auth.logout / isAuthenticated / updateMe

// ============================================================
// 2. ROTAS (src/App.jsx)
// ============================================================
const routes = [
  { path: "/login", component: "Login", publico: true },
  { path: "/register", component: "Register", publico: true },
  { path: "/forgot-password", component: "ForgotPassword", publico: true },
  { path: "/reset-password", component: "ResetPassword", publico: true },
  { path: "/", component: "Dashboard", protegido: true },
  { path: "/produtos", component: "Products", protegido: true },
  { path: "/culturas", component: "Cultures", protegido: true },
  { path: "/movimentacoes", component: "Movements", protegido: true },
  { path: "/solicitacoes", component: "Requests", protegido: true },
  { path: "/aprovacoes", component: "Aprovacoes", protegido: true },
  { path: "/alertas", component: "Alerts", protegido: true },
  { path: "/relatorios", component: "Reports", protegido: true },
  { path: "/planilha", component: "Spreadsheet", protegido: true },
  { path: "/usuarios", component: "UsersPage", protegido: true },
];

// ============================================================
// 3. HELPERS DE NEGÓCIO (src/lib/agroHelpers.js)
// ============================================================

// Mapeamento de cores DASA para classes Tailwind
const dasaColorMap = {
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
  Branco: { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-400" },
  Preto: { bg: "bg-gray-900", text: "text-white", dot: "bg-gray-700" },
  Azul: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-600" },
};

// Normaliza o papel do usuário (builder/legacy → supervisor_geral)
function normalizeRole(role) {
  if (["comum", "supervisor", "supervisor_geral"].includes(role)) return role;
  return "supervisor_geral";
}

// Verifica se o usuário pode editar (supervisor ou superior)
function canEdit(role) {
  const r = normalizeRole(role);
  return r === "supervisor" || r === "supervisor_geral";
}

// Verifica estoque zerado
function isZeroed(product) {
  return (product.quantidade || 0) === 0;
}

// Verifica estoque baixo (abaixo do mínimo, mas não zerado)
function isLowStock(product) {
  const qtd = product.quantidade || 0;
  const min = product.estoque_minimo || 0;
  return qtd > 0 && qtd <= min;
}

// Rótulos de papel para exibição
const roleLabels = {
  comum: "Comum",
  supervisor: "Supervisor",
  supervisor_geral: "Supervisor Geral",
};

// Mapeamento de toxicidade para cores
const toxicidadeColorMap = {
  Baixo: { bg: "bg-green-100", text: "text-green-800" },
  Médio: { bg: "bg-yellow-100", text: "text-yellow-800" },
  Alto: { bg: "bg-orange-100", text: "text-orange-800" },
  Extremo: { bg: "bg-red-100", text: "text-red-800" },
};

// ============================================================
// 4. PÁGINA: DASHBOARD (src/pages/Dashboard.jsx)
// ============================================================
function Dashboard() {
  // Carrega produtos, movimentações e culturas em paralelo
  // Calcula: total de produtos, alertas de estoque baixo,
  //           entradas, saídas, valor total em estoque
  // Renderiza: 6 cards de resumo + alerta de estoque baixo +
  //            lista de movimentações recentes (últimas 5)
  //
  // Cards:
  //   1. Produtos Cadastrados (total)
  //   2. Alertas de Estoque Baixo (count)
  //   3. Entradas Registradas (count)
  //   4. Saídas Registradas (count)
  //   5. Culturas (count)
  //   6. Valor em Estoque (R$)
}

// ============================================================
// 5. PÁGINA: PRODUTOS (src/pages/Products.jsx)
// ============================================================
function Products() {
  // Estado: products[], loading, search, filterCategoria,
  //         filterDasa, filterDisponibilidade, filterCaracteristica
  //
  // Permissões: canEdit(user.role) → mostra botões Novo/Importar
  //
  // Carrega: base44.entities.Product.list("-updated_date", 500)
  //
  // Categorias (lista fixa): Fertilizante, Herbicida, Inseticida,
  //                          Fungicida, Acaricida, Outros
  //
  // Filtros aplicados:
  //   - Busca por nome (case-insensitive)
  //   - Filtro por categoria (lista fixa)
  //   - Filtro por cor DASA
  //   - Filtro por disponibilidade (todos / baixo / zerado)
  //   - Busca por característica
  //
  // Tabela exibe:
  //   Nome, Categoria, Qtd., DASA (badge colorido),
  //   Toxicidade (badge), Embalagem, Preço Unit., Preço Total
  //
  // Linhas com estoque zerado → fundo vermelho (bg-red-50)
  // Linhas com estoque baixo  → fundo amarelo (bg-amber-50)
  //
  // Ações:
  //   - Novo Produto → abre ProductForm (modal)
  //   - Importar Planilha → abre ProductImport (modal)
  //   - Editar (ícone lápis) → abre ProductForm com dados
  //   - Excluir (ícone lixeira) → confirma e deleta
}

// ============================================================
// 6. COMPONENTE: ProductForm (src/components/products/ProductForm.jsx)
// ============================================================
function ProductForm({ product, onSave, onClose }) {
  // Campos do formulário:
  //   - nome * (text)
  //   - categoria * (select: Fertilizante, Herbicida, Inseticida,
  //                  Fungicida, Acaricida, Outros)
  //   - categoria_tipo * (select: NPK, NFP)
  //   - quantidade * (number, default 0)
  //   - estoque_minimo (number, default 0)
  //   - horario (time) — Horário de Aplicação
  //   - nivel_toxicidade * (select: Baixo, Médio, Alto, Extremo)
  //   - dasa_cor * (select: Verde, Amarelo, Laranja, Vermelho, Roxo,
  //                Branco, Preto, Azul)
  //   - nome_cientifico (text)
  //   - caracteristica (textarea)
  //   - embalagem_tipo * (select: kg, litro)
  //   - embalagem_quantidade * (number)
  //   - preco * (number, R$)
  //
  // Calcula automaticamente: preco_total = preco * quantidade
  // onSave: cria ou atualiza via base44.entities.Product
}

// ============================================================
// 7. COMPONENTE: ProductImport (src/components/products/ProductImport.jsx)
// ============================================================
function ProductImport({ onClose, onImported }) {
  // Fluxo:
  //   1. Usuário seleciona arquivo (CSV/XLSX)
  //   2. Upload via base44.integrations.Core.UploadPublicFile
  //   3. Extração via base44.integrations.Core.ExtractDataFromUploadedFile
  //   4. Normaliza dados (categoria_tipo default NPK, etc.)
  //   5. Bulk create via base44.entities.Product.bulkCreate
  //   6. Feedback de sucesso/erro
}

// ============================================================
// 8. PÁGINA: CULTURAS (src/pages/Cultures.jsx)
// ============================================================
function Cultures() {
  // Carrega: cultures[] e products[]
  // Permissões: canEdit(user.role) → mostra botão Nova Cultura
  //
  // Cada cultura exibe:
  //   - Nome
  //   - Área em hectares
  //   - Lista de produtos vinculados com quantidade por hectare
  //   - Consumo total estimado = Σ(quantidade_por_hectare × área)
  //
  // Ações: Nova Cultura, Editar, Excluir
}

// ============================================================
// 9. PÁGINA: MOVIMENTAÇÕES (src/pages/Movements.jsx)
// ============================================================
function Movements() {
  // Carrega: movements[] e products[]
  //
  // Filtros: tipo (Entrada/Saída), busca textual (produto/usuário/finalidade),
  //         data inicial, data final
  //
  // Formulário de nova movimentação:
  //   - tipo (Entrada/Saída)
  //   - data
  //   - finalidade
  //   - lista de produtos (produto_id + quantidade)
  //
  // Ao registrar:
  //   1. Cria registro em Movement
  //   2. Para cada produto na lista:
  //      - Entrada: quantidade += item.quantidade
  //      - Saída:   quantidade -= item.quantidade (mínimo 0)
  //   3. Atualiza preco_total do produto
}

// ============================================================
// 10. PÁGINA: SOLICITAÇÕES (src/pages/Requests.jsx)
// ============================================================
function Requests() {
  // Usuários supervisor+ podem criar solicitações de entrada/saída
  // Cada solicitação contém: tipo, finalidade, lista de produtos, status
  // Status: Pendente → Aprovado/Recusado (decidido na página Aprovações)
}

// ============================================================
// 11. PÁGINA: APROVAÇÕES (src/pages/Aprovacoes.jsx)
// ============================================================
function Aprovacoes() {
  // Visível apenas para supervisor_geral
  // Lista solicitações pendentes
  // Aprova ou recusa com observação
  // Ao aprovar: cria uma Movement correspondente e atualiza estoque
}

// ============================================================
// 12. PÁGINA: ALERTAS (src/pages/Alerts.jsx)
// ============================================================
function Alerts() {
  // Lista produtos com estoque baixo ou zerado
  // Exibe: nome, quantidade atual, estoque mínimo, diferença
  // Destaque visual para produtos zerados (vermelho)
}

// ============================================================
// 13. PÁGINA: RELATÓRIOS (src/pages/Reports.jsx)
// ============================================================
function Reports() {
  // Gera relatórios de custo histórico
  // Mostra: valor total em estoque, custo por categoria,
  //         movimentações por período, gráficos (recharts)
}

// ============================================================
// 14. PÁGINA: MODO PLANILHA (src/pages/Spreadsheet.jsx)
// ============================================================
function Spreadsheet() {
  // Visualização estilo Excel
  // Colunas: Nome, Categoria, Tipo, Qtd., Mínimo, DASA,
  //          Toxicidade, Embalagem, Preço Unit., Total
  // Edição inline de: quantidade, preco, estoque_minimo
  // Linhas zeradas → fundo vermelho
  // Linhas com estoque baixo → fundo amarelo
  //
  // Exportação para Excel (CSV):
  function exportToCSV() {
    // Gera arquivo CSV com separador ";" e formato brasileiro
    // Headers: Nome, Categoria, Tipo, Quantidade, Estoque Minimo, DASA,
    //          Toxicidade, Embalagem Tipo, Embalagem Qtd, Preco Unitario, Preco Total
    // Download: alertagro_estoque_YYYY-MM-DD.csv
    // BOM UTF-8 (\uFEFF) para acentuação correta no Excel
  }
}

// ============================================================
// 15. PÁGINA: USUÁRIOS (src/pages/Users.jsx)
// ============================================================
function UsersPage() {
  // Visível apenas para supervisor_geral
  // Lista todos os usuários do sistema
  // Permite: alterar hierarquia (comum/supervisor/supervisor_geral)
  //          convidar novos usuários (base44.users.inviteUser)
}

// ============================================================
// 16. AUTENTICAÇÃO (src/pages/Login.jsx, Register.jsx, etc.)
// ============================================================

// Login:
//   - Email + senha via base44.auth.loginViaEmailPassword
//   - Google OAuth via base44.auth.loginWithProvider("google")
//   - Botão "Entrar" ampliado (h-14, text-lg)
//   - Link para recuperação de senha
//   - Redireciona para returnTo ou "/"

// Register:
//   - Email + telefone + senha + confirmação
//   - Google OAuth
//   - Após registro: verifica OTP por email
//   - Após verificação: salva telefone no perfil via updateMe
//   - Hierarquia padrão: "comum" (admin promove depois)
//   - Sem seleção de hierarquia no formulário

// ForgotPassword:
//   - Email → base44.auth.resetPasswordRequest
//   - Sempre mostra sucesso genérico

// ResetPassword:
//   - Lê token da URL (?token=)
//   - Nova senha + confirmação → base44.auth.resetPassword

// ============================================================
// 17. LAYOUT E NAVEGAÇÃO (src/components/Layout.jsx)
// ============================================================
function Layout() {
  // Sidebar com navegação filtrada por papel:
  //   - Todos: Início, Produtos, Culturas, Movimentações,
  //            Alertas, Relatórios, Modo Planilha
  //   - Supervisor+: Solicitações
  //   - Supervisor Geral: Aprovações, Usuários
  //
  // Header mobile com botão hambúrguer
  // Exibe nome e papel do usuário logado
  // Botão Sair → base44.auth.logout
}

// ============================================================
// 18. PROTEÇÃO DE ROTAS (src/components/ProtectedRoute.jsx)
// ============================================================
function ProtectedRoute({ unauthenticatedElement }) {
  // Verifica base44.auth.isAuthenticated()
  // Se autenticado: renderiza <Outlet /> (rotas filhas)
  // Se não autenticado: redireciona para /login
  // Trata erros: user_not_registered, auth_required
}

// ============================================================
// 19. CONTEXTO DE AUTENTICAÇÃO (src/lib/AuthContext.jsx)
// ============================================================
function AuthProvider() {
  // Fornece: user, isLoadingAuth, isLoadingPublicSettings,
  //          authError, navigateToLogin
  // user = await base44.auth.me()
}

// ============================================================
// 20. MODELOS DE DADOS (Entidades)
// ============================================================
const Product = {
  nome: "string (obrigatório)",
  categoria:
    "string: Fertilizante|Herbicida|Inseticida|Fungicida|Acaricida|Outros",
  categoria_tipo: "enum: NPK|NFP",
  quantidade: "number (default 0)",
  nivel_toxicidade: "enum: Baixo|Médio|Alto|Extremo",
  dasa_cor: "enum: Verde|Amarelo|Laranja|Vermelho|Roxo|Branco|Preto|Azul",
  nome_cientifico: "string",
  caracteristica: "string",
  horario: "time (Horário de Aplicação)",
  embalagem_tipo: "enum: kg|litro",
  embalagem_quantidade: "number",
  preco: "number (R$)",
  preco_total: "number (calculado)",
  estoque_minimo: "number (default 0)",
};

const Culture = {
  nome: "string (obrigatório)",
  area_hectares: "number (obrigatório)",
  produtos_quantidade:
    "array[{ produto_id, produto_nome, quantidade_por_hectare }]",
};

const Movement = {
  usuario_id: "string",
  usuario_nome: "string (obrigatório)",
  produtos_lista:
    "array[{ produto_id, produto_nome, quantidade, preco_unitario }]",
  data: "date (obrigatório)",
  status_aprovado: "enum: Pendente|Aprovado|Recusado (default Aprovado)",
  tipo: "enum: Entrada|Saida",
  finalidade: "string",
};

const Request = {
  tipo: "enum: Entrada|Saida",
  usuario_id: "string",
  usuario_nome: "string (obrigatório)",
  produtos_lista: "array[{ produto_id, produto_nome, quantidade }]",
  finalidade: "string",
  status: "enum: Pendente|Aprovado|Recusado (default Pendente)",
  data_solicitacao: "date (obrigatório)",
  data_resposta: "date",
  resposta_observacao: "string",
};

const User = {
  full_name: "string (sistema)",
  email: "string (sistema)",
  role: "enum: comum|supervisor|supervisor_geral (default comum)",
  telefone: "string",
};
