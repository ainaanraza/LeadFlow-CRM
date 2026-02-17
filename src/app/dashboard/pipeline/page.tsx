'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getLeads, getLeadsByRep, updateLead, getStages, initializeStages } from '@/lib/firestore';
import { Lead, PipelineStage } from '@/types';
import { formatCurrency, getInitials } from '@/lib/utils';
import Link from 'next/link';

export default function PipelinePage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedLead, setDraggedLead] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<string | null>(null);

    const loadData = async () => {
        if (!user) return;
        try {
            let s = await getStages();
            if (s.length === 0) { await initializeStages(); s = await getStages(); }

            // Deduplicate stages based on name
            const uniqueStages = Array.from(new Map(s.map(stage => [stage.name, stage])).values());

            // Sort by order manually if needed, assuming they come sorted but dedupe might mess with it if not careful
            uniqueStages.sort((a, b) => (a.order || 0) - (b.order || 0));

            setStages(uniqueStages);

            const l = user.role === 'admin' ? await getLeads() : await getLeadsByRep(user.id);
            setLeads(l);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [user]);

    const handleDragStart = (leadId: string) => { setDraggedLead(leadId); };
    const handleDragOver = (e: React.DragEvent, stageName: string) => { e.preventDefault(); setDragOverStage(stageName); };
    const handleDragLeave = () => { setDragOverStage(null); };
    const handleDrop = async (stageName: string) => {
        if (!draggedLead) return;
        const lead = leads.find(l => l.id === draggedLead);
        if (lead && lead.status !== stageName) {
            await updateLead(draggedLead, { ...lead, status: stageName });
            setLeads(prev => prev.map(l => l.id === draggedLead ? { ...l, status: stageName } : l));
        }
        setDraggedLead(null);
        setDragOverStage(null);
    };

    const getScoreClass = (s: number) => s >= 70 ? 'score-high' : s >= 40 ? 'score-medium' : 'score-low';

    if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading pipeline...</div>;

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>Pipeline Board</h1>
                <p style={{ color: '#A3AED0', fontSize: 13, marginTop: 4 }}>Drag and drop leads between stages to update their status</p>
            </div>

            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 24, minHeight: 'calc(100vh - 220px)' }}>
                {stages.map(stage => {
                    const stageLeads = leads.filter(l => l.status === stage.name);
                    const totalValue = stageLeads.reduce((s, l) => s + (l.expectedValue || 0), 0);
                    const isDragOver = dragOverStage === stage.name;

                    return (
                        <div key={stage.id}
                            className={`kanban-column-drop ${isDragOver ? 'drag-over' : ''}`}
                            onDragOver={(e) => handleDragOver(e, stage.name)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDrop(stage.name)}
                            style={{ minWidth: 300, maxWidth: 320, flex: '0 0 300px', background: isDragOver ? '#E0E7FF' : '#F4F7FE', borderRadius: 20, padding: 16, display: 'flex', flexDirection: 'column', transition: 'background 0.2s', border: '1px solid #E9EDF7' }}>
                            {/* Column header */}
                            <div style={{ padding: '8px 4px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: stage.color }} />
                                <span style={{ fontWeight: 700, fontSize: 16, color: '#1B2559', flex: 1 }}>{stage.name}</span>
                                <span style={{ padding: '4px 10px', borderRadius: 8, background: 'white', fontSize: 12, fontWeight: 700, color: '#1B2559', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>{stageLeads.length}</span>
                            </div>
                            <p style={{ fontSize: 12, color: '#A3AED0', fontWeight: 500, padding: '0 4px 16px', borderBottom: '1px solid #E9EDF7', marginBottom: 16 }}>Total Value: <span style={{ color: '#1B2559', fontWeight: 700 }}>{formatCurrency(totalValue)}</span></p>

                            {/* Cards */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4 }}>
                                {stageLeads.map(lead => (
                                    <div key={lead.id}
                                        draggable
                                        onDragStart={() => handleDragStart(lead.id)}
                                        className="card-base"
                                        style={{ padding: 16, cursor: 'grab', transition: 'transform 0.2s, box-shadow 0.2s', border: draggedLead === lead.id ? '2px solid #4318FF' : 'none' }}>
                                        <Link href={`/dashboard/leads/${lead.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4318FF', fontWeight: 700, fontSize: 12 }}>{getInitials(lead.name)}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1B2559', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</p>
                                                    <p style={{ fontSize: 12, color: '#A3AED0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <span style={{ fontWeight: 700, fontSize: 14, color: '#1B2559' }}>{formatCurrency(lead.expectedValue)}</span>
                                                <span className={getScoreClass(lead.score)} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{lead.score}</span>
                                            </div>
                                            {lead.tags?.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {lead.tags.slice(0, 2).map((t, i) => (
                                                        <span key={i} style={{ padding: '4px 8px', background: '#F4F7FE', color: '#4318FF', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </Link>
                                    </div>
                                ))}
                                {stageLeads.length === 0 && (
                                    <div style={{ padding: 24, textAlign: 'center', color: '#A3AED0', fontSize: 13, border: '2px dashed #E9EDF7', borderRadius: 12, background: 'rgba(255,255,255,0.5)' }}>
                                        No leads
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
