import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import HomeUI from "../ui/HomeUI";
import {
  archiveInterviewReport,
  generateInterviewReport,
  listInterviewReports,
} from "../services/interview.api";

const Home = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reports, setReports] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [archivingReportId, setArchivingReportId] = useState("");

  useEffect(() => {
    const loadInterviewReports = async () => {
      setIsHistoryLoading(true);
      setHistoryError("");

      try {
        const data = await listInterviewReports();
        setReports(data?.interviewReports || []);
      } catch (error) {
        setHistoryError(error.message || "Unable to load report history");
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadInterviewReports();
  }, []);

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];
    setResumeFile(file || null);
    setResumeFileName(file ? file.name : "");
    setErrorMessage("");
  };

  const handleGenerateClick = async () => {
    if (!jobDescription.trim() || !resumeFile) {
      setErrorMessage("Please add a job description and upload your resume.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);
      formData.append("selfDescription", selfDescription);

      const data = await generateInterviewReport(formData);
      const createdReport = data?.interViewReport;
      const interviewId = createdReport?._id;

      if (!interviewId) {
        throw new Error("Interview report was created but no report id was returned");
      }

      setReports((currentReports) =>
        createdReport ? [createdReport, ...currentReports] : currentReports
      );

      navigate(`/interview/${interviewId}`);
    } catch (error) {
      setErrorMessage(error.message || "Unable to generate interview strategy");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenReport = (interviewId) => {
    navigate(`/interview/${interviewId}`);
  };

  const handleArchiveReport = async (interviewId) => {
    setArchivingReportId(interviewId);
    setHistoryError("");

    try {
      await archiveInterviewReport(interviewId);
      setReports((currentReports) =>
        currentReports.filter((report) => report._id !== interviewId)
      );
    } catch (error) {
      setHistoryError(error.message || "Unable to archive report");
    } finally {
      setArchivingReportId("");
    }
  };

  const isGenerateDisabled = isGenerating || !jobDescription.trim() || !resumeFile;

  return (
    <HomeUI
      jobDescription={jobDescription}
      onJobDescriptionChange={(event) => {
        setJobDescription(event.target.value);
        setErrorMessage("");
      }}
      resumeFileName={resumeFileName}
      onResumeChange={handleResumeChange}
      selfDescription={selfDescription}
      onSelfDescriptionChange={(event) => {
        setSelfDescription(event.target.value);
        setErrorMessage("");
      }}
      onGenerateClick={handleGenerateClick}
      isResumeRequired={isGenerateDisabled}
      isGenerating={isGenerating}
      errorMessage={errorMessage}
      reports={reports}
      isHistoryLoading={isHistoryLoading}
      historyError={historyError}
      onOpenReport={handleOpenReport}
      onArchiveReport={handleArchiveReport}
      archivingReportId={archivingReportId}
    />
  );
};

export default Home;
