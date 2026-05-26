import api from "../../../lib/api";

export async function register({ username, email, password }) {
    try {
        const response = await api.post("/api/auth/register", {
            username,
            email,
            password
        });

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to register right now"
        );
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email,
            password
        });

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to login right now"
        );
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout");

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to logout right now"
        );
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me");

        return response.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.message || "Unable to fetch user details"
        );
    }
}
