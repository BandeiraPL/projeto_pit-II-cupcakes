const store = require("../data/store");
const { isDatabaseEnabled, query } = require("../database/connection");

async function findAll({ busca = "", categoria = "" } = {}) {
  if (isDatabaseEnabled()) {
    const params = {
      busca: `%${busca}%`,
      categoria,
    };
    let sql = `
      SELECT id, nome, categoria, preco, imagem, destaque, descricao, ativo, criado_em
      FROM produtos
      WHERE ativo = TRUE AND nome LIKE :busca
    `;

    if (categoria) sql += " AND categoria = :categoria";
    sql += " ORDER BY destaque DESC, nome ASC";

    return (await query(sql, params)).map(normalizeProduct);
  }

  const termo = busca.toLowerCase();

  return store.produtos.filter((produto) => {
    const bateBusca = produto.nome.toLowerCase().includes(termo);
    const bateCategoria = !categoria || produto.categoria === categoria;
    return bateBusca && bateCategoria;
  });
}

async function findById(id) {
  if (isDatabaseEnabled()) {
    const rows = await query(
      `
        SELECT id, nome, categoria, preco, imagem, destaque, descricao, ativo, criado_em
        FROM produtos
        WHERE id = :id AND ativo = TRUE
      `,
      { id: Number(id) }
    );
    return rows[0] ? normalizeProduct(rows[0]) : null;
  }

  return store.produtos.find((produto) => produto.id === Number(id));
}

function normalizeProduct(produto) {
  return {
    ...produto,
    preco: Number(produto.preco),
    destaque: Boolean(produto.destaque),
    ativo: Boolean(produto.ativo),
  };
}

module.exports = {
  findAll,
  findById,
};
