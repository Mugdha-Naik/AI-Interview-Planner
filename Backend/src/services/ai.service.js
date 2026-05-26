const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { jsonrepair } = require("jsonrepair");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })).min(1),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })).min(1),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"])
    })).min(1),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string()).min(1)
    })).min(1),
    title: z.string().optional()
});

function deriveTitle(jobDescription) {
    const firstLine = jobDescription
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean);

    return firstLine || "Interview Preparation Report";
}

function buildFallbackReport({ jobDescription, selfDescription }) {
    const focusSource = selfDescription?.trim() || "your recent experience";

    return {
        title: deriveTitle(jobDescription),
        matchScore: 60,
        technicalQuestions: [
            {
                question: "Walk me through a project from your background that best matches this role.",
                intention: "To evaluate practical alignment with the job requirements.",
                answer: "Explain the problem, your role, the tech stack, the decisions you made, and the measurable result."
            },
            {
                question: "Which technical decisions in your recent work are you most confident defending?",
                intention: "To test technical depth and engineering judgment.",
                answer: "Pick one decision, explain alternatives you considered, and justify the final choice with tradeoffs."
            },
            {
                question: "What parts of this role feel strongest for you right now?",
                intention: "To identify your clearest strengths for this position.",
                answer: `Connect the role requirements to ${focusSource} using concrete examples and outcomes.`
            },
            {
                question: "What area in this role would require the most ramp-up for you?",
                intention: "To assess self-awareness and learning strategy.",
                answer: "Name the gap honestly, then explain how you would close it with a focused learning plan."
            },
            {
                question: "How would you prepare technically for this interview over the next few days?",
                intention: "To understand preparation strategy and prioritization.",
                answer: "Prioritize role-specific concepts first, then practice explanation, tradeoffs, and mock interview drills."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time you took ownership of a difficult problem.",
                intention: "To assess ownership and initiative.",
                answer: "Use STAR and emphasize what you personally drove and what changed because of your work."
            },
            {
                question: "Describe a time you received feedback and improved your work.",
                intention: "To evaluate coachability and growth mindset.",
                answer: "Explain the feedback clearly, what you changed, and how the result improved afterward."
            },
            {
                question: "Tell me about a time you worked with others under pressure.",
                intention: "To understand collaboration and communication under stress.",
                answer: "Highlight coordination, clear communication, and how the team reached a good result."
            }
        ],
        skillGaps: [
            { skill: "Role-specific depth", severity: "medium" },
            { skill: "Mock interview practice", severity: "medium" },
            { skill: "Behavioral storytelling", severity: "low" }
        ],
        preparationPlan: [
            { day: 1, focus: "Role fit review", tasks: ["Map your strongest projects to the job description", "List 5 likely technical questions and rehearse answers"] },
            { day: 2, focus: "Core technical revision", tasks: ["Review the most relevant concepts for the role", "Prepare one deep-dive architecture story"] },
            { day: 3, focus: "Behavioral preparation", tasks: ["Draft STAR answers for 3 ownership stories", "Practice concise communication aloud"] },
            { day: 4, focus: "Gap closing", tasks: ["Review the most important weaker areas", "Create a short explanation for how you are improving them"] },
            { day: 5, focus: "Mock interview", tasks: ["Run a full mock interview session", "Refine weak answers and tighten examples"] }
        ]
    };
}

function withGenerationMeta(report, generationSource, generationReason = "") {
    return {
        ...report,
        generationSource,
        generationReason
    };
}

function parseAiResponse(text) {
    try {
        return JSON.parse(text);
    } catch (parseError) {
        try {
            const repaired = jsonrepair(text);
            return JSON.parse(repaired);
        } catch (repairError) {
            return null;
        }
    }
}

function tryParseObject(value) {
    if (!value || typeof value !== "string") {
        return null;
    }

    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
        return null;
    }
}

