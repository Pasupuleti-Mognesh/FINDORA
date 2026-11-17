const mongoose = require("mongoose");
const Item = require("../models/Item");

exports.createItem = async (req, res, next) => {
  try {
    const { title, category, description, location, date, type } = req.body;

    if (!title || !category || !description || !location || !date || !type) {
      return res.status(400).json({ success: false, message: "Please complete all required fields" });
    }

    if (!["Lost", "Found"].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be Lost or Found" });
    }

    const item = await Item.create({
      title, category, description, location, date, type,
      image: req.cloudinaryImage ? req.cloudinaryImage.secure_url : "",
      reportedBy: req.user._id
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

exports.getItems = async (req, res, next) => {
  try {
    const { search, category, location, type, status } = req.query;
    const filter = {};

    if (category) filter.category = new RegExp(category, "i");
    if (location) filter.location = new RegExp(location, "i");
    if (type && ["Lost", "Found"].includes(type)) filter.type = type;
    if (status && ["Active", "Claimed", "Recovered", "Closed"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: new RegExp(safeSearch, "i") },
        { description: new RegExp(safeSearch, "i") },
        { category: new RegExp(safeSearch, "i") },
        { location: new RegExp(safeSearch, "i") }
      ];
    }

    const items = await Item.find(filter)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: items.length, items });
  } catch (error) {
    next(error);
  }
};

exports.getItemById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }

    const item = await Item.findById(req.params.id)
      .populate("reportedBy", "name email");

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID"
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    const isOwner =
      item.reportedBy.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this item"
      });
    }

    // Only administrators may change item status.
    if (
      Object.prototype.hasOwnProperty.call(req.body, "status") &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Only an administrator can change item status"
      });
    }

    const allowed = [
      "title",
      "category",
      "description",
      "location",
      "date"
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        item[key] = req.body[key];
      }
    }

    if (isAdmin && req.body.status !== undefined) {
      const validStatuses = [
        "Active",
        "Claimed",
        "Recovered",
        "Closed"
      ];

      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item status"
        });
      }

      item.status = req.body.status;
    }

    await item.save();

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

exports.getMyItems = async (req, res, next) => {
  try {
    const items = await Item.find({ reportedBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, items });
  } catch (error) {
    next(error);
  }
};
