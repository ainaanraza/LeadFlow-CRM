'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getLeads, getLeadsByRep, getFollowupsByRep, getFollowups, getUsers } from '@/lib/firestore';
import { Lead, LeadFollowup, User } from '@/types';
import { formatCurrency, isToday, isOverdue, formatDate, getInitials } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [followups, setFollowups] = useState<LeadFollowup[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const [l, f, u] = await Promise.all([
                    user.role === 'admin' ? getLeads() : getLeadsByRep(user.id),
                    user.role === 'admin' ? getFollowups() : getFollowupsByRep(user.id),
                    user.role === 'admin' ? getUsers() : Promise.resolve([]),
                ]);
                setLeads(l);
                setFollowups(f);
                setUsers(u);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
    }, [user]);

    if (loading || !user) {
        return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading dashboard...</div>;
    }

    // Calculations
    const wonLeads = leads.filter(l => l.status === 'Won');
    const lostLeads = leads.filter(l => l.status === 'Lost');
    const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
    const revenue = wonLeads.reduce((s, l) => s + (l.expectedValue || 0), 0);
    const pipelineValue = activeLeads.reduce((s, l) => s + (l.expectedValue || 0), 0);
    const conversionRate = leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : '0.0';

    // Follow-ups
    const todayFollowups = followups.filter(f => isToday(f.dateTime));
    const overdueFollowups = followups.filter(f => isOverdue(f.dateTime));

    // Admin: Top Reps Calculation
    const topReps = users.map(u => {
        const repLeads = leads.filter(l => l.assignedRep === u.id);
        const repWon = repLeads.filter(l => l.status === 'Won');
        const repRevenue = repWon.reduce((s, l) => s + (l.expectedValue || 0), 0);
        return { ...u, wonCount: repWon.length, revenue: repRevenue };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Monthly data for chart
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0).map((_, i) => {
        return leads.filter(l => {
            const d = new Date(l.createdAt);
            return d.getMonth() === i && d.getFullYear() === currentYear;
        }).reduce((s, l) => s + (l.expectedValue || 0), 0);
    });
    const maxVal = Math.max(...monthlyData, 1);
    const chartBars = monthlyData.map(v => (v / maxVal) * 100);

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>
                    {user.role === 'admin' ? 'Company Overview' : 'My Performance'}
                </h2>
                <p style={{ color: '#A3AED0', fontSize: 14, marginTop: 4 }}>
                    {user.role === 'admin' ? 'Track company-wide performance and metrics' : 'Track your sales pipeline and tasks'}
                </p>
            </div>

            {/* Top Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>

                {/* Revenue Card */}
                <div className="card-base gradient-blue" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                    <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.9, marginBottom: 8 }}>{user.role === 'admin' ? 'Total Revenue' : 'Won Revenue'}</p>
                    <h3 style={{ fontSize: 32, fontWeight: 700 }}>{formatCurrency(revenue).replace('.00', '')}</h3>
                    <div style={{ marginTop: 12, fontSize: 13, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                        {wonLeads.length} Deals Won
                    </div>
                </div>

                {/* Pipeline Card */}
                <div className="card-base" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#A3AED0' }}>Pipeline Value</p>
                        <span style={{ fontSize: 20, color: '#4318FF' }}></span>
                    </div>
                    <h3 style={{ fontSize: 28, fontWeight: 700, color: '#1B2559' }}>{formatCurrency(pipelineValue).replace('.00', '')}</h3>
                    <p style={{ fontSize: 13, color: '#A3AED0', marginTop: 8 }}><span style={{ color: '#05CD99', fontWeight: 600 }}>{activeLeads.length}</span> Active Leads</p>
                </div>

                {/* Conversion Card */}
                <div className="card-base" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#A3AED0' }}>Conversion Rate</p>
                        <span style={{ fontSize: 20, color: '#05CD99' }}></span>
                    </div>
                    <h3 style={{ fontSize: 28, fontWeight: 700, color: '#1B2559' }}>{conversionRate}%</h3>
                    <p style={{ fontSize: 13, color: '#A3AED0', marginTop: 8 }}>Won / Total Leads</p>
                </div>

                {/* Tasks Card */}
                <div className="card-base" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#A3AED0' }}>Today's Tasks</p>
                        <span style={{ fontSize: 20, color: '#FFB547' }}></span>
                    </div>
                    <h3 style={{ fontSize: 28, fontWeight: 700, color: '#1B2559' }}>{todayFollowups.length}</h3>
                    <p style={{ fontSize: 13, color: '#EE5D50', marginTop: 8 }}><span style={{ fontWeight: 600 }}>{overdueFollowups.length}</span> Overdue</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>

                {/* Left Column: Chart */}
                <div className="card-base" style={{ padding: 24, minHeight: 400 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2559', marginBottom: 32 }}>Revenue Trend ({new Date().getFullYear()})</h3>
                    {/* CSS Bar Chart */}
                    <div style={{ height: 280, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingBottom: 20, borderBottom: '1px solid #E9EDF7' }}>
                        {chartBars.map((h, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                                <div style={{
                                    width: '100%',
                                    maxWidth: 30,
                                    height: h > 0 ? `${Math.max(h, 5)}%` : '2%',
                                    background: i % 2 === 0 ? '#4318FF' : '#868CFF',
                                    borderRadius: '8px 8px 0 0',
                                    transition: 'height 1s ease',
                                    opacity: h > 0 ? 1 : 0.3
                                }} title={`Month ${i + 1}: ${formatCurrency(monthlyData[i])}`} />
                                <span style={{ fontSize: 11, color: '#A3AED0', fontWeight: 600 }}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i].substring(0, 1)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Top Reps (Admin) or Today's Follow-ups (Rep) */}
                <div className="card-base" style={{ padding: 24, minHeight: 400 }}>
                    {user.role === 'admin' ? (
                        <>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2559', marginBottom: 24 }}>Top Performers</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {topReps.map((rep, i) => (
                                    <div key={rep.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#FFB547' : i === 1 ? '#A3AED0' : i === 2 ? '#E96868' : '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i < 3 ? 'white' : '#A3AED0' }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4318FF', fontWeight: 700, fontSize: 14 }}>
                                            {getInitials(rep.name)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 14, fontWeight: 700, color: '#1B2559' }}>{rep.name}</p>
                                            <p style={{ fontSize: 12, color: '#A3AED0' }}>{rep.wonCount} Deals Won</p>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#05CD99' }}>
                                            {formatCurrency(rep.revenue).split('.')[0]}
                                        </div>
                                    </div>
                                ))}
                                {topReps.length === 0 && <p style={{ color: '#A3AED0', fontSize: 14, textAlign: 'center' }}>No data yet.</p>}
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1B2559', marginBottom: 24 }}>Today's Tasks</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {todayFollowups.map((f) => (
                                    <div key={f.id} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 12, background: '#F4F7FE' }}>
                                        <div style={{ fontSize: 18 }}></div>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1B2559' }}>{f.description}</p>
                                            <Link href={`/dashboard/leads/${f.leadId}`} style={{ fontSize: 12, color: '#4318FF', textDecoration: 'none' }}>View Lead →</Link>
                                        </div>
                                    </div>
                                ))}
                                {todayFollowups.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 32, color: '#A3AED0' }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                                        <p>No tasks for today.</p>
                                    </div>
                                )}
                                <Link href="/dashboard/followups" className="btn-pill ghost" style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', marginTop: 12 }}>
                                    View All Tasks
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
