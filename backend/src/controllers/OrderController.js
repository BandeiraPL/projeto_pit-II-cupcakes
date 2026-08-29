const OrderModel = require("../models/OrderModel");

async function index() {
  return OrderModel.findAll();
}

async function create({ body }) {
  return OrderModel.create(body);
}

module.exports = {
  index,
  create,
};
