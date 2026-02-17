'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth'; // Ensure this path is correct based on your previous tool outputs

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth(); // Assuming resetPassword exists in useAuth

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Simulated delay if resetPassword is fast
            await new Promise(resolve => setTimeout(resolve, 800));
            await resetPassword(email);
            setSent(true);
        } catch (err: any) {
            // In a real app, don't expose if email exists or not for security, but for this demo shows error
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FE', padding: 20 }}>
            <div className="animate-scaleIn card-base" style={{ width: '100%', maxWidth: 420, padding: '48px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#1B2559', letterSpacing: '-0.5px', marginBottom: 24, display: 'inline-block' }}>
                            LeadFlow<span style={{ color: '#4318FF' }}>.</span>
                        </div>
                    </Link>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1B2559', marginBottom: 8, letterSpacing: '-0.5px' }}>Reset Password</h1>
                    <p style={{ color: '#A3AED0', fontSize: 14 }}>Enter your email to receive a reset link</p>
                </div>

                {sent ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#E0E7FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, color: '#4318FF' }}>✉️</div>
                        <h3 style={{ color: '#1B2559', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Check your email</h3>
                        <p style={{ color: '#A3AED0', fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>
                            We sent a password reset link to <br /><span style={{ color: '#1B2559', fontWeight: 600 }}>{email}</span>
                        </p>
                        <Link href="/login" className="btn-pill ghost" style={{ width: '100%', display: 'inline-block', padding: '12px', fontSize: 14, background: 'transparent', color: '#4318FF' }}>
                            ← Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{ padding: '12px', background: '#FEE2E2', border: '1px solid #EE5D50', borderRadius: 12, color: '#EE5D50', fontSize: 13, marginBottom: 24, textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B2559', marginBottom: 8 }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="mail@example.com"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: 16,
                                    border: '1px solid #E9EDF7',
                                    fontSize: 14,
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    color: '#1B2559',
                                    background: 'white'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#4318FF'}
                                onBlur={(e) => e.target.style.borderColor = '#E9EDF7'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: 16,
                                background: '#4318FF',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: 14,
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 10px 20px rgba(67, 24, 255, 0.2)'
                            }}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <Link href="/login" style={{ color: '#A3AED0', fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#4318FF'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#A3AED0'}>
                                ← Back to Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </div>

            <div style={{ position: 'fixed', bottom: 20, color: '#A3AED0', fontSize: 12 }}>
                © 2026 LeadFlow CRM
            </div>
        </div>
    );
}
