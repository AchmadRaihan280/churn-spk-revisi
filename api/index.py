from flask import Flask, request, jsonify
from flask_cors import CORS
from recommendation import generate_recommendation

import os

# ==================================================
# LOAD MODEL
# ==================================================

model = None
feature_columns = []

if not os.environ.get('VERCEL'):
    import joblib
    import pandas as pd
    import numpy as np
    try:
        model = joblib.load("best_model.pkl")
        feature_columns = joblib.load("feature_columns.pkl")
        print("✅ Model berhasil di-load")
        print("Jumlah fitur :", len(feature_columns))
    except Exception as e:
        print("Gagal load model di lokal:", str(e))

app = Flask(__name__)
CORS(app)

# ==================================================
# LOAD MODEL
# ==================================================

model = joblib.load("best_model.pkl")
feature_columns = joblib.load("feature_columns.pkl")

print("✅ Model berhasil di-load")
print("Jumlah fitur :", len(feature_columns))


# ==================================================
# SENSOR KEBAL EROR (Fungsi yang dicari)
# ==================================================
def safe_float(val, default=0.0):
    try:
        if val is None:
            return default
        
        val_str = str(val).strip()
        
        # JIKA BERISI FORMAT TANGGAL ATAU KOSONG, UBAH JADI DEFAULT (0.0) AGAR TIDAK CRASH
        if "-" in val_str or ":" in val_str or val_str.lower() == "nan" or val_str == "":
            return default
            
        return float(val_str.replace(',', '.'))
    except:
        return default


# ==================================================
# PREPROCESS (DIREVISI TOTAL AGAR SINKRON DENGAN COLAB)
# ==================================================

def preprocess_input(mapped_data):
    import pandas as pd
    encoded = {}
    
    # Helper untuk menyederhanakan pengecekan string (case-insensitive & strip)
    def check_val(key, target_string):
        val = str(mapped_data.get(key, "")).strip().lower()
        return 1 if val == str(target_string).lower() else 0
    
    # 1. Kolom Numerik Asli
    encoded['Tenure Months'] = safe_float(mapped_data.get('Tenure Months', 0))
    encoded['Monthly Charges'] = safe_float(mapped_data.get('Monthly Charges', 0))
    encoded['Total Charges'] = safe_float(mapped_data.get('Total Charges', 0))
    
    # 2. Senior Citizen (Menyesuaikan dengan log Anda: 'Senior Citizen_Yes')
    # Jika bernilai '1', 'yes', atau True, maka dianggap Senior Citizen
    sc_val = str(mapped_data.get('Senior Citizen', '0')).strip().lower()
    encoded['Senior Citizen_Yes'] = 1 if sc_val in ['1', 'yes', 'true'] else 0

    # 3. Translasi Fitur Kategori (Sesuai persis dengan log terminal Anda)
    encoded['Gender_Male'] = check_val('Gender', 'Male')
    encoded['Partner_Yes'] = check_val('Partner', 'Yes')
    encoded['Dependents_Yes'] = check_val('Dependents', 'Yes')
    encoded['Phone Service_Yes'] = check_val('Phone Service', 'Yes')
    
    # Multiple Lines
    encoded['Multiple Lines_No phone service'] = check_val('Multiple Lines', 'No phone service')
    encoded['Multiple Lines_Yes'] = check_val('Multiple Lines', 'Yes')
    
    # Internet Service
    encoded['Internet Service_Fiber optic'] = check_val('Internet Service', 'Fiber optic')
    encoded['Internet Service_No'] = check_val('Internet Service', 'No')
    
    # Layanan Tambahan Internet (Mempertahankan spasi sesuai log: 'Online Security_Yes')
    for service in ['Online Security', 'Online Backup', 'Device Protection', 'Tech Support', 'Streaming TV', 'Streaming Movies']:
        encoded[f'{service}_No internet service'] = check_val(service, 'No internet service')
        encoded[f'{service}_Yes'] = check_val(service, 'Yes')
        
    # Contract
    encoded['Contract_One year'] = check_val('Contract', 'One year')
    encoded['Contract_Two year'] = check_val('Contract', 'Two year')
    
    # Paperless Billing
    encoded['Paperless Billing_Yes'] = check_val('Paperless Billing', 'Yes')
    
    # Payment Method
    encoded['Payment Method_Credit card (automatic)'] = check_val('Payment Method', 'Credit card (automatic)')
    encoded['Payment Method_Electronic check'] = check_val('Payment Method', 'Electronic check')
    encoded['Payment Method_Mailed check'] = check_val('Payment Method', 'Mailed check')

    # Konversi ke DataFrame
    df_encoded = pd.DataFrame([encoded])
    
    # Susun ulang sesuai feature_columns dari pkl
    df_final = df_encoded.reindex(columns=feature_columns, fill_value=0)
    
    return df_final