function tryParseLooseObject(value) {
    if (!value || typeof value !== "string") {
        return null;
    }

    const normalized = value.replace(/\\"/g, "\"").trim();
    const candidates = [
        normalized,
        `{${normalized}}`,
        normalized.startsWith("{") ? normalized : `{${normalized.replace(/^[^{]*/, "")}}`
    ];

    for (const candidate of candidates) {
        try {
            const repaired = jsonrepair(candidate);
            const parsed = JSON.parse(repaired);
            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        } catch (error) {
            continue;
        }
    }

    return null;
}

function extractFieldFromText(text, fieldName) {
    if (typeof text !== "string") {
        return "";
    }

    const normalized = text.replace(/\\"/g, "\"");
    const patterns = {
        question: /question"?\s*:\s*"([^"]+)"/i,
        intention: /intention"?\s*:\s*"([^"]+)"/i,
        answer: /answer"?\s*:\s*"([^"]+)"/i,
        skill: /skill"?\s*:\s*"([^"]+)"/i,
        severity: /severity"?\s*:\s*"([^"]+)"/i,
        focus: /focus"?\s*:\s*"([^"]+)"/i,
        day: /day"?\s*:\s*(\d+)/i
    };

    const pattern = patterns[fieldName];

    if (!pattern) {
        return "";
    }

    const match = normalized.match(pattern);
    return match?.[1]?.trim() || "";
}

function buildQuestionFragment(item, fallbackIntention, fallbackAnswer) {
    const rawText = typeof item === "string" ? item : "";
    const stringSource =
        typeof item === "string"
            ? tryParseObject(item) || tryParseLooseObject(item) || { question: item }
            : item || {};
    const parsedQuestionObject =
        tryParseObject(stringSource.question) || tryParseLooseObject(stringSource.question);
    const source = parsedQuestionObject
        ? {
            ...stringSource,
            ...parsedQuestionObject
        }
        : stringSource;
    const extractedQuestion = extractFieldFromText(rawText, "question") || extractFieldFromText(source.question, "question");
    const extractedIntention = extractFieldFromText(rawText, "intention") || extractFieldFromText(source.question, "intention");
    const extractedAnswer = extractFieldFromText(rawText, "answer") || extractFieldFromText(source.question, "answer");

    return {
        question: asString(extractedQuestion || source.question, ""),
        intention: asString(
            extractedIntention || source.intention,
            fallbackIntention
        ),
        answer: asString(
            extractedAnswer || source.answer,
            fallbackAnswer
        )
    };
}

function collapseQuestionFragments(fragments) {
    const collapsed = [];
    let current = null;

    for (const fragment of fragments) {
        const hasQuestion = Boolean(fragment.question);
        const hasIntention = Boolean(fragment.intention);
        const hasAnswer = Boolean(fragment.answer);

        if (hasQuestion && hasIntention && hasAnswer) {
            collapsed.push(fragment);
            current = null;
            continue;
        }

        if (!current) {
            current = {
                question: "",
                intention: "",
                answer: ""
            };
        }

        if (hasQuestion && !current.question) {
            current.question = fragment.question;
        }

        if (hasIntention && (!current.intention || current.intention.startsWith("To assess") || current.intention.startsWith("To evaluate"))) {
            current.intention = fragment.intention;
        }

        if (hasAnswer && (!current.answer || current.answer.startsWith("Explain") || current.answer.startsWith("Use the STAR"))) {
            current.answer = fragment.answer;
        }

        if (current.question && current.intention && current.answer) {
            collapsed.push(current);
            current = null;
        }
    }

    if (current && current.question) {
        collapsed.push(current);
    }

    return collapsed;
}

function asString(value, fallback = "") {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    if (value == null) {
        return fallback;
    }

    return String(value).trim() || fallback;
}

function normalizeSeverity(value) {
    const severity = asString(value, "medium").toLowerCase();
    if (severity === "low" || severity === "medium" || severity === "high") {
        return severity;
    }

    return "medium";
}

function normalizeQuestionList(list, fallbackIntention, fallbackAnswer) {
    if (!Array.isArray(list)) {
        return [];
    }

    const fragments = list.map((item) =>
        buildQuestionFragment(item, fallbackIntention, fallbackAnswer)
    );

    return collapseQuestionFragments(fragments)
        .filter((item) => item.question);
}

function normalizeSkillGapList(list) {
    if (!Array.isArray(list)) {
        return [];
    }

    const rawItems = list.map((item) => {
        const rawText = typeof item === "string" ? item : "";
        const stringSource =
            typeof item === "string"
                ? tryParseObject(item) || tryParseLooseObject(item) || { skill: item }
                : item || {};
        const parsedSkillObject =
            tryParseObject(stringSource.skill) || tryParseLooseObject(stringSource.skill);
        const source = parsedSkillObject
            ? {
                ...stringSource,
                ...parsedSkillObject
            }
            : stringSource;
        const extractedSkill = extractFieldFromText(rawText, "skill") || extractFieldFromText(source.skill, "skill");
        const extractedSeverity = extractFieldFromText(rawText, "severity") || extractFieldFromText(source.skill, "severity");

        return {
            skill: asString(extractedSkill || source.skill, ""),
            severity: normalizeSeverity(
                asString(extractedSeverity || source.severity, "")
            )
        };
    });

    const collapsed = [];
    let pendingSkill = null;

    for (const item of rawItems) {
        if (item.skill && !item.skill.startsWith("severity")) {
            pendingSkill = {
                skill: item.skill,
                severity: item.severity || "medium"
            };
            collapsed.push(pendingSkill);
            continue;
        }

        if (pendingSkill && item.severity) {
            pendingSkill.severity = item.severity;
        }
    }

    return collapsed
        .filter((item) => item.skill);
}

function extractTasksFromText(text) {
    if (typeof text !== "string") {
        return [];
    }

    const normalized = text.replace(/\\"/g, "\"");
    const matches = [...normalized.matchAll(/"([^"]+)"/g)]
        .map((match) => match[1])
        .filter((value) => value && value !== "tasks" && value !== "focus");

    return matches.filter((value) => !/^day$/i.test(value) && !/^severity$/i.test(value));
}

function normalizePreparationPlan(list) {
    if (!Array.isArray(list)) {
        return [];
    }

    return list
        .map((item, index) => {
            const stringSource =
                typeof item === "string"
                    ? tryParseObject(item) || tryParseLooseObject(item) || { focus: item }
                    : item || {};
            const parsedFocusObject =
                tryParseObject(stringSource.focus) || tryParseLooseObject(stringSource.focus);
            const source = parsedFocusObject
                ? {
                    ...stringSource,
                    ...parsedFocusObject
                }
                : stringSource;
            const rawFocusText = typeof item === "string" ? item : asString(source.focus, "");
            const extractedFocus = extractFieldFromText(rawFocusText, "focus") || extractFieldFromText(source.focus, "focus");
            const extractedDay = extractFieldFromText(rawFocusText, "day") || extractFieldFromText(source.focus, "day");
            const extractedTasks = extractTasksFromText(rawFocusText).filter(
                (task) =>
                    task !== extractedFocus &&
                    task !== extractedDay &&
                    !task.startsWith("day\":") &&
                    !task.startsWith("focus\":")
            );
            const tasks = Array.isArray(source.tasks)
                ? source.tasks.map((task) => asString(task, "")).filter(Boolean)
                : extractedTasks;

            return {
                day:
                    Number(source.day) > 0
                        ? Number(source.day)
                        : Number(extractedDay) > 0
                            ? Number(extractedDay)
                            : index + 1,
                focus: asString(extractedFocus || source.focus, ""),
                tasks: tasks.length ? tasks : ["Review the focus area", "Practice explaining it clearly"]
            };
        })
        .filter((item) => item.focus);
}

function sanitizeAiReport(parsed, jobDescription) {
    const source = parsed && typeof parsed === "object" ? parsed : {};

    const matchScoreNumber = Number(source.matchScore);
    const sanitized = {
        title: asString(source.title, deriveTitle(jobDescription)),
        matchScore: Number.isFinite(matchScoreNumber)
            ? Math.max(0, Math.min(100, Math.round(matchScoreNumber)))
            : 60,
        technicalQuestions: normalizeQuestionList(
            source.technicalQuestions,
            "To assess technical understanding.",
            "Explain the concept clearly with an example and the tradeoffs involved."
        ),
        behavioralQuestions: normalizeQuestionList(
            source.behavioralQuestions,
            "To evaluate communication, ownership, and teamwork.",
            "Use the STAR method with a concrete example."
        ),
        skillGaps: normalizeSkillGapList(source.skillGaps),
        preparationPlan: normalizePreparationPlan(source.preparationPlan)
    };

    return sanitized;
}

function mergeWithFallback(sanitizedReport, fallbackReport) {
    return {
        title: sanitizedReport.title || fallbackReport.title,
        matchScore: sanitizedReport.matchScore ?? fallbackReport.matchScore,
        technicalQuestions:
            sanitizedReport.technicalQuestions.length >= 5
                ? sanitizedReport.technicalQuestions
                : fallbackReport.technicalQuestions,
        behavioralQuestions:
            sanitizedReport.behavioralQuestions.length >= 3
                ? sanitizedReport.behavioralQuestions
                : fallbackReport.behavioralQuestions,
        skillGaps:
            sanitizedReport.skillGaps.length >= 3
                ? sanitizedReport.skillGaps
                : fallbackReport.skillGaps,
        preparationPlan:
            sanitizedReport.preparationPlan.length >= 5
                ? sanitizedReport.preparationPlan
                : fallbackReport.preparationPlan
    };
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `
Generate a structured interview report for this candidate and role.

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return ONLY JSON. No markdown fences. No explanations.

Required shape:
{
  "title": "string",
  "matchScore": 0-100,
  "technicalQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],
  "skillGaps": [
    {
      "skill": "string",
      "severity": "low|medium|high"
    }
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "string",
      "tasks": ["string", "string"]
    }
  ]
}

Requirements:
- 5 technical questions
- 3 behavioral questions
- 3 skill gaps
- 5 preparation plan days
- Make the content specific to the provided resume, self description, and job description.
`;

    const fallbackReport = buildFallbackReport({ jobDescription, selfDescription });

    try {
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            return withGenerationMeta(
                fallbackReport,
                "fallback",
                "Gemini API key is missing."
            );
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema)
            }
        });

        const text = response.text || "";
        const parsed = parseAiResponse(text);

        if (!parsed) {
            console.error("GEMINI_PARSE_FAILED_RAW_RESPONSE:", text);
            return withGenerationMeta(
                fallbackReport,
                "fallback",
                "Gemini returned malformed JSON, so fallback content was used."
            );
        }

        const sanitized = sanitizeAiReport(parsed, jobDescription);
        const merged = mergeWithFallback(sanitized, fallbackReport);
        const validated = interviewReportSchema.safeParse(merged);

        if (!validated.success) {
            console.error(
                "GEMINI_SCHEMA_FAILED_SANITIZED_RESPONSE:",
                JSON.stringify(merged, null, 2)
            );

            return withGenerationMeta(
                fallbackReport,
                "fallback",
                "Gemini response could not be normalized into the expected report format."
            );
        }

        return withGenerationMeta(validated.data, "ai");
    } catch (error) {
        console.error("AI SERVICE ERROR:", error.message);
        return withGenerationMeta(
            fallbackReport,
            "fallback",
            `Gemini request failed: ${error.message}`
        );
    }
}

module.exports = generateInterviewReport;
