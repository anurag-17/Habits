const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Please provide user email."],
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      default: "Admin",
    },
    activeToken: {
      type: String,
    },
    resetToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
