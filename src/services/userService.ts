import api from './api';
import { Chatbot } from './chatbotService';

export interface UserMeResponse {
    configs: Array<{
        config_id: string;
        user_id: string;
        client_id: string;
        mode: boolean;
        model_name: string;
        api_key: string | null;
    }>;
    chatbots: Chatbot[];
}

export const userService = {
    getUserInfo: async (userId: string, clientId: string): Promise<UserMeResponse> => {
        const response = await api.post('/me/', {
            user_id: userId,
            client_id: clientId,
        });
        return response.data;
    },
};
