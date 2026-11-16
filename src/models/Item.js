const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  location: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["Lost", "Found"], required: true },
  image: { type: String, default: "" },
  status: { type: String, enum: ["Active", "Claimed", "Recovered", "Closed"], default: "Active" },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);
