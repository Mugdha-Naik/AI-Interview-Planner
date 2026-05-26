const multer = require("multer");
const AppError = require("../utils/appError");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const isPdfMimeType = file.mimetype === "application/pdf";
        const hasPdfExtension = file.originalname.toLowerCase().endsWith(".pdf");

        if (!isPdfMimeType && !hasPdfExtension) {
            return cb(
                new AppError(
                    "Only PDF resumes are supported right now. Please upload a .pdf file.",
                    400
                )
            );
        }

        return cb(null, true);
    }
});

module.exports = upload;
