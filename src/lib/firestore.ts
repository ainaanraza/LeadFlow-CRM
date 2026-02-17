import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { Lead, LeadActivity, LeadFollowup, PipelineStage, EmailTemplate, EmailLog, User, DEFAULT_STAGES } from '@/types';
import { calculateLeadScore } from './scoring';
import { generateId } from './utils';

// ---- USERS ----
export async function getUsers(): Promise<User[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
}

export async function getUser(id: string): Promise<User | null> {
    const snap = await getDoc(doc(db, 'users', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', id), data as Record<string, unknown>);
}

// ---- LEADS ----
export async function getLeads(): Promise<Lead[]> {
    const snap = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead));
}

export async function getLeadsByRep(repId: string): Promise<Lead[]> {
    const snap = await getDocs(query(collection(db, 'leads'), where('assignedRep', '==', repId), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lead));
}

export async function getLead(id: string): Promise<Lead | null> {
    const snap = await getDoc(doc(db, 'leads', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Lead) : null;
}

export async function createLead(data: Omit<Lead, 'id' | 'score' | 'scoreReasons' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const { score, reasons } = calculateLeadScore(data as Partial<Lead>);
    const now = new Date().toISOString();
    const ref = await addDoc(collection(db, 'leads'), {
        ...data,
        score,
        scoreReasons: reasons,
        createdAt: now,
        updatedAt: now,
    });
    return ref.id;
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<void> {
    const { score, reasons } = calculateLeadScore(data as Partial<Lead>);
    await updateDoc(doc(db, 'leads', id), {
        ...data,
        score,
        scoreReasons: reasons,
        updatedAt: new Date().toISOString(),
    } as Record<string, unknown>);
}

export async function deleteLead(id: string): Promise<void> {
    await deleteDoc(doc(db, 'leads', id));
}

// ---- LEAD ACTIVITIES ----
export async function getActivities(leadId: string): Promise<LeadActivity[]> {
    const snap = await getDocs(query(collection(db, 'lead_activities'), where('leadId', '==', leadId), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadActivity));
}

export async function createActivity(data: Omit<LeadActivity, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'lead_activities'), {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return ref.id;
}

// ---- LEAD FOLLOWUPS ----
export async function getFollowups(leadId?: string): Promise<LeadFollowup[]> {
    let q;
    if (leadId) {
        q = query(collection(db, 'lead_followups'), where('leadId', '==', leadId), orderBy('dateTime', 'asc'));
    } else {
        q = query(collection(db, 'lead_followups'), orderBy('dateTime', 'asc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadFollowup));
}

export async function getFollowupsByRep(repId: string): Promise<LeadFollowup[]> {
    const snap = await getDocs(query(collection(db, 'lead_followups'), where('createdBy', '==', repId), orderBy('dateTime', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadFollowup));
}

export async function createFollowup(data: Omit<LeadFollowup, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'lead_followups'), {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return ref.id;
}

export async function updateFollowup(id: string, data: Partial<LeadFollowup>): Promise<void> {
    await updateDoc(doc(db, 'lead_followups', id), data as Record<string, unknown>);
}

// ---- PIPELINE STAGES ----
export async function getStages(): Promise<PipelineStage[]> {
    const snap = await getDocs(query(collection(db, 'pipeline_stages'), orderBy('order', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PipelineStage));
}

export async function initializeStages(): Promise<void> {
    const existing = await getStages();
    if (existing.length === 0) {
        for (const stage of DEFAULT_STAGES) {
            await addDoc(collection(db, 'pipeline_stages'), stage);
        }
    }
}

export async function updateStage(id: string, data: Partial<PipelineStage>): Promise<void> {
    await updateDoc(doc(db, 'pipeline_stages', id), data as Record<string, unknown>);
}

export async function createStage(data: Omit<PipelineStage, 'id'>): Promise<string> {
    const ref = await addDoc(collection(db, 'pipeline_stages'), data);
    return ref.id;
}

export async function deleteStage(id: string): Promise<void> {
    await deleteDoc(doc(db, 'pipeline_stages', id));
}

// ---- EMAIL TEMPLATES ----
export async function getTemplates(): Promise<EmailTemplate[]> {
    const snap = await getDocs(query(collection(db, 'email_templates'), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmailTemplate));
}

export async function createTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'email_templates'), {
        ...data,
        createdAt: new Date().toISOString(),
    });
    return ref.id;
}

export async function updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<void> {
    await updateDoc(doc(db, 'email_templates', id), data as Record<string, unknown>);
}

export async function deleteTemplate(id: string): Promise<void> {
    await deleteDoc(doc(db, 'email_templates', id));
}

// ---- EMAIL LOGS ----
export async function getEmailLogs(leadId: string): Promise<EmailLog[]> {
    const snap = await getDocs(query(collection(db, 'email_logs'), where('leadId', '==', leadId), orderBy('sentAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmailLog));
}

export async function createEmailLog(data: Omit<EmailLog, 'id' | 'sentAt'>): Promise<string> {
    const ref = await addDoc(collection(db, 'email_logs'), {
        ...data,
        sentAt: new Date().toISOString(),
    });
    return ref.id;
}
