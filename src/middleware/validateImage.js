const fs = require("fs");

function detectImageType(header) {
    if (
        header.length >= 8 &&
        header.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
        )
    ) return "image/png";

    if (
        header.length >= 3 &&
        header[0] === 0xFF &&
        header[1] === 0xD8 &&
        header[2] === 0xFF
    ) return "image/jpeg";

    if (
        header.length >= 6 &&
        ["GIF87a", "GIF89a"].includes(header.toString("ascii", 0, 6))
    ) return "image/gif";

    if (
        header.length >= 12 &&
        header.toString("ascii", 0, 4) === "RIFF" &&
        header.toString("ascii", 8, 12) === "WEBP"
    ) return "image/webp";

    if (
        header.length >= 2 &&
        header[0] === 0x42 &&
        header[1] === 0x4D
    ) return "image/bmp";

    if (
        header.length >= 4 &&
        (
            header.subarray(0, 4).equals(Buffer.from([0x49, 0x49, 0x2A, 0x00])) ||
            header.subarray(0, 4).equals(Buffer.from([0x4D, 0x4D, 0x00, 0x2A]))
        )
    ) return "image/tiff";

    return null;
}

module.exports = async function validateImage(req, res, next) {
    if (!req.file) return next();

    let handle;

    try {
        handle = await fs.promises.open(req.file.path, "r");

        const header = Buffer.alloc(12);
        const result = await handle.read(header, 0, header.length, 0);

        await handle.close();
        handle = null;

        const actualMime = detectImageType(
            header.subarray(0, result.bytesRead)
        );

        if (!actualMime || actualMime !== req.file.mimetype) {
            const error = new Error(
                "The uploaded file does not contain valid image data."
            );

            error.code = "INVALID_IMAGE_CONTENT";
            error.status = 400;

            await fs.promises.unlink(req.file.path).catch(() => {});
            req.file = null;

            return next(error);
        }

        next();
    } catch (error) {
        if (handle) await handle.close().catch(() => {});

        if (req.file?.path) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            req.file = null;
        }

        next(error);
    }
};
