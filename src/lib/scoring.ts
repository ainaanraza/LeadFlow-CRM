import { Lead } from '@/types';

interface ScoreResult {
    score: number;
    reasons: string[];
}

export function calculateLeadScore(lead: Partial<Lead>): ScoreResult {
    let score = 0;
    const reasons: string[] = [];

    // Has email (+15)
    if (lead.email && lead.email.trim() !== '') {
        score += 15;
        reasons.push('Has email address (+15)');
    }

    // Has phone (+15)
    if (lead.phone && lead.phone.trim() !== '') {
        score += 15;
        reasons.push('Has phone number (+15)');
    }

    // Has company (+15)
    if (lead.company && lead.company.trim() !== '') {
        score += 15;
        reasons.push('Has company info (+15)');
    }

    // Source quality
    const sourceScores: Record<string, number> = {
        'Referral': 20,
        'LinkedIn': 20,
        'Website': 10,
        'Cold Call': 5,
        'Advertisement': 10,
        'Other': 5,
    };
    const sourceScore = sourceScores[lead.source || 'Other'] || 5;
    score += sourceScore;
    reasons.push(`Source: ${lead.source || 'Other'} (+${sourceScore})`);

    // Stage progression
    const stageScores: Record<string, number> = {
        'New': 5,
        'Contacted': 10,
        'Qualified': 15,
        'Proposal': 25,
        'Negotiation': 30,
        'Won': 35,
        'Lost': 0,
    };
    const stageScore = stageScores[lead.status || 'New'] || 5;
    score += stageScore;
    reasons.push(`Stage: ${lead.status || 'New'} (+${stageScore})`);

    return { score: Math.min(score, 100), reasons };
}
