import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix default marker
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

// ── Demo Crime Data (always available, no backend needed) ──
const DEMO_CRIME_DATA = [
    // South Mumbai - High Risk Zone (Colaba to CST)
    { lat: 18.9067, lng: 72.8147, type: 'Theft', risk: 3 },
    { lat: 18.9120, lng: 72.8260, type: 'Robbery', risk: 3 },
    { lat: 18.9190, lng: 72.8320, type: 'Assault', risk: 3 },
    { lat: 18.9250, lng: 72.8310, type: 'Theft', risk: 2 },
    { lat: 18.9310, lng: 72.8340, type: 'Harassment', risk: 2 },
    { lat: 18.9220, lng: 72.8290, type: 'Robbery', risk: 3 },
    { lat: 18.9180, lng: 72.8180, type: 'Theft', risk: 2 },
    { lat: 18.9140, lng: 72.8230, type: 'Assault', risk: 3 },
    { lat: 18.9160, lng: 72.8280, type: 'Theft', risk: 2 },
    { lat: 18.9100, lng: 72.8200, type: 'Robbery', risk: 3 },
    // Marine Drive Area - Medium Risk
    { lat: 18.9440, lng: 72.8230, type: 'Theft', risk: 2 },
    { lat: 18.9470, lng: 72.8200, type: 'Harassment', risk: 1 },
    { lat: 18.9500, lng: 72.8170, type: 'Theft', risk: 2 },
    { lat: 18.9530, lng: 72.8150, type: 'Theft', risk: 1 },
    // Dadar Area - High Risk
    { lat: 19.0178, lng: 72.8478, type: 'Robbery', risk: 3 },
    { lat: 19.0200, lng: 72.8500, type: 'Assault', risk: 3 },
    { lat: 19.0160, lng: 72.8460, type: 'Theft', risk: 2 },
    { lat: 19.0190, lng: 72.8520, type: 'Harassment', risk: 2 },
    { lat: 19.0210, lng: 72.8440, type: 'Robbery', risk: 3 },
    // Bandra - Medium Risk
    { lat: 19.0540, lng: 72.8400, type: 'Theft', risk: 2 },
    { lat: 19.0580, lng: 72.8370, type: 'Theft', risk: 1 },
    { lat: 19.0560, lng: 72.8420, type: 'Harassment', risk: 1 },
    { lat: 19.0520, lng: 72.8380, type: 'Theft', risk: 2 },
    // Andheri - Medium-High Risk
    { lat: 19.1190, lng: 72.8460, type: 'Robbery', risk: 3 },
    { lat: 19.1220, lng: 72.8490, type: 'Assault', risk: 2 },
    { lat: 19.1170, lng: 72.8430, type: 'Theft', risk: 2 },
    { lat: 19.1150, lng: 72.8510, type: 'Theft', risk: 1 },
    // Churchgate - Low Risk
    { lat: 18.9350, lng: 72.8270, type: 'Theft', risk: 1 },
    { lat: 18.9370, lng: 72.8250, type: 'Theft', risk: 1 },
    // Kurla
    { lat: 19.0725, lng: 72.8790, type: 'Robbery', risk: 3 },
    { lat: 19.0700, lng: 72.8810, type: 'Assault', risk: 3 },
    { lat: 19.0740, lng: 72.8770, type: 'Theft', risk: 2 },
    // Juhu / Vile Parle
    { lat: 19.0980, lng: 72.8265, type: 'Theft', risk: 1 },
    { lat: 19.1010, lng: 72.8440, type: 'Harassment', risk: 1 },
    // Powai area - Low-Medium
    { lat: 19.1180, lng: 72.9060, type: 'Theft', risk: 1 },
    { lat: 19.1200, lng: 72.9080, type: 'Theft', risk: 2 },
    // Borivali
    { lat: 19.2290, lng: 72.8560, type: 'Robbery', risk: 2 },
    { lat: 19.2310, lng: 72.8580, type: 'Theft', risk: 1 },
    // Malad
    { lat: 19.1870, lng: 72.8490, type: 'Assault', risk: 2 },
    { lat: 19.1850, lng: 72.8510, type: 'Robbery', risk: 3 },
    // Goregaon
    { lat: 19.1550, lng: 72.8490, type: 'Theft', risk: 1 },
    { lat: 19.1570, lng: 72.8510, type: 'Harassment', risk: 1 },
];

