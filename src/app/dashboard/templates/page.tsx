'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/lib/firestore';
import { EmailTemplate } from '@/types';
import { formatDate } from '@/lib/utils';

export default function TemplatesPage() {
    const { user } = useAuth();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<EmailTemplate | null>(null);
    const [form, setForm] = useState({ name: '', subject: '', body: '' });
    const [saving, setSaving] = useState(false);

    const loadData = async () => {
        try { setTemplates(await getTemplates()); } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async () => {
        if (!form.name.trim() || !form.subject.trim()) return;
        setSaving(true);
        try {
            if (editing) {
                await updateTemplate(editing.id, form);
            } else {
                await createTemplate({ ...form, createdBy: user!.id });
            }
            setShowForm(false);
            setEditing(null);
            setForm({ name: '', subject: '', body: '' });
            await loadData();
        } catch (e) { console.error(e); }
        setSaving(false);
    };

    const handleEdit = (t: EmailTemplate) => {
        setEditing(t);
        setForm({ name: t.name, subject: t.subject, body: t.body });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this template?')) {
            await deleteTemplate(id);
            await loadData();
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading templates...</div>;

    if (user?.role !== 'admin') {
        return (
            <div style={{ textAlign: 'center', padding: 64 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559' }}>Access Denied</h2>
                <p style={{ color: '#A3AED0' }}>You do not have permission to view this page.</p>
            </div>
        );
    }

    const fieldStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E9EDF7', fontSize: 13, outline: 'none', background: '#F4F7FE', color: '#1B2559' };
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600 as const, color: '#1B2559', marginBottom: 6 };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>Email Templates</h1>
                    <p style={{ color: '#A3AED0', fontSize: 13, marginTop: 4 }}>Create and manage repetitive email templates for your team</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', subject: '', body: '' }); setShowForm(true); }}
                    className="btn-pill" style={{ background: '#4318FF', color: 'white' }}>
                    + New Template
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                {templates.map(t => (
                    <div key={t.id} className="card-base card-hover" style={{ padding: 24, transition: 'transform 0.2s', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B2559', marginBottom: 4 }}>{t.name}</h3>
                                <p style={{ fontSize: 13, color: '#A3AED0' }}>Subject: <span style={{ color: '#1B2559' }}>{t.subject}</span></p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => handleEdit(t)} style={{ padding: '6px', borderRadius: 8, border: 'none', background: '#F4F7FE', color: '#A3AED0', cursor: 'pointer', transition: 'all 0.2s' }}>✏️</button>
                                <button onClick={() => handleDelete(t.id)} style={{ padding: '6px', borderRadius: 8, border: 'none', background: '#FEE2E2', color: '#EE5D50', cursor: 'pointer', transition: 'all 0.2s' }}>🗑️</button>
                            </div>
                        </div>
                        <div style={{ background: '#F4F7FE', borderRadius: 12, padding: 16, fontSize: 13, color: '#707EAE', lineHeight: 1.6, maxHeight: 120, overflow: 'hidden', marginBottom: 16 }}>
                            {t.body}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <p style={{ color: '#A3AED0' }}>Created {formatDate(t.createdAt)}</p>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ background: '#E0E7FF', color: '#4318FF', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{'{leadName}'}</span>
                                <span style={{ background: '#E0E7FF', color: '#4318FF', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{'{company}'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && !showForm && (
                <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0', background: 'rgba(255,255,255,0.5)', borderRadius: 20, border: '2px dashed #E9EDF7' }}>
                    <p style={{ fontSize: 40, marginBottom: 16 }}>📧</p>
                    <p style={{ fontSize: 16, fontWeight: 500, color: '#1B2559' }}>No templates yet.</p>
                    <p>Create a new template to get started!</p>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
                    <div className="animate-scaleIn card-base" style={{ width: '100%', maxWidth: 560, padding: 32, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1B2559' }}>{editing ? 'Edit Template' : 'New Template'}</h2>
                            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#A3AED0' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gap: 20 }}>
                            <div><label style={labelStyle}>Template Name</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Welcome Email" style={fieldStyle} />
                            </div>
                            <div><label style={labelStyle}>Subject</label>
                                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Hello {{leadName}}!" style={fieldStyle} />
                            </div>
                            <div><label style={labelStyle}>Body</label>
                                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={8} placeholder="Use {{leadName}} and {{company}} as variables..." style={{ ...fieldStyle, resize: 'vertical' as const }} />
                            </div>
                            <p style={{ fontSize: 13, color: '#A3AED0' }}>Available variables: <span style={{ color: '#4318FF', fontWeight: 600 }}>{'{{leadName}}'}</span>, <span style={{ color: '#4318FF', fontWeight: 600 }}>{'{{company}}'}</span></p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                                <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn-pill ghost" style={{ background: 'white', border: '1px solid #E9EDF7', color: '#1B2559' }}>Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="btn-pill" style={{ background: '#4318FF', color: 'white', opacity: saving ? 0.7 : 1 }}>
                                    {saving ? 'Saving...' : editing ? 'Update Template' : 'Create Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
