const produtos = [
  {
    id: 1,
    nome: "Cupcake de Morango",
    categoria: "Frutas",
    preco: 8.5,
    imagem: "cupcake-morango.png",
    destaque: true,
    descricao:
      "Massa de baunilha, recheio cremoso de morango e cobertura suave com fruta fresca.",
  },
  {
    id: 2,
    nome: "Cupcake de Chocolate",
    categoria: "Chocolate",
    preco: 7.9,
    imagem: "cupcake-chocolate.png",
    destaque: true,
    descricao:
      "Massa de cacau, brigadeiro artesanal e confeitos coloridos.",
  },
  {
    id: 3,
    nome: "Cupcake Red Velvet",
    categoria: "Especiais",
    preco: 9.5,
    imagem: "cupcake-redvelvet.png",
    destaque: true,
    descricao:
      "Massa red velvet com recheio leve, cobertura cremosa e frutas vermelhas.",
  },
  {
    id: 4,
    nome: "Cupcake de Limao",
    categoria: "Frutas",
    preco: 7.5,
    imagem: "cupcake-limao.png",
    destaque: false,
    descricao: "Cupcake citrico com massa macia e creme de limao.",
  },
  {
    id: 5,
    nome: "Cupcake de Baunilha",
    categoria: "Classicos",
    preco: 6.9,
    imagem: "cupcake-morango.png",
    destaque: false,
    descricao: "Receita tradicional de baunilha com cobertura leve.",
  },
];

const usuario = {
  id: 1,
  nome: "Maria Silva",
  email: "maria.silva@email.com",
  telefone: "(11) 98765-4321",
  endereco: "Rua das Flores, 123 - Sao Paulo, SP",
};

const carrinho = [];

const pedidos = [
  {
    id: "ORD-001",
    usuarioId: 1,
    data: "27/03/2026",
    status: "Entregue",
    total: 24.9,
    itens: "3 cupcakes",
  },
];

module.exports = {
  produtos,
  usuario,
  carrinho,
  pedidos,
};
