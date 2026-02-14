# SafeTourX

SafeTourX is a decentralized tourist safety platform leveraging the Algorand blockchain and AI-driven risk analysis.

## Project Structure

- `/frontend`: React + Vite + Tailwind CSS mobile/web interface.
- `/backend`: Node.js Express server with Algorand SDK.
- `/ai_engine`: Python Flask microservice for risk assessment.
- `/contracts`: PyTeal smart contracts for DID, Escrow, and SOS logs.

## Quick Start

### 1. Prerequisites
- Node.js & npm
- Python 3.x
- `pip install flask flask-cors`

### 2. Installations

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
npm install
```

**AI Engine:**
```bash
cd ai_engine
pip install -r requirements.txt
```

### 3. Running the demo

1. Start AI Engine: `cd ai_engine; python risk_engine.py`
2. Start Backend: `cd backend; node server.js`
3. Start Frontend: `cd frontend; npm run dev`

Visit `http://localhost:5173` to see the dashboard.

## Security & Privacy
- All PII is stored as salted hashes on-chain.
- Off-chain storage recommended on IPFS.
- SOS logs use lightweight transactions for fast finality.
