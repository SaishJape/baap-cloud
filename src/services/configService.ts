import api from './api';

export interface ConfigData {
    user_id: string;
    client_id: string;
    mode: boolean; // true for Gemini (Agent), false for Free
    model_name?: string;
    api_key?: string | null;
}

export interface ConfigResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        id: string;
        user_id: string;
        client_id: string;
        mode: boolean;
        model_name: string;
        api_key: string | null;
        created_at: string;
        updated_at: string;
    };
}

export const configService = {
    createOrUpdateConfig: async (data: ConfigData): Promise<{ config_id: string; message: string }> => {
        // Set defaults based on mode if not provided is handled by backend or frontend.
        // Frontend should probably send the correct model_name.
        // Free: 'sentence-transformers/all-MiniLM-L6-v2'
        // Gemini: 'models/embedding-001' (as per curl example, though user might want chat model?)
        // The curl says "models/embedding-001" for Gemini. I'll stick to that or let UI decide.

        const response = await api.post('/config/config/', data);
        return response.data;
    },
};
