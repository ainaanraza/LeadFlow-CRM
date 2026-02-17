'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getUsers, updateUser, getLeads } from '@/lib/firestore';
import { User, Lead } from '@/types';
import { getInitials, formatDate } from '@/lib/utils';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [u, l] = await Promise.all([getUsers(), getLeads()]);
            setUsers(u);
            setLeads(l);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { if (currentUser?.role === 'admin') loadData(); }, [currentUser]);

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'rep') => {
        await updateUser(userId, { role: newRole });
        await loadData();
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>Loading users...</div>;

    if (currentUser?.role !== 'admin') {
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
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>Users</h1>
                <p style={{ color: '#A3AED0', fontSize: 13, marginTop: 4 }}>Manage sales reps and admins</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {users.map(u => {
                    const userLeads = leads.filter(l => l.assignedRep === u.id);
                    const wonLeads = userLeads.filter(l => l.status === 'Won');
                    const winRate = userLeads.length > 0 ? ((wonLeads.length / userLeads.length) * 100).toFixed(0) : 0;

                    return (
                        <div key={u.id} className="card-base card-hover" style={{ padding: 24, transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                <div style={{ width: 50, height: 50, borderRadius: '14px', background: '#F4F7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4318FF', fontWeight: 700, fontSize: 18 }}>
                                    {getInitials(u.name)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontSize: 16, color: '#1B2559', marginBottom: 2 }}>{u.name}</p>
                                    <p style={{ fontSize: 13, color: '#A3AED0' }}>{u.email}</p>
                                </div>
                                <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value as 'admin' | 'rep')}
                                    disabled={u.id === currentUser.id}
                                    style={{ padding: '6px 12px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, color: u.role === 'admin' ? '#4318FF' : '#2B3674', background: u.role === 'admin' ? '#E0E7FF' : '#F4F7FE', cursor: u.id === currentUser.id ? 'not-allowed' : 'pointer', outline: 'none' }}>
                                    <option value="admin">Admin</option>
                                    <option value="rep">Sales Rep</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#F4F7FE', borderRadius: 12 }}>
                                    <p style={{ fontWeight: 700, fontSize: 18, color: '#4318FF' }}>{userLeads.length}</p>
                                    <p style={{ fontSize: 11, fontWeight: 500, color: '#A3AED0' }}>Leads</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#F4F7FE', borderRadius: 12 }}>
                                    <p style={{ fontWeight: 700, fontSize: 18, color: '#05CD99' }}>{wonLeads.length}</p>
                                    <p style={{ fontSize: 11, fontWeight: 500, color: '#A3AED0' }}>Won</p>
                                </div>
                                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#F4F7FE', borderRadius: 12 }}>
                                    <p style={{ fontWeight: 700, fontSize: 18, color: '#1B2559' }}>{winRate}%</p>
                                    <p style={{ fontSize: 11, fontWeight: 500, color: '#A3AED0' }}>Win Rate</p>
                                </div>
                            </div>

                            {u.createdAt && (
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F4F7FE', textAlign: 'center' }}>
                                    <p style={{ fontSize: 12, color: '#A3AED0', fontWeight: 500 }}>Joined {formatDate(u.createdAt)}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {users.length === 0 && <div style={{ textAlign: 'center', padding: 64, color: '#A3AED0' }}>No users found.</div>}
        </div>
    );
}
