const store = require("../data/store");
const ProductModel = require("./ProductModel");
const { httpError } = require("../utils/http");
const { isDatabaseEnabled, query } = require("../database/connection");

async function addItem(produtoId, quantidade = 1) {
  const productId = Number(produtoId);
  const amount = Number(quantidade);
  const produto = await ProductModel.findById(productId);

  if (!produto) throw httpError("Produto nao encontrado", 404);
  if (!Number.isInteger(amount) || amount < 1) {
    throw httpError("Quantidade invalida", 400);
  }

  if (isDatabaseEnabled()) {
    const carrinho = await getOpenCart();
    const rows = await query(
      "SELECT id, quantidade FROM carrinho_itens WHERE carrinho_id = :carrinhoId AND produto_id = :produtoId",
      { carrinhoId: carrinho.id, produtoId: productId }
    );

    if (rows[0]) {
      await query(
        "UPDATE carrinho_itens SET quantidade = quantidade + :quantidade WHERE id = :id",
        { quantidade: amount, id: rows[0].id }
      );
    } else {
      await query(
        `
          INSERT INTO carrinho_itens (carrinho_id, produto_id, quantidade, preco_unitario)
          VALUES (:carrinhoId, :produtoId, :quantidade, :precoUnitario)
        `,
        {
          carrinhoId: carrinho.id,
          produtoId: productId,
          quantidade: amount,
          precoUnitario: produto.preco,
        }
      );
    }

    return getSummary();
  }

  const item = store.carrinho.find((entry) => entry.produtoId === productId);
  if (item) item.quantidade += amount;
  else store.carrinho.push({ produtoId: productId, quantidade: amount });

  return getSummary();
}

async function updateItem(produtoId, data) {
  const productId = Number(produtoId);
  if (isDatabaseEnabled()) {
    const carrinho = await getOpenCart();
    const rows = await query(
      "SELECT id, quantidade FROM carrinho_itens WHERE carrinho_id = :carrinhoId AND produto_id = :produtoId",
      { carrinhoId: carrinho.id, produtoId: productId }
    );
    const item = rows[0];
    if (!item) throw httpError("Item nao encontrado no carrinho", 404);

    const nextQuantity =
      data.quantidade !== undefined
        ? Number(data.quantidade)
        : item.quantidade + Number(data.delta || 0);

    if (!Number.isInteger(nextQuantity)) {
      throw httpError("Quantidade invalida", 400);
    }

    if (nextQuantity <= 0) {
      await query("DELETE FROM carrinho_itens WHERE id = :id", { id: item.id });
    } else {
      await query("UPDATE carrinho_itens SET quantidade = :quantidade WHERE id = :id", {
        quantidade: nextQuantity,
        id: item.id,
      });
    }

    return getSummary();
  }

  const item = store.carrinho.find((entry) => entry.produtoId === productId);

  if (!item) throw httpError("Item nao encontrado no carrinho", 404);

  const nextQuantity =
    data.quantidade !== undefined
      ? Number(data.quantidade)
      : item.quantidade + Number(data.delta || 0);

  if (!Number.isInteger(nextQuantity)) {
    throw httpError("Quantidade invalida", 400);
  }

  item.quantidade = nextQuantity;
  if (item.quantidade <= 0) removeItem(productId);

  return getSummary();
}

async function removeItem(produtoId) {
  const productId = Number(produtoId);
  if (isDatabaseEnabled()) {
    const carrinho = await getOpenCart();
    await query(
      "DELETE FROM carrinho_itens WHERE carrinho_id = :carrinhoId AND produto_id = :produtoId",
      { carrinhoId: carrinho.id, produtoId: productId }
    );
    return getSummary();
  }

  const index = store.carrinho.findIndex((entry) => entry.produtoId === productId);
  if (index >= 0) store.carrinho.splice(index, 1);
  return getSummary();
}

async function clear() {
  if (isDatabaseEnabled()) {
    const carrinho = await getOpenCart();
    await query("DELETE FROM carrinho_itens WHERE carrinho_id = :carrinhoId", {
      carrinhoId: carrinho.id,
    });
    return;
  }

  store.carrinho.splice(0, store.carrinho.length);
}

async function getSummary() {
  if (isDatabaseEnabled()) {
    const carrinho = await getOpenCart();
    const rows = await query(
      `
        SELECT
          ci.quantidade,
          ci.preco_unitario,
          p.id,
          p.nome,
          p.categoria,
          p.preco,
          p.imagem,
          p.destaque,
          p.descricao,
          p.ativo
        FROM carrinho_itens ci
        INNER JOIN produtos p ON p.id = ci.produto_id
        WHERE ci.carrinho_id = :carrinhoId
        ORDER BY ci.id ASC
      `,
      { carrinhoId: carrinho.id }
    );

    const itens = rows.map((row) => ({
      produto: {
        id: row.id,
        nome: row.nome,
        categoria: row.categoria,
        preco: Number(row.preco),
        imagem: row.imagem,
        destaque: Boolean(row.destaque),
        descricao: row.descricao,
        ativo: Boolean(row.ativo),
      },
      quantidade: row.quantidade,
      total: round(Number(row.preco_unitario) * row.quantidade),
    }));

    return buildSummary(itens);
  }

  const itens = await Promise.all(store.carrinho.map(async (item) => {
    const produto = await ProductModel.findById(item.produtoId);
    return {
      produto,
      quantidade: item.quantidade,
      total: round(produto.preco * item.quantidade),
    };
  }));

  return buildSummary(itens);
}

function buildSummary(itens) {
  const quantidadeTotal = itens.reduce((total, item) => total + item.quantidade, 0);
  const subtotal = round(itens.reduce((total, item) => total + item.total, 0));
  const desconto = quantidadeTotal >= 6 ? round(subtotal * 0.1) : 0;

  return {
    itens,
    quantidadeTotal,
    subtotal,
    desconto,
    entrega: 0,
    total: round(subtotal - desconto),
  };
}

async function getOpenCart() {
  const rows = await query(
    "SELECT id FROM carrinhos WHERE usuario_id = 1 AND status = 'aberto' ORDER BY id DESC LIMIT 1"
  );
  if (rows[0]) return rows[0];

  const result = await query("INSERT INTO carrinhos (usuario_id, status) VALUES (1, 'aberto')");
  return { id: result.insertId };
}

function round(value) {
  return Number(value.toFixed(2));
}

module.exports = {
  addItem,
  updateItem,
  removeItem,
  clear,
  getSummary,
};
