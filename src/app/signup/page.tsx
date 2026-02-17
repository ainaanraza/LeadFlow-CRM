'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await signup(name, email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FE', padding: 20 }}>
            <div className="animate-scaleIn card-base" style={{ width: '100%', maxWidth: 420, padding: '48px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1B2559', marginBottom: 8, letterSpacing: '-0.5px' }}>Sign Up</h1>
                    <p style={{ color: '#A3AED0', fontSize: 14 }}>Create your account to start managing leads</p>
                </div>

                {error && (
                    <div style={{ padding: '12px 16px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, color: '#dc2626', fontSize: 13, marginBottom: 24, fontWeight: 500 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1B2559', marginBottom: 8 }}>Full Name*</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="John Doe"
                            style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid #E9EDF7', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: 'transparent', color: '#1B2559' }}
                            onFocus={(e) => e.target.style.borderColor = '#4318FF'}
                            onBlur={(e) => e.target.style.borderColor = '#E9EDF7'}
                        />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1B2559', marginBottom: 8 }}>Email*</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="mail@simmmple.com"
                            style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid #E9EDF7', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: 'transparent', color: '#1B2559' }}
                            onFocus={(e) => e.target.style.borderColor = '#4318FF'}
                            onBlur={(e) => e.target.style.borderColor = '#E9EDF7'}
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#1B2559', marginBottom: 8 }}>Password*</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Min. 8 characters"
                                style={{ width: '100%', padding: '16px 50px 16px 20px', borderRadius: 16, border: '1px solid #E9EDF7', fontSize: 14, outline: 'none', transition: 'border-color 0.2s', background: 'transparent', color: '#1B2559' }}
                                onFocus={(e) => e.target.style.borderColor = '#4318FF'}
                                onBlur={(e) => e.target.style.borderColor = '#E9EDF7'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: 16,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#A3AED0',
                                    fontSize: 18,
                                    padding: 4
                                }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#4318FF', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#3311DB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#4318FF'}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#1B2559', fontWeight: 500 }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#4318FF', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
            {/* Footer Text */}
            <div style={{ position: 'absolute', bottom: 20, textAlign: 'center', width: '100%', color: '#A3AED0', fontSize: 12 }}>
                © {new Date().getFullYear()} LeadFlow. All Rights Reserved.
            </div>
        </div>
    );
}
