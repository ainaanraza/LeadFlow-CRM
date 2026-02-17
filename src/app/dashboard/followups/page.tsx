'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getFollowups, getFollowupsByRep, updateFollowup } from '@/lib/firestore'; // Removed getLead to optimize if possible, or keep if needed. Wait, original used getLead. I should keep it or fetch leads differently.
import { getLead } from '@/lib/firestore';
import { LeadFollowup } from '@/types';
import { formatDateTime, isOverdue, isToday } from '@/lib/utils';
import Link from 'next/link';

export default function FollowupsPage() {
    const { user } = useAuth();
    const [followups, setFollowups] = useState<(LeadFollowup & { leadName?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!user) return;
        try {
            const fups = user.role === 'admin' ? await getFollowups() : await getFollowupsByRep(user.id);
            // Enrich with lead names. Ideally this should be done in backend or store leadName in followup.
            // For now, fetching each lead might be slow if many followups. 
            // Optimally we should have leadName in the followup document.
            // Assuming we don't, I'll keep the logic but maybe we can optimize later.
            const enriched = await Promise.all(
                fups.map(async (f) => {
                    // Start of simple caching or optimization could go here? 
                    // No, for now just replicate functionality.
                    const lead = await getLead(f.leadId);
                    return { ...f, leadName: lead?.name || 'Unknown' };
                })
            );
            setFollowups(enriched);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [user]);

    // Grouping
    const overdue = followups.filter(f => f.status === 'pending' && isOverdue(f.dateTime) && !isToday(f.dateTime));
    const today = followups.filter(f => f.status === 'pending' && isToday(f.dateTime));
    const upcoming = followups.filter(f => f.status === 'pending' && !isOverdue(f.dateTime) && !isToday(f.dateTime));
    const done = followups.filter(f => f.status === 'done');

    const handleToggle = async (id: string, currentStatus: string) => {
        await updateFollowup(id, { status: currentStatus === 'done' ? 'pending' : 'done' });
        await loadData();
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading follow-ups...</div>;

    const Section = ({ title, icon, items, color, borderColor }: { title: string; icon: string; items: (LeadFollowup & { leadName?: string })[]; color: string; borderColor: string }) => (
        <div className="card-base" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2559' }}>{title}</h3>
                <span style={{ padding: '4px 12px', borderRadius: 12, background: `${color}15`, color: color, fontSize: 14, fontWeight: 700 }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.length > 0 ? items.map(f => (
                    <div key={f.id} style={{ display: 'flex', gap: 16, padding: '16px', background: '#F4F7FE', borderRadius: 16, alignItems: 'center' }}>
                        <button onClick={() => handleToggle(f.id, f.status)}
                            style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${f.status === 'done' ? '#05CD99' : color}`, background: f.status === 'done' ? '#05CD99' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, flexShrink: 0, transition: 'all 0.2s' }}>
                            {f.status === 'done' && '✓'}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: f.status === 'done' ? '#A3AED0' : '#1B2559', textDecoration: f.status === 'done' ? 'line-through' : 'none', marginBottom: 4 }}>{f.description}</p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#A3AED0', flexWrap: 'wrap' }}>
                                <Link href={`/dashboard/leads/${f.leadId}`} style={{ color: '#4318FF', textDecoration: 'none', fontWeight: 600 }}>{f.leadName}</Link>
                                <span>•</span>
                                <span>{formatDateTime(f.dateTime)}</span>
                                {f.createdByName && <><span>•</span><span>{f.createdByName}</span></>}
                            </div>
                        </div>
                    </div>
                )) : <p style={{ color: '#A3AED0', fontSize: 14, textAlign: 'center', padding: 20 }}>No follow-ups here for now.</p>}
            </div>
        </div>
    );

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>Follow-ups</h1>
                <p style={{ color: '#A3AED0', fontSize: 13, marginTop: 4 }}>Track and manage all your scheduled follow-ups and tasks</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {overdue.length > 0 && <Section title="Overdue" icon="🔴" items={overdue} color="#EE5D50" borderColor="#FEE2E2" />}
                    <Section title="Today" icon="" items={today} color="#FFB547" borderColor="#FEF3C7" />
                    <Section title="Upcoming" icon="" items={upcoming} color="#4318FF" borderColor="#E0E7FF" />
                </div>
                <div>
                    <Section title="Completed" icon="" items={done} color="#05CD99" borderColor="#D1FAE5" />
                </div>
            </div>
        </div>
    );
}
