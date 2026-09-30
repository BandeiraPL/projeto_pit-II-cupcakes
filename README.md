# CupcakeShop - PIT II

Projeto desenvolvido para a atividade PIT II do curso de Engenharia de Software.

## Descrição

O CupcakeShop é uma aplicação web simples para venda de cupcakes. O cliente acessa o catálogo, adiciona produtos ao carrinho, preenche os dados de cadastro e finaliza o pedido.

## Tecnologias Utilizadas

- HTML
- CSS
- JavaScript
- Python
- MySQL
- Nginx
- Pytest

## Documentação

Os documentos principais estão na pasta `docs`:

- `docs/UML_CupcakeShop.pdf`: documentação UML do sistema, com casos de uso, classes, sequência, atividades, banco de dados e relação com o backend.
- `docs/revisaoPIT-1.pdf`: revisão e atualização da documentação do PIT I para o PIT II.

## Como Rodar o Backend

Acesse a pasta do backend:

```bash
cd backend
```

Crie o ambiente virtual:

```bash
python -m venv .venv
```

Ative o ambiente virtual no Windows:

```bash
.venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Copie o arquivo de exemplo de variáveis de ambiente:

```bash
copy .env.example .env
```

Configure os dados do banco no arquivo `.env` e inicie a API:

```bash
python src/server.py
```

## Testes

Para executar os testes automatizados com Pytest:

```bash
python -m pytest -v
```

## Estrutura de Pastas

```text
backend/       Código do backend em Python organizado em MVC
docs/          Documentação do projeto
frontend/      Interface do usuário em HTML, CSS e JavaScript
```

## Link da aplicação
https://cupcakesshop-pit-ii.bandcode.tech
