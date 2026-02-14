import pandas as pd
import numpy as np
import random
import time

def generate_crime_data(num_samples=50000):
    # Mumbai Coordinates Boundaries
    lat_min, lat_max = 18.8930, 19.2700
    lng_min, lng_max = 72.7750, 73.0000

    # Risk Hotspots (Lat, Lng, Radius, Intensity)
    hotspots = [
        (18.9220, 72.8347, 0.01, 0.9), # Gateway / Colaba (High tourist, petty theft)
        (19.0596, 72.8295, 0.02, 0.8), # Bandra (Nightlife)
        (19.0330, 72.8450, 0.015, 0.7), # Dadar (Crowded)
        (18.9500, 72.8200, 0.01, 0.3), # Marine Drive (Relatively Safe)
    ]

    data = []
    start_time = time.time()

    print(f"Generating {num_samples} samples...")

    for _ in range(num_samples):
        # Base random location
        lat = random.uniform(lat_min, lat_max)
        lng = random.uniform(lng_min, lng_max)

        # Time of day (0-23)
        hour = random.randint(0, 23)

        # Crime Categories
        crime_types = ['Theft', 'Harassment', 'Assault', 'Robbery', 'None']
        weights = [0.1, 0.05, 0.02, 0.01, 0.82] # Default low crime

        # Adjust based on hotspots
        is_hotspot = False
        for h_lat, h_lng, rad, intensity in hotspots:
            dist = np.sqrt((lat - h_lat)**2 + (lng - h_lng)**2)
            if dist < rad:
                # Inside hotspot
                if random.random() < intensity:
                    weights = [0.3, 0.15, 0.05, 0.05, 0.45] # Increased crime prob
                    is_hotspot = True
                break
        
        # Adjust based on time (Night is riskier)
        if hour > 22 or hour < 5:
             weights[0] += 0.1 # More theft
             weights[4] -= 0.1 # Less 'None'
        
        crime = random.choices(crime_types, weights=weights)[0]
        
        # Risk Score (Target Variable for Training)
        # 0 = Safe, 1 = Low, 2 = Medium, 3 = High
        if crime == 'None':
            risk_label = 0
        elif crime == 'Theft':
            risk_label = 1
        elif crime == 'Harassment':
            risk_label = 2
        else:
            risk_label = 3

        data.append([lat, lng, hour, crime, risk_label])

    df = pd.DataFrame(data, columns=['latitude', 'longitude', 'hour', 'crime_type', 'risk_label'])
    
    output_file = 'maharashtra_crime_dummy_50000.csv'
    df.to_csv(output_file, index=False)
    print(f"✅ Generated {output_file} in {time.time() - start_time:.2f} seconds")

if __name__ == "__main__":
    generate_crime_data()
