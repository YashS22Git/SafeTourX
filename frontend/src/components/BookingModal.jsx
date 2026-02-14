import React, { useState } from 'react';
import { X, Calendar, Users, User, CreditCard } from 'lucide-react';

const BookingModal = ({ hotel, onClose, onConfirm, loading }) => {
    const [formData, setFormData] = useState({
        name: '',
        checkIn: '',
        checkOut: '',
        guests: 1
    });

    if (!hotel) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(formData);
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-brand-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold">Secure Booking</h2>
                    <p className="text-brand-100 text-sm mt-1">{hotel.name}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Guest Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                placeholder="Full Name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Check-in</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    min={today}
                                    value={formData.checkIn}
                                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Check-out</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    required
                                    min={formData.checkIn || today}
                                    value={formData.checkOut}
                                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                        <div className="relative">
                            <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                min="1"
                                max="10"
                                required
                                value={formData.guests}
                                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-6">
                        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                            <span>Price per night</span>
                            <span>{hotel.price} ALGO</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                            <span>Smart Escrow Fee</span>
                            <span className="text-green-600">0.00 ALGO (Free)</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <div className="flex justify-between items-center font-bold text-gray-900">
                            <span>Total to Escrow</span>
                            <span className="text-brand-600 text-lg">{hotel.price} ALGO</span>
                        </div>
                    </div>

                    <p className="text-xs text-center text-gray-500 italic">
                        Funds will be held in Smart Contract Escrow until you confirm check-in.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing Transaction...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5" />
                                Book & Pay with Pera
                            </>
                        )}
                    </button>

                    {loading && (
                        <p className="text-xs text-center text-brand-600 animate-pulse mt-2">
                            Please check your Pera Wallet to sign the transaction
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
