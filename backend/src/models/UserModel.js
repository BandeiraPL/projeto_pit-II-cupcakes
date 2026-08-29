const store = require("../data/store");
const { httpError } = require("../utils/http");
const { isDatabaseEnabled, query } = require("../database/connection");

async function findCurrent() {
  if (isDatabaseEnabled()) {
    const rows = await query(
      "SELECT id, nome, email, telefone, endereco, criado_em FROM usuarios WHERE id = :id",
      { id: 1 }
    );
    if (!rows[0]) throw httpError("Usuario padrao nao encontrado", 404);
    return rows[0];
  }

  return store.usuario;
}

async function update(data) {
  const campos = ["nome", "email", "telefone", "endereco"];
  for (const campo of campos) {
    if (!data[campo] || !String(data[campo]).trim()) {
      throw httpError(`Campo obrigatorio: ${campo}`, 400);
    }
  }

  const usuario = {
    nome: String(data.nome).trim(),
    email: String(data.email).trim(),
    telefone: String(data.telefone).trim(),
    endereco: String(data.endereco).trim(),
  };

  if (isDatabaseEnabled()) {
    await query(
      `
        UPDATE usuarios
        SET nome = :nome, email = :email, telefone = :telefone, endereco = :endereco
        WHERE id = 1
      `,
      usuario
    );
    return findCurrent();
  }

  Object.assign(store.usuario, usuario);

  return store.usuario;
}

module.exports = {
  findCurrent,
  update,
};
