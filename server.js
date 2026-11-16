require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/authRoutes");
const itemRoutes = require("./src/routes/itemRoutes");
const claimRoutes = require("./src/routes/claimRoutes");

const app = express();

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://192.168.1.109:5500",
        "http://127.0.0.1:5000",
        "http://localhost:5000"
    ],
    credentials: true
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "FINDORA API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    let status = 500;
    let message = "Internal server error";

    if (err.name === "MulterError") {
        status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

        message = status === 413
            ? "Image must not exceed 5 MB."
            : "Invalid image upload.";
    } else if (
        err.code === "INVALID_IMAGE_TYPE" ||
        err.code === "INVALID_IMAGE_CONTENT"
    ) {
        status = 400;
        message = err.message;
    } else if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
        status = err.status;
        message = err.message || "Request could not be processed.";
    }

    if (status >= 500) {
        console.error("FINDORA server error:", err.message);
    }

    res.status(status).json({
        success: false,
        message
    });
});

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`FINDORA server running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Unable to start FINDORA:", error.message);
        process.exit(1);
    });
