const { isDatabaseEnabled } = require("../database/connection");
const ProductController = require("../controllers/ProductController");
const UserController = require("../controllers/UserController");
const CartController = require("../controllers/CartController");
const OrderController = require("../controllers/OrderController");
const { httpError, parseBody } = require("../utils/http");

const routes = [
  route("GET", /^\/$/, () => ({
    nome: "CupcakeShop API",
    versao: "1.0.0",
    arquitetura: "MVC",
    rotas: ["/api/health", "/api/produtos", "/api/carrinho", "/api/pedidos"],
  })),
  route("GET", /^\/api\/health$/, () => ({
    status: "ok",
    bancoDeDados: isDatabaseEnabled() ? "configurado" : "pendente",
  })),
  route("GET", /^\/api\/produtos$/, ProductController.index),
  route("GET", /^\/api\/produtos\/(?<id>\d+)$/, ProductController.show),
  route("GET", /^\/api\/usuario$/, UserController.show),
  route("PUT", /^\/api\/usuario$/, UserController.update, true),
  route("GET", /^\/api\/carrinho$/, CartController.show),
  route("POST", /^\/api\/carrinho\/itens$/, CartController.addItem, true, 201),
  route("PATCH", /^\/api\/carrinho\/itens\/(?<produtoId>\d+)$/, CartController.updateItem, true),
  route("DELETE", /^\/api\/carrinho\/itens\/(?<produtoId>\d+)$/, CartController.removeItem),
  route("GET", /^\/api\/pedidos$/, OrderController.index),
  route("POST", /^\/api\/pedidos$/, OrderController.create, true, 201),
];

async function handleRoute(req, url) {
  for (const item of routes) {
    const match = url.pathname.match(item.pattern);
    if (item.method === req.method && match) {
      const body = item.readBody ? await parseBody(req) : {};
      return {
        status: item.status,
        data: await item.handler({
          req,
          url,
          body,
          params: match.groups || {},
        }),
      };
    }
  }

  throw httpError("Rota nao encontrada", 404);
}

function route(method, pattern, handler, readBody = false, status = 200) {
  return {
    method,
    pattern,
    handler,
    readBody,
    status,
  };
}

module.exports = {
  handleRoute,
};
