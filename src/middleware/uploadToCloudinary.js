const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");

module.exports = async function uploadToCloudinary(req, res, next) {
    if (!req.file) return next();

    const requiredVariables = [
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
    ];

    const missing = requiredVariables.filter(
        (name) => !process.env[name]
    );

    if (missing.length) {
        const error = new Error(
            "Image storage is not configured. Please contact the administrator."
        );

        error.status = 503;
        return next(error);
    }

    try {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "findora/items",
                    resource_type: "image",
                    unique_filename: true,
                    overwrite: false
                },
                (error, uploadedImage) => {
                    if (error) return reject(error);
                    resolve(uploadedImage);
                }
            );

            Readable.from([req.file.buffer]).pipe(uploadStream);
        });

        if (!result || !result.secure_url || !result.public_id) {
            throw new Error("Cloudinary did not return a valid image URL.");
        }

        req.cloudinaryImage = result;

        next();
    } catch (error) {
        console.error(
            "Cloudinary image upload failed:",
            error.message
        );

        error.status = 502;
        next(error);
    }
};