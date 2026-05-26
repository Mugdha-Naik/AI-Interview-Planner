const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/error.middleware");
// creating / initialiting the server
const app = express();


// middleware or apis or routes creation
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// require all the routes here
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "genai-project-backend"
    });
});

// using all the routes here
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use(errorHandler);

module.exports = app;
