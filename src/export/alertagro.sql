-- ============================================================
-- AlertAgro - Esquema do Banco de Dados (SQL)
-- Plataforma de Controle de Estoque de Insumos Agrícolas
-- Data: 28/09/2026
-- ============================================================

-- Tabela de Usuários (sistema de hierarquia: comum, supervisor, supervisor_geral)
CREATE TABLE users (
    id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id   VARCHAR(36),
    full_name       VARCHAR(255),
    email           VARCHAR(255) UNIQUE NOT NULL,
    role            ENUM('comum', 'supervisor', 'supervisor_geral') DEFAULT 'comum' NOT NULL,
    telefone        VARCHAR(30)
);

-- Tabela de Produtos (Insumos Agrícolas)
CREATE TABLE products (
    id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id         VARCHAR(36),
    nome                  VARCHAR(255) NOT NULL,                    -- Nome do Produto
    categoria             VARCHAR(100) NOT NULL,                    -- Fertilizante, Herbicida, Inseticida, Fungicida, Acaricida, Outros
    categoria_tipo        ENUM('NPK', 'NFP') NOT NULL,             -- Tipo de Categoria
    quantidade            DECIMAL(12,2) DEFAULT 0,                  -- Quantidade em Estoque
    nivel_toxicidade      ENUM('Baixo', 'Médio', 'Alto', 'Extremo') NOT NULL,  -- Nível de Toxicidade
    dasa_cor              ENUM('Verde', 'Amarelo', 'Laranja', 'Vermelho', 'Roxo', 'Branco', 'Preto', 'Azul') NOT NULL,  -- Classificação DASA
    nome_cientifico       VARCHAR(255),                             -- Nome Científico
    caracteristica        TEXT,                                      -- Características
    horario               TIME,                                      -- Horário de Aplicação
    embalagem_tipo        ENUM('kg', 'litro') NOT NULL,            -- Tipo de Embalagem
    embalagem_quantidade  DECIMAL(12,2) NOT NULL,                   -- Quantidade por Embalagem
    preco                 DECIMAL(12,2) NOT NULL,                   -- Preço Unitário (R$)
    preco_total           DECIMAL(14,2),                             -- Preço Total (R$) - calculado: preco * quantidade
    estoque_minimo        DECIMAL(12,2) DEFAULT 0                   -- Estoque Mínimo para Alerta
);

-- Tabela de Culturas (Culturas agrícolas e consumo por hectare)
CREATE TABLE cultures (
    id                  VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id        VARCHAR(36),
    nome                 VARCHAR(255) NOT NULL,                     -- Nome da Cultura
    area_hectares        DECIMAL(12,2) NOT NULL,                   -- Área em hectares
    produtos_quantidade  JSON  -- Array de: { produto_id, produto_nome, quantidade_por_hectare }
);

-- Tabela de Movimentações (Entradas e Saídas de estoque)
CREATE TABLE movements (
    id               VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id    VARCHAR(36),
    usuario_id       VARCHAR(36),                                    -- ID do Usuário
    usuario_nome     VARCHAR(255) NOT NULL,                         -- Nome do Usuário
    produtos_lista   JSON NOT NULL,  -- Array de: { produto_id, produto_nome, quantidade, preco_unitario }
    data             DATE NOT NULL,                                  -- Data da movimentação
    status_aprovado  ENUM('Pendente', 'Aprovado', 'Recusado') DEFAULT 'Aprovado',
    tipo             ENUM('Entrada', 'Saida') NOT NULL,              -- Tipo de Movimentação
    finalidade       TEXT                                            -- Finalidade da movimentação
);

-- Tabela de Solicitações (fluxo de aprovação)
CREATE TABLE requests (
    id                    VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    created_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id         VARCHAR(36),
    tipo                  ENUM('Entrada', 'Saida') NOT NULL,        -- Tipo de Solicitação
    usuario_id            VARCHAR(36),                               -- ID do Solicitante
    usuario_nome          VARCHAR(255) NOT NULL,                    -- Nome do Solicitante
    produtos_lista        JSON NOT NULL,  -- Array de: { produto_id, produto_nome, quantidade }
    finalidade            TEXT,                                       -- Finalidade
    status                ENUM('Pendente', 'Aprovado', 'Recusado') DEFAULT 'Pendente' NOT NULL,
    data_solicitacao      DATE NOT NULL,                             -- Data da Solicitação
    data_resposta         DATE,                                       -- Data da Resposta
    resposta_observacao   TEXT                                        -- Observação da Resposta
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX idx_products_categoria ON products(categoria);
CREATE INDEX idx_products_dasa_cor ON products(dasa_cor);
CREATE INDEX idx_movements_tipo ON movements(tipo);
CREATE INDEX idx_movements_data ON movements(data);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_usuario_id ON requests(usuario_id);
CREATE INDEX idx_cultures_nome ON cultures(nome);

-- ============================================================
-- Views Úteis
-- ============================================================

-- Produtos com estoque baixo ou zerado
CREATE VIEW v_produtos_alerta AS
SELECT nome, categoria, quantidade, estoque_minimo,
       CASE
           WHEN quantidade = 0 THEN 'ZERADO'
           WHEN quantidade <= estoque_minimo THEN 'BAIXO'
           ELSE 'OK'
       END AS status_estoque
FROM products
WHERE quantidade <= COALESCE(estoque_minimo, 0);

-- Valor total em estoque
CREATE VIEW v_valor_estoque AS
SELECT SUM(preco_total) AS valor_total_estoque,
       COUNT(*) AS total_produtos,
       SUM(CASE WHEN quantidade = 0 THEN 1 ELSE 0 END) AS produtos_zerados
FROM products;

-- Movimentações por tipo
CREATE VIEW v_movimentacoes_resumo AS
SELECT tipo,
       COUNT(*) AS total,
       SUM((SELECT SUM(item.quantidade) FROM JSON_TABLE(produtos_lista, '$[*]' COLUMNS(quantidade DECIMAL PATH '$.quantidade')) AS item)) AS quantidade_total
FROM movements
WHERE status_aprovado = 'Aprovado'
GROUP BY tipo;