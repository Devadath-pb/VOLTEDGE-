
import joblib

model_path = "backend/app/ml/models/soh_model.pkl"

try:
    model_data = joblib.load(model_path)

    print("Model loaded successfully!")
    print("Model type:", type(model_data))

    if isinstance(model_data, dict):
        print("Available keys:", list(model_data.keys()))

        model = model_data.get("model")
        if model is not None:
            print("Actual model:", type(model))
            print("Expected features:",
                  getattr(model, "feature_names_in_", "Not stored"))
    else:
        print("Expected features:",
              getattr(model_data, "feature_names_in_", "Not stored"))

except Exception as e:
    print("Error loading model:", e)