# ==================================================
# PREDICT MANUAL
# ==================================================

@app.route("/api/predict", methods=["POST"])
def predict():
    if os.environ.get('VERCEL'):
        return jsonify({"message": "AI diproses di lokal lewat ngrok, bukan di Vercel"}), 200
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Data JSON tidak ditemukan"}), 400

        # ==========================================
        # INPUT USER
        # ==========================================
        mapped_data = {
            "Gender": data.get("gender", ""),
            "Senior Citizen": data.get("seniorCitizen", ""),
            "Partner": data.get("partner", ""),
            "Dependents": data.get("dependents", ""),
            "Tenure Months": safe_float(data.get("tenure", 0)),
            "Phone Service": data.get("phoneService", ""),
            "Multiple Lines": data.get("multipleLines", ""),
            "Internet Service": data.get("internetService", ""),
            "Online Security": data.get("onlineSecurity", ""),
            "Online Backup": data.get("onlineBackup", ""),
            "Device Protection": data.get("deviceProtection", ""),
            "Tech Support": data.get("techSupport", ""),
            "Streaming TV": data.get("streamingTV", ""),
            "Streaming Movies": data.get("streamingMovies", ""),
            "Contract": data.get("contract", ""),
            "Paperless Billing": data.get("paperlessBilling", ""),
            "Payment Method": data.get("paymentMethod", ""),
            "Monthly Charges": safe_float(data.get("monthlyCharges", 0)),
            "Total Charges": safe_float(data.get("totalCharges", 0)),
        }

        print("\n========== INPUT USER ==========")
        for k, v in mapped_data.items():
            print(f"{k} : {v}")

        # ==========================================
        # PREPROCESS
        # ==========================================
        df_final = preprocess_input(mapped_data)
        
        print("\n========== HASIL MATRIKS ENCODE MASUK KE MODEL ==========")
        print(df_final.to_dict(orient="records"))

        # ==========================================
        # PREDIKSI
        # ==========================================
        prob = float(model.predict_proba(df_final)[0][1])
        prediction = int(prob > 0.5)

        # ==========================================
        # RISK LEVEL
        # ==========================================
        if prob >= 0.7:
            risk = "high"
        elif prob >= 0.4:
            risk = "medium"
        else:
            risk = "low"

        # ==========================================
        # RECOMMENDATION
        # ==========================================
        recommendation = generate_recommendation(
            tenure=mapped_data["Tenure Months"],
            internet_service=mapped_data["Internet Service"],
            contract=mapped_data["Contract"],
            payment_method=mapped_data["Payment Method"],
            paperless_billing=mapped_data["Paperless Billing"],
            phone_service=mapped_data["Phone Service"],
            dependents=mapped_data["Dependents"],
            churn_probability=prob,
            monthly_charges=mapped_data["Monthly Charges"],
            total_charges=mapped_data["Total Charges"],
            online_security=mapped_data["Online Security"],
            online_backup=mapped_data["Online Backup"],
            device_protection=mapped_data["Device Protection"],
            tech_support=mapped_data["Tech Support"],
            streaming_tv=mapped_data["Streaming TV"],
            streaming_movies=mapped_data["Streaming Movies"],
            senior_citizen=mapped_data["Senior Citizen"],
        )
        
        # ==========================================
        # RESPONSE
        # ==========================================
        return jsonify(
            {
                "final_probability": round(prob, 4),
                "prediction": prediction,
                "risk": risk,
                "recommendation": recommendation,
            }
        )

    except Exception as e:
        print("\n❌ ERROR PREDICT")
        print(str(e))
        return jsonify({"error": str(e)}), 500


# ==================================================
# BULK PREDICT (CSV / EXCEL)
# ==================================================

