import api from './api';

export interface Chatbot {
    id: string;
    config_id: string;
    user_id: string;
    client_id: string;
    title: string;
    status: string;
    source_type: string;
    created_at: string;
    updated_at: string;
}

export interface CreateChatbotPayload {
    config_id: string;
    title: string;
}

export interface ChatbotResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: Chatbot;
}

export interface ChatbotListResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: Chatbot[];
}

export interface DocumentUploadResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
        status: string;
        message: string;
        doc_id: string;
        chatbot_name: string;
    };
}

export const chatbotService = {
    createChatbot: async (payload: CreateChatbotPayload): Promise<ChatbotResponse> => {
        const response = await api.post('/chatbot/chatbot/', payload);
        return response.data;
    },

    getChatbots: async (userId: string, clientId: string): Promise<ChatbotListResponse> => {
        const response = await api.get('/chatbot/chatbot/', {
            params: { user_id: userId, client_id: clientId },
            ...({ skipAuth: true } as any)
        });
        return response.data;
    },

    getChatbot: async (id: string): Promise<ChatbotResponse> => {
        const response = await api.get(`/chatbot/chatbot/${id}`, {
            ...({ skipAuth: true } as any)
        });
        return response.data;
    },

    uploadDocument: async (file: File, chatbotId: string, configId: string): Promise<DocumentUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatbot_id', chatbotId);
        formData.append('config_id', configId);

        const response = await api.post('/document/document/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    askQuestion: async (chatbotId: string, question: string): Promise<any> => {
        const response = await api.post('/chat/chat/ask', {
            chatbot_id: chatbotId,
            question: question
        });
        return response.data;
    }
};
