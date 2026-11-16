const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");

exports.createClaim = async (req, res, next) => {
  try {
    const { itemId, message } = req.body;

    if (!itemId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Item ID and claim message are required" });
    }

    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid item ID" });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    if (item.status !== "Active") {
      return res.status(400).json({ success: false, message: "This item is not available for claims" });
    }

    if (item.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot claim your own report" });
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user._id,
      message: message.trim()
    });

    res.status(201).json({ success: true, claim });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a claim for this item"
      });
    }
    next(error);
  }
};

exports.getClaims = async (req, res, next) => {
  try {
    const filter = req.user.role === "admin"
      ? {}
      : { claimant: req.user._id };

    const claims = await Claim.find(filter)
      .populate({
        path: "item",
        populate: { path: "reportedBy", select: "name email" }
      })
      .populate("claimant", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, claims });
  } catch (error) {
    next(error);
  }
};

exports.reviewClaim = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid claim ID" });
    }

    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be Approved or Rejected" });
    }

    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (claim.status !== "Pending") {
      return res.status(400).json({ success: false, message: "This claim has already been reviewed" });
    }

    claim.status = status;
    await claim.save();

    if (status === "Approved") {
      await Item.findByIdAndUpdate(claim.item, { status: "Claimed" });

      await Claim.updateMany(
        { item: claim.item, _id: { $ne: claim._id }, status: "Pending" },
        { status: "Rejected" }
      );
    }

    res.json({ success: true, claim });
  } catch (error) {
    next(error);
  }
};
