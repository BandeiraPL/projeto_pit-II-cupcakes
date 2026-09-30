# CupcakeShop Backend

API em Python para o aplicativo CupcakeShop, organizada em MVC.

## Estrutura

```text
src/app.py                    Servidor HTTP e tratamento das requisicoes
src/server.py                 Inicializacao da API
src/routes/router.py          Definicao das rotas
src/controllers/              Controle das entradas e saidas da API
src/models/                   Regras de negocio e acesso aos dados
src/data/store.py             Dados locais para ambiente sem banco configurado
src/database/connection.py    Conexao com MySQL
```

## Como rodar

Crie o ambiente virtual:

```bash
python -m venv .venv
```

Ative o ambiente virtual no Windows:

```bash
.venv\Scripts\activate
```

Ative o ambiente virtual no Linux:

```bash
source .venv/bin/activate
```

Instale as dependencias:

```bash
pip install -r requirements.txt
```

Inicie a API:

```bash
python src/server.py
```

Servidor:

```text
http://localhost:3000
```

## Banco de dados

Para usar MySQL, copie `.env.example` para `.env` e ajuste:

```text
DB_HOST=127.0.0.1
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
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

## Testes

```bash
python -m pytest -v
```
