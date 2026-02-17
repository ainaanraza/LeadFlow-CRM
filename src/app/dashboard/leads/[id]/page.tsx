'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getLead, updateLead, getActivities, createActivity, getFollowups, createFollowup, updateFollowup, getEmailLogs, createEmailLog, getTemplates, getStages, getUsers } from '@/lib/firestore';
import { Lead, LeadActivity, LeadFollowup, EmailLog, EmailTemplate, PipelineStage, User, LEAD_SOURCES } from '@/types';
import { formatCurrency, formatDate, formatDateTime, getInitials, isOverdue, isToday } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';

export default function LeadDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const leadId = params.id as string;

    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<LeadActivity[]>([]);
    const [followups, setFollowups] = useState<LeadFollowup[]>([]);
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Activity form
    const [actType, setActType] = useState<LeadActivity['type']>('note');
    const [actContent, setActContent] = useState('');
    // Followup form
    const [fuDate, setFuDate] = useState('');
    const [fuDesc, setFuDesc] = useState('');
    // Email form
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    // Documents (Links)
    const [docName, setDocName] = useState('');
    const [docLink, setDocLink] = useState('');
    // Edit mode
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    const loadData = async () => {
        try {
            const [l, a, f, e, t, s, u] = await Promise.all([
                getLead(leadId), getActivities(leadId), getFollowups(leadId),
                getEmailLogs(leadId), getTemplates(), getStages(), getUsers()
            ]);
            setLead(l); setActivities(a); setFollowups(f); setEmailLogs(e);

            // Deduplicate stages
            const uniqueStages = Array.from(new Map(s.map(st => [st.name, st])).values());
            uniqueStages.sort((a, b) => (a.order || 0) - (b.order || 0));

            setTemplates(t); setStages(uniqueStages); setUsers(u);
            if (l) setEditForm({ ...l, tags: l.tags?.join(', ') || '' });
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [leadId]);

    const handleAddActivity = async () => {
        if (!actContent.trim()) return;
        await createActivity({ leadId, type: actType, content: actContent, createdBy: user!.id, createdByName: user!.name });
        setActContent('');
        await loadData();
    };

    const handleAddFollowup = async () => {
        if (!fuDate || !fuDesc.trim()) return;
        await createFollowup({ leadId, dateTime: fuDate, description: fuDesc, status: 'pending', createdBy: user!.id, createdByName: user!.name });
        setFuDate(''); setFuDesc('');
        await loadData();
    };

    const handleSendEmail = async () => {
        if (!emailSubject.trim() || !emailBody.trim()) return;
        const tmpl = templates.find(t => t.id === selectedTemplate);
        await createEmailLog({ leadId, leadName: lead!.name, templateId: selectedTemplate, templateName: tmpl?.name || 'Custom', subject: emailSubject, body: emailBody, sentBy: user!.id, sentByName: user!.name });
        setEmailSubject(''); setEmailBody(''); setSelectedTemplate('');
        await loadData();
    };

    const handleAddDocument = async () => {
        if (!docName.trim() || !docLink.trim()) return;
        // Store as a 'document' type activity for now, since we don't have a separate files table setup yet in this limited context.
        // Or better, just append to notes/description or create a special activity.
        // Let's create an activity of type 'note' but with special prefix "DOCUMENT:"
        await createActivity({
            leadId,
            type: 'note', // Using 'note' generic type for now
            content: `DOCUMENT: [${docName}](${docLink})`,
            createdBy: user!.id,
            createdByName: user!.name
        });
        setDocName(''); setDocLink('');
        await loadData();
    };

    const handleSaveEdit = async () => {
        const repUser = users.find(u => u.id === editForm.assignedRep);
        await updateLead(leadId, { ...editForm, tags: typeof editForm.tags === 'string' ? editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : editForm.tags, assignedRepName: repUser?.name || editForm.assignedRepName, expectedValue: Number(editForm.expectedValue) });
        setEditing(false);
        await loadData();
    };

    const handleTemplateSelect = (tid: string) => {
        setSelectedTemplate(tid);
        const t = templates.find(te => te.id === tid);
        if (t && lead) {
            setEmailSubject(t.subject.replace(/\{\{leadName\}\}/g, lead.name).replace(/\{\{company\}\}/g, lead.company));
            setEmailBody(t.body.replace(/\{\{leadName\}\}/g, lead.name).replace(/\{\{company\}\}/g, lead.company));
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading lead details...</div>;
    if (!lead) return <div style={{ textAlign: 'center', padding: 64 }}><p style={{ fontSize: 20, marginBottom: 12, color: '#1B2559' }}>Lead not found</p><button onClick={() => router.back()} style={{ color: '#4318FF', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Go back</button></div>;

    const getScoreClass = (s: number) => s >= 70 ? 'score-high' : s >= 40 ? 'score-medium' : 'score-low';
    const statusClass = (s: string) => `status-${s.toLowerCase().replace(/\s/g, '')}`;
    const activityIcons: Record<string, string> = { note: '📝', call: '📞', email: '📧', whatsapp: '💬', meeting: '🤝' };

    const tabs = ['overview', 'activities', 'follow-ups', 'emails', 'documents'];
    const fieldStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E9EDF7', fontSize: 13, outline: 'none', background: '#F4F7FE', color: '#1B2559' };
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600 as const, color: '#1B2559', marginBottom: 6 };

    // Parse activities for documents
    const documents = activities.filter(a => a.content.startsWith('DOCUMENT:'));
    const regularActivities = activities.filter(a => !a.content.startsWith('DOCUMENT:'));

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 14, color: '#A3AED0' }}>
                <button onClick={() => router.push('/dashboard/leads')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4318FF', fontWeight: 600, fontSize: 14 }}>← Leads</button>
                <span>/</span>
                <span style={{ color: '#1B2559', fontWeight: 600 }}>{lead.name}</span>
            </div>

            {/* Lead header card */}
            <div className="card-base" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4318FF', fontWeight: 700, fontSize: 24 }}>{getInitials(lead.name)}</div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', marginBottom: 4, letterSpacing: '-0.5px' }}>{lead.name}</h1>
                            <p style={{ color: '#A3AED0', fontSize: 14 }}>{lead.company} · {lead.location}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                <span className={statusClass(lead.status)} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{lead.status}</span>
                                <span className={getScoreClass(lead.score)} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>Score: {lead.score}</span>
                                <span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#EFF4FB', color: '#1B2559' }}>{formatCurrency(lead.expectedValue)}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setEditing(!editing)} className="btn-pill ghost" style={{ background: 'white', border: '1px solid #E9EDF7', color: '#1B2559' }}>
                        {editing ? '✕ Cancel' : '✏️ Edit'}
                    </button>
                </div>

                {/* AI Score Breakdown */}
                {lead.scoreReasons && lead.scoreReasons.length > 0 && (
                    <div style={{ marginTop: 20, padding: 16, background: '#F4F7FE', borderRadius: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#4318FF', marginBottom: 8 }}>🤖 AI Score Breakdown</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {lead.scoreReasons.map((r, i) => (
                                <span key={i} style={{ padding: '4px 12px', background: 'white', borderRadius: 8, fontSize: 12, color: '#1B2559', fontWeight: 500 }}>{r}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, paddingBottom: 0, overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`btn-tab ${activeTab === tab ? 'active' : ''}`}
                        style={{ textTransform: 'capitalize', fontSize: 14, padding: '10px 24px' }}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                    <div className="card-base" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1B2559' }}>Lead Information</h3>
                        {editing ? (
                            <div style={{ display: 'grid', gap: 16 }}>
                                {[
                                    { label: 'Name', key: 'name' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' },
                                    { label: 'Company', key: 'company' }, { label: 'Location', key: 'location' },
                                ].map(f => (
                                    <div key={f.key}><label style={labelStyle}>{f.label}</label>
                                        <input value={editForm[f.key] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [f.key]: e.target.value }))} style={fieldStyle} /></div>
                                ))}
                                <div><label style={labelStyle}>Source</label>
                                    <select value={editForm.source} onChange={e => setEditForm((p: any) => ({ ...p, source: e.target.value }))} style={fieldStyle}>
                                        {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div><label style={labelStyle}>Stage</label>
                                    <select value={editForm.status} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))} style={fieldStyle}>
                                        {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div><label style={labelStyle}>Expected Value</label>
                                    <input type="number" value={editForm.expectedValue} onChange={e => setEditForm((p: any) => ({ ...p, expectedValue: e.target.value }))} style={fieldStyle} />
                                </div>
                                <div><label style={labelStyle}>Tags</label>
                                    <input value={editForm.tags} onChange={e => setEditForm((p: any) => ({ ...p, tags: e.target.value }))} style={fieldStyle} />
                                </div>
                                <div><label style={labelStyle}>Notes</label>
                                    <textarea value={editForm.notes} onChange={e => setEditForm((p: any) => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...fieldStyle, resize: 'vertical' as const }} />
                                </div>
                                <button onClick={handleSaveEdit} className="btn-pill" style={{ background: '#4318FF', color: 'white', marginTop: 8 }}>Save Changes</button>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 20 }}>
                                {[
                                    { label: 'Email', value: lead.email, icon: '📧' },
                                    { label: 'Phone', value: lead.phone, icon: '📞' },
                                    { label: 'Company', value: lead.company, icon: '🏢' },
                                    { label: 'Location', value: lead.location, icon: '📍' },
                                    { label: 'Source', value: lead.source, icon: '🔗' },
                                    { label: 'Assigned to', value: lead.assignedRepName, icon: '👤' },
                                    { label: 'Created', value: formatDate(lead.createdAt), icon: '📅' },
                                ].map(f => (
                                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{f.icon}</div>
                                        <div><p style={{ fontSize: 12, color: '#A3AED0', fontWeight: 500, marginBottom: 2 }}>{f.label}</p><p style={{ fontSize: 14, color: '#1B2559', fontWeight: 600 }}>{f.value || '—'}</p></div>
                                    </div>
                                ))}
                                {lead.tags?.length > 0 && (
                                    <div><p style={{ fontSize: 12, color: '#A3AED0', fontWeight: 500, marginBottom: 8 }}>Tags</p>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {lead.tags.map((t, i) => <span key={i} style={{ padding: '6px 14px', background: '#F4F7FE', color: '#4318FF', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{t}</span>)}
                                        </div>
                                    </div>
                                )}
                                {lead.notes && (
                                    <div><p style={{ fontSize: 12, color: '#A3AED0', fontWeight: 500, marginBottom: 8 }}>Notes</p>
                                        <p style={{ fontSize: 14, color: '#1B2559', lineHeight: 1.6, background: '#F4F7FE', padding: 16, borderRadius: 12 }}>{lead.notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'activities' && (
                <div className="card-base" style={{ padding: 24 }}>
                    <div style={{ marginBottom: 24, padding: 20, background: '#F4F7FE', borderRadius: 16 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            {(['note', 'call', 'email', 'whatsapp', 'meeting'] as const).map(t => (
                                <button key={t} onClick={() => setActType(t)}
                                    style={{ padding: '8px 16px', borderRadius: 12, border: actType === t ? 'none' : '1px solid #E9EDF7', background: actType === t ? '#4318FF' : 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: actType === t ? 'white' : '#A3AED0', transition: 'all 0.2s' }}>
                                    {activityIcons[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <textarea value={actContent} onChange={e => setActContent(e.target.value)} placeholder={`Add a ${actType} note...`} rows={2}
                                style={{ flex: 1, ...fieldStyle, background: 'white', border: 'none', resize: 'vertical' as const }} />
                            <button onClick={handleAddActivity} className="btn-pill" style={{ background: '#4318FF', color: 'white', alignSelf: 'flex-end' }}>Add</button>
                        </div>
                    </div>
                    {regularActivities.map(a => (
                        <div key={a.id} className="animate-slideIn" style={{ display: 'flex', gap: 16, padding: '20px 0', borderBottom: '1px solid #F4F7FE' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color: '#4318FF' }}>{activityIcons[a.type]}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#4318FF', textTransform: 'capitalize' }}>{a.type}</span>
                                    <span style={{ fontSize: 12, color: '#A3AED0' }}>{formatDateTime(a.createdAt)}</span>
                                </div>
                                <p style={{ fontSize: 14, color: '#1B2559', lineHeight: 1.6 }}>{a.content}</p>
                                <p style={{ fontSize: 12, color: '#A3AED0', marginTop: 6, fontWeight: 500 }}>by {a.createdByName}</p>
                            </div>
                        </div>
                    ))}
                    {regularActivities.length === 0 && <p style={{ textAlign: 'center', color: '#A3AED0', padding: 40, fontSize: 14 }}>No activities recorded yet. Start by adding one above!</p>}
                </div>
            )}

            {activeTab === 'follow-ups' && (
                <div className="card-base" style={{ padding: 24 }}>
                    <div style={{ marginBottom: 24, padding: 20, background: '#F4F7FE', borderRadius: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={labelStyle}>Date & Time</label>
                            <input type="datetime-local" value={fuDate} onChange={e => setFuDate(e.target.value)} style={{ ...fieldStyle, background: 'white', border: 'none' }} />
                        </div>
                        <div style={{ flex: '2 1 300px' }}>
                            <label style={labelStyle}>Description</label>
                            <input value={fuDesc} onChange={e => setFuDesc(e.target.value)} placeholder="Follow-up description..." style={{ ...fieldStyle, background: 'white', border: 'none' }} />
                        </div>
                        <button onClick={handleAddFollowup} className="btn-pill" style={{ background: '#4318FF', color: 'white' }}>Add</button>
                    </div>
                    {followups.map(f => (
                        <div key={f.id} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid #F4F7FE', alignItems: 'center' }}>
                            <button onClick={async () => { await updateFollowup(f.id, { status: f.status === 'done' ? 'pending' : 'done' }); await loadData(); }}
                                style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${f.status === 'done' ? '#05CD99' : isOverdue(f.dateTime) && !isToday(f.dateTime) ? '#EE5D50' : '#E9EDF7'}`, background: f.status === 'done' ? '#05CD99' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, flexShrink: 0, transition: 'all 0.2s' }}>
                                {f.status === 'done' && '✓'}
                            </button>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 14, color: f.status === 'done' ? '#A3AED0' : '#1B2559', textDecoration: f.status === 'done' ? 'line-through' : 'none', fontWeight: 600 }}>{f.description}</p>
                                <p style={{ fontSize: 12, color: isOverdue(f.dateTime) && f.status !== 'done' && !isToday(f.dateTime) ? '#EE5D50' : '#A3AED0', marginTop: 4, fontWeight: 500 }}>
                                    {isToday(f.dateTime) ? '📅 Today' : isOverdue(f.dateTime) && f.status !== 'done' ? '⚠️ Overdue' : ''} · {formatDateTime(f.dateTime)}
                                </p>
                            </div>
                        </div>
                    ))}
                    {followups.length === 0 && <p style={{ textAlign: 'center', color: '#A3AED0', padding: 40, fontSize: 14 }}>No follow-ups scheduled.</p>}
                </div>
            )}

            {activeTab === 'emails' && (
                <div className="card-base" style={{ padding: 24 }}>
                    <div style={{ marginBottom: 24, padding: 20, background: '#F4F7FE', borderRadius: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <label style={labelStyle}>Template</label>
                            <select value={selectedTemplate} onChange={e => handleTemplateSelect(e.target.value)} style={{ ...fieldStyle, background: 'white', border: 'none' }}>
                                <option value="">Select a template...</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={labelStyle}>Subject</label>
                            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} style={{ ...fieldStyle, background: 'white', border: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Body</label>
                            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={4} style={{ ...fieldStyle, background: 'white', border: 'none', resize: 'vertical' as const }} />
                        </div>
                        <button onClick={handleSendEmail} className="btn-pill" style={{ background: '#4318FF', color: 'white' }}>📧 Send Email</button>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1B2559' }}>Email Log</h3>
                    {emailLogs.map(e => (
                        <div key={e.id} style={{ padding: '16px 0', borderBottom: '1px solid #F4F7FE' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#1B2559' }}>{e.subject}</p>
                                <span style={{ fontSize: 12, color: '#A3AED0' }}>{formatDateTime(e.sentAt)}</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#707EAE', lineHeight: 1.6 }}>{e.body.slice(0, 150)}{e.body.length > 150 ? '...' : ''}</p>
                            <p style={{ fontSize: 11, color: '#A3AED0', marginTop: 6, fontWeight: 500 }}>Sent by {e.sentByName} · Template: {e.templateName}</p>
                        </div>
                    ))}
                    {emailLogs.length === 0 && <p style={{ textAlign: 'center', color: '#A3AED0', padding: 40, fontSize: 14 }}>No emails sent yet.</p>}
                </div>
            )}

            {activeTab === 'documents' && (
                <div className="card-base" style={{ padding: 24 }}>
                    <div style={{ marginBottom: 24, padding: 20, background: '#F4F7FE', borderRadius: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, alignItems: 'end' }}>
                            <div>
                                <label style={labelStyle}>Document Name</label>
                                <input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Proposal PDF" style={{ ...fieldStyle, background: 'white', border: 'none' }} />
                            </div>
                            <div>
                                <label style={labelStyle}>Link URL</label>
                                <input value={docLink} onChange={e => setDocLink(e.target.value)} placeholder="https://drive.google.com/..." style={{ ...fieldStyle, background: 'white', border: 'none' }} />
                            </div>
                            <button onClick={handleAddDocument} className="btn-pill" style={{ background: '#4318FF', color: 'white' }}>+ Add Link</button>
                        </div>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#1B2559' }}>Documents</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {documents.map(d => {
                            // Parse "DOCUMENT: [Name](Link)"
                            const match = d.content.match(/DOCUMENT: \[(.*?)\]\((.*?)\)/);
                            const name = match ? match[1] : 'Document';
                            const link = match ? match[2] : '#';
                            return (
                                <a key={d.id} href={link} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'block', padding: 16, borderRadius: 16, background: 'white', border: '1px solid #E9EDF7', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                                    className="card-hover">
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
                                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1B2559', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                                    <p style={{ fontSize: 12, color: '#A3AED0' }}>Added {formatDate(d.createdAt)}</p>
                                </a>
                            );
                        })}
                    </div>
                    {documents.length === 0 && <p style={{ textAlign: 'center', color: '#A3AED0', padding: 40, fontSize: 14 }}>No documents linked.</p>}
                </div>
            )}
        </div>
    );
}
