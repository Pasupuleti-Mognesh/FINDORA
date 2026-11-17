const multer = require("multer");
const path = require("path");

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
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});