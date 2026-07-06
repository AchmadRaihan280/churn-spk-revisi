def generate_recommendation(
    tenure,
    internet_service,
    contract,
    payment_method,
    paperless_billing,
    phone_service,
    dependents,
    churn_probability,
    monthly_charges=0,
    total_charges=0,
    online_security="No",
    online_backup="No",
    device_protection="No",
    tech_support="No",
    streaming_tv="No",
    streaming_movies="No",
    senior_citizen="No",
):
    reasons = []
    recommendations = []

    # Helper function untuk standarisasi teks input (menghindari error spasi / kapitalisasi)
    def clean_val(val):
        if val is None:
            return "no"
        return str(val).strip().lower()

    # Standarisasi nilai esensial ke format huruf kecil
    internet_service_clean = clean_val(internet_service)
    contract_clean = str(contract).strip() # Tetap jaga casing asli untuk visualisasi nama kontrak jika perlu
    payment_method_clean = str(payment_method).strip()

    # ==================================================
    # RISK LEVEL
    # ==================================================
    if churn_probability >= 0.70:
        risk_level = "HIGH"
    elif churn_probability >= 0.40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # ==================================================
    # TENURE
    # ==================================================
    try:
        tenure_val = float(tenure)
    except:
        tenure_val = 0

    if tenure_val < 12:
        reasons.append(
            f"Pelanggan masih baru dengan masa berlangganan {int(tenure_val)} bulan."
        )
        recommendations.append(
            "Berikan program onboarding dan edukasi layanan untuk meningkatkan keterikatan pelanggan."
        )
    elif tenure_val >= 48:
        reasons.append(
            f"Pelanggan telah berlangganan selama {int(tenure_val)} bulan."
        )
        recommendations.append(
            "Berikan reward loyalitas atau penghargaan pelanggan jangka panjang."
        )

    # ==================================================
    # CONTRACT
    # ==================================================
    if contract_clean == "Month-to-month":
        reasons.append(
            "Menggunakan kontrak bulanan yang memungkinkan pelanggan berhenti kapan saja."
        )
        recommendations.append(
            "Tawarkan migrasi ke kontrak 1 tahun atau 2 tahun dengan insentif harga."
        )
    elif contract_clean == "One year":
        reasons.append("Menggunakan kontrak satu tahun.")
    elif contract_clean == "Two year":
        reasons.append("Menggunakan kontrak dua tahun yang menunjukkan loyalitas lebih tinggi.")

    # ==================================================
    # MONTHLY CHARGES
    # ==================================================
    try:
        monthly_val = float(monthly_charges)
    except:
        monthly_val = 0

    if monthly_val >= 100:
        reasons.append(
            f"Tagihan bulanan sangat tinggi (${monthly_val:.2f})."
        )
        recommendations.append(
            "Berikan diskon loyalitas atau paket bundling untuk menurunkan beban biaya pelanggan."
        )
    elif monthly_val >= 80:
        reasons.append(
            f"Tagihan bulanan cukup tinggi (${monthly_val:.2f})."
        )
        recommendations.append(
            "Tawarkan promo harga atau peningkatan value layanan."
        )
    elif monthly_val <= 30 and monthly_val > 0:
        reasons.append(
            f"Tagihan bulanan relatif rendah (${monthly_val:.2f})."
        )

    # ==================================================
    # TOTAL CHARGES
    # ==================================================
    try:
        total_val = float(total_charges)
    except:
        total_val = 0

    if total_val >= 5000:
        reasons.append(
            f"Pelanggan telah memberikan kontribusi pendapatan tinggi (${total_val:.2f})."
        )
        recommendations.append(
            "Masukkan pelanggan ke program VIP atau loyalitas prioritas."
        )

    # ==================================================
    # INTERNET SERVICE
    # ==================================================
    if internet_service_clean == "fiber optic":
        reasons.append(
            "Menggunakan layanan Fiber Optic yang pada data historis memiliki tingkat churn lebih tinggi."
        )
        recommendations.append(
            "Lakukan monitoring kualitas jaringan dan survei kepuasan pelanggan."
        )
    elif internet_service_clean == "dsl":
        reasons.append("Menggunakan layanan DSL.")
    elif internet_service_clean == "no":
        reasons.append("Tidak menggunakan layanan internet.")
        recommendations.append(
            "Tawarkan paket internet dengan harga promosi."
        )

    # ==================================================
    # ONLINE SECURITY, BACKUP, PROTECTION, TECH SUPPORT
    # ==================================================
    # Aturan valid: Rekomendasi proteksi ditawarkan HANYA jika pelanggan MEMILIKI layanan internet
    if internet_service_clean != "no":
        if clean_val(online_security) == "no":
            reasons.append("Tidak menggunakan layanan Online Security.")
            recommendations.append(
                "Tawarkan fitur keamanan online gratis atau diskon pada bulan pertama."
            )
        
        if clean_val(online_backup) == "no":
            reasons.append("Tidak menggunakan layanan Online Backup.")
            recommendations.append(
                "Tawarkan layanan backup data sebagai nilai tambah."
            )
            
        if clean_val(device_protection) == "no":
            reasons.append("Tidak menggunakan layanan Device Protection.")
            recommendations.append(
                "Tawarkan perlindungan perangkat untuk meningkatkan keterikatan pelanggan."
            )
            
        if clean_val(tech_support) == "no":
            reasons.append("Tidak menggunakan layanan Tech Support.")
            recommendations.append(
                "Berikan layanan Tech Support gratis selama periode tertentu."
            )

    # ==================================================
    # PHONE SERVICE & BUNDLING
    # ==================================================
    if clean_val(phone_service) == "no":
        reasons.append("Tidak menggunakan layanan telepon.")
        # Hanya menyarankan bundling jika pelanggan punya internet tapi gak punya telepon
        if internet_service_clean != "no":
            recommendations.append("Tawarkan bundling layanan telepon dengan internet.")

    # ==================================================
    # STREAMING SERVICES
    # ==================================================
    if clean_val(streaming_tv) == "yes":
        reasons.append("Menggunakan layanan Streaming TV.")

    if clean_val(streaming_movies) == "yes":
        reasons.append("Menggunakan layanan Streaming Movies.")

    # ==================================================
    # PAYMENT METHOD
    # ==================================================
    if payment_method_clean == "Electronic check":
        reasons.append(
            "Menggunakan metode pembayaran Electronic Check yang secara historis memiliki kecenderungan churn lebih tinggi."
        )
        recommendations.append(
            "Dorong pelanggan beralih ke metode pembayaran otomatis."
        )
    elif payment_method_clean in ["Credit card (automatic)", "Bank transfer (automatic)"]:
        reasons.append(f"Menggunakan pembayaran otomatis ({payment_method_clean}).")
    elif payment_method_clean == "Mailed check":
        reasons.append("Menggunakan pembayaran melalui cek.")
        recommendations.append(
            "Tawarkan migrasi ke pembayaran digital yang lebih praktis."
        )

    # ==================================================
    # PAPERLESS BILLING
    # ==================================================
    if clean_val(paperless_billing) == "yes":
        reasons.append("Menggunakan Paperless Billing.")
        recommendations.append(
            "Manfaatkan kanal digital untuk memberikan promosi yang dipersonalisasi."
        )

    # ==================================================
    # DEPENDENTS
    # ==================================================
    if clean_val(dependents) == "no":
        reasons.append(
            "Tidak memiliki tanggungan sehingga lebih fleksibel dalam berpindah layanan."
        )
        recommendations.append(
            "Fokus pada promosi berbasis manfaat dan nilai layanan."
        )
    else:
        reasons.append(
            "Memiliki tanggungan yang membutuhkan stabilitas layanan."
        )

    # ==================================================
    # SENIOR CITIZEN
    # ==================================================
    if clean_val(senior_citizen) in ["yes", "1"]:
        reasons.append("Termasuk kategori Senior Citizen.")
        recommendations.append(
            "Berikan layanan pelanggan yang lebih personal dan mudah diakses."
        )

    # ==================================================
    # RISK LEVEL ACTION
    # ==================================================
    if risk_level == "HIGH":
        recommendations.append(
            "Lakukan kontak proaktif melalui telepon atau email untuk memahami kebutuhan pelanggan."
        )
        recommendations.append(
            "Berikan penawaran retensi khusus karena pelanggan berada pada risiko churn tinggi."
        )
        recommendations.append(
            "Prioritaskan pelanggan dalam program customer retention."
        )
    elif risk_level == "MEDIUM":
        recommendations.append(
            "Pantau aktivitas pelanggan dan kirim promo yang relevan."
        )
        recommendations.append(
            "Lakukan follow-up berkala untuk meningkatkan kepuasan pelanggan."
        )
    else:
        recommendations.append(
            "Pertahankan kualitas layanan dan program loyalitas yang ada."
        )

    # ==================================================
    # REMOVE DUPLICATE
    # ==================================================
    recommendations = list(dict.fromkeys(recommendations))
    reasons = list(dict.fromkeys(reasons))

    return {
        "risk_level": risk_level,
        "reasons": reasons,
        "recommendations": recommendations,
    }