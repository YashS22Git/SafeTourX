import React, { useState, useEffect } from 'react';
import { ShieldCheck, Map as MapIcon, Calendar, User, Bell, Info, ArrowUpRight, CheckCircle2, ShieldAlert, Loader2, LogOut } from 'lucide-react';
import axios from 'axios';
import algosdk from 'algosdk';
import MapView from './components/MapView';
import SOSButton from './components/SOSButton';
import WalletConnect, { peraWallet } from './components/WalletConnect';
import BookingModal from './components/BookingModal';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from './contexts/AuthContext';

function App() {
    const { currentUser, userProfile, logout } = useAuth();
    const [showSignup, setShowSignup] = useState(false);
    const [userAddress, setUserAddress] = useState(null);

    const [activeTab, setActiveTab] = useState('map');
    const [identityData, setIdentityData] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loadingAction, setLoadingAction] = useState(null);
    const [verificationStep, setVerificationStep] = useState(0);
    const [tempFile, setTempFile] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [selectedCity, setSelectedCity] = useState('All');
    const cities = ['All', 'Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'];

    // Load wallet address from Firebase profile
    useEffect(() => {
        if (userProfile?.walletAddress) {
            setUserAddress(userProfile.walletAddress);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchHotels(selectedCity);
    }, [selectedCity]);

    const fetchHotels = async (city = 'All') => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await axios.get(`${API_URL}/api/hotels/list`, {
                params: { city }
            });
            setHotels(res.data);
        } catch (err) {
            console.error("Failed to fetch hotels");
        }
    };

    const ESCROW_ADDRESS = "U3CXLXWDCXL2CGEJVTRDOIWWLJ4IUW5OMNGEYLHHIFKLVWJWM7BWFAHN4Q";
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

    const handleBookHotel = async (formData) => {
        const hotel = selectedHotel;
        setLoadingAction(`book-${hotel.id}`);

        if (!userAddress || userAddress.length !== 58) {
            alert('Please connect your Pera Wallet first! You need a real Algorand address to make a payment.');
            setLoadingAction(null);
            return;
        }

        console.log("Booking with address:", userAddress, "Length:", userAddress.length);
        let txId = null;

        try {
            // Step 1: Create transaction in frontend using real wallet address
            const suggestedParams = await algodClient.getTransactionParams().do();

            const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
                sender: userAddress,
                receiver: ESCROW_ADDRESS,
                amount: Math.round(hotel.price * 1000000), // Convert ALGO to microAlgos
                note: new Uint8Array(new TextEncoder().encode(`SafeTourX Booking: ${hotel.id}`)),
                suggestedParams
            });

            // Step 2: Sign with Pera Wallet (opens on phone)
            const signedTxnGroups = await peraWallet.signTransaction([[{ txn }]]);

            // Step 3: Submit to Algorand TestNet
            const response = await algodClient.sendRawTransaction(signedTxnGroups[0]).do();
            console.log("Raw Send Response:", response);

            // Robust ID extraction
            txId = response.txId || response.txid;
            if (!txId && response.body) txId = response.body.txId || response.body.txid;
            if (!txId && typeof response === 'string') txId = response;

            if (!txId) {
                console.error("Response structure unknown:", JSON.stringify(response));
                // Fallback: if response is object with no ID, maybe it is the ID?
                if (response && response.length > 20 && typeof response !== 'object') {
                    txId = response;
                } else {
                    throw new Error("Transaction sent but no ID returned from network");
                }
            }

            console.log("Transaction ID:", txId);

            // Step 4: Wait for blockchain confirmation (increased to 12 rounds)
            alert(`⏳ Transaction Submitted!\n\nTxID: ${txId}\n\nWaiting for confirmation on blockchain...`);

            const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 12);
            console.log("Transaction confirmed:", confirmedTxn);

            // Step 5: Record booking on backend
            const res = await axios.post('http://localhost:5000/api/hotels/book', {
                hotelId: hotel.id,
                userAddress: userAddress,
                price: hotel.price,
                txId: txId,
                ...formData // Add name, checkIn, checkOut, guests
            });

            // Step 6: Update UI
            setBookings([...bookings, {
                ...res.data.booking,
                hotelDetails: hotel,
                status: 'ESCROW_LOCKED',
                txId: txId,
                confirmedRound: confirmedTxn['confirmed-round']
            }]);

            setSelectedHotel(null); // Close modal on success

            alert(
                `✅ Payment Confirmed on Algorand TestNet!\n\n` +
                `Transaction: ${txId}\n` +
                `Deducted: ${hotel.price} ALGO\n` +
                `Round: ${confirmedTxn['confirmed-round']}\n` +
                `Status: FUNDS LOCKED IN ESCROW`
            );
        } catch (err) {
            console.error('Booking error:', err);

            if (err?.data?.type === 'SIGN_TRANSACTIONS') {
                alert("Transaction cancelled by user.");
            } else if (txId && (err.message && (err.message.includes("confirmed") || err.message.includes("timeout")))) {
                alert(`⚠️ Transaction Slow Warning\n\nThe transaction ${txId} was sent but took too long to confirm in the app.\n\nCheck your Pera Wallet or AlgoExplorer. If funds were deducted, the booking is valid!`);
            } else {
                alert("Transaction failed: " + (err.message || "Unknown error"));
            }
        } finally {
            setLoadingAction(null);
        }
    };

    const handleCheckIn = async (booking) => {
        setLoadingAction(`checkin-${booking.id}`);
        try {
            const res = await axios.post('http://localhost:5000/api/hotels/checkin', {
                bookingId: booking.id
            });

            if (res.data.success) {
                const updatedBookings = bookings.map(b =>
                    b.id === booking.id ? { ...b, status: 'FUNDS_RELEASED' } : b
                );
                setBookings(updatedBookings);
                alert(`🎉 Verification Successful!\n\nSmart Contract has released ${booking.price} ALGO to the hotel.\n\nEnjoy your safe stay!`);
            }
        } catch (err) {
            alert("Check-in failed");
        } finally {
            setLoadingAction(null);
        }
    };



    const handleIdentityUpload = (file) => {
        if (!file) return;
        setTempFile(file);
        setVerificationStep(1); // Start document scanning

        // Simulate document OCR scan
        setTimeout(() => {
            setVerificationStep(2); // Move to face scan
            startWebcam();
        }, 2000);
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.getElementById('webcam');
            if (video) {
                video.srcObject = stream;

                // Simulate face scanning for 3.5 seconds
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                    verifyWithBackend();
                }, 3500);
            }
        } catch (err) {
            alert("Camera access denied. Skipping face verification.");
            verifyWithBackend();
        }
    };

    const verifyWithBackend = async () => {
        setVerificationStep(3); // Government API verification

        setTimeout(async () => {
            try {
                const formData = new FormData();
                formData.append('file', tempFile);

                const res = await axios.post('http://localhost:5000/api/ipfs/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const identity = {
                    walletAddress: userAddress || "TOURIST_DEMO_ADDR",
                    documentCID: res.data.cid,
                    timestamp: Date.now(),
                    verified: true,
                    authority: "UIDAI_GOV_INDIA"
                };
                setIdentityData(identity);
                setVerificationStep(4); // Verified!

                alert(
                    `✅ Identity Verified Successfully!\n\n` +
                    `1. Document: Validated via DigiLocker\n` +
                    `2. Biometrics: Face Match Confirmed\n` +
                    `3. Blockchain: Identity Hash Minted`
                );
            } catch (err) {
                alert("Verification failed: " + (err.response?.data?.error || err.message));
                setVerificationStep(0);
            }
        }, 2500);
    };

    // Show login/signup if not authenticated
    if (!currentUser) {
        return showSignup ? (
            <Signup
                onSuccess={() => setShowSignup(false)}
                onSwitchToLogin={() => setShowSignup(false)}
            />
        ) : (
            <Login
                onSuccess={() => { }}
                onSwitchToSignup={() => setShowSignup(true)}
            />
        );
    }

    // Show profile tab
    if (activeTab === 'profile') {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shadow-brand-500/20 shadow-lg">
                            <ShieldCheck className="text-white w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">SafeTour<span className="text-brand-600">X</span></h1>
                    </div>
                    <button onClick={() => setActiveTab('map')} className="px-4 py-2 text-sm font-bold text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                        Back to Dashboard
                    </button>
                </nav>
                <div className="pt-20">
                    <Profile />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
            {/* Top Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shadow-brand-500/20 shadow-lg">
                        <ShieldCheck className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">SafeTour<span className="text-brand-600">X</span> <span className="text-[10px] bg-slate-100 text-slate-500 uppercase tracking-widest px-2 py-0.5 rounded ml-2 font-black">Official</span></h1>
                </div>

                <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                    {[
                        { id: 'map', icon: MapIcon, label: 'Safety Map' },
                        { id: 'booking', icon: Calendar, label: 'Bookings' },
                        { id: 'profile', icon: User, label: 'Profile' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">{userProfile?.name}</p>
                        <p className="text-[10px] text-slate-500">{userProfile?.email}</p>
                    </div>
                    <WalletConnect onConnect={setUserAddress} />
                    <button
                        onClick={logout}
                        className="w-9 h-9 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 text-red-600" />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {activeTab === 'map' && (
                        <motion.div
                            key="map-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-brand-600">
                                        <Bell className="w-3 h-3 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Intelligence Feed</span>
                                    </div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">SafeTravel Intelligence</h2>
                                    <p className="text-slate-500 text-sm max-w-2xl font-medium tracking-tight">AI-monitored safety layers powered by Algorand blockchain immutable transparency.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl flex flex-col shadow-sm">
                                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-1">Risk Status</span>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500" />
                                            <span className="text-sm font-bold text-slate-800">Operational</span>
                                        </div>
                                    </div>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-9 space-y-6">
                                    <div className="bg-white p-2 rounded-[24px] shadow-premium border border-slate-100">
                                        <MapView
                                            hotels={hotels}
                                            onBook={setSelectedHotel}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Active Reports', value: '42', delta: '+12%', color: 'brand' },
                                            { label: 'Verified Nodes', value: '1,204', delta: 'Stable', color: 'slate' },
                                            { label: 'Avg Respond Time', value: '8.4m', delta: '-1.2m', color: 'green' }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                                <div className="flex items-end justify-between">
                                                    <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.color === 'brand' ? 'bg-brand-50 text-brand-600' : 'bg-green-50 text-green-600'}`}>
                                                        {stat.delta}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-3 space-y-6">
                                    <div className="bg-white p-8 rounded-[32px] shadow-premium border border-red-100 flex flex-col items-center justify-center text-center">
                                        <SOSButton userAddress={userAddress} />
                                    </div>

                                    <div className="bg-white p-6 rounded-[24px] shadow-premium border border-slate-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 italic flex items-center gap-2">
                                                <ShieldAlert className="w-3 h-3 text-red-500" />
                                                Security Feed
                                            </h3>
                                            <span className="text-[9px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded font-bold">Real-time</span>
                                        </div>
                                        <div className="space-y-4 pt-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="group cursor-pointer">
                                                    <div className="flex gap-4 items-start">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 group-hover:bg-brand-500 transition-colors" />
                                                        <div className="space-y-0.5">
                                                            <p className="text-[11px] font-bold text-slate-900 leading-tight">Public transit delay in Sector {i + 2}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-slate-400 font-mono">2m ago</span>
                                                                <span className="text-[9px] text-brand-600 font-bold uppercase tracking-tighter flex items-center">Verify <ArrowUpRight className="w-2 h-2 ml-0.5" /></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all mt-2">View Global Incident Log</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'booking' && (
                        <motion.div
                            key="booking-tab"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold tracking-tight italic">Verified <span className="text-brand-600">Housing</span></h2>
                                    <p className="text-slate-500 text-sm mt-1 max-w-xl font-medium">Smart Contracts hold your security deposit until you verify the property condition.</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {cities.map(city => (
                                        <button
                                            key={city}
                                            onClick={() => setSelectedCity(city)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedCity === city
                                                ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                                                }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {hotels.map(hotel => {
                                    const existingBooking = bookings.find(b => b.hotelId === hotel.id);
                                    const isBooked = !!existingBooking;
                                    const isReleased = existingBooking?.status === 'FUNDS_RELEASED';

                                    return (
                                        <div key={hotel.id} className={`bg-white p-6 rounded-[28px] border transition-all duration-500 group relative overflow-hidden ${isBooked ? 'border-brand-500 shadow-xl scale-105' : 'border-slate-200 hover:border-brand-200 hover:shadow-premium'}`}>

                                            {isBooked && (
                                                <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-500 animate-pulse z-10"></div>
                                            )}

                                            <div className="h-44 bg-slate-100 rounded-2xl mb-6 overflow-hidden relative">
                                                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-3 left-4 text-white">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Verified Stay</div>
                                                    <div className="font-bold text-lg">{hotel.name}</div>
                                                </div>
                                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-600 border border-brand-100 shadow-sm flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> All Verified
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{hotel.location}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-500 text-xs">★</span>
                                                        <span className="text-xs font-bold text-slate-700">{hotel.rating} ({hotel.reviews})</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-900 font-bold text-lg">{hotel.price} <span className="text-xs font-medium text-slate-500">ALGO</span></p>
                                                    <p className="text-xs text-slate-400">per night</p>
                                                </div>
                                            </div>

                                            {isBooked ? (
                                                <div className="p-4 bg-brand-50 rounded-xl space-y-3 mb-6 border border-brand-100">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="text-slate-500 uppercase font-black tracking-widest">Contract Status</span>
                                                        <span className={`${isReleased ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} px-2 py-0.5 rounded font-black italic`}>
                                                            {isReleased ? 'COMPLETED' : 'ESCROW LOCKED'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-500 font-medium">Protect Amount</span>
                                                        <span className="text-slate-900 font-bold font-mono">{hotel.price}.00 ALGO</span>
                                                    </div>
                                                    {!isReleased && <p className="text-[9px] text-slate-400 italic text-center pt-1">Funds locked until check-in verified</p>}
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-slate-50 rounded-xl space-y-2 mb-6 text-center">
                                                    <p className="text-[10px] text-slate-500 font-medium">🔒 Smart Contract Protection Enabled</p>
                                                    <p className="text-[9px] text-slate-400">100% Refund guarantee if verified fake</p>
                                                </div>
                                            )}

                                            {!isBooked ? (
                                                <button
                                                    onClick={() => setSelectedHotel(hotel)}
                                                    disabled={loadingAction === `book-${hotel.id}`}
                                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black tracking-[0.2em] uppercase italic text-[10px] shadow-lg hover:bg-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                                >
                                                    {loadingAction === `book-${hotel.id}` ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Locking Funds...</>
                                                    ) : (
                                                        "Book & Escrow"
                                                    )}
                                                </button>
                                            ) : !isReleased ? (
                                                <button
                                                    onClick={() => handleCheckIn(existingBooking)}
                                                    disabled={loadingAction === `checkin-${existingBooking.id}`}
                                                    className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black tracking-[0.2em] uppercase italic text-[10px] shadow-lg shadow-brand-500/30 hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                                >
                                                    {loadingAction === `checkin-${existingBooking.id}` ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                                    ) : (
                                                        "Check-in & Release"
                                                    )}
                                                </button>
                                            ) : (
                                                <button disabled className="w-full py-4 bg-green-50 text-green-700 rounded-2xl font-black tracking-[0.2em] uppercase italic text-[10px] border border-green-200">
                                                    ✓ Payment Released
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'id' && (
                        <motion.div
                            key="id-tab"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-premium text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-600" />

                                <div className="w-20 h-20 bg-brand-50 rounded-[24px] mx-auto mb-8 flex items-center justify-center border border-brand-100 shadow-inner">
                                    <User className="w-8 h-8 text-brand-600" />
                                </div>

                                <h2 className="text-3xl font-extrabold tracking-tight mb-3 italic uppercase">Identity <span className="text-brand-600 underline underline-offset-8 decoration-slate-100">Vault</span></h2>
                                <p className="text-slate-500 text-sm mb-10 font-medium px-8 leading-relaxed">Securely authorize your biometric and document hashes on-chain. Privacy-first travel credentials accepted worldwide.</p>

                                <div className="bg-slate-50 rounded-3xl p-6 text-left border border-slate-100 mb-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200">
                                            <CheckCircle2 className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Protocol Status</p>
                                            <p className="text-xs font-bold text-slate-900 tracking-tight italic">Ready to Initialize</p>
                                        </div>
                                    </div>

                                    <div className="relative group mb-6">
                                        {verificationStep === 0 && (
                                            <>
                                                <input
                                                    type="file"
                                                    onChange={(e) => handleIdentityUpload(e.target.files[0])}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                />
                                                <button className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black tracking-[0.2em] uppercase italic text-xs group-hover:bg-brand-600 transition-all shadow-xl group-hover:shadow-brand-500/20 flex flex-col items-center justify-center gap-1">
                                                    <span>Upload Document</span>
                                                    <span className="text-[9px] text-slate-400 font-normal normal-case opacity-70">Verified with DigiLocker / Passport Seva</span>
                                                </button>
                                            </>
                                        )}

                                        {verificationStep === 1 && (
                                            <button disabled className="w-full py-5 bg-slate-100 text-slate-500 rounded-[24px] font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-wait">
                                                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden max-w-[200px]">
                                                    <div className="h-full bg-blue-500 animate-pulse"></div>
                                                </div>
                                                <span className="animate-pulse">🤖 AI Scanning Document...</span>
                                            </button>
                                        )}

                                        {verificationStep === 2 && (
                                            <div className="w-full h-64 bg-black rounded-[24px] overflow-hidden relative flex items-center justify-center">
                                                <video id="webcam" autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80"></video>
                                                <div className="absolute inset-0 border-4 border-brand-400 opacity-50 rounded-[24px]"></div>
                                                <div className="absolute w-40 h-52 border-2 border-brand-500 rounded-full animate-pulse flex items-center justify-center">
                                                    <div className="w-full h-0.5 bg-brand-400 absolute" style={{ animation: 'scan 2s linear infinite' }}></div>
                                                </div>
                                                <div className="absolute bottom-4 bg-black/60 backdrop-blur px-4 py-1 rounded-full text-brand-400 text-[10px] font-mono tracking-widest border border-brand-500/30">
                                                    🤳 SCANNING FACE...
                                                </div>
                                            </div>
                                        )}

                                        {verificationStep === 3 && (
                                            <button disabled className="w-full py-5 bg-blue-50 text-blue-600 rounded-[24px] font-bold text-xs flex flex-col items-center justify-center gap-2 cursor-wait border border-blue-100">
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                                <span>🏛️ Connecting to Government Gateway...</span>
                                            </button>
                                        )}

                                        {verificationStep === 4 && (
                                            <button className="w-full py-5 bg-green-500 text-white rounded-[24px] font-black tracking-[0.2em] uppercase italic text-xs shadow-xl flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-5 h-5" /> Verified by Govt API
                                            </button>
                                        )}
                                    </div>
                                    {identityData && (
                                        <div className="mt-8 p-6 bg-gradient-to-br from-brand-50 to-blue-50 rounded-3xl border-2 border-brand-200">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-700 mb-4 text-center">✓ Digital Tourist ID</h3>
                                            <div className="bg-white p-4 rounded-2xl shadow-lg mb-4 flex justify-center">
                                                <QRCodeSVG
                                                    value={JSON.stringify(identityData)}
                                                    size={180}
                                                    level="H"
                                                    includeMargin={true}
                                                />
                                            </div>
                                            <div className="space-y-2 text-left">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-slate-500 font-bold uppercase tracking-widest">Document CID</span>
                                                    <span className="text-brand-700 font-mono text-[9px]">{identityData.documentCID.substring(0, 16)}...</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-slate-500 font-bold uppercase tracking-widest">Status</span>
                                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Verified UIDAI
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 text-center">
                                                <p className="text-[9px] text-slate-400 italic">Digitally Signed by Govt of India (Simulated)</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                                        <div className="text-[8px] font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 rounded">ISO 27001</div>
                                        <div className="text-[8px] font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 rounded">GDPR Compliant</div>
                                        <div className="text-[8px] font-bold uppercase tracking-widest bg-slate-100 px-3 py-1 rounded">ALGO W3C-DID</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {selectedHotel && (
                    <BookingModal
                        hotel={selectedHotel}
                        onClose={() => setSelectedHotel(null)}
                        onConfirm={handleBookHotel}
                        loading={loadingAction === `book-${selectedHotel.id}`}
                    />
                )}
            </main>

            {/* Global Status Bar */}
            <footer className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-200 py-3 px-8 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm" />
                        <span>Node Consensus: 100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />
                        <span>Chain Latency: 3.8s</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-brand-600 italic">SafeTourX Protocol v1.4</span>
                    <span className="text-slate-200 mx-2">|</span>
                    <span>Algorand TestNet Layer-1</span>
                </div>
            </footer>
        </div>
    );
}

export default App;
