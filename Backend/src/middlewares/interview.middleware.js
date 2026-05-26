const { z } = require("zod");
const AppError = require("../utils/appError");

const generateInterviewSchema = z.object({
    jobDescription: z
        .string({ required_error: "Job description is required" })
        .trim()
        .min(20, "Job description should be at least 20 characters long"),
    selfDescription: z
        .string()
        .trim()
        .max(4000, "Self description should be under 4000 characters")
        .optional()
});

function validateGenerateInterviewRequest(req, res, next) {
    const parsed = generateInterviewSchema.safeParse({
        jobDescription: req.body?.jobDescription,
        selfDescription: req.body?.selfDescription || ""
    });

    if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return next(new AppError(firstIssue.message, 400, parsed.error.flatten()));
    }

    const hasResume = Boolean(req.file);
    const hasSelfDescription = Boolean(parsed.data.selfDescription);

    if (!hasResume && !hasSelfDescription) {
        return next(
            new AppError(
                "Please upload a resume PDF or provide a self description before generating a report.",
                400
            )
        );
    }

    req.validatedInterviewInput = parsed.data;
    return next();
}

module.exports = {
    validateGenerateInterviewRequest
};
