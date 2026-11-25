import axios from "axios";

const api = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Attach stored JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("mess_token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// If 401, clear token so user is sent back to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("mess_token");
        }
        return Promise.reject(error);
    }
);

export default api;