// ── Risk Zone Clusters (for heatmap circles) ──
const RISK_ZONES = [
    { lat: 18.9150, lng: 72.8230, radius: 800, risk: 'high', label: 'Colaba Zone' },
    { lat: 19.0185, lng: 72.8480, radius: 600, risk: 'high', label: 'Dadar Zone' },
    { lat: 19.0720, lng: 72.8790, radius: 500, risk: 'high', label: 'Kurla Zone' },
    { lat: 19.1190, lng: 72.8470, radius: 600, risk: 'medium', label: 'Andheri Zone' },
    { lat: 19.0550, lng: 72.8400, radius: 500, risk: 'medium', label: 'Bandra Zone' },
    { lat: 18.9480, lng: 72.8200, radius: 400, risk: 'low', label: 'Marine Drive' },
    { lat: 19.1860, lng: 72.8500, radius: 400, risk: 'medium', label: 'Malad Zone' },
];

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };

// ── Custom Icons ──
const greenMarker = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const redMarker = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// ── Main Component ──
const MapView = ({ hotels, onBook }) => {
    const [map, setMap] = useState(null);
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [analyzing, setAnalyzing] = useState(false);
    const [showCrimeDots, setShowCrimeDots] = useState(true);
    const [crimeData, setCrimeData] = useState([]);

    // Fetch Crime Data on Mount
    useEffect(() => {
        const fetchCrimeData = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${API_URL}/api/crime/data`);
                if (Array.isArray(res.data)) {
                    setCrimeData(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch crime data", err);
            }
        };
        fetchCrimeData();
    }, []);

    // ── Map Click Logic ──
    const ClickHandler = () => {
        useMapEvents({
            click(e) {
                if (!startPoint) {
                    setStartPoint(e.latlng);
                    setRoutes([]);
                } else if (!endPoint) {
                    setEndPoint(e.latlng);
                } else {
                    setStartPoint(e.latlng);
                    setEndPoint(null);
                    setRoutes([]);
                }
            }
        });
        return null;
    };

    // ── Route Analysis ──
    const analyze = async () => {
        if (!startPoint || !endPoint) return;
        setAnalyzing(true);
        setRoutes([]);

        try {
            // Fetch multiple OSRM routes
            const url = `https://router.project-osrm.org/route/v1/driving/${startPoint.lng},${startPoint.lat};${endPoint.lng},${endPoint.lat}?overview=full&geometries=geojson&alternatives=3`;
            const res = await axios.get(url);
            const raw = res.data.routes || [];
            if (!raw.length) { alert('No routes found.'); setAnalyzing(false); return; }

            const results = [];
            for (let i = 0; i < raw.length; i++) {
                const r = raw[i];
                const path = r.geometry.coordinates.map(c => [c[1], c[0]]);
                const dist = (r.distance / 1000).toFixed(1);
                const dur = (r.duration / 60).toFixed(0);

                // Calculate risk from demo data proximity
                let totalRisk = 0;
                const sampledPath = path.filter((_, idx) => idx % 15 === 0);

                // Simple local proximity check against loaded crime data
                if (crimeData.length > 0) {
                    for (const pt of sampledPath) {
                        // Check random sample of crime data to avoid O(N^2) lag
                        for (let k = 0; k < Math.min(crimeData.length, 100); k++) {
                            const crime = crimeData[k];
                            // Robust fallbacks for field names
                            const cLat = crime.latitude || crime.lat;
                            const cLng = crime.longitude || crime.lng;
                            const cRisk = crime.risk_label === 'High' ? 3 : crime.risk_label === 'Medium' ? 2 : 1;

                            const d = L.latLng(pt).distanceTo([cLat, cLng]);
                            if (d < 300) totalRisk += cRisk * (1 - d / 300);
                        }
                    }
                }

                const riskScore = Math.min(100, (totalRisk / Math.max(1, sampledPath.length)) * 5).toFixed(1);

                // Also try server-side AI
                let aiRisk = null;
                try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const aiRes = await axios.post(`${API_URL}/api/risk/batch`, {
                        points: sampledPath.slice(0, 50).map(p => ({ lat: p[0], lng: p[1] }))
                    });
                    aiRisk = aiRes.data.average_risk;
                } catch { /* server offline, use local calc */ }

                const finalRisk = aiRisk !== null ? ((parseFloat(riskScore) + aiRisk) / 2).toFixed(1) : riskScore;

                let color = '#22c55e';
                if (finalRisk > 25) color = '#eab308';
                if (finalRisk > 50) color = '#f97316';
                if (finalRisk > 75) color = '#ef4444';

                results.push({ path, dist, dur, risk: finalRisk, color, label: `Route ${String.fromCharCode(65 + i)}` });
            }

            results.sort((a, b) => a.risk - b.risk);
            results[0].safest = true;

            setRoutes(results);
            setSelectedIdx(0);
            if (map) map.fitBounds(L.latLngBounds([startPoint, endPoint]).pad(0.3));
        } catch (err) {
            console.error(err);
            alert('Route analysis failed.');
        } finally {
            setAnalyzing(false);
        }
    };

    const reset = () => { setStartPoint(null); setEndPoint(null); setRoutes([]); };

    const selected = routes[selectedIdx];

    return (
        <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
            {/* ── Map ── */}
            <MapContainer center={[19.0760, 72.8777]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false} ref={setMap}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                <ClickHandler />

                {/* Crime Dots (Real Data) */}
                {showCrimeDots && crimeData.map((c, i) => {
                    // Robust field handling
                    const lat = c.latitude || c.lat;
                    const lng = c.longitude || c.lng;
                    const type = c.crime_type || c.type || "Unknown";
                    const risk = c.risk_label || "Medium";

                    if (!lat || !lng) return null;

                    const color = risk === 'High' ? '#ef4444' : risk === 'Medium' ? '#f59e0b' : '#3b82f6';

                    return (
                        <CircleMarker key={`crime-${i}`} center={[lat, lng]} radius={4}
                            pathOptions={{
                                color: color,
                                fillColor: color,
                                fillOpacity: 0.8, weight: 0
                            }}
                        >
                            <Popup><span style={{ fontSize: 12 }}><b>{type}</b><br />Risk: {risk}</span></Popup>
                        </CircleMarker>
                    );
                })}

                {/* Start / End */}
                {startPoint && <Marker position={startPoint} icon={greenMarker}><Popup>Start</Popup></Marker>}
                {endPoint && <Marker position={endPoint} icon={redMarker}><Popup>Destination</Popup></Marker>}

                {/* Routes */}
                {routes.map((r, i) => (
                    <Polyline key={i} positions={r.path} pathOptions={{
                        color: r.color, weight: selectedIdx === i ? 6 : 3, opacity: selectedIdx === i ? 0.9 : 0.35,
                        dashArray: !r.safest && selectedIdx !== i ? '8 6' : null
                    }} eventHandlers={{ click: () => setSelectedIdx(i) }} />
                ))}

                {/* Hotels */}
                {hotels?.map(h => {
                    // Try to parse location if lat/lng not explicit (Mock logic)
                    // For now, mapping fixed positions to new cities for demo only
                    let pos = [19.0760, 72.8777]; // Default Mumbai center
                    if (h.city === 'Pune') pos = [18.5204, 73.8567];
                    if (h.city === 'Nagpur') pos = [21.1458, 79.0882];
                    if (h.city === 'Nashik') pos = [19.9975, 73.7898];
                    if (h.city === 'Aurangabad') pos = [19.8762, 75.3433];
                    if (h.city === 'Thane') pos = [19.2183, 72.9781];

                    // Add slight random jitter so they don't overlap perfectly
                    const jitter = (h.id.charCodeAt(h.id.length - 1) % 10) * 0.005;
                    pos = [pos[0] + jitter, pos[1] + jitter];

                    return (
                        <Marker key={h.id} position={pos}>
                            <Popup>
                                <div style={{ fontSize: 12, minWidth: 140 }}>
                                    <b>{h.name}</b><br /><span style={{ color: '#666' }}>{h.location}</span><br />
                                    <b style={{ color: '#6366f1' }}>{h.price} ALGO</b>
                                    <br /><button onClick={() => onBook(h)} style={{ marginTop: 4, padding: '2px 8px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>Book</button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* ── Top Bar (Compact) ── */}
            <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-2">
                {/* Coords Display */}
                <div className="bg-white/95 backdrop-blur shadow-lg rounded-lg px-3 py-2 flex items-center gap-3 border border-slate-200 text-xs">
                    <div>
                        <span className="text-[9px] text-slate-400 font-semibold block">FROM</span>
                        <span className="font-mono text-green-600 font-bold">{startPoint ? `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` : '— click map —'}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                        <span className="text-[9px] text-slate-400 font-semibold block">TO</span>
                        <span className="font-mono text-red-500 font-bold">{endPoint ? `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` : '— click map —'}</span>
                    </div>
                </div>

                {/* Actions */}
                <button onClick={analyze} disabled={!startPoint || !endPoint || analyzing}
                    className={`px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-all ${!startPoint || !endPoint ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-green-600'}`}>
                    {analyzing ? '⏳ Analyzing...' : '▶ Find Safest'}
                </button>
                <button onClick={reset} className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-red-500 border border-slate-200 shadow">
                    ✕ Clear
                </button>

                {/* Heatmap Toggle */}
                <button onClick={() => setShowCrimeDots(!showCrimeDots)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border shadow transition-all ${showCrimeDots ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white/90 text-slate-400 border-slate-200'}`}>
                    {showCrimeDots ? '🔴 Crime Dots ON' : '○ Crime Dots OFF'}
                </button>
            </div>

            {/* ── Route Results Panel (Bottom) ── */}
            {routes.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 z-[1000]">
                    <div className="bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-slate-200 p-3">
                        {/* Summary Header */}
                        <div className="text-[11px] font-bold text-slate-600 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">{routes.length} Routes Found</span>
                            <span className="text-slate-400">→ Ranked by Safety (Best First)</span>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {routes.map((r, i) => {
                                const rankLabel = i === 0 ? 'SAFEST' : i === 1 ? 'MODERATE' : 'RISKY';
                                const rankColor = i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : 'bg-red-500';

                                return (
                                    <div key={i} onClick={() => setSelectedIdx(i)}
                                        className={`flex-shrink-0 cursor-pointer rounded-lg p-3 border-2 transition-all min-w-[200px] relative ${selectedIdx === i ? 'border-slate-900 bg-slate-50 shadow-lg scale-105' : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                                            }`}>
                                        {/* Ranking Number Badge (Top Left) */}
                                        <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-lg ${rankColor}`}>
                                            {i + 1}
                                        </div>

                                        <div className="flex items-center justify-between mb-2 mt-1">
                                            <span className="font-bold text-sm text-slate-800">{r.label}</span>
                                            <span className={`text-[9px] text-white px-2 py-0.5 rounded-full font-bold ${rankColor}`}>
                                                {rankLabel}
                                            </span>
                                        </div>

                                        {/* Risk Bar */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, r.risk)}%`, backgroundColor: r.color }} />
                                            </div>
                                            <span className="text-[10px] font-mono font-bold" style={{ color: r.color }}>{r.risk}%</span>
                                        </div>

                                        <div className="flex gap-4 text-[11px] text-slate-500">
                                            <span>🕐 {r.dur} min</span>
                                            <span>📏 {r.dist} km</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Legend (Bottom Right when no routes) ── */}
            {showCrimeDots && routes.length === 0 && (
                <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-lg border border-slate-200 p-2 text-[10px]">
                    <div className="font-bold text-slate-600 mb-1">Crime Risk</div>
                    <div className="flex flex-col gap-0.5">
                        <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" /> High Risk</span>
                        <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" /> Medium Risk</span>
                        <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" /> Low Risk</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapView;
