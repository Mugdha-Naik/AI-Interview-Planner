import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { getInterviewReport } from "../services/interview.api";
import "../style/interview.scss";

const toDisplayDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "Unknown";
  }
};

const deriveTitle = (report) => {
  if (report.title?.trim()) {
    return report.title;
  }

  if (report.jobDescription?.trim()) {
    return report.jobDescription.split("\n")[0].trim().slice(0, 80);
  }

  return "Interview Preparation Report";
};

const Interview = () => {
  const { interviewId } = useParams();
  const [activeSection, setActiveSection] = useState("technical");
  const [interviewReport, setInterviewReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadInterviewReport = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const data = await getInterviewReport(interviewId);
        setInterviewReport(data?.interviewReport || null);
      } catch (error) {
        setInterviewReport(null);
        setErrorMessage(error.message || "Unable to load interview report");
      } finally {
        setIsLoading(false);
      }
    };

    loadInterviewReport();
  }, [interviewId]);

  const parsedData = useMemo(() => {
    if (!interviewReport) {
      return null;
    }

    return {
      title: deriveTitle(interviewReport),
      matchScore: interviewReport.matchScore ?? null,
      generationSource: interviewReport.generationSource || "fallback",
      generationReason: interviewReport.generationReason || "",
      technicalQuestions: interviewReport.technicalQuestions || [],
      behavioralQuestions: interviewReport.behavioralQuestions || [],
      skillGaps: interviewReport.skillGaps || [],
      preparationPlan: interviewReport.preparationPlan || [],
      createdAt: toDisplayDate(interviewReport.createdAt),
    };
  }, [interviewReport]);

  if (isLoading) {
    return (
      <main className="interview-page interview-state-page">
        <section className="state-card">
          <p className="sidebar-eyebrow">Interview Studio</p>
          <h1>Loading your report...</h1>
          <p>We’re pulling the latest interview strategy for this report.</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="interview-page interview-state-page">
        <section className="state-card">
          <p className="sidebar-eyebrow">Interview Studio</p>
          <h1>We couldn’t load this report</h1>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  if (!parsedData) {
    return (
      <main className="interview-page interview-state-page">
        <section className="state-card">
          <p className="sidebar-eyebrow">Interview Studio</p>
          <h1>No report found</h1>
          <p>This interview report is missing or no longer available.</p>
        </section>
      </main>
    );
  }

  const sections = [
    {
      id: "technical",
      label: "Technical Questions",
      eyebrow: "Core Knowledge Drill",
      title: "Technical interview questions to rehearse",
      description:
        "Focus on explaining tradeoffs, architecture, and practical examples as if you are already in the interview room.",
      items: parsedData.technicalQuestions,
    },
    {
      id: "behavioral",
      label: "Behavioral Questions",
      eyebrow: "Storytelling Prep",
      title: "Behavioral prompts with strong answer direction",
      description:
        "Keep your responses structured, reflective, and grounded in real examples that show ownership and collaboration.",
      items: parsedData.behavioralQuestions,
    },
    {
      id: "roadmap",
      label: "Road Map",
      eyebrow: "5 Day Sprint",
      title: "A focused preparation plan for the next few days",
      description:
        "Use this roadmap to close priority gaps first, then reinforce confidence with mock practice and project-based revision.",
      items: parsedData.preparationPlan,
    },
  ];

  const activeContent =
    sections.find((section) => section.id === activeSection) || sections[0];

  return (
    <main className="interview-page">
      <div className="interview-shell">
        <aside className="interview-sidebar">
          <div className="sidebar-header">
            <p className="sidebar-eyebrow">Interview Studio</p>
            <h1>{parsedData.title}</h1>
            <p className="sidebar-meta">Generated on {parsedData.createdAt}</p>
            {parsedData.generationSource === "fallback" ? (
              <p className="sidebar-warning">
                Fallback report shown
                {parsedData.generationReason ? `: ${parsedData.generationReason}` : ""}
              </p>
            ) : (
              <p className="sidebar-success">AI-generated report</p>
            )}
            <p className="sidebar-score">
              Match Score{" "}
              <strong>
                {parsedData.matchScore !== null ? `${parsedData.matchScore}%` : "N/A"}
              </strong>
            </p>
          </div>

          <nav className="sidebar-nav" aria-label="Interview sections">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`sidebar-link${
                  activeSection === section.id ? " is-active" : ""
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="interview-main">
          <div className="content-header">
            <p className="content-eyebrow">{activeContent.eyebrow}</p>
            <h2>{activeContent.title}</h2>
            <p>{activeContent.description}</p>
          </div>

          <div className="content-list">
            {activeSection === "roadmap"
              ? activeContent.items.map((item) => (
                  <article key={item.day} className="content-card roadmap-card">
                    <div className="day-pill">Day {item.day}</div>
                    <h3>{item.focus}</h3>
                    <ul className="task-list">
                      {item.tasks.map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ul>
                  </article>
                ))
              : activeContent.items.map((item, index) => (
                  <article
                    key={`${activeSection}-${index + 1}`}
                    className="content-card question-card"
                  >
                    <div className="card-topline">
                      <span className="question-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="question-tag">
                        {activeSection === "technical"
                          ? "Technical"
                          : "Behavioral"}
                      </span>
                    </div>
                    <h3>{item.question}</h3>
                    <div className="detail-block">
                      <h4>Interviewer Intention</h4>
                      <p>{item.intention}</p>
                    </div>
                    <div className="detail-block">
                      <h4>Answer Direction</h4>
                      <p>{item.answer}</p>
                    </div>
                    <div className="detail-block detail-tip">
                      <h4>Coach Tip</h4>
                      <p>
                        {item.coachTip ||
                          item.answer ||
                          "Practice answering this clearly with one concrete example."}
                      </p>
                    </div>
                  </article>
                ))}
          </div>

          {parsedData.generationSource === "fallback" ? (
            <div className="fallback-note">
              <h3>Fallback Content Notice</h3>
              <p>
                This report is showing static fallback content, not a full AI-generated
                analysis.
              </p>
              <p>
                If you still see this after restarting both backend and frontend, the
                Gemini response is still failing validation.
              </p>
            </div>
          ) : null}
        </section>

        <aside className="interview-insights">
          <div className="insight-card">
            <p className="insight-eyebrow">Match Snapshot</p>
            <h3>Overall Match</h3>
            <div className="match-score">
              <strong>
                {parsedData.matchScore !== null ? `${parsedData.matchScore}%` : "N/A"}
              </strong>
              <span>Resume alignment with this role</span>
            </div>
          </div>

          <div className="insight-card">
            <p className="insight-eyebrow">Priority Gaps</p>
            <h3>Skill Gaps</h3>
            <div className="skill-gap-list">
              {parsedData.skillGaps.length ? (
                parsedData.skillGaps.map((item) => (
                  <span
                    key={item.skill}
                    className={`skill-gap-chip severity-${item.severity}`}
                  >
                    {item.skill}
                  </span>
                ))
              ) : (
                <p className="empty-copy">No skill gaps were returned for this report.</p>
              )}
            </div>
          </div>

          <div className="insight-card">
            <p className="insight-eyebrow">Quick Snapshot</p>
            <div className="stat-list">
              <div className="stat-item">
                <span>Technical</span>
                <strong>{parsedData.technicalQuestions.length}</strong>
              </div>
              <div className="stat-item">
                <span>Behavioral</span>
                <strong>{parsedData.behavioralQuestions.length}</strong>
              </div>
              <div className="stat-item">
                <span>Plan Days</span>
                <strong>{parsedData.preparationPlan.length}</strong>
              </div>
            </div>
          </div>

          <div className="insight-card insight-note">
            <p className="insight-eyebrow">Focus Reminder</p>
            <p>
              Prioritize medium-severity gaps first, then use the roadmap to
              convert revision into confident, interview-ready answers.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
};

export default Interview;
