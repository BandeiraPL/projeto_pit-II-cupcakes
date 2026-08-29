function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(httpError("JSON invalido", 400));
      }
    });
    req.on("error", reject);
  });
}

module.exports = {
  sendJson,
  httpError,
  parseBody,
};
