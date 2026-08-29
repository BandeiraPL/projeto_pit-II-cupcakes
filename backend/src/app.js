const http = require("node:http");
const { URL } = require("node:url");
require("./config/env");
const { handleRoute } = require("./routes/router");
const { sendJson } = require("./utils/http");

function createServer() {
  return http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const response = await handleRoute(req, url);
      sendJson(res, response.status, response.data);
    } catch (error) {
      const status = error.status || 500;
      sendJson(res, status, {
        erro: status >= 500 ? "Erro interno do servidor" : error.message,
        detalhe: error.message,
      });
    }
  });
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = {
  createServer,
};
