import React from "react";
import "../style/homeui.scss";

const HomeUI = ({
  jobDescription,
  onJobDescriptionChange,
  resumeFileName,
  onResumeChange,
  selfDescription,
  onSelfDescriptionChange,
  onGenerateClick,
  isResumeRequired,
  isGenerating,
  errorMessage,
  reports,
  isHistoryLoading,
  historyError,
  onOpenReport,
  onArchiveReport,
  archivingReportId,
}) => {
  return (
    <main className="home-page">
      <section className="home-content is-visible">
        <section className="home-hero">
          <p className="hero-eyebrow">AI Interview Preparation Studio</p>
          <h1>
            Create Your Custom <span>Interview Plan</span>
          </h1>
          <p className="hero-copy">
            Let our AI analyze the job requirements and your unique profile to
            build a winning strategy.
          </p>
        </section>

        <section className="interview-card">
          <div className="interview-grid">
            <div className="panel panel-left">
              <div className="panel-heading">
                <h2>
                  <span className="panel-icon" aria-hidden="true" />
                  Target Job Description
                </h2>
                <span className="badge badge-required">Required</span>
              </div>

              <textarea
                name="jobDescription"
                id="jobDescription"
                placeholder="Paste the full job description here...
e.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'"
                value={jobDescription}
                onChange={onJobDescriptionChange}
                maxLength={5000}
                className="input-area job-description"
              />

              <div className="char-count">{jobDescription.length} / 5000 chars</div>
            </div>

            <div className="panel panel-right">
              <div className="panel-heading">
                <h2>
                  <span className="panel-icon" aria-hidden="true" />
                  Your Profile
                </h2>
              </div>

              <div className="field-header">
                <span>Upload Resume</span>
                <span className="badge badge-results">Best Results</span>
              </div>

              <label htmlFor="resume-upload" className="upload-area">
                <input
                  type="file"
                  id="resume-upload"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={onResumeChange}
                />
                <div className="upload-icon" aria-hidden="true" />
                <strong>Click to upload or drag &amp; drop</strong>
                <span>PDF or DOCX (Max 5MB)</span>
                {resumeFileName ? (
                  <em className="file-name">{resumeFileName}</em>
                ) : null}
              </label>

              <div className="divider">
                <span>OR</span>
              </div>

              <div className="field-header">
                <span>Quick Self-Description</span>
              </div>

              <textarea
                name="selfDescription"
                id="selfDescription"
                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                value={selfDescription}
                onChange={onSelfDescriptionChange}
                className="input-area self-description"
              />

              <div className="info-box">
                Upload your <b>Resume</b> and add the <b>Job Description</b> to
                generate a personalized interview plan. Self-description is optional
                extra context.
              </div>
            </div>
          </div>

          <div className="card-footer">
            <span>AI-Powered Strategy Generation - Approx 30s</span>
            <button
              className="generate-btn"
              onClick={onGenerateClick}
              disabled={isResumeRequired}
            >
              {isGenerating ? "Generating..." : "Generate My Interview Strategy"}
            </button>
          </div>

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        </section>

        <section className="history-section">
          <div className="history-header">
            <div>
              <p className="hero-eyebrow">Saved Reports</p>
              <h2>Your interview history</h2>
            </div>
            <span className="history-count">{reports.length} active reports</span>
          </div>

          {historyError ? <p className="history-error">{historyError}</p> : null}

          {isHistoryLoading ? (
            <div className="history-state-card">
              <h3>Loading your saved reports...</h3>
              <p>Your previous interview strategies will appear here.</p>
            </div>
          ) : reports.length ? (
            <div className="history-grid">
              {reports.map((report) => (
                <article key={report._id} className="history-card">
                  <div className="history-card-top">
                    <div>
                      <p className="history-card-label">Interview Report</p>
                      <h3>{report.title || "Interview Preparation Report"}</h3>
                    </div>
                    <span className="history-score">
                      {typeof report.matchScore === "number"
                        ? `${report.matchScore}% match`
                        : "Score pending"}
                    </span>
                  </div>

                  <p className="history-meta">
                    Created on{" "}
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString()
                      : "Unknown date"}
                  </p>

                  <p className="history-summary">
                    {report.jobDescription
                      ? report.jobDescription.slice(0, 140)
                      : "Open this report to review your technical questions, behavioral prompts, and preparation roadmap."}
                    {report.jobDescription && report.jobDescription.length > 140
                      ? "..."
                      : ""}
                  </p>

                  <div className="history-actions">
                    <button
                      type="button"
                      className="history-btn history-btn-primary"
                      onClick={() => onOpenReport(report._id)}
                    >
                      Reopen Report
                    </button>
                    <button
                      type="button"
                      className="history-btn history-btn-secondary"
                      onClick={() => onArchiveReport(report._id)}
                      disabled={archivingReportId === report._id}
                    >
                      {archivingReportId === report._id ? "Archiving..." : "Archive"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="history-state-card">
              <h3>No reports yet</h3>
              <p>
                Generate your first interview strategy and it will appear here for
                quick access later.
              </p>
            </div>
          )}
        </section>

        <footer className="page-footer">
          <a href="/">Privacy Policy</a>
          <a href="/">Terms of Service</a>
          <a href="/">Help Center</a>
        </footer>
      </section>
    </main>
  );
};

export default HomeUI;
