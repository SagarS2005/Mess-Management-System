import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await api.get("/auth/me");
            if (res.data?.success) {
                setUser(res.data.data);
            }
        } catch (err) {
            localStorage.removeItem("mess_token");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post("/auth/login", { email, password });
        if (res.data?.success) {
            if (res.data.data?.token) {
                localStorage.setItem("mess_token", res.data.data.token);
            }
            setUser(res.data.data.user);
            return res.data;
        }
    };

    const register = async (userData) => {
        const res = await api.post("/auth/register", userData);
        if (res.data?.success) {
            if (res.data.data?.token) {
                localStorage.setItem("mess_token", res.data.data.token);
            }
            setUser(res.data.data.user);
            return res.data;
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            localStorage.removeItem("mess_token");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
