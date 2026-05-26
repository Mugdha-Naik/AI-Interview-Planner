const multer = require("multer");
const AppError = require("../utils/appError");

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "Resume file is too large. Maximum allowed size is 5MB."
            });
        }

        return res.status(400).json({
            message: error.message
        });
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            details: error.details || undefined
        });
    }

    console.error("Unhandled Error:", error);

    return res.status(500).json({
        message: "Internal server error"
    });
}

module.exports = errorHandler;
