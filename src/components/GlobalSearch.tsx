'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUsers, getStages } from '@/lib/firestore';
import { User, PipelineStage, LEAD_SOURCES } from '@/types';

export default function GlobalSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State for filters
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [expanded, setExpanded] = useState(false);

    const [stage, setStage] = useState(searchParams.get('stage') || 'All');
    const [source, setSource] = useState(searchParams.get('source') || 'All');
    const [rep, setRep] = useState(searchParams.get('rep') || 'All');
    const [tags, setTags] = useState(searchParams.get('tags') || '');
    const [startDate, setStartDate] = useState(searchParams.get('start') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end') || '');

    // Data for dropdowns
    const [users, setUsers] = useState<User[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);

    useEffect(() => {
        // Load filter data
        const load = async () => {
            const [u, s] = await Promise.all([getUsers(), getStages()]);
            setUsers(u);

            // Deduplicate stages
            const uniqueStages = Array.from(new Map(s.map(st => [st.name, st])).values());
            uniqueStages.sort((a, b) => (a.order || 0) - (b.order || 0));
            setStages(uniqueStages);
        };
        load();
    }, []);

    // Effect to auto-apply search when typing (debounced slightly by nature of React state, but strictly enter key or button is better for UX)
    // Actually, for "Global Search", pressing Enter is standard. Filters usually apply immediately or on "Apply".
    // Let's apply immediately for simple fields, but maybe Enter for text?

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('q', searchTerm);
        if (stage !== 'All') params.set('stage', stage);
        if (source !== 'All') params.set('source', source);
        if (rep !== 'All') params.set('rep', rep);
        if (tags) params.set('tags', tags);
        if (startDate) params.set('start', startDate);
        if (endDate) params.set('end', endDate);

        // Always redirect to Leads page when searching/filtering globally, assuming leads are the primary resource.
        // User said "do not make it specifically for the lead page", but "global search bar".
        // It implies one search bar works everywhere.
        // If I am on /dashboard, and I search "foo", where do I go?
        // Usually, a global search results page OR filter the current view if applicable.
        // Given the app structure, redirecting to /dashboard/leads with filters is the most logical "action" for a CRM search.

        router.push(`/dashboard/leads?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilters();
            setExpanded(false); // Close dropdown on search
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStage('All');
        setSource('All');
        setRep('All');
        setTags('');
        setStartDate('');
        setEndDate('');
        router.push('/dashboard/leads');
    };

    const fieldStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E9EDF7', fontSize: 13, outline: 'none', background: '#F4F7FE', color: '#1B2559', marginBottom: 8 };

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F4F7FE', borderRadius: 49, padding: '10px 20px', width: expanded ? 400 : 220, transition: 'width 0.2s', position: 'relative', zIndex: 60 }}>
                <span onClick={applyFilters} style={{ marginRight: 8, cursor: 'pointer' }}>🔍</span>
                <input
                    placeholder="Global Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setExpanded(true)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#1B2559', width: '100%' }}
                />
                {expanded && (
                    <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#A3AED0' }}>✕</button>
                )}
            </div>

            {/* Advanced Filters Dropdown */}
            {expanded && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setExpanded(false)} />
                    <div className="animate-scaleIn" style={{ position: 'absolute', top: '120%', right: 0, width: 320, background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 20px 40px rgba(112, 144, 176, 0.18)', zIndex: 61, border: '1px solid #F4F7FE' }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1B2559', marginBottom: 12 }}>Advanced Filters</h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: '#A3AED0', marginBottom: 4, display: 'block' }}>Stage</label>
                                <select value={stage} onChange={e => setStage(e.target.value)} style={fieldStyle}>
                                    <option value="All">All Stages</option>
                                    {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: '#A3AED0', marginBottom: 4, display: 'block' }}>Source</label>
                                <select value={source} onChange={e => setSource(e.target.value)} style={fieldStyle}>
                                    <option value="All">All Sources</option>
                                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <label style={{ fontSize: 11, fontWeight: 600, color: '#A3AED0', marginBottom: 4, display: 'block' }}>Assigned Rep</label>
                        <select value={rep} onChange={e => setRep(e.target.value)} style={fieldStyle}>
                            <option value="All">All Representatives</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: '#A3AED0', marginBottom: 4, display: 'block' }}>Start Date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={fieldStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: '#A3AED0', marginBottom: 4, display: 'block' }}>End Date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={fieldStyle} />
                            </div>
                        </div>

                        <label style={{ fontSize: 11, fontWeight: 600, color: '#A3AED0', marginBottom: 4, display: 'block' }}>Tags</label>
                        <input placeholder="vip, hot..." value={tags} onChange={e => setTags(e.target.value)} style={fieldStyle} />

                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={clearFilters} style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#F4F7FE', color: '#A3AED0', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Reset</button>
                            <button onClick={() => { applyFilters(); setExpanded(false); }} style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#4318FF', color: 'white', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Apply Filters</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
