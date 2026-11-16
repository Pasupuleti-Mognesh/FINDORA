const router = require("express").Router();
const {
  createItem, getItems, getItemById, updateItem, getMyItems
} = require("../controllers/itemController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../config/upload");
const validateImage = require("../middleware/validateImage");

router.get("/", getItems);
router.get("/mine", protect, getMyItems);
router.post("/", protect, upload.single("image"), validateImage, createItem);
router.get("/:id", getItemById);
router.patch("/:id", protect, updateItem);

module.exports = router;
