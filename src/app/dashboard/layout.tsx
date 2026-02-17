'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import GlobalSearch from '@/components/GlobalSearch';

const adminNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Leads', href: '/dashboard/leads' },
    { label: 'Pipeline', href: '/dashboard/pipeline' },
    { label: 'Users', href: '/dashboard/users' },
    { label: 'Templates', href: '/dashboard/templates' },
    { label: 'Settings', href: '/dashboard/settings' },
];

const repNavItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Leads', href: '/dashboard/leads' },
    { label: 'Pipeline', href: '/dashboard/pipeline' },
    { label: 'Follow-ups', href: '/dashboard/followups' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FE' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #7c5cfc, #6d4ced)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20, marginBottom: 16 }}>LF</div>
                    <p style={{ color: '#A3AED0', fontSize: 14 }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = user.role === 'admin' ? adminNavItems : repNavItems;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FE' }}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
            )}

            {/* Sidebar */}
            <aside style={{
                width: 280,
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                bottom: 0,
                left: sidebarOpen ? 0 : '-280px',
                zIndex: 50,
                transition: 'left 0.3s ease',
                padding: '30px 20px',
            }}
                className="sidebar-desktop"
            >
                {/* Logo */}
                <div style={{ padding: '0 12px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#1B2559', letterSpacing: '-0.5px' }}>
                        LeadFlow<span style={{ color: '#4318FF' }}>.</span>
                    </div>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', marginBottom: 20 }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderRadius: 20,
                                    background: isActive ? '#4318FF' : 'transparent',
                                    color: isActive ? 'white' : '#A3AED0',
                                    textDecoration: 'none', fontSize: 15, fontWeight: isActive ? 700 : 500,
                                    transition: 'all 0.2s ease',
                                    boxShadow: isActive ? '0px 10px 20px rgba(67, 24, 255, 0.2)' : 'none',
                                    flexShrink: 0
                                }}>
                                <span style={{ fontSize: 20 }}></span>
                                {item.label}
                                {isActive && <div style={{ marginLeft: 'auto', width: 4, height: 4, background: 'white', borderRadius: '50%' }} />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section (Bottom) */}
                <div style={{ marginTop: 'auto', padding: '20px', background: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)', borderRadius: 24, color: 'white', position: 'relative', overflow: 'hidden', flexShrink: 0, boxShadow: '0 20px 40px rgba(67, 24, 255, 0.2)' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2, marginBottom: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4318FF', fontWeight: 800, flexShrink: 0, fontSize: 16 }}>
                            {getInitials(user.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                            <p style={{ fontSize: 11, opacity: 0.9, fontWeight: 500 }}>{user.role === 'admin' ? 'Administrator' : 'Sales Representative'}</p>
                        </div>
                    </div>
                    <button onClick={logout} style={{ width: '100%', padding: '12px', background: 'white', borderRadius: 14, border: 'none', color: '#4318FF', fontSize: 13, fontWeight: 700, cursor: 'pointer', zIndex: 2, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span></span> Log Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, marginLeft: 280, minWidth: 0, display: 'flex', flexDirection: 'column' }} className="main-content">
                {/* Top bar */}
                <header style={{
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '20px 24px 0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    background: '#F4F7FE'
                }}>
                    <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"
                        style={{ display: 'none', padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', marginRight: 12, fontSize: 20 }}>
                        ☰
                    </button>

                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: '#707EAE', fontWeight: 500 }}>Pages / {pathname.split('/').pop()?.charAt(0).toUpperCase()}{pathname.split('/').pop()?.slice(1) || 'Dashboard'}</p>
                        <h2 style={{ fontSize: 30, fontWeight: 700, color: '#1B2559', letterSpacing: '-0.5px' }}>
                            {pathname === '/dashboard' ? (user.role === 'admin' ? 'Overview' : 'My Performance') : (pathname.split('/').pop() || '').charAt(0).toUpperCase() + (pathname.split('/').pop() || '').slice(1)}
                        </h2>
                    </div>

                    <div style={{ background: 'white', padding: '10px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '14px 17px 40px 4px rgba(112, 144, 176, 0.08)' }}>
                        <GlobalSearch />
                        <span style={{ color: '#A3AED0', cursor: 'pointer' }}></span>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#11047A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                            {getInitials(user.name)}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ padding: '24px 24px 40px' }}>
                    {children}
                </main>
            </div>

            {/* Responsive styles */}
            <style jsx global>{`
        @media (min-width: 769px) {
          .sidebar-desktop {
            left: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
        </div>
    );
}
