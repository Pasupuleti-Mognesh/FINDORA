const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".tif": "image/tiff",
    ".tiff": "image/tiff"
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeExt = path.extname(file.originalname).toLowerCase();
        const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;

        cb(null, uniqueName);
    }
});

function fileFilter(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMime = allowedTypes[extension];

    if (!expectedMime || file.mimetype !== expectedMime) {
        const error = new Error(
            "Only supported image files are allowed (PNG, JPG, GIF, WebP, BMP, TIFF)."
        );

        error.code = "INVALID_IMAGE_TYPE";
        error.status = 400;

        return cb(error);
    }

    cb(null, true);
}

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});
