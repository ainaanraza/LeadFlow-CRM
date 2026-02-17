'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState, useMemo } from 'react';
import { getLeads, getLeadsByRep, createLead, updateLead, deleteLead, getUsers, getStages, initializeStages } from '@/lib/firestore';
import { Lead, User, PipelineStage, LEAD_SOURCES } from '@/types';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LeadsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filters from URL
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const filterStage = searchParams.get('stage') || 'All';
    const filterSource = searchParams.get('source') || 'All';
    const filterRep = searchParams.get('rep') || 'All';
    const dateStart = searchParams.get('start');
    const dateEnd = searchParams.get('end');
    const filterTags = searchParams.get('tags') || '';

    const [form, setForm] = useState<Partial<Lead>>({ name: '', email: '', phone: '', company: '', expectedValue: 0, status: 'New', source: 'Website', tags: [] });

    const loadData = async () => {
        if (!user) return;
        try {
            const [u, s] = await Promise.all([getUsers(), getStages()]);
            let steps = s;
            if (s.length === 0) {
                await initializeStages();
                steps = await getStages();
            }
            // Deduplicate stages
            const uniqueStages = Array.from(new Map(steps.map(st => [st.name, st])).values());
            uniqueStages.sort((a, b) => (a.order || 0) - (b.order || 0));

            setUsers(u);
            setStages(uniqueStages);

            const l = user.role === 'admin' ? await getLeads() : await getLeadsByRep(user.id);
            setLeads(l);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [user]);

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStage = filterStage === 'All' || l.status === filterStage;
            const matchesSource = filterSource === 'All' || l.source === filterSource;
            const matchesRep = filterRep === 'All' || l.assignedRep === filterRep;
            const matchesDate = (!dateStart || new Date(l.createdAt) >= new Date(dateStart)) &&
                (!dateEnd || new Date(l.createdAt) <= new Date(dateEnd + 'T23:59:59'));
            const matchesTags = !filterTags || (l.tags && l.tags.some(t => t.toLowerCase().includes(filterTags.toLowerCase())));

            return matchesSearch && matchesStage && matchesSource && matchesRep && matchesDate && matchesTags;
        });
    }, [leads, searchQuery, filterStage, filterSource, filterRep, dateStart, dateEnd, filterTags]);

    const handleCreate = async () => {
        if (!form.name || !form.company) return;
        setLoading(true);
        // Admin creates: assign to self or first rep? Default to self for now.
        // Or if form has assignedRep, use it.
        const assignedId = form.assignedRep || user!.id;
        const assignedName = users.find(u => u.id === assignedId)?.name || user!.name;

        await createLead({
            ...form as any,
            assignedRep: assignedId,
            assignedRepName: assignedName,
            createdBy: user!.id,

            tags: Array.isArray(form.tags) ? form.tags : []
        });
        setShowModal(false);
        setForm({ name: '', email: '', phone: '', company: '', expectedValue: 0, status: 'New', source: 'Website', tags: [] });
        await loadData(); // Reload to get fresh list
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this lead?')) {
            await deleteLead(id);
            setLeads(prev => prev.filter(l => l.id !== id));
        }
    };

    const handleExport = () => {
        const headers = ['Name', 'Company', 'Email', 'Phone', 'Status', 'Value', 'Source', 'Assigned Rep'];
        const csvContent = [
            headers.join(','),
            ...filteredLeads.map(l =>
                `"${l.name}","${l.company}","${l.email || ''}","${l.phone || ''}","${l.status}","${l.expectedValue}","${l.source}","${l.assignedRepName}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n').filter(Boolean).slice(1); // Skip header

            setLoading(true);
            for (const line of lines) {
                // Simple CSV parse (handling quotes roughly)
                const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
                if (cols.length < 2) continue;
                // Assume format: Name,Company,Email,Phone,Status,Value,Source
                await createLead({
                    name: cols[0] || 'Unknown',
                    company: cols[1] || 'Unknown',
                    email: cols[2] || '',
                    phone: cols[3] || '',
                    status: cols[4] || 'New',
                    expectedValue: Number(cols[5]) || 0,
                    source: (cols[6] || 'Import') as any,
                    assignedRep: user!.id,
                    assignedRepName: user!.name,
                    createdBy: user!.id,

                    tags: ['Imported']
                });
            }
            await loadData();
        };
        reader.readAsText(file);
    };

    const getScoreClass = (score: number) => score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
    const statusClass = (s: string) => `status-${s.toLowerCase().replace(/\s/g, '')}`;

    if (loading && leads.length === 0) return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading leads...</div>;

    const fieldStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E9EDF7', fontSize: 13, outline: 'none', background: '#F4F7FE', color: '#1B2559' };
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600 as const, color: '#1B2559', marginBottom: 6 };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>{user?.role === 'admin' ? 'All Leads' : 'My Leads'}</h1>
                    <p style={{ color: '#A3AED0', fontSize: 13, marginTop: 4 }}>{user?.role === 'admin' ? 'Manage and track all leads in the system' : 'Track and manage your assigned leads'}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleExport} className="btn-pill ghost" style={{ background: 'white', border: '1px solid #E9EDF7' }}>Export CSV</button>
                    {user?.role === 'admin' && (
                        <label className="btn-pill ghost" style={{ background: 'white', border: '1px solid #E9EDF7', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            Import CSV
                            <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
                        </label>
                    )}
                    <button onClick={() => setShowModal(true)} className="btn-pill" style={{ background: '#4318FF', color: 'white' }}>+ New Lead</button>
                </div>
            </div>



            <div className="card-base" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                        <thead style={{ background: '#F4F7FE' }}>
                            <tr>
                                {['Name', 'Company', 'Status', 'Score', 'Value', 'Source', 'Assigned', 'Created', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#A3AED0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} style={{ borderBottom: '1px solid #F4F7FE', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4318FF', fontWeight: 700, fontSize: 14 }}>
                                                {getInitials(lead.name)}
                                            </div>
                                            <div>
                                                <Link href={`/dashboard/leads/${lead.id}`} style={{ display: 'block', fontWeight: 700, fontSize: 14, color: '#1B2559', textDecoration: 'none' }}>{lead.name}</Link>
                                                <span style={{ fontSize: 12, color: '#A3AED0' }}>{lead.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: 14, color: '#1B2559', fontWeight: 500 }}>{lead.company}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span className={statusClass(lead.status)} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{lead.status}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span className={getScoreClass(lead.score)} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{lead.score}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px', fontWeight: 600, fontSize: 14, color: '#1B2559' }}>
                                        {formatCurrency(lead.expectedValue)}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: 13, color: '#A3AED0' }}>
                                        {lead.source}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: 13, color: '#1B2559', fontWeight: 500 }}>
                                        {lead.assignedRepName}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontSize: 13, color: '#A3AED0' }}>
                                        {formatDate(lead.createdAt)}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Link href={`/dashboard/leads/${lead.id}`} style={{ padding: '6px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#F4F7FE', color: '#A3AED0', fontSize: 14 }}>✏️</Link>
                                            {user?.role === 'admin' && (
                                                <button onClick={() => handleDelete(lead.id)} style={{ padding: '6px', cursor: 'pointer', borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#EE5D50', fontSize: 14 }}>🗑️</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#A3AED0' }}>
                                        No leads found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
                    <div className="animate-scaleIn card-base" style={{ width: '100%', maxWidth: 600, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1B2559' }}>Add New Lead</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#A3AED0' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Full Name</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={fieldStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Company</label>
                                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Inc" style={fieldStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@acme.com" style={fieldStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 890" style={fieldStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Expected Value</label>
                                <input type="number" value={form.expectedValue} onChange={e => setForm(f => ({ ...f, expectedValue: Number(e.target.value) }))} style={fieldStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Source</label>
                                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as Lead['source'] }))} style={fieldStyle}>
                                    {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Stage</label>
                                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={fieldStyle}>
                                    {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            {user?.role === 'admin' && (
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={labelStyle}>Assign To</label>
                                    <select value={form.assignedRep || user.id} onChange={e => setForm(f => ({ ...f, assignedRep: e.target.value }))} style={fieldStyle}>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                    </select>
                                </div>
                            )}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>Tags (comma separated)</label>
                                <input value={Array.isArray(form.tags) ? form.tags.join(',') : ''} onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',') }))} placeholder="vip, hot lead, q3" style={fieldStyle} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
                            <button onClick={() => setShowModal(false)} className="btn-pill ghost" style={{ background: 'white', border: '1px solid #E9EDF7', color: '#1B2559' }}>Cancel</button>
                            <button onClick={handleCreate} className="btn-pill" style={{ background: '#4318FF', color: 'white' }}>Create Lead</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
