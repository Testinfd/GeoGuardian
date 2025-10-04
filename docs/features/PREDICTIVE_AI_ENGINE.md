# Feature Documentation: Predictive AI Engine for Early Warning

This document provides a detailed guide for implementing the Predictive AI Engine into the GeoGuardian platform.

---

### 1. Overview

**Goal:** Transition from reactive change detection to proactive, AI-driven forecasting of environmental anomalies. The engine will predict future spectral index values (e.g., NDVI), and flag significant deviations from these predictions in new satellite imagery, serving as an early warning system.

**Core Technology:** A Long Short-Term Memory (LSTM) neural network, which is well-suited for time-series forecasting.

---

### 2. Backend Implementation Guide

The backend will handle data collection, model training, and prediction.

#### **Step 2.1: Update Dependencies**

Add the following libraries to `backend/requirements_enhanced.txt` for machine learning and data manipulation:

```
tensorflow
scikit-learn
pandas
```

Install them in your environment: `pip install -r backend/requirements_enhanced.txt`

#### **Step 2.2: Create the Forecasting Module**

Create a new file: `backend/app/algorithms/forecasting.py`. This module will contain the LSTM model and its related functions.

```python
# backend/app/algorithms/forecasting.py

import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler

# Constants
N_STEPS = 30  # Lookback period (e.g., 30 days)
N_FEATURES = 1 # Number of features (e.g., just NDVI)

def create_dataset(data, n_steps=N_STEPS):
    """Prepares time-series data for the LSTM model."""
    X, y = [], []
    for i in range(len(data)):
        end_ix = i + n_steps
        if end_ix > len(data)-1:
            break
        seq_x, seq_y = data[i:end_ix], data[end_ix]
        X.append(seq_x)
        y.append(seq_y)
    return np.array(X), np.array(y)

def build_lstm_model(n_steps=N_STEPS, n_features=N_FEATURES):
    """Builds and compiles the LSTM model."""
    model = Sequential()
    model.add(LSTM(50, activation='relu', return_sequences=True, input_shape=(n_steps, n_features)))
    model.add(Dropout(0.2))
    model.add(LSTM(50, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mse')
    return model

def train_model(model, historical_data):
    """Trains the LSTM model on historical data."""
    # Assuming historical_data is a pandas Series of NDVI values
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(historical_data.values.reshape(-1, 1))

    X, y = create_dataset(scaled_data)
    X = X.reshape((X.shape[0], X.shape[1], N_FEATURES))

    model.fit(X, y, epochs=200, verbose=0)
    return model, scaler

def predict_future(model, scaler, recent_data):
    """Predicts the next value in the time series."""
    # recent_data should be the last N_STEPS values
    scaled_data = scaler.transform(recent_data.values.reshape(-1, 1))
    x_input = np.array(scaled_data).reshape((1, N_STEPS, N_FEATURES))
    
    predicted_scaled = model.predict(x_input, verbose=0)
    predicted_value = scaler.inverse_transform(predicted_scaled)
    
    return predicted_value[0][0]

```

#### **Step 2.3: Integrate into the Analysis Engine**

Modify `backend/app/core/analysis_engine.py` to include a new analysis type for prediction.

```python
# In backend/app/core/analysis_engine.py

# ... other imports
from app.algorithms import forecasting
from app.core.satellite_data import get_historical_time_series # Assuming this function exists/is created

# ...

class AnalysisEngine:
    # ... existing methods

    def run_predictive_analysis(self, aoi, days_to_predict=7):
        """
        Runs the predictive analysis for a given AOI.
        1. Fetches historical data.
        2. Trains a dedicated model for the AOI.
        3. Predicts future values.
        4. Compares prediction with the latest actual data.
        """
        # 1. Fetch historical data (e.g., last 90 days of daily NDVI)
        # This function needs to be implemented in satellite_data.py
        historical_ndvi = get_historical_time_series(aoi, lookback_period=90)

        if len(historical_ndvi) < forecasting.N_STEPS + 1:
            # Not enough data to train
            return {"status": "error", "message": "Insufficient historical data for prediction."}

        # 2. Build and train the model
        model = forecasting.build_lstm_model()
        model, scaler = forecasting.train_model(model, historical_ndvi)

        # 3. Predict the next value
        recent_data = historical_ndvi.iloc[-forecasting.N_STEPS:]
        predicted_ndvi = forecasting.predict_future(model, scaler, recent_data)

        # 4. Compare with latest actual data
        latest_actual_ndvi = historical_ndvi.iloc[-1]
        divergence = (latest_actual_ndvi - predicted_ndvi) / predicted_ndvi

        result = {
            "predicted_ndvi": predicted_ndvi,
            "latest_actual_ndvi": latest_actual_ndvi,
            "divergence_percent": divergence * 100,
        }

        # 5. Trigger alert if divergence is significant
        if abs(result["divergence_percent"]) > 15: # 15% threshold
            # Logic to create and save a new "Predicted Anomaly" alert
            self.create_predicted_anomaly_alert(aoi, result)
        
        return result

    def create_predicted_anomaly_alert(self, aoi, result_data):
        # This would create a new alert in the database with a special type
        # and store the prediction details.
        print(f"Predicted Anomaly Alert for AOI {aoi.id}: {result_data}")
        pass

```

#### **Step 2.4: Create New API Endpoint**

In a relevant file like `backend/app/api/v2/analysis.py`, add an endpoint to trigger this new analysis.

---

### 3. Frontend Implementation Guide

The frontend needs to display the new type of alert.

#### **Step 3.1: Update Alert Component**

In `frontend/src/components/alerts/AlertVerification.tsx` or a similar component, add logic to render "Predicted Anomaly" alerts differently.

- **Distinguishing Feature:** Check for a new alert type, e.g., `alert.type === 'PREDICTED_ANOMALY'`.
- **Visual Cue:** Use a distinct icon (like a brain or a crystal ball) and a different color scheme (e.g., purple) to signify that it's a predictive alert.
- **Display Data:** Show the predicted vs. actual NDVI values and the divergence percentage.

#### **Step 3.2: Update Analysis Creation Form**

In `frontend/src/app/analysis/new/page.tsx`, add "Predictive Forecast" as a new option in the analysis type selector. When selected, it should call the new backend endpoint.

---

### 4. Summary

This implementation creates a powerful new capability for GeoGuardian. The key is to build a robust data pipeline in `satellite_data.py` to feed the model and to clearly present the predictive insights to the user on the frontend.
