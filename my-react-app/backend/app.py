from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
import json

app = Flask(__name__)
# Enable CORS so the React frontend can make requests
CORS(app)

# Global variables to hold the model, features, and medicine mappings
model = None
feature_names = None
df_medicine = None

def load_resources():
    global model, feature_names, df_medicine
    base_dir = os.path.dirname(__file__)
    
    model_path = os.path.join(base_dir, 'rf_model.pkl')
    features_path = os.path.join(base_dir, 'feature_names.json')
    med_path = os.path.join(base_dir, 'disease_medicine.csv')
    
    if os.path.exists(model_path) and os.path.exists(features_path):
        model = joblib.load(model_path)
        with open(features_path, 'r') as f:
            feature_names = json.load(f)
        print("Model and features loaded successfully.")
    else:
        print("Warning: Model or features not found. Run train_model.py first.")
        
    if os.path.exists(med_path):
        df_medicine = pd.read_csv(med_path)
        print("Medicine dataset loaded successfully.")
    else:
        print("Warning: Medicine dataset not found.")

# Load resources at startup
load_resources()

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        "status": "online", 
        "model_loaded": model is not None,
        "available_symptoms": feature_names if feature_names else []
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None or feature_names is None:
        return jsonify({"error": "Machine Learning model is not initialized."}), 500
        
    try:
        data = request.json
        # Expecting data format: {"symptoms": [{"name": "fever", "severity": 2}, ...]}
        user_symptoms = data.get('symptoms', [])
        
        if not user_symptoms:
            return jsonify({"error": "No symptoms provided."}), 400
            
        # Create a feature vector initialized to 0
        input_vector = np.zeros(len(feature_names))
        
        # Populate the feature vector with severities
        for item in user_symptoms:
            sym_name = item.get('name')
            severity = item.get('severity', 1)
            
            if sym_name in feature_names:
                idx = feature_names.index(sym_name)
                input_vector[idx] = severity
                
        # Reshape for sklearn
        input_vector = input_vector.reshape(1, -1)
        
        # Get predictions and probabilities
        probabilities = model.predict_proba(input_vector)[0]
        classes = model.classes_
        
        # Combine classes with their probabilities and sort by highest prob
        class_probs = list(zip(classes, probabilities))
        class_probs.sort(key=lambda x: x[1], reverse=True)
        
        # Get the top 3 predictions
        top_predictions = []
        for i in range(min(3, len(class_probs))):
            disease, prob = class_probs[i]
            if prob > 0: # Only include if probability > 0
                top_predictions.append({
                    "disease": disease,
                    "confidence": round(prob * 100, 2)
                })
                
        if not top_predictions:
            return jsonify({
                "predictions": [],
                "medicines": [],
                "message": "Could not determine a matching disease with the given symptoms."
            })
            
        # LOW CONFIDENCE FALLBACK SYSTEM
        if top_predictions[0]["confidence"] < 40.0:
            return jsonify({
                "isFallback": True,
                "message": "No reliable medicine recommendation could be generated based on the provided symptoms. Please consult a healthcare professional for accurate diagnosis.",
                "predictions": top_predictions,
                "medicines": []
            })
            
        # Primary predicted disease
        primary_disease = top_predictions[0]["disease"]
        
        # Fetch medicines for the primary disease
        recommended_medicines = []
        if df_medicine is not None:
            meds = df_medicine[df_medicine['Disease'] == primary_disease]
            if 'Priority' in meds.columns:
                meds = meds.sort_values(by='Priority')
            for _, row in meds.iterrows():
                med_info = {
                    "name": row['Medicine'],
                    "category": row['Category'],
                    "description": row['Description']
                }
                if 'Precautions' in row:
                    med_info['precautions'] = row['Precautions']
                if 'Priority' in row:
                    med_info['priority'] = int(row['Priority'])
                recommended_medicines.append(med_info)
                
        return jsonify({
            "predictions": top_predictions,
            "medicines": recommended_medicines
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run the Flask app on port 5050
    app.run(debug=True, port=5050)
