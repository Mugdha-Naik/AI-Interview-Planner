const pdfParse = require("pdf-parse");
const generateInterviewReport = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
const AppError = require("../utils/appError");

function isWeakGeneratedText(value) {
    if (typeof value !== "string") {
        return true;
    }

    const normalized = value.trim().toLowerCase();

    return (
        !normalized ||
        normalized === "(candidate's response)" ||
        normalized === "candidate's response" ||
        normalized === "(candidate response)" ||
        normalized === "candidate response" ||
        normalized === "n/a" ||
        normalized === "na" ||
        normalized === "placeholder"
    );
}

function isGenericAnswerDirection(value) {
    if (typeof value !== "string") {
        return true;
    }

    const normalized = value.trim().toLowerCase();

    return (
        isWeakGeneratedText(value) ||
        normalized === "explain clearly with examples and approach" ||
        normalized === "explain the concept clearly with an example and the tradeoffs involved." ||
        normalized === "use star method to answer" ||
        normalized === "use the star method with a concrete example."
    );
}

function buildAnswerDirection(question, intention, type) {
    if (type === "behavioral") {
        const questionText = typeof question === "string" ? question.toLowerCase() : "";

        if (questionText.includes("feedback")) {
            return "Start with the feedback you received, explain how you responded without being defensive, describe the exact change you made, and close with the improved result and what it taught you.";
        }

        if (questionText.includes("conflict") || questionText.includes("team")) {
            return "Set up the team context, explain the disagreement or coordination issue, show how you communicated clearly, and end with how the team moved forward and what outcome you achieved together.";
        }

        if (questionText.includes("challenge") || questionText.includes("problem")) {
            return "Use STAR: describe the challenge briefly, explain the specific actions you personally took, highlight the reasoning behind those actions, and end with a measurable result and one learning.";
        }

        return `Use the STAR method and answer this with a concrete example that shows ${intention.toLowerCase()}. End with the impact and what you learned.`;
    }

    const questionText = typeof question === "string" ? question.toLowerCase() : "";

    if (questionText.includes("restful api") || questionText.includes("api")) {
        return "Begin with the business problem the API solved, then explain the route structure, request validation, authentication, error handling, versioning strategy, and how you kept the service maintainable as it grew. Finish with one scalability decision and its impact.";
    }

    if (questionText.includes("jwt") || questionText.includes("authentication")) {
        return "Walk through the full authentication flow: login, token creation, storage strategy, middleware verification, authorization checks, and logout or revocation handling. Then mention security choices like HTTP-only cookies, token expiry, refresh flow, and blacklist or rotation strategy.";
    }

    if (questionText.includes("mongodb") || questionText.includes("query")) {
        return "Describe the exact performance bottleneck first, then explain how you diagnosed it using profiling or `explain()`, what optimization you chose such as indexing or aggregation refactoring, the measurable before/after impact, and any tradeoff like write overhead or index size.";
    }

    if (questionText.includes("redis") || questionText.includes("cache")) {
        return "Start with the use case you cached, explain why caching helped, describe the strategy you used such as cache-aside or TTL-based caching, then cover invalidation, stale-data risk, and one production tradeoff you had to manage.";
    }

    if (questionText.includes("event-driven") || questionText.includes("message queue") || questionText.includes("kafka") || questionText.includes("rabbitmq")) {
        return "Explain the event-driven flow end to end: producer, queue or broker, consumer services, retry handling, and failure recovery. Then describe how you ensured scalability, observability, idempotency, and fault tolerance in the design.";
    }

    if (questionText.includes("system design") || questionText.includes("architecture")) {
        return "Structure your answer around requirements, high-level components, data flow, scaling strategy, fault tolerance, and tradeoffs. Use one concrete example from your past work instead of answering only in theory.";
    }

    if (questionText.includes("docker") || questionText.includes("ci/cd") || questionText.includes("deployment")) {
        return "Explain how you would package the service, manage environment configuration, run tests in the pipeline, build and publish artifacts, and safely deploy changes. Include one practical example of how this improves reliability or developer velocity.";
    }

    return `Answer directly, connect it to one real project from your experience, explain the technical decision-making clearly, and make sure your explanation demonstrates ${intention.toLowerCase()}.`;
}

function buildCoachTip(question, type) {
    const questionText = typeof question === "string" ? question.toLowerCase() : "";

    if (type === "behavioral") {
        if (questionText.includes("feedback")) {
            return "Avoid sounding defensive. Focus on how you adapted, what changed in your work, and how the outcome improved.";
        }

        if (questionText.includes("conflict") || questionText.includes("team")) {
            return "Show maturity here: explain how you listened, aligned the team, and kept the project moving without blaming anyone.";
        }

        if (questionText.includes("challenge") || questionText.includes("problem")) {
            return "Keep the challenge short and spend more time on your actions, decisions, and the measurable result.";
        }

        return "Keep the story concise: situation, task, action, result, and end with what you learned.";
    }

    if (questionText.includes("restful api") || questionText.includes("api")) {
        return "Anchor the answer in one real API you built and walk through validation, errors, auth, and scale in that exact example.";
    }

    if (questionText.includes("mongodb") || questionText.includes("query")) {
        return "Mention the exact optimization, the before/after impact, and why that choice worked better than alternatives.";
    }

    if (questionText.includes("jwt") || questionText.includes("authentication")) {
        return "Do not stop at definitions. Walk through the actual request flow and call out one security pitfall you would avoid.";
    }

    if (questionText.includes("redis") || questionText.includes("cache")) {
        return "Interviewers usually want tradeoffs here, so mention cache invalidation and stale-data handling explicitly.";
    }

    if (questionText.includes("event-driven") || questionText.includes("message queue") || questionText.includes("kafka") || questionText.includes("rabbitmq")) {
        return "Map the flow clearly: producer, broker, consumer, retries, and how you kept events safe from duplication or loss.";
    }

    if (questionText.includes("system design") || questionText.includes("architecture")) {
        return "Sketch the high-level design first, then zoom into one hard tradeoff so the answer feels senior and structured.";
    }

    if (questionText.includes("docker") || questionText.includes("ci/cd") || questionText.includes("deployment")) {
        return "Mention what changed for developers or releases after automation, not just the tools you used.";
    }

    if (questionText.includes("performance") || questionText.includes("scalability")) {
        return "Use numbers if you can. Even rough before/after impact makes this answer much more convincing.";
    }

    return "Make the answer concrete: name the project, the technical decision, and the impact instead of speaking only in general theory.";
}

