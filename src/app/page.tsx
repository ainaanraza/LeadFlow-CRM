'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
    const { user } = useAuth(); // Note: useAuth might cause hydration mismatch if not handled carefully, but for now it's client side rendered.

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(11, 20, 55, 0.9) 0%, rgba(27, 37, 89, 0.9) 100%), url("/landing-bg.jpg") center/cover no-repeat', color: 'white', fontFamily: 'var(--font-dm-sans)' }}>
            {/* Navbar */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', maxWidth: 1280, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#4318FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 18 }}>LF</div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px' }}>LeadFlow</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    {user ? (
                        <Link href="/dashboard" style={{ padding: '12px 28px', borderRadius: 14, background: '#4318FF', color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: 14, transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(67, 24, 255, 0.4)' }}>
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" style={{ padding: '12px 28px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: 14, transition: 'all 0.2s', background: 'rgba(255,255,255,0.05)' }}>
                                Log In
                            </Link>
                            <Link href="/signup" style={{ padding: '12px 28px', borderRadius: 14, background: '#4318FF', color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: 14, transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(67, 24, 255, 0.4)' }}>
                                Start Free
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '100px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
                <div className="animate-fadeIn">
                    <span style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 30, background: 'rgba(67, 24, 255, 0.2)', color: '#A3AED0', fontSize: 13, fontWeight: 700, marginBottom: 32, border: '1px solid rgba(67, 24, 255, 0.4)' }}>
                        AI-Powered Lead Scoring Built In
                    </span>
                    <h1 style={{ fontSize: 'clamp(42px, 6vw, 64px)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
                        Turn Leads Into <br /> Revenue With <span style={{ color: '#4318FF', background: 'white', padding: '0 12px', borderRadius: 8 }}>LeadFlow</span>
                    </h1>
                    <p style={{ fontSize: 18, color: '#A3AED0', lineHeight: 1.6, maxWidth: 600, margin: '0 auto 48px' }}>
                        The smart CRM that helps your sales team manage leads, track pipelines, schedule follow-ups, and close deals faster.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/signup" style={{ padding: '16px 40px', borderRadius: 16, background: '#4318FF', color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: 16, boxShadow: '0 10px 30px rgba(67, 24, 255, 0.3)', transition: 'transform 0.2s' }}>
                            Get Started Free →
                        </Link>
                        <Link href="/login" style={{ padding: '16px 40px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 600, textDecoration: 'none', fontSize: 16, transition: 'all 0.2s' }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '60px 24px 100px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                    {[
                        { title: 'Pipeline Management', desc: 'Drag-and-drop Kanban board to visualize your entire sales pipeline at a glance.' },
                        { title: 'AI Lead Scoring', desc: 'Automatically score leads 0-100 based on data quality, source, and pipeline stage.' },
                        { title: 'Follow-up Tracking', desc: 'Never miss a follow-up with smart reminders for overdue, today, and upcoming tasks.' },
                        { title: 'Email Templates', desc: 'Create and send templated emails to leads with one click. All logs tracked per lead.' },
                        { title: 'Analytics Dashboard', desc: 'Real-time dashboards with conversion rates, pipeline value, and top performer rankings.' },
                        { title: 'Role-Based Access', desc: 'Separate views for Admins and Sales Reps. Secure, organized, and efficient.' },
                    ].map((f, i) => (
                        <div key={i} className="animate-fadeIn" style={{ background: '#111C44', borderRadius: 24, padding: 32, border: '1px solid #1B2559', animationDelay: `${i * 0.08}s`, animationFillMode: 'backwards', transition: 'transform 0.2s' }}>

                            <h3 style={{ color: 'white', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{f.title}</h3>
                            <p style={{ color: '#A3AED0', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid #1B2559', background: '#0B1437' }}>
                <p style={{ color: '#707EAE', fontSize: 14, fontWeight: 500 }}>© 2026 LeadFlow CRM. All rights reserved.</p>
            </footer>
        </div>
    );
}
