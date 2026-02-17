import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Globe, CreditCard, UserPlus, Loader2, Upload, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Signup = ({ onSuccess, onSwitchToLogin }) => {
    const { signup, uploadProfilePhoto } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        nationality: '',
        aadhaarNumber: '',
        emergencyContact: '',
        photoFile: null
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photoFile: file });
        }
    };

    const validateStep = () => {
        if (step === 1) {
            if (!formData.email || !formData.password) {
                setError('Email and password are required');
                return false;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
        } else if (step === 2) {
            if (!formData.name || !formData.phone || !formData.nationality) {
                setError('All fields are required');
                return false;
            }
        } else if (step === 3) {
            if (!formData.aadhaarNumber || !formData.emergencyContact) {
                setError('All fields are required');
                return false;
            }
            if (formData.aadhaarNumber.length !== 12) {
                setError('Aadhaar number must be 12 digits');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;

        setLoading(true);
        setError('');

        try {
            // Create user account
            const user = await signup(formData.email, formData.password, {
                name: formData.name,
                phone: formData.phone,
                nationality: formData.nationality,
                aadhaarNumber: formData.aadhaarNumber,
                emergencyContact: formData.emergencyContact
            });

            // Upload profile photo if provided
            if (formData.photoFile) {
                await uploadProfilePhoto(formData.photoFile);
            }

            if (onSuccess) onSuccess(user);
        } catch (err) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account');
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
                        <div className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Account</h2>
                        <p className="text-sm text-slate-500">Step {step} of 4 - {
                            step === 1 ? 'Account Credentials' :
                                step === 2 ? 'Personal Information' :
                                    step === 3 ? 'Tourist Details' :
                                        'Profile Photo'
                        }</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(s => (
                                <div
                                    key={s}
                                    className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-brand-600' : 'bg-slate-200'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Step 1: Email & Password */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
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
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            placeholder="Min. 6 characters"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            placeholder="Re-enter password"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Personal Info */}
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Nationality</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="nationality"
                                            value={formData.nationality}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            placeholder="Indian"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Tourist Details */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Aadhaar Number</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="aadhaarNumber"
                                            value={formData.aadhaarNumber}
                                            onChange={handleInputChange}
                                            maxLength="12"
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            placeholder="123456789012"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">12-digit Aadhaar number</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Emergency Contact</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            name="emergencyContact"
                                            value={formData.emergencyContact}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Contact in case of emergency</p>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 4: Profile Photo */}
                        {step === 4 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Profile Photo (Optional)</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-brand-300 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="photo-upload"
                                        />
                                        <label htmlFor="photo-upload" className="cursor-pointer">
                                            {formData.photoFile ? (
                                                <div>
                                                    <img
                                                        src={URL.createObjectURL(formData.photoFile)}
                                                        alt="Preview"
                                                        className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
                                                    />
                                                    <p className="text-sm text-slate-600">{formData.photoFile.name}</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                                    <p className="text-sm text-slate-600">Click to upload photo</p>
                                                    <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                    Back
                                </button>
                            )}
                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                                >
                                    Next <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Switch to Login */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-brand-600 font-bold hover:underline"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
