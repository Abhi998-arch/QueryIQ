# QueryIQ – Intelligent Customer Query Classification System

QueryIQ is an AI-powered customer query management system that automatically classifies customer messages, predicts their categories, assigns them to the appropriate departments, and tracks their resolution status.

## Features

- **AI Query Classification:** Predicts customer query categories using Natural Language Processing and Machine Learning.
- **Department Routing:** Assigns queries to relevant departments.
- **Confidence Score:** Displays the model's prediction confidence.
- **Query History:** Stores and displays previously submitted queries.
- **Status Management:** Tracks queries as Pending, In Progress, or Resolved.
- **Analytics Dashboard:** Displays query statistics, category distribution, department distribution, and resolution rate.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, CSS |
| Backend | Python, FastAPI |
| Machine Learning | Scikit-learn |
| NLP | TF-IDF |
| Classification Model | Logistic Regression |
| Data Processing | Pandas, NumPy |
| Database | SQLite |

## Machine Learning Approach

QueryIQ uses a TF-IDF vectorizer with unigram and bigram features to convert customer messages into numerical representations.

A Logistic Regression classifier predicts the most likely query category.

**Training dataset:** 100 synthetic customer queries across five categories.

**Evaluation:** 82% accuracy using 5-fold cross-validation on the current dataset.

*Note: This is an experimental model evaluated on a small synthetic dataset. Its performance may differ on real-world customer messages.*

## Query Categories

1. Billing
2. Technical Support
3. Account Management
4. Order Management
5. General Inquiry

## Project Structure

```text
QueryIQ/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   └── queryiq.db
│   └── ml/
│       ├── data/
│       │   └── customer_queries.csv
│       ├── models/
│       │   └── query_classifier.joblib
│       └── training.py
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
├── .venv/
└── .gitignore
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Abhi998-arch/QueryIQ.git
cd QueryIQ
```

### 2. Set up the Python environment

```bash
py -3.13 -m venv .venv
```

Activate the environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Start the backend

From the project root:

```bash
uvicorn backend.app.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Backend health check |
| POST | `/predict` | Classify and save a customer query |
| GET | `/queries` | Retrieve query history |
| PATCH | `/queries/{query_id}/status` | Update query status |
| GET | `/analytics` | Retrieve dashboard analytics |

## Query Status Workflow

- **Pending:** Newly submitted query awaiting attention.
- **In Progress:** Query currently being handled.
- **Resolved:** Query successfully completed.

## Future Improvements

- Expand the training dataset with real-world examples.
- Improve classification accuracy.
- Add administrator authentication and role-based access.
- Introduce human review for uncertain predictions.
- Deploy the frontend and backend to cloud platforms.

## Author

**Abhilash Venkat**

GitHub: [Abhi998-arch](https://github.com/Abhi998-arch)

---

**QueryIQ – Intelligent Query Management System**  
Powered by Natural Language Processing and Machine Learning.
