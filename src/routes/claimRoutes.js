const router = require("express").Router();
const { createClaim, getClaims, reviewClaim } = require("../controllers/claimController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, createClaim);
router.get("/", protect, getClaims);
router.patch("/:id/review", protect, adminOnly, reviewClaim);

module.exports = router;