function tryParseJSON(value) {
    if (typeof value !== "string") {
        return value;
    }

    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    } catch (error) {
        return value;
    }

    return value;
}

function normalizeReport(report) {
    if (Array.isArray(report.technicalQuestions)) {
        report.technicalQuestions = report.technicalQuestions.map((item) => {
            const parsedQuestion = tryParseJSON(item.question || item);
            const question =
                typeof parsedQuestion === "object" && parsedQuestion.question
                    ? parsedQuestion.question
                    : parsedQuestion;
            const intention = item.intention || "To assess understanding of the concept";
            const answer = !isGenericAnswerDirection(item.answer)
                ? item.answer
                : buildAnswerDirection(question, intention, "technical");

            return {
                question,
                intention,
                answer,
                coachTip: buildCoachTip(question, "technical")
            };
        });
    }

    if (Array.isArray(report.behavioralQuestions)) {
        report.behavioralQuestions = report.behavioralQuestions.map((item) => {
            const parsedQuestion = tryParseJSON(item.question || item);
            const question =
                typeof parsedQuestion === "object" && parsedQuestion.question
                    ? parsedQuestion.question
                    : parsedQuestion;
            const intention = item.intention || "To evaluate behavior and problem-solving";
            const answer = !isGenericAnswerDirection(item.answer)
                ? item.answer
                : buildAnswerDirection(question, intention, "behavioral");

            return {
                question,
                intention,
                answer,
                coachTip: buildCoachTip(question, "behavioral")
            };
        });
    }

    if (Array.isArray(report.skillGaps)) {
        report.skillGaps = report.skillGaps.map((item) => {
            const parsedSkill = tryParseJSON(item.skill || item);

            return {
                skill:
                    typeof parsedSkill === "object" && parsedSkill.skill
                        ? parsedSkill.skill
                        : parsedSkill,
                severity:
                    item.severity ||
                    (typeof parsedSkill === "object" && parsedSkill.severity
                        ? parsedSkill.severity
                        : "medium")
            };
        });
    }

    if (Array.isArray(report.preparationPlan)) {
        report.preparationPlan = report.preparationPlan.map((item, index) => {
            const parsedFocus = tryParseJSON(item.focus || item);

            return {
                day:
                    item.day ||
                    (typeof parsedFocus === "object" && parsedFocus.day
                        ? parsedFocus.day
                        : index + 1),
                focus:
                    typeof parsedFocus === "object" && parsedFocus.focus
                        ? parsedFocus.focus
                        : parsedFocus,
                tasks:
                    item.tasks ||
                    (typeof parsedFocus === "object" && Array.isArray(parsedFocus.tasks)
                        ? parsedFocus.tasks
                        : ["Study concept", "Practice problems"])
            };
        });
    }

    return report;
}

async function generateInterViewReportController(req, res, next) {
    try {
        const { selfDescription, jobDescription } = req.validatedInterviewInput;
        let resumeText = "";

        if (req.file?.buffer) {
            try {
                const resumeContent = await pdfParse(req.file.buffer);
                resumeText = resumeContent.text?.trim() || "";
            } catch (error) {
                throw new AppError(
                    "We could not read that PDF resume. Please upload a valid PDF file.",
                    400
                );
            }
        }

        if (!resumeText && !selfDescription) {
            throw new AppError(
                "Please upload a readable resume PDF or provide a self description.",
                400
            );
        }

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        });

        const normalizedReport = normalizeReport(interviewReportByAi);

        const interViewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...normalizedReport
        });

        return res.status(201).json({
            message: "Interview report generated successfully",
            interViewReport,
            generation: {
                source: interViewReport.generationSource,
                reason: interViewReport.generationReason
            }
        });
    } catch (error) {
        return next(error);
    }
}

async function getInterviewReportByIdController(req, res, next) {
    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: req.params.interviewId,
            user: req.user.id,
            isArchived: false
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully",
            interviewReport
        });
    } catch (error) {
        return next(error);
    }
}

async function listInterviewReportsController(req, res, next) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id, isArchived: false })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports
        });
    } catch (error) {
        return next(error);
    }
}

async function archiveInterviewReportController(req, res, next) {
    try {
        const interviewReport = await interviewReportModel.findOneAndUpdate(
            {
                _id: req.params.interviewId,
                user: req.user.id,
                isArchived: false
            },
            {
                isArchived: true,
                archivedAt: new Date()
            },
            {
                new: true
            }
        );

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            });
        }

        return res.status(200).json({
            message: "Interview report archived successfully",
            interviewReport
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    listInterviewReportsController,
    archiveInterviewReportController
};
