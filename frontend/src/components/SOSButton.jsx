import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2, MapPin, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SOSButton = ({ userAddress }) => {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        // Get user location for SOS
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => console.error("Location error:", error)
            );
        }
    }, []);

    const triggerSOS = async () => {
        setLoading(true);
        try {
            const sosData = {
                userAddress: userAddress || "DEMO_ADDRESS",
                latitude: userLocation?.latitude || 19.0760,
                longitude: userLocation?.longitude || 72.8777,
                timestamp: Date.now(),
                // Include user profile data for enhanced SOS
                userName: userProfile?.name || 'Unknown User',
                userEmail: userProfile?.email || 'No email',
                userPhone: userProfile?.phone || 'No phone',
                emergencyContact: userProfile?.emergencyContact || 'No emergency contact'
            };

            const res = await axios.post('http://localhost:5000/api/sos', sosData);

            setActive(true);

            // Show success message
            if (res.data.success) {
                alert(`🚨 SOS Alert Sent!\n\n` +
                    `📍 Location: ${sosData.latitude.toFixed(4)}°N, ${sosData.longitude.toFixed(4)}°E\n` +
                    ` Incident ID: ${res.data.incident.id}\n` +
                    `✅ ${res.data.message}`);
            }

            setTimeout(() => setActive(false), 8000);
        } catch (error) {
            console.error("SOS failed", error);
            alert("SOS Alert triggered! (Offline mode)");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <button
                onClick={triggerSOS}
                disabled={loading}
                className={`
          relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl
"${active ? 'bg-red-600 scale-110 animate-pulse' : 'bg-white border-4 border-red-100 hover:bg-red-50 hover:scale-105'}
        `}
            >
                <div className={`
          absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping
          ${active ? 'block' : 'hidden'}
        `} />

                {loading ? (
                    <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                ) : active ? (
                    <Check className="w-12 h-12 text-white" />
                ) : (
                    <ShieldAlert className={`w-12 h-12 ${active ? 'text-white' : 'text-red-600'}`} />
                )}
            </button>

            <div className="text-center">
                <p className="text-slate-900 font-bold text-sm tracking-tight uppercase">
                    {active ? "Alert Active" : "Emergency SOS"}
                </p>
                <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest mt-1">
                    {active ? "Help is dispatched" : "Tap for immediate assistance"}
                </p>
                {userLocation && !active && (
                    <div className="flex items-center gap-1 justify-center mt-2 text-[9px] text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="font-mono">Live location ready</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SOSButton;