@app.route("/api/predict-bulk", methods=["POST"])
def predict_bulk():
    if os.environ.get('VERCEL'):
        return jsonify({"message": "AI diproses di lokal lewat ngrok, bukan di Vercel"}), 200
        
    import pandas as pd
    try:
        if "file" not in request.files:
            return jsonify({"error": "File tidak ditemukan"}), 400

        file = request.files["file"]

        if file.filename.endswith(".csv"):
            df_input = pd.read_csv(file)
        elif file.filename.endswith((".xls", ".xlsx")):
            df_input = pd.read_excel(file)
        else:
            return jsonify({"error": "Format file tidak didukung"}), 400

        df_input = df_input.fillna("")
        
        # Bersihkan spasi di nama kolom agar tidak ada hidden space
        df_input.columns = [str(col).strip() for col in df_input.columns]
        
        results = []
        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0

        for i, row in df_input.iterrows():
            # Helper internal untuk merapikan text di tingkat baris agar seragam
            def clean_row_str(column_name, default=""):
                val = row.get(column_name, default)
                return str(val).strip()

            # Pemetaan menggunakan safe_float agar baris tanggal tidak memicu crash
            mapped_data = {
                "Gender": clean_row_str("Gender"),
                "Senior Citizen": clean_row_str("Senior Citizen", "0"),
                "Partner": clean_row_str("Partner"),
                "Dependents": clean_row_str("Dependents"),
                "Tenure Months": clean_row_str("Tenure Months", "0"),
                "Phone Service": clean_row_str("Phone Service"),
                "Multiple Lines": clean_row_str("Multiple Lines"),
                "Internet Service": clean_row_str("Internet Service"),
                "Online Security": clean_row_str("Online Security"),
                "Online Backup": clean_row_str("Online Backup"),
                "Device Protection": clean_row_str("Device Protection"),
                "Tech Support": clean_row_str("Tech Support"),
                "Streaming TV": clean_row_str("Streaming TV"),
                "Streaming Movies": str(row.get("Streaming Movi", row.get("Streaming Movies", ""))).strip(),
                "Contract": clean_row_str("Contract"),
                "Paperless Billing": clean_row_str("Paperless Billing"),
                "Payment Method": clean_row_str("Payment Method"),
                "Monthly Charges": str(row.get("Monthly Charge", row.get("Monthly Charges", "0"))).strip(),
                "Total Charges": clean_row_str("Total Charges", "0"),
            }

            # Preprocess & Predict
            df_processed = preprocess_input(mapped_data)
            prob = float(model.predict_proba(df_processed)[0][1])
            prediction = int(prob > 0.5)

            if prob >= 0.7:
                risk = "high"
                high_risk_count += 1
            elif prob >= 0.4:
                risk = "medium"
                medium_risk_count += 1
            else:
                risk = "low"
                low_risk_count += 1

            # Menggunakan skema ekstraksi data yang aman dan sinkron untuk rekomendasi
            recommendation = generate_recommendation(
                tenure=safe_float(mapped_data["Tenure Months"]),
                internet_service=mapped_data["Internet Service"],
                contract=mapped_data["Contract"],
                payment_method=mapped_data["Payment Method"],
                paperless_billing=mapped_data["Paperless Billing"],
                phone_service=mapped_data["Phone Service"],
                dependents=mapped_data["Dependents"],
                churn_probability=prob,
                monthly_charges=safe_float(mapped_data["Monthly Charges"]),
                total_charges=safe_float(mapped_data["Total Charges"]),
                online_security=mapped_data["Online Security"],
                online_backup=mapped_data["Online Backup"],
                device_protection=mapped_data["Device Protection"],
                tech_support=mapped_data["Tech Support"],
                streaming_tv=mapped_data["Streaming TV"],
                streaming_movies=mapped_data["Streaming Movies"],
                senior_citizen=mapped_data["Senior Citizen"],
            )

            # Menangkap CustomerID dengan huruf I besar sesuai file Excel Anda
            cust_id = str(row.get("CustomerID", f"CUST-{i+1:03d}"))

            results.append({
                "customerID": cust_id,
                "tenure": safe_float(mapped_data["Tenure Months"]),
                "monthlyCharges": safe_float(mapped_data["Monthly Charges"]),
                "totalCharges": safe_float(mapped_data["Total Charges"]),
                "final_probability": round(prob, 4),
                "prediction": prediction,
                "risk": risk,
                "recommendation": recommendation,
            })

        return jsonify({
            "total_data": len(df_input),
            "high_risk": high_risk_count,
            "medium_risk": medium_risk_count,
            "low_risk": low_risk_count,
            "predictions": results,
        })

    except Exception as e:
        print("\n❌ ERROR BULK")
        print(str(e))
        return jsonify({"error": str(e)}), 500


# ==================================================
# TEST API
# ==================================================

@app.route("/")
def home():
    return jsonify(
        {
            "status": "success",
            "message": "Customer Churn API Running",
           "model": "Paralel 24-Scenario Best Model Evaluator",
            "total_feature": len(feature_columns) if feature_columns else 30,
        }
    )


# ==================================================
# RUN SERVER
# ==================================================

if __name__ == "__main__":
    app.run(debug=True, port=5000)  