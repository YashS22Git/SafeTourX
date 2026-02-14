import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ onSuccess, onSwitchToSignup }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            const user = await login(email, password);
            if (onSuccess) onSuccess(user);
        } catch (err) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else {
                setError(err.message || 'Failed to login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-blue-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-[32px] shadow-premium border border-slate-100 p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Welcome to <span className="text-brand-600">SafeTourX</span>
                        </h1>
                        <p className="text-sm text-slate-500">Sign in to access your tourist safety dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                    placeholder="tourist@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-brand-700 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200"></div>
                        <span className="text-xs text-slate-400 uppercase font-bold">Or</span>
                        <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Switch to Signup */}
                    <div className="text-center">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <button
                                onClick={onSwitchToSignup}
                                className="text-brand-600 font-bold hover:underline"
                            >
                                Create Account
                            </button>
                        </p>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-500 text-center">
                            🔒 Secured by Firebase Authentication & Algorand Blockchain
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
