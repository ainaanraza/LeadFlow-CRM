export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'rep';
    avatarUrl?: string;
    createdAt: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    location?: string;
    source: 'LinkedIn' | 'Website' | 'Referral' | 'Cold Call' | 'Advertisement' | 'Other';
    status: string;
    assignedRep: string;
    assignedRepName?: string;
    expectedValue: number;
    notes?: string;
    tags: string[];
    score: number;
    scoreReasons: string[];
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface LeadActivity {
    id: string;
    leadId: string;
    type: 'note' | 'call' | 'email' | 'whatsapp' | 'meeting';
    content: string;
    createdBy: string;
    createdByName?: string;
    createdAt: string;
}

export interface LeadFollowup {
    id: string;
    leadId: string;
    dateTime: string;
    description: string;
    status: 'pending' | 'done' | 'overdue';
    createdBy: string;
    createdByName?: string;
    createdAt: string;
}

export interface PipelineStage {
    id: string;
    name: string;
    order: number;
    color: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    createdBy: string;
    createdAt: string;
}

export interface EmailLog {
    id: string;
    leadId: string;
    leadName?: string;
    templateId: string;
    templateName?: string;
    subject: string;
    body: string;
    sentBy: string;
    sentByName?: string;
    sentAt: string;
}

export const DEFAULT_STAGES: Omit<PipelineStage, 'id'>[] = [
    { name: 'New', order: 0, color: '#6366f1' },
    { name: 'Contacted', order: 1, color: '#8b5cf6' },
    { name: 'Qualified', order: 2, color: '#a78bfa' },
    { name: 'Proposal', order: 3, color: '#f59e0b' },
    { name: 'Negotiation', order: 4, color: '#f97316' },
    { name: 'Won', order: 5, color: '#10b981' },
    { name: 'Lost', order: 6, color: '#ef4444' },
];

export const LEAD_SOURCES = ['LinkedIn', 'Website', 'Referral', 'Cold Call', 'Advertisement', 'Other'] as const;
