import axios from 'axios';
import api, { AWS_AUTH_URL } from './api';

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        status: string;
    };
}

export interface UserLoginResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        id: string;
        user_id: string;
        client_id: string;
        created_at: string;
        updated_at: string;
    };
}

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        const response = await axios.post(`${AWS_AUTH_URL}/auth/login`, {
            email,
            password,
        });
        return response.data;
    },

    createUserLogin: async (userId: string, clientId: string): Promise<UserLoginResponse> => {
        const response = await api.post('/user-login/user-login/', {
            user_id: userId,
            client_id: clientId,
        });
        return response.data;
    },
};
