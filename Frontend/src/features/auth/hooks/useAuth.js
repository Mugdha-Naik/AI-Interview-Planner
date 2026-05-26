import { useContext } from "react";
import { AuthContext } from "../auth.context-instance";
import { login, register, logout } from "../services/auth.api";

export const useAuth = () => {
    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context;

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            setUser(data.user);
            return {
                success: true,
                data
            };
        } catch (error) {
            setUser(null);
            return {
                success: false,
                message: error.message || "Unable to login right now"
            };
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            setUser(data.user);
            return {
                success: true,
                data
            };
        } catch (error) {
            setUser(null);
            return {
                success: false,
                message: error.message || "Unable to register right now"
            };
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
            setUser(null);
            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || "Unable to logout right now"
            };
        } finally {
            setLoading(false);
        }
    };

    return { user, loading, handleRegister, handleLogin, handleLogout };
};
