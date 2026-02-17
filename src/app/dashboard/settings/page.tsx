'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getStages, createStage, updateStage, deleteStage, initializeStages } from '@/lib/firestore';
import { PipelineStage } from '@/types';

export default function SettingsPage() {
    const { user } = useAuth();
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#4318FF');
    const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

    const loadData = async () => {
        try {
            let s = await getStages();
            if (s.length === 0) { await initializeStages(); s = await getStages(); }

            // Deduplicate stages based on name
            const uniqueStages = Array.from(new Map(s.map(stage => [stage.name, stage])).values());

            // Sort by order
            uniqueStages.sort((a, b) => (a.order || 0) - (b.order || 0));

            setStages(uniqueStages);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { if (user?.role === 'admin') loadData(); }, [user]);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        await createStage({ name: newName, order: stages.length, color: newColor });
        setNewName(''); setNewColor('#4318FF');
        await loadData();
    };

    const handleSaveEdit = async () => {
        if (!editingStage || !editingStage.name.trim()) return;
        await updateStage(editingStage.id, { name: editingStage.name, color: editingStage.color });
        setEditingStage(null);
        await loadData();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this pipeline stage?')) {
            await deleteStage(id);
            await loadData();
        }
    };

    const fieldStyle = { padding: '12px 16px', borderRadius: 12, border: '1px solid #E9EDF7', fontSize: 13, outline: 'none', background: '#F4F7FE', color: '#1B2559' };

    if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading settings...</div>;

    if (user?.role !== 'admin') {
        return (
            <div style={{ textAlign: 'center', padding: 64 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559' }}>Access Denied</h2>
                <p style={{ color: '#A3AED0' }}>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>Settings</h1>
                <p style={{ color: '#A3AED0', fontSize: 13, marginTop: 4 }}>Configure your pipeline stages and other preferences</p>
            </div>

            <div className="card-base" style={{ padding: 24, maxWidth: 800 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2559', marginBottom: 20 }}>Pipeline Stages</h3>

                {/* Add new stage */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New stage name..."
                            style={{ width: '100%', ...fieldStyle }} />
                    </div>
                    <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                        style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #E9EDF7', cursor: 'pointer', padding: 4, background: 'white' }} />
                    <button onClick={handleAdd} className="btn-pill" style={{ background: '#4318FF', color: 'white' }}>Add Stage</button>
                </div>

                {/* Stages list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stages.map((stage) => (
                        <div key={stage.id} className="animate-slideIn" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'white', borderRadius: 16, border: '1px solid #F4F7FE', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                            {editingStage?.id === stage.id ? (
                                <>
                                    <input type="color" value={editingStage.color} onChange={e => setEditingStage({ ...editingStage, color: e.target.value })}
                                        style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #E9EDF7', cursor: 'pointer', padding: 2 }} />
                                    <input value={editingStage.name} onChange={e => setEditingStage({ ...editingStage, name: e.target.value })}
                                        style={{ flex: 1, ...fieldStyle, background: 'white' }} />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={handleSaveEdit} className="btn-pill" style={{ padding: '8px 16px', background: '#05CD99', fontSize: 12, color: 'white' }}>Save</button>
                                        <button onClick={() => setEditingStage(null)} className="btn-pill ghost" style={{ padding: '8px 16px', fontSize: 12, background: '#F4F7FE', color: '#A3AED0' }}>Cancel</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: stage.color, flexShrink: 0, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} />
                                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: '#1B2559' }}>{stage.name}</span>
                                    <span style={{ fontSize: 12, color: '#A3AED0', background: '#F4F7FE', padding: '4px 10px', borderRadius: 8, fontWeight: 500 }}>Order: {stage.order}</span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => setEditingStage(stage)}
                                            style={{ padding: '8px', borderRadius: 8, border: 'none', background: '#F4F7FE', color: '#A3AED0', cursor: 'pointer', transition: 'all 0.2s' }}>✏️</button>
                                        <button onClick={() => handleDelete(stage.id)}
                                            style={{ padding: '8px', borderRadius: 8, border: 'none', background: '#FEE2E2', color: '#EE5D50', cursor: 'pointer', transition: 'all 0.2s' }}>🗑️</button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {stages.length === 0 && <p style={{ color: '#A3AED0', textAlign: 'center' }}>No stages found.</p>}
                </div>

                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #F4F7FE' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B2559', marginBottom: 8 }}>Remove Duplicate Stages</h4>
                    <button onClick={async () => {
                        if (!confirm('This will delete ALL stages with duplicate names (keeping the first one found). Are you sure?')) return;
                        setLoading(true);
                        try {
                            let all = await getStages();
                            const seen = new Set<string>();
                            for (const s of all) {
                                const key = s.name.trim().toLowerCase();
                                if (seen.has(key)) {
                                    await deleteStage(s.id);
                                } else {
                                    seen.add(key);
                                }
                            }
                            await loadData();
                            alert('Duplicates cleaned up!');
                        } catch (e) {
                            console.error(e);
                            alert('Error cleaning up');
                        }
                        setLoading(false);
                    }} className="btn-pill" style={{ background: '#FEE2E2', color: '#EE5D50', border: 'none' }}>
                        Remove
                    </button>
                </div>
            </div >
        </div >
    );
}
