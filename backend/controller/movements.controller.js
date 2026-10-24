import { randomUUID } from "crypto";
import { pool } from "../database/db.js";

export async function listMovements(req, res, next) {
  try {
    const [movements] = await pool.execute(
      "SELECT * FROM movements ORDER BY data DESC",
    );

    for (const movement of movements) {
      const [products] = await pool.execute(
        `SELECT id, movement_id, produto_id, produto_nome,
                quantidade, preco_unitario
         FROM movement_products
         WHERE movement_id = ?`,
        [movement.id],
      );

      movement.produtos_lista = products.map((item) => ({
        produto_id: item.produto_id,
        produto_nome: item.produto_nome,
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario || 0),
      }));
    }

    res.json(movements);
  } catch (error) {
    next(error);
  }
}

export async function createMovement(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const {
      tipo,
      usuario_id,
      usuario_nome,
      data,
      finalidade,
      status_aprovado = "Aprovado",
      produtos_lista,
    } = req.body;

    if (!["Entrada", "Saida"].includes(tipo)) {
      return res.status(400).json({
        message: "Tipo de movimentação inválido.",
      });
    }

    if (
      !data ||
      !Array.isArray(produtos_lista) ||
      produtos_lista.length === 0
    ) {
      return res.status(400).json({
        message: "Informe a data e pelo menos um produto.",
      });
    }

    if (!["Pendente", "Aprovado", "Recusado"].includes(status_aprovado)) {
      return res.status(400).json({
        message: "Status de aprovação inválido.",
      });
    }

    await connection.beginTransaction();

    const movementId = randomUUID().replaceAll("-", "").slice(0, 24);

    await connection.execute(
      `INSERT INTO movements
       (id, tipo, usuario_id, usuario_nome, data, finalidade, status_aprovado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        movementId,
        tipo,
        usuario_id || req.user?.id || null,
        usuario_nome || req.user?.full_name || req.user?.email || "—",
        data,
        finalidade || null,
        status_aprovado,
      ],
    );

    for (const item of produtos_lista) {
      const productId = item.produto_id;
      const quantity = Number(item.quantidade);

      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        throw new Error("Produto ou quantidade inválida.");
      }

      const [productRows] = await connection.execute(
        "SELECT id, nome, quantidade, preco, preco_total FROM products WHERE id = ? FOR UPDATE",
        [productId],
      );

      if (!productRows.length) {
        throw new Error(`Produto não encontrado: ${productId}`);
      }

      const product = productRows[0];
      const unitPrice = Number(product.preco || 0);

      await connection.execute(
        `INSERT INTO movement_products
         (id, movement_id, produto_id, produto_nome, quantidade, preco_unitario)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          randomUUID().replaceAll("-", "").slice(0, 24),
          movementId,
          product.id,
          product.nome,
          quantity,
          unitPrice,
        ],
      );

      // Atualiza o estoque apenas para movimentações aprovadas.
      if (status_aprovado === "Aprovado") {
        const currentQuantity = Number(product.quantidade || 0);
        const delta = tipo === "Entrada" ? quantity : -quantity;
        const newQuantity = currentQuantity + delta;

        if (newQuantity < 0) {
          throw new Error(
            `Estoque insuficiente para "${product.nome}". Disponível: ${currentQuantity}.`,
          );
        }

        await connection.execute(
          "UPDATE products SET quantidade = ?, preco_total = ? WHERE id = ?",
          [newQuantity, unitPrice * newQuantity, product.id],
        );
      }
    }

    await connection.commit();

    const [rows] = await pool.execute(
      "SELECT * FROM movements WHERE id = ? LIMIT 1",
      [movementId],
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}
