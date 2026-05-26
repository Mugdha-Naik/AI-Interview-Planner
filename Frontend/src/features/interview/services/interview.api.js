import api from "../../../lib/api";

export async function generateInterviewReport(formData) {
    try {
        const response = await api.post("/api/interview", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to generate interview report"
        );
    }
}

export async function getInterviewReport(interviewId) {
    try {
        const response = await api.get(`/api/interview/${interviewId}`);
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to fetch interview report"
        );
    }
}

export async function listInterviewReports() {
    try {
        const response = await api.get("/api/interview");
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to fetch interview reports"
        );
    }
}

export async function archiveInterviewReport(interviewId) {
    try {
        const response = await api.patch(`/api/interview/${interviewId}/archive`);
        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to archive interview report"
        );
    }
}
