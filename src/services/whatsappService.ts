

export interface WhatsAppTemplate {
    id: string;
    name: string;
    language: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    status: 'APPROVED' | 'PENDING' | 'REJECTED';
    components: {
        type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
        text?: string;
        format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
        buttons?: any[];
    }[];
    createdAt: string;
}

export interface WhatsAppCampaign {
    id: string;
    name: string;
    templateId: string;
    templateName: string;
    totalRecipients: number;
    stats: {
        sent: number;
        delivered: number;
        read: number;
        failed: number;
    };
    status: 'COMPLETED' | 'PROCESSING' | 'SCHEDULED';
    createdAt: string;
}

// Mock Data
const MOCK_TEMPLATES: WhatsAppTemplate[] = [
    {
        id: '1',
        name: 'black_friday_promo',
        language: 'en_US',
        category: 'MARKETING',
        status: 'APPROVED',
        components: [
            { type: 'HEADER', format: 'IMAGE' },
            { type: 'BODY', text: 'Hey {{1}}, check out our Black Friday deals! Up to 50% off on all items.' },
            { type: 'FOOTER', text: 'Opt-out to unsubscribe' },
            { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Shop Now' }] }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'order_confirmation',
        language: 'en_US',
        category: 'UTILITY',
        status: 'APPROVED',
        components: [
            { type: 'BODY', text: 'Your order #{{1}} has been confirmed and will ship soon.' },
        ],
        createdAt: new Date().toISOString()
    }
];

const MOCK_CAMPAIGNS: WhatsAppCampaign[] = [
    {
        id: '1',
        name: 'November Newsletter',
        templateId: '1',
        templateName: 'black_friday_promo',
        totalRecipients: 1000,
        stats: { sent: 1000, delivered: 980, read: 450, failed: 20 },
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
    }
];

export interface WhatsAppPhoneNumber {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    status: 'VERIFIED' | 'PENDING' | 'OFFLINE';
    code_verification_status: 'VERIFIED' | 'NOT_VERIFIED' | 'EXPIRED';
}

const MOCK_NUMBERS: WhatsAppPhoneNumber[] = [
    {
        id: '1',
        display_phone_number: '+1 555 010 1234',
        verified_name: 'Acme Corp Support',
        quality_rating: 'GREEN',
        status: 'VERIFIED',
        code_verification_status: 'VERIFIED'
    }
];


export const whatsappService = {
    getTemplates: async (): Promise<WhatsAppTemplate[]> => {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        return [...MOCK_TEMPLATES];
    },

    createTemplate: async (data: Omit<WhatsAppTemplate, 'id' | 'status' | 'createdAt'>): Promise<WhatsAppTemplate> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newTemplate: WhatsAppTemplate = {
            ...data,
            id: crypto.randomUUID(),
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        MOCK_TEMPLATES.unshift(newTemplate);
        return newTemplate;
    },

    getCampaigns: async (): Promise<WhatsAppCampaign[]> => {
        await new Promise(resolve => setTimeout(resolve, 600));
        return [...MOCK_CAMPAIGNS];
    },

    createCampaign: async (name: string, templateId: string, file: File): Promise<WhatsAppCampaign> => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const template = MOCK_TEMPLATES.find(t => t.id === templateId);
        const newCampaign: WhatsAppCampaign = {
            id: crypto.randomUUID(),
            name,
            templateId,
            templateName: template?.name || 'Unknown',
            totalRecipients: Math.floor(Math.random() * 500) + 10,
            stats: { sent: 0, delivered: 0, read: 0, failed: 0 },
            status: 'PROCESSING',
            createdAt: new Date().toISOString()
        };
        MOCK_CAMPAIGNS.unshift(newCampaign);
        return newCampaign;
    },

    getStats: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            total_messages: 12540,
            delivered_rate: 98.5,
            campaigns_count: 12,
            failed_count: 145
        }
    },

    getPhoneNumbers: async (): Promise<WhatsAppPhoneNumber[]> => {
        await new Promise(resolve => setTimeout(resolve, 700));
        return [...MOCK_NUMBERS];
    },

    registerPhoneNumber: async (phoneNumber: string, displayName: string) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Simulate OTP sent
        return { success: true, message: "OTP sent to " + phoneNumber };
    },

    verifyOTP: async (phoneNumber: string, code: string) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (code === '123456') {
            const newNumber: WhatsAppPhoneNumber = {
                id: crypto.randomUUID(),
                display_phone_number: phoneNumber,
                verified_name: 'New Number',
                quality_rating: 'GREEN',
                status: 'VERIFIED',
                code_verification_status: 'VERIFIED'
            };
            MOCK_NUMBERS.push(newNumber);
            return { success: true };
        }
        throw new Error("Invalid OTP Code");
    }
};
