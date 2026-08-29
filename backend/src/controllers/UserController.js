const UserModel = require("../models/UserModel");

async function show() {
  return UserModel.findCurrent();
}

async function update({ body }) {
  return UserModel.update(body);
}

module.exports = {
  show,
  update,
};
