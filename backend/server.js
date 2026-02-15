const express = require('express');
const algosdk = require('algosdk');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email Configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'alternos.act@gmail.com',
        pass: 'wvfx fhes ynkd belv'
    }
});

// Verify email configuration
emailTransporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email service error:', error);
    } else {
        console.log('✅ Email service ready to send messages');
    }
});

const app = express();
const port = process.env.PORT || 5000;

const fs = require('fs');

// Debug Logger
const logStream = fs.createWriteStream('server_debug.log', { flags: 'a' });
const log = (msg) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    logStream.write(logMsg);
};

process.on('uncaughtException', (err) => {
    log(`CRITICAL ERROR (Uncaught Exception): ${err.message}`);
    log(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`CRITICAL ERROR (Unhandled Rejection): ${reason}`);
});

app.use(cors());
app.use(bodyParser.json());

// Multer for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Algorand TestNet Configuration
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = '';
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

app.get('/', (req, res) => {
    res.send('SafeTourX Backend API is running.');
});

// Fixed IPFS Upload Endpoint using Pinata JWT
app.post('/api/ipfs/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded." });
    }

    try {
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const pinataMetadata = JSON.stringify({
            name: req.file.originalname,
        });
        formData.append('pinataMetadata', pinataMetadata);

        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            maxBodyLength: Infinity,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'Authorization': `Bearer ${process.env.PINATA_JWT}`
            }
        });

        res.json({
            success: true,
            cid: response.data.IpfsHash,
            timestamp: response.data.Timestamp,
            url: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        });
    } catch (error) {
        console.error("IPFS Upload Error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

app.post('/api/id/register', async (req, res) => {
    try {
        const params = await algodClient.getTransactionParams().do();
        res.json({ success: true, params });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/sos', async (req, res) => {
    const { userAddress, latitude, longitude, timestamp, userName, userEmail, userPhone, emergencyContact } = req.body;
    console.log(`🚨 SOS Alert from ${userName} (${userEmail}) at [${latitude}, ${longitude}]`);

    // Mock blockchain logging
    const incident = {
        id: `SOS_${Date.now()}`,
        userAddress,
        userName,
        userEmail,
        userPhone,
        emergencyContact,
        location: { latitude, longitude },
        timestamp,
        status: 'AUTHORITIES_NOTIFIED'
    };

    // Send Email Alert
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const dateTime = new Date(timestamp).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'long'
    });

    const mailOptions = {
        from: 'alternos.act@gmail.com',
        to: 'chinmaytidke630@gmail.com',
        subject: `🚨 EMERGENCY SOS ALERT - ${userName} - Incident ${incident.id}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff3cd; border: 3px solid #dc3545; border-radius: 10px;">
                <h1 style="color: #dc3545; text-align: center; margin-bottom: 20px;">
                    🚨 EMERGENCY SOS ALERT 🚨
                </h1>
                
                <div style="background-color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">Incident Details</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        <strong>Incident ID:</strong> <span style="color: #dc3545; font-family: monospace;">${incident.id}</span><br>
                        <strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">${incident.status}</span><br>
                        <strong>Date & Time:</strong> ${dateTime}
                    </p>
                </div>

                <div style="background-color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">👤 Tourist Information</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        <strong>Name:</strong> ${userName || 'Not provided'}<br>
                        <strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #007bff;">${userEmail || 'Not provided'}</a><br>
                        <strong>Phone:</strong> <a href="tel:${userPhone}" style="color: #007bff;">${userPhone || 'Not provided'}</a><br>
                        <strong>Emergency Contact:</strong> <a href="tel:${emergencyContact}" style="color: #dc3545; font-weight: bold;">${emergencyContact || 'Not provided'}</a>
                    </p>
                </div>

                <div style="background-color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">📍 Location Information</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        <strong>Latitude:</strong> ${latitude}°N<br>
                        <strong>Longitude:</strong> ${longitude}°E<br>
                        <strong>Coordinates:</strong> <code style="background-color: #f8f9fa; padding: 5px; border-radius: 3px;">${latitude}, ${longitude}</code>
                    </p>
                    
                    <a href="${googleMapsLink}" target="_blank" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
                        📍 View on Google Maps
                    </a>
                </div>

                <div style="background-color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">🔐 Blockchain Details</h2>
                    
                    <p style="font-size: 16px; line-height: 1.6;">
                        <strong>Wallet Address:</strong><br>
                        <code style="background-color: #f8f9fa; padding: 10px; border-radius: 3px; display: block; word-break: break-all; margin-top: 5px;">${userAddress}</code>
                    </p>
                </div>

                <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        <strong>⚠️ URGENT:</strong> This is an automated emergency alert from the SafeTourX platform. Immediate assistance may be required at the location specified above. Please contact the emergency contact number provided.
                    </p>
                </div>

                <div style="text-align: center; padding: 15px; color: #666; font-size: 12px; border-top: 1px solid #ddd;">
                    <p style="margin: 5px 0;">SafeTourX - Tourist Safety Platform</p>
                    <p style="margin: 5px 0;">Powered by Algorand Blockchain & Firebase</p>
                </div>
            </div>
        `
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Emergency email sent to chinmaytidke630@gmail.com for ${userName}`);

        res.json({
            success: true,
            message: "Emergency services notified and alert email sent. Help is on the way.",
            incident,
            emailSent: true
        });
    } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);

        // Still return success for the SOS, but note email failure
        res.json({
            success: true,
            message: "Emergency services notified. Help is on the way.",
            incident,
            emailSent: false,
            emailError: emailError.message
        });
    }
});

// Updated heatmap with India coordinates
app.get('/api/risk/heatmap', async (req, res) => {
    const mumbaiHeatmap = [
        // Mumbai coordinates with risk levels
        { lat: 19.0760, lng: 72.8777, risk: 0.2, area: "Gateway of India" },
        { lat: 19.0896, lng: 72.8656, risk: 0.8, area: "Dharavi" },
        { lat: 19.1136, lng: 72.8697, risk: 0.5, area: "Bandra" },
        { lat: 18.9750, lng: 72.8258, risk: 0.3, area: "Colaba" },
        { lat: 19.0330, lng: 72.8489, risk: 0.7, area: "Crawford Market" },
    ];
    res.json(mumbaiHeatmap);
});

// New route planning endpoint
app.post('/api/route/plan', async (req, res) => {
    const { origin, destination } = req.body;

    // Mock route with safety check
    const mockRoute = {
        origin,
        destination,
        distance: "12.5 km",
        duration: "25 mins",
        safetyScore: 0.85,
        waypoints: [
            { lat: origin.lat, lng: origin.lng },
            { lat: (origin.lat + destination.lat) / 2, lng: (origin.lng + destination.lng) / 2 },
            { lat: destination.lat, lng: destination.lng }
        ],
        warning: null
    };

    // Check if route passes through high-risk areas
    const passesUnsafeZone = Math.random() > 0.7;
    if (passesUnsafeZone) {
        mockRoute.warning = "⚠ Route passes through high-risk area. Safer alternative suggested.";
        mockRoute.safetyScore = 0.4;
    }

    res.json(mockRoute);
});

// AI Risk Analysis Proxy
app.post('/api/risk/batch', async (req, res) => {
    try {
        const { points } = req.body;
        // Forward to Python AI Engine
        const response = await axios.post('http://localhost:5001/predict_batch', { points });
        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error:", error.message);
        // Fallback if AI service is down
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
        const response = await axios.get('http://localhost:5001/crime_data');
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

// Book Hotel - Records booking (transaction handled by frontend via Pera Wallet)
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

// Check-in (Simulate Smart Contract Release)
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

app.listen(port, () => {
    console.log(`✅ SafeTourX Backend running on port ${port}`);
});
