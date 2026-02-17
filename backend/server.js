const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Logging Middleware
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

// Mock Data for Safe Route Algorithm
const DEMO_CRIME_DATA = [
    { lat: 18.9600, lng: 72.8350, risk: 3, type: "Theft" },
    { lat: 19.0760, lng: 72.8777, risk: 2, type: "Harassment" },
    { lat: 19.2183, lng: 72.9781, risk: 1, type: "Vandalism" }
];

// Routes

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'active', timestamp: Date.now() });
});

// Mock Route Planning Endpoint (Proxy to OSRM + Risk Layer)
app.post('/api/route/plan', async (req, res) => {
    const { start, end } = req.body;
    // ... (This logic is mostly handled in frontend now, but keeping for reference)
    res.json({ success: true, message: "Route calculation delegated to client-side OSRM" });
});

// Risk Analysis Endpoint (Batch)
app.post('/api/risk/batch', async (req, res) => {
    const { points } = req.body;
    try {
        // Forward to AI Engine
        const aiResponse = await axios.post('http://localhost:5001/predict_batch', { points });
        res.json(aiResponse.data);
    } catch (error) {
        console.error("AI Engine Offline, using fallback risk");
        // Fallback: Random risk for demo if AI offline
        res.json({
            average_risk: 15,
            max_risk: 30,
            fallback: true,
            risk_scores: points.map(() => 15)
        });
    }
});


// Crime Data Visualization Proxy
app.get('/api/crime/data', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5001/get_crime_data');
        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error (Crime Data):", error.message);
        // Fallback mock data if AI is down
        res.json([
            { latitude: 18.9220, longitude: 72.8290, crime_type: "Theft", risk_label: "High" },
            { latitude: 19.0760, longitude: 72.8777, crime_type: "Assault", risk_label: "High" }
        ]);
    }
});

// Hotel listings endpoint
app.get('/api/hotels/list', (req, res) => {
    const { city } = req.query;

    const allHotels = [
        // Mumbai
        { id: "mum_001", city: "Mumbai", name: "Taj Mahal Palace", location: "Colaba, Mumbai", verified: true, rating: 4.8, price: 0.1, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80", reviews: 1247 },
        { id: "mum_002", city: "Mumbai", name: "The Oberoi", location: "Nariman Point, Mumbai", verified: true, rating: 4.9, price: 0.2, image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80", reviews: 892 },
        // Pune
        { id: "pun_001", city: "Pune", name: "Conrad Pune", location: "Koregaon Park, Pune", verified: true, rating: 4.7, price: 0.15, image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=80", reviews: 520 },
        { id: "pun_002", city: "Pune", name: "Ritz-Carlton", location: "Yerwada, Pune", verified: true, rating: 4.9, price: 0.25, image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80", reviews: 310 },
        // Nagpur
        { id: "nag_001", city: "Nagpur", name: "Radisson Blu", location: "Wardha Road, Nagpur", verified: true, rating: 4.5, price: 0.12, image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80", reviews: 410 },
        // Nashik
        { id: "nas_001", city: "Nashik", name: "Gateway Hotel", location: "Ambad, Nashik", verified: true, rating: 4.6, price: 0.11, image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80", reviews: 205 },
        // Aurangabad
        { id: "aur_001", city: "Aurangabad", name: "Vivanta", location: "Rauzabag, Aurangabad", verified: true, rating: 4.8, price: 0.14, image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=80", reviews: 180 },
        // Thane
        { id: "tha_001", city: "Thane", name: "Planet Hollywood", location: "Ghodbunder Rd, Thane", verified: true, rating: 4.4, price: 0.13, image: "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1000&q=80", reviews: 150 }
    ];

    if (city && city !== 'All') {
        const filtered = allHotels.filter(h => h.city === city);
        res.json(filtered);
    } else {
        res.json(allHotels);
    }
});

// In-memory bookings store
let bookings = [];

// Book Hotel
app.post('/api/hotels/book', (req, res) => {
    const { hotelId, userAddress, price, txId, checkIn, checkOut, guests, name } = req.body;

    log(`Booking request: hotel=${hotelId}, user=${userAddress}, price=${price} ALGO, txId=${txId || 'pending'}`);
    log(`Details: ${name}, ${guests} guests, ${checkIn} to ${checkOut}`);

    const newBooking = {
        id: `STX-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
        hotelId,
        userAddress,
        price,
        txId: txId || null,
        status: txId ? 'ESCROW_LOCKED' : 'PENDING',
        checkIn,
        checkOut,
        guests,
        guestName: name,
        timestamp: Date.now()
    };

    bookings.push(newBooking);
    log(`✅ Booking recorded: ${newBooking.id}`);
    res.json({ success: true, booking: newBooking });
});

// Check-in
app.post('/api/hotels/checkin', (req, res) => {
    const { bookingId } = req.body;
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
        return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Simulate verification delay
    setTimeout(() => {
        booking.status = 'FUNDS_RELEASED'; // Final state: Hotel paid
        console.log(`💸 Funds Released for Booking ${booking.id}`);
        res.json({ success: true, booking });
    }, 2000);
});

// Get User Bookings
app.get('/api/bookings/:userAddress', (req, res) => {
    const userBookings = bookings.filter(b => b.userAddress === req.params.userAddress);
    res.json(userBookings);
});

// IPFS Upload Proxy (Mock)
app.post('/api/ipfs/upload', (req, res) => {
    res.json({ cid: "QmX7...mock...CID..." });
});

app.listen(port, () => {
    console.log(`✅ SafeTourX Backend running on port ${port}`);
    console.log(`✅ SERVER RELOADED WITH CITIES (Verifying Update)`);
});
