const ProductModel = require("../models/ProductModel");
const { httpError } = require("../utils/http");

async function index({ url }) {
  return ProductModel.findAll({
    busca: url.searchParams.get("busca") || "",
    categoria: url.searchParams.get("categoria") || "",
  });
}

async function show({ params }) {
  const produto = await ProductModel.findById(params.id);
  if (!produto) throw httpError("Produto nao encontrado", 404);
  return produto;
}

module.exports = {
  index,
  show,
};
