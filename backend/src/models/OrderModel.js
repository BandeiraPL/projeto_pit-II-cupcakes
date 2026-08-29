const store = require("../data/store");
const CartModel = require("./CartModel");
const { httpError } = require("../utils/http");
const { isDatabaseEnabled, query } = require("../database/connection");

async function findAll() {
  if (isDatabaseEnabled()) {
    const pedidos = await query(
      `
        SELECT
          id,
          usuario_id AS usuarioId,
          DATE_FORMAT(criado_em, '%d/%m/%Y') AS data,
          status,
          endereco_entrega AS endereco,
          forma_pagamento AS pagamento,
          subtotal,
          desconto,
          taxa_entrega AS taxaEntrega,
          total
        FROM pedidos
        WHERE usuario_id = 1
        ORDER BY id DESC
      `
    );

    for (const pedido of pedidos) {
      pedido.id = `ORD-${String(pedido.id).padStart(3, "0")}`;
      pedido.total = Number(pedido.total);
      pedido.subtotal = Number(pedido.subtotal);
      pedido.desconto = Number(pedido.desconto);
      pedido.taxaEntrega = Number(pedido.taxaEntrega);
      pedido.itens = await findItemsByOrderId(Number(pedido.id.replace("ORD-", "")));
    }

    return pedidos;
  }

  return store.pedidos;
}

async function create(data) {
  if (!data.endereco || !String(data.endereco).trim()) {
    throw httpError("Endereco de entrega obrigatorio", 400);
  }

  const carrinho = await CartModel.getSummary();
  if (!carrinho.itens.length) throw httpError("Carrinho vazio", 400);

  if (isDatabaseEnabled()) {
    const result = await query(
      `
        INSERT INTO pedidos
          (usuario_id, endereco_entrega, forma_pagamento, status, subtotal, desconto, taxa_entrega, total)
        VALUES
          (1, :endereco, :pagamento, 'recebido', :subtotal, :desconto, :taxaEntrega, :total)
      `,
      {
        endereco: String(data.endereco).trim(),
        pagamento: data.pagamento || "Pix",
        subtotal: carrinho.subtotal,
        desconto: carrinho.desconto,
        taxaEntrega: carrinho.entrega,
        total: carrinho.total,
      }
    );

    const pedidoId = result.insertId;
    for (const item of carrinho.itens) {
      await query(
        `
          INSERT INTO pedido_itens
            (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, total)
          VALUES
            (:pedidoId, :produtoId, :nomeProduto, :quantidade, :precoUnitario, :total)
        `,
        {
          pedidoId,
          produtoId: item.produto.id,
          nomeProduto: item.produto.nome,
          quantidade: item.quantidade,
          precoUnitario: item.produto.preco,
          total: item.total,
        }
      );
    }

    await CartModel.clear();

    return {
      id: `ORD-${String(pedidoId).padStart(3, "0")}`,
      usuarioId: 1,
      data: new Date().toLocaleDateString("pt-BR"),
      status: "Recebido",
      endereco: String(data.endereco).trim(),
      pagamento: data.pagamento || "Pix",
      itens: carrinho.itens.map((item) => ({
        produtoId: item.produto.id,
        nome: item.produto.nome,
        quantidade: item.quantidade,
        total: item.total,
      })),
      total: carrinho.total,
    };
  }

  const pedido = {
    id: `ORD-${String(store.pedidos.length + 1).padStart(3, "0")}`,
    usuarioId: store.usuario.id,
    data: new Date().toLocaleDateString("pt-BR"),
    status: "Recebido",
    endereco: String(data.endereco).trim(),
    pagamento: data.pagamento || "Pix",
    itens: carrinho.itens.map((item) => ({
      produtoId: item.produto.id,
      nome: item.produto.nome,
      quantidade: item.quantidade,
      total: item.total,
    })),
    total: carrinho.total,
  };

  store.pedidos.unshift(pedido);
  CartModel.clear();

  return pedido;
}

async function findItemsByOrderId(pedidoId) {
  const rows = await query(
    `
      SELECT
        produto_id AS produtoId,
        nome_produto AS nome,
        quantidade,
        preco_unitario AS precoUnitario,
        total
      FROM pedido_itens
      WHERE pedido_id = :pedidoId
      ORDER BY id ASC
    `,
    { pedidoId }
  );

  return rows.map((item) => ({
    ...item,
    precoUnitario: Number(item.precoUnitario),
    total: Number(item.total),
  }));
}

module.exports = {
  findAll,
  create,
};
