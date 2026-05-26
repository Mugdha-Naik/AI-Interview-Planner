const mongoose = require('mongoose')

// AI Service


/**
 * job description schema : String
 * resume text  : String
 * self description : String
 * 
 * matchScore: Number
 * 
 * techincal questions : 
 *                          [{
 *                              questions:"",
 *                              intention: "",
 *                              answer: "",              
 *                          }]
 * behavioral questions : [{
 *                             question: "",
 *                             intention: "",
 *                             answer: "",
 *                        }]
 * skill gaps : [{
 *                  skill : "",
 *                  severity : {
 *                      type: String,
 *                      enum : ["low", "medium", "high"]
 *                  }
 *              }]
 * preperation plan : [ {
 *                          day: Number,
 *                          focus: String,
 *                          tasks:[String]
 *                    } ]
 */


// sub-schema because main schema already is filled so much
const technicalQuestionsSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Technical question is required"]
    },
    intention: {
        type: String,
        required: [true, "Intention is required"]
    },
    answer: {
        type: String,
        required: [true, "Answer is required"]
    },
    coachTip: {
        type: String,
        default: ""
    }
}, {
    _id: false
})

// another sub-schema
const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Behavioral question is required"]
    },
    intention: {
        type: String,
        required: [true, "Intention is required"]
    },
    answer: {
        type: String,
        required: [true, "Answer is required"]
    },
    coachTip: {
        type: String,
        default: ""
    }
}, {
    _id: false
})

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, "Skill is required"]
    },
    severity : {
        type: String,
        enum : ["low", "medium", "high"],
        required: [true, "Severity is required"]
    }
}, { 
    _id: false
})

// sub-schema
const preparationPlanSchema = new mongoose.Schema({
    day : {
        type: Number,
        required : [true, "Day is required"]
    },
    focus : {
        type: String,
        required: [true, "Focus is required"]
    },
    tasks: [ {
        type: String,
        required: [true, "Task is required"]
    }]
})

// main schema
const interviewReportSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    jobDescription : {
        type: String,
        required : []
    },
    resume:{
        type: String,
    },
    selfDescription : {
        type: String
    },
    matchScore : {
        type: Number,
        min: 0,
        max: 100,
    },
    generationSource: {
        type: String,
        enum: ["ai", "fallback"],
        default: "fallback"
    },
    generationReason: {
        type: String,
        default: ""
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: null
    },
    technicalQuestions: [technicalQuestionsSchema],
    behavioralQuestions : [behavioralQuestionSchema],
    skillGaps : [skillGapSchema],
    preparationPlan : [preparationPlanSchema],
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "users"
    }
}, {
    timestamps : true
})

const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;
