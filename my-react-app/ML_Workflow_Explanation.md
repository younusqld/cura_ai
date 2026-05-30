# Machine Learning Workflow: Personalized Medicine Recommendation System

This document explains the end-to-end Machine Learning pipeline used in this project. It is designed to help you prepare for your BTech final year project viva.

## 1. Problem Statement
The goal is to build an intelligent triage system that can analyze a patient's symptoms, predict the most likely underlying disease, and recommend standard medical treatments based on that prediction.

## 2. Dataset Generation & Preprocessing
In a real-world scenario, we would use large datasets like the Columbia University Disease-Symptom dataset. For this project, a highly realistic synthetic dataset was generated using a custom Python script (`dataset_generator.py`).

### Data Structure
- **Symptoms-Disease Dataset (`symptoms_disease.csv`)**: Contains rows where each column represents a specific symptom (e.g., `fever`, `cough`, `headache`), and the target column is `Disease` (e.g., `COVID-19`, `Malaria`).
- **Disease-Medicine Mapping (`disease_medicine.csv`)**: A lookup table mapping a specific disease to recommended medicines, categories, and descriptions.

### Preprocessing Techniques
1. **Feature Engineering**: Instead of simple binary values (0 = Absent, 1 = Present), the system accepts **Severity Weights** (1 = Mild, 2 = Moderate, 3 = Severe). This allows the model to differentiate between a mild headache and a severe migraine.
2. **Noise Introduction**: During dataset generation, random unrelated symptoms were introduced to 20% of the training data. This prevents the model from memorizing exact symptom combinations, making it robust against real-world, noisy patient inputs.
3. **Target Encoding**: The `Disease` column is treated as categorical target data (`y`), while the symptoms are the feature matrix (`X`).

## 3. Model Selection: Random Forest Classifier
The **Random Forest Classifier** (from Scikit-Learn) was chosen over other algorithms (like SVM or Logistic Regression) for several reasons:
- **Interpretability**: It is easy to explain. A Random Forest is an ensemble of many Decision Trees. Each tree "votes" on the disease, and the majority vote wins.
- **Handling Non-linear Data**: Symptoms do not always have a linear relationship with diseases. Decision trees handle complex, non-linear relationships well.
- **Robustness to Overfitting**: By aggregating multiple trees trained on random subsets of data and features, Random Forest prevents the overfitting common in single decision trees.

### Hyperparameters
- `n_estimators=100`: The model builds 100 individual decision trees.
- `random_state=42`: Ensures reproducibility of results across different runs.

## 4. Inference Pipeline (How Prediction Works)
When a user submits their symptoms via the React frontend:
1. **Vectorization**: The Flask backend receives the symptoms and creates an array of zeros matching the exact length of all known features (symptoms). It then places the severity score (1, 2, or 3) into the index corresponding to the user's selected symptoms.
2. **Prediction**: The vector is passed to `model.predict_proba(input_vector)`.
3. **Confidence Scores**: Instead of just outputting a single disease, `predict_proba` returns a probability distribution across all known diseases. The top 3 diseases with the highest probabilities are returned to the user as "Confidence Scores".
4. **Treatment Lookup**: The primary predicted disease is used to query the `disease_medicine.csv` dataset to retrieve recommended treatments.

## 5. Limitations and Ethical Considerations
> [!WARNING]
> **Important Viva Point:** Always emphasize that this system is a **triage and educational tool**, not a replacement for a doctor.
- **Dataset Limitation**: The model is only as good as its training data. It cannot diagnose rare diseases not present in its dataset.
- **False Positives/Negatives**: The system may misdiagnose life-threatening conditions. Hence, a strict medical disclaimer is displayed before any prediction is made.
- **Lack of Patient History**: The current model does not factor in patient age, gender, allergies, or past medical history, which are critical for safe medicine prescription.
