const { createServer } = require("./app");
const { connectDatabase } = require("./database/connection");

const PORT = Number(process.env.PORT || 3000);

async function start() {
  const database = await connectDatabase();
  console.log(database.message);

  const server = createServer();
  server.listen(PORT, () => {
    console.log(`CupcakeShop API rodando em http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Nao foi possivel iniciar o servidor:", error);
  process.exit(1);
});
