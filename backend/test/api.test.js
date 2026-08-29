const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.DB_HOST = "";
process.env.DB_USER = "";
process.env.DB_NAME = "";

const { createServer } = require("../src/app");

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const data = body ? JSON.stringify(body) : null;
    const req = require("node:http").request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        method,
        path,
        headers: data
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(data),
            }
          : {},
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function withServer(callback) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  try {
    await callback(server);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("lista produtos e permite criar pedido", async () => {
  await withServer(async (server) => {
    const produtos = await request(server, "GET", "/api/produtos");
    assert.equal(produtos.status, 200);
    assert.ok(produtos.body.length >= 1);

    const carrinho = await request(server, "POST", "/api/carrinho/itens", {
      produtoId: 1,
      quantidade: 2,
    });
    assert.equal(carrinho.status, 201);
    assert.equal(carrinho.body.quantidadeTotal, 2);

    const pedido = await request(server, "POST", "/api/pedidos", {
      endereco: "Rua das Flores, 123",
      pagamento: "Pix",
    });
    assert.equal(pedido.status, 201);
    assert.equal(pedido.body.status, "Recebido");
  });
});
