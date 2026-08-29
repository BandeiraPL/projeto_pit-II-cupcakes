const CartModel = require("../models/CartModel");

async function show() {
  return CartModel.getSummary();
}

async function addItem({ body }) {
  return CartModel.addItem(body.produtoId, body.quantidade || 1);
}

async function updateItem({ params, body }) {
  return CartModel.updateItem(params.produtoId, body);
}

async function removeItem({ params }) {
  return CartModel.removeItem(params.produtoId);
}

module.exports = {
  show,
  addItem,
  updateItem,
  removeItem,
};
