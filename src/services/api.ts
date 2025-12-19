import axios from 'axios';

// Base URL for the main backend (ngrok)
export const API_BASE_URL = 'http://127.0.0.1:8000';
// AWS Auth URL
export const AWS_AUTH_URL = 'https://dt1wp7hrm9.execute-api.ap-south-1.amazonaws.com/auth/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
    },
});

// Interceptor to add auth token if available
api.interceptors.request.use((config) => {
    // Check for custom config property to skip auth
    // Note: You might need to extend AxiosRequestConfig type definition for TS, 
    // or just cast config as any to avoid errors for quick fix.
    if ((config as any).skipAuth) {
        return config;
    }

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
