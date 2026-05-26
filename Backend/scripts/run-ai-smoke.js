require("dotenv").config();

const connectToDB = require("../src/config/database");
const generateInterviewReport = require("../src/services/ai.service");
const { resume, selfDescription, jobDescription } = require("../src/services/temp");

async function runAiSmokeTest() {
    try {
        await connectToDB();

        console.log("Running AI smoke test...");
        console.time("AI_SMOKE_TEST");

        const result = await generateInterviewReport({
            resume,
            selfDescription,
            jobDescription
        });

        console.timeEnd("AI_SMOKE_TEST");
        console.log("AI smoke test result:");
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("AI smoke test failed:", error.message);
        process.exit(1);
    }
}

runAiSmokeTest();
