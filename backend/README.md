# CupcakeShop Backend

API em Node.js para o aplicativo CupcakeShop, organizada em MVC.

## Estrutura

```text
src/app.js                  Servidor HTTP e tratamento das requisicoes
src/routes/router.js        Definicao das rotas
src/controllers/            Controle das entradas e saidas da API
src/models/                 Regras de negocio e acesso aos dados
src/data/store.js           Dados locais para ambiente sem banco configurado
src/database/connection.js  Conexao com MySQL
```

## Como rodar

```bash
npm start
```

Servidor:

```text
http://localhost:3000
```

## Banco de dados

Para usar MySQL, copie `.env.example` para `.env` e ajuste:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=cupcakeshop
```

Com a conexao configurada, a API utiliza as tabelas do banco `cupcakeshop`.

## Rotas principais

```text
GET    /api/health
GET    /api/produtos
GET    /api/produtos/:id
GET    /api/usuario
PUT    /api/usuario
GET    /api/carrinho
POST   /api/carrinho/itens
PATCH  /api/carrinho/itens/:produtoId
DELETE /api/carrinho/itens/:produtoId
GET    /api/pedidos
POST   /api/pedidos
```
