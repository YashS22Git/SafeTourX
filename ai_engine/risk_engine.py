import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os

app = Flask(__name__)
CORS(app)

# Global model and scaler
model = None
scaler = None

def train_model():
    global model, scaler
    print("⏳ Loading crime data...", end=" ")
    
    try:
        # Load Data
        df = pd.read_csv('maharashtra_crime_dummy_50000.csv')
        print(f"Loaded {len(df)} records.")

        # Features: Lat, Lng, Hour
        X = df[['latitude', 'longitude', 'hour']]
        y = df['risk_label'] # 0=Safe, 1=Low, 2=Medium, 3=High

        # Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)

        # Train Random Forest
        print("🌲 Training Random Forest Classifier...", end=" ")
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train_scaled, y_train)
        print("Done ✅")
        
        # Save model (optional for persistence, skipping for demo speed)
        # joblib.dump(model, 'risk_model.pkl')
        # joblib.dump(scaler, 'scaler.pkl')

    except Exception as e:
        print(f"\n❌ Error training model: {e}")

# Train on startup
if os.path.exists('maharashtra_crime_dummy_50000.csv'):
    train_model()
else:
    print("⚠ CSV not found. Please run generate_data.py first.")

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    global model, scaler
    if not model:
        return jsonify({"error": "Model not trained"}), 500

    try:
        data = request.json
        points = data.get('points', []) # List of {lat, lng, hour}
        
        if not points:
            return jsonify({"error": "No points provided"}), 400

        # Convert to DataFrame
        input_df = pd.DataFrame(points)
        
        # Ensure correct columns
        if 'hour' not in input_df.columns:
            # Default to current hour if not provided
            import datetime
            current_hour = datetime.datetime.now().hour
            input_df['hour'] = current_hour

        # Preprocess
        X_pred = input_df[['lat', 'lng', 'hour']]
        # Rename columns to match training
        X_pred.columns = ['latitude', 'longitude', 'hour']
        
        X_pred_scaled = scaler.transform(X_pred)

        # Predict Probabilities
        probs = model.predict_proba(X_pred_scaled)
        
        # Calculate Weighted Risk Score (0-100)
        # Classes: 0 (Safe), 1 (Low), 2 (Med), 3 (High)
        # Weights: 0, 30, 60, 100
        risk_scores = []
        for prob in probs:
            # prob is array of [p0, p1, p2, p3]
            # Handle cases where not all classes are present in training subset (edge case)
            score = 0
            classes = model.classes_
            
            for idx, cls in enumerate(classes):
                weight = 0
                if cls == 1: weight = 30
                elif cls == 2: weight = 60
                elif cls == 3: weight = 100
                
                score += prob[idx] * weight
            
            risk_scores.append(score)

        avg_risk = np.mean(risk_scores)
        max_risk = np.max(risk_scores)

        return jsonify({
            "average_risk": round(avg_risk, 2),
            "max_risk": round(max_risk, 2),
            "points_analyzed": len(points),
            "risk_scores": [round(x, 2) for x in risk_scores]
        })

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running", "model_trained": model is not None})

@app.route('/get_crime_data', methods=['GET'])
def get_crime_data():
    try:
        # Load data if not already (though train_model does it, we might want fresh read or use global)
        # For efficiency, we will read the CSV again or cache it. 
        # Using a sample of 1000 points for frontend performance.
        df = pd.read_csv('maharashtra_crime_dummy_50000.csv')
        
        # Optional: Filters from query params
        crime_type = request.args.get('type')
        if crime_type and crime_type != "All":
            df = df[df['crime_type'] == crime_type]
            
        # Sample for visualization (limit to 2000 to prevent browser lag)
        # Handle NaN values which break JSON
        df = df.where(pd.notnull(df), None)
        sample = df.sample(n=min(2000, len(df))).to_dict(orient='records')
        return jsonify(sample)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True, use_reloader=False)
