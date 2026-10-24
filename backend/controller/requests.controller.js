import { randomUUID } from "crypto";
import { pool } from "../database/db.js";

export async function createRequest(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { tipo, produtos_lista, finalidade, data_solicitacao } =
      req.body || {};

    if (!["Entrada", "Saida"].includes(tipo)) {
      return res.status(400).json({
        message: "Tipo de solicitação inválido.",
      });
    }

    if (!Array.isArray(produtos_lista) || produtos_lista.length === 0) {
      return res.status(400).json({
        message: "Adicione pelo menos um produto à solicitação.",
      });
    }

    if (!finalidade || !finalidade.trim()) {
      return res.status(400).json({
        message: "Informe a finalidade da solicitação.",
      });
    }

    const requestId = randomUUID().replaceAll("-", "").slice(0, 24);
    const usuarioId = req.user.id;
    const usuarioNome = req.user.full_name || req.user.email || "Usuário";

    const data = data_solicitacao || new Date().toISOString().slice(0, 10);

    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO requests
        (id, tipo, usuario_id, usuario_nome, finalidade, status, data_solicitacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        tipo,
        usuarioId,
        usuarioNome,
        finalidade.trim(),
        "Pendente",
        data,
      ],
    );

    for (const item of produtos_lista) {
      const produtoId = item.produto_id;
      const quantidade = Number(item.quantidade);

      if (!produtoId || !Number.isFinite(quantidade) || quantidade <= 0) {
        throw new Error("Verifique os produtos e suas quantidades.");
      }

      const [products] = await connection.execute(
        "SELECT id, nome FROM products WHERE id = ? LIMIT 1",
        [produtoId],
      );

      if (products.length === 0) {
        throw new Error("Um dos produtos selecionados não existe.");
      }

      await connection.execute(
        `INSERT INTO request_products
          (id, request_id, produto_id, produto_nome, quantidade)
         VALUES (?, ?, ?, ?, ?)`,
        [
          randomUUID().replaceAll("-", "").slice(0, 24),
          requestId,
          products[0].id,
          products[0].nome,
          quantidade,
        ],
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: "Solicitação criada com sucesso.",
      id: requestId,
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function listRequests(req, res, next) {
  try {
    const [requests] = await pool.execute(
      `SELECT r.* FROM requests r
       ORDER BY r.data_solicitacao DESC`,
    );

    for (const request of requests) {
      const [products] = await pool.execute(
        `SELECT produto_id, produto_nome, quantidade
         FROM request_products
         WHERE request_id = ?`,
        [request.id],
      );

      request.produtos_lista = products;
    }

    res.json(requests);
  } catch (error) {
    next(error);
  }
}

export async function reviewRequest(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const { status, data_resposta, resposta_observacao } = req.body;

    if (!["Aprovado", "Recusado"].includes(status)) {
      return res.status(400).json({
        message: "Status de resposta inválido.",
      });
    }

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      "SELECT * FROM requests WHERE id = ? FOR UPDATE",
      [req.params.id],
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: "Solicitação não encontrada.",
      });
    }

    const request = rows[0];

    if (request.status !== "Pendente") {
      await connection.rollback();
      return res.status(409).json({
        message: "Esta solicitação já foi respondida.",
      });
    }

    if (status === "Aprovado") {
      const [items] = await connection.execute(
        `SELECT produto_id, produto_nome, quantidade
         FROM request_products
         WHERE request_id = ?`,
        [request.id],
      );

      if (items.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          message: "A solicitação não possui produtos.",
        });
      }

      for (const item of items) {
        const [products] = await connection.execute(
          "SELECT id, nome, quantidade, preco FROM products WHERE id = ? FOR UPDATE",
          [item.produto_id],
        );

        if (products.length === 0) {
          throw new Error(`Produto não encontrado: ${item.produto_nome}`);
        }

        const product = products[0];
        const quantity = Number(item.quantidade);
        const currentStock = Number(product.quantidade);

        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error(`Quantidade inválida para ${product.nome}.`);
        }

        if (request.tipo === "Saida" && currentStock < quantity) {
          throw new Error(`Estoque insuficiente para ${product.nome}.`);
        }
      }

      const movementId = randomUUID().replaceAll("-", "").slice(0, 24);

      await connection.execute(
        `INSERT INTO movements
         (id, usuario_id, usuario_nome, finalidade, data, tipo, status_aprovado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          movementId,
          request.usuario_id,
          request.usuario_nome,
          request.finalidade,
          data_resposta,
          request.tipo,
          "Aprovado",
        ],
      );

      for (const item of items) {
        const [products] = await connection.execute(
          "SELECT quantidade, preco FROM products WHERE id = ? FOR UPDATE",
          [item.produto_id],
        );

        const product = products[0];
        const quantity = Number(item.quantidade);
        const currentStock = Number(product.quantidade);
        const delta = request.tipo === "Entrada" ? quantity : -quantity;
        const newQuantity = currentStock + delta;

        await connection.execute(
          `UPDATE products
           SET quantidade = ?, preco_total = ? WHERE id = ?`,
          [newQuantity, Number(product.preco) * newQuantity, item.produto_id],
        );

        await connection.execute(
          `INSERT INTO movement_products
           (id, movement_id, produto_id, produto_nome, quantidade, preco_unitario)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            randomUUID().replaceAll("-", "").slice(0, 24),
            movementId,
            item.produto_id,
            item.produto_nome || "",
            quantity,
            Number(product.preco),
          ],
        );
      }
    }

    await connection.execute(
      `UPDATE requests
       SET status = ?, data_resposta = ?, resposta_observacao = ?
       WHERE id = ?`,
      [status, data_resposta, resposta_observacao || null, request.id],
    );

    await connection.commit();

    res.json({
      message:
        status === "Aprovado"
          ? "Solicitação aprovada e estoque atualizado."
          : "Solicitação recusada.",
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}
