const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware");
const {
    validateGenerateInterviewRequest
} = require("../middlewares/interview.middleware");
const interviewRouter = express.Router();

/**
 * @router POST/api/interview
 * @description generate new interview report on the basis of user self-description, resume pdf, and job description
 * @access private
 */


// because access is private here we are going to use an auth middleware
interviewRouter.post(
    "/",
    authMiddleware.authUser,
    upload.single("resume"),
    validateGenerateInterviewRequest,
    interviewController.generateInterViewReportController
);

/**
 * @route GET /api/interview
 * @description list all interview reports for the logged-in user
 * @access private
 */

interviewRouter.get(
    "/",
    authMiddleware.authUser,
    interviewController.listInterviewReportsController
);

/**
 * @route PATCH /api/interview/:interviewId/archive
 * @description archive an interview report for the logged-in user
 * @access private
 */

interviewRouter.patch(
    "/:interviewId/archive",
    authMiddleware.authUser,
    interviewController.archiveInterviewReportController
);

/** 
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 */

interviewRouter.get(
    "/:interviewId",
    authMiddleware.authUser,
    interviewController.getInterviewReportByIdController
);


module.exports = interviewRouter;
