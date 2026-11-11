
import pandas as pd
import joblib

from pathlib import Path
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import classification_report

# Project paths
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "customer_queries.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "query_classifier.joblib"

# Load dataset
data = pd.read_csv(DATA_PATH)

X = data["query"]
y = data["category"]

# Build the machine learning pipeline
model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
    ("classifier", LogisticRegression(max_iter=1000))
])

# Evaluate using 5-fold cross-validation
cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

predictions = cross_val_predict(model, X, y, cv=cv)

print("\nQUERYIQ MODEL EVALUATION")
print(classification_report(y, predictions, zero_division=0))

# Train final model using the complete dataset
model.fit(X, y)

# Save trained model
MODEL_DIR.mkdir(parents=True, exist_ok=True)
joblib.dump(model, MODEL_PATH)

print("\nModel trained and saved successfully!")
print(f"Model location: {MODEL_PATH}")
