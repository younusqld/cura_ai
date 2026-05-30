# ⚕️ Cura AI - Personalized Medicine Recommendation System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react)
![Flask](https://img.shields.io/badge/backend-Flask-000000?logo=flask)
![Machine Learning](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?logo=scikit-learn)

Cura AI is an intelligent medical triage and personalized medicine recommendation system. Built as a full-stack application with a React frontend and a Python/Flask backend, the system analyzes a patient's symptoms using a Machine Learning (Random Forest) model to predict the most likely underlying disease and suggest standard medical treatments.

> **⚠️ Disclaimer:** This application is built as an educational tool and triage system (e.g., for a BTech final year project). **It is NOT a replacement for professional medical advice, diagnosis, or treatment.** Always consult a healthcare professional for accurate medical diagnoses.

---

## ✨ Features

- **Intelligent Triage:** Enter symptoms (with severity weights) to get probability-based disease predictions.
- **Treatment Recommendations:** Receives tailored medication suggestions based on the primary predicted disease.
- **Low Confidence Fallback:** The system automatically flags ambiguous symptoms and defers to medical professionals if the prediction confidence drops below 40%.
- **Modern UI/UX:** Built with React, Vite, and Tailwind CSS for a fast, responsive, and beautiful user experience.
- **Robust ML Backend:** Utilizes a Random Forest Classifier trained on synthetic medical data, robust against real-world noisy inputs.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React

### Backend
- **Framework:** Python Flask
- **Machine Learning:** Scikit-Learn (Random Forest)
- **Data Handling:** Pandas, NumPy
- **Model Serialization:** Joblib

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/) (v3.8 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/younusqld/cura_ai.git
cd cura_ai/my-react-app
```

### 2. Backend Setup
The backend runs a Flask server that serves the Machine Learning predictions.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Start the Flask server (runs on port 5050 by default)
python app.py
```

### 3. Frontend Setup
Open a **new terminal window/tab**, and run the React frontend.

```bash
# Ensure you are in the my-react-app directory
cd my-react-app

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will typically be available at `http://localhost:5173`.

---

## 🧠 Machine Learning Workflow

The intelligence of Cura AI is powered by a **Random Forest Classifier**.
- **Input:** A vector representing the presence and severity (Mild=1, Moderate=2, Severe=3) of various symptoms.
- **Processing:** The model outputs a probability distribution across known diseases.
- **Output:** The top 3 predicted diseases with confidence scores.

For a detailed explanation of the dataset, preprocessing, hyperparameter choices, and inference pipeline (especially useful for Viva preparation), please refer to the [ML Workflow Explanation](ML_Workflow_Explanation.md) document.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
