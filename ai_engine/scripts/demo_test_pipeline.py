"""
FULL TRACE DEMO SCRIPT
----------------------
This script shows EACH STEP of the AI ticket classification pipeline:
- Language Detection
- Translation
- Cleaning
- Lemmatization
- Keyword Extraction
- Model Prediction
- Rule Engine
- Entity Extraction
- Final JSON Output
"""

from inference import (
    translate_to_english,
    clean_text,
    lemmatize_and_clean_text,
    extract_entities,
    preprocess_text,
    model_predict,
    apply_minimal_rules,
    predict_ticket_final
)

# ===============================
# Test Cases
# ===============================
test_tickets = [
    {
        "case": "Short Issue",
        "title": "Wifi issue",
        "description": "Internet not working"
    },
    {
        "case": "Long Detailed Issue",
        "title": "Laptop overheating and shutdown",
        "description": (
            "My office laptop is overheating after 10 minutes of use. "
            "The fan is running very loud and the system shuts down automatically."
        )
    },
    {
        "case": "Ambiguous Issue",
        "title": "Problem",
        "description": "Something is wrong with the system"
    },
    {
        "case": "Critical Production Issue",
        "title": "Server Down",
        "description": "Production server down since morning. Critical error observed."
    },
    {
        "case": "Non-English Issue (Hindi)",
        "title": "नेटवर्क समस्या",
        "description": "ऑफिस में वाईफाई काम नहीं कर रहा है"
    },
    {
        "case": "Non-English Issue (Kannada)",
        "title": "",
        "description": "ಆಫೀಸ್ ಲ್ಯಾಪ್‌ಟಾಪ್ ಸ್ಟಾರ್ಟ್ ಆಗುತ್ತಿಲ್ಲ"
    },
    {
        "case": "Very Short / Invalid Input",
        "title": "",
        "description": "help"
    }
]

# ===============================
# RUN TRACE
# ===============================
print("\n================ FULL AI PIPELINE TRACE DEMO ================\n")

for idx, ticket in enumerate(test_tickets, start=1):
    print(f"\n🔹 TEST CASE {idx}: {ticket['case']}")
    print("=" * 70)

    title = ticket["title"]
    desc = ticket["description"]
    raw_text = f"{title} {desc}"

    print("\n[1] RAW INPUT")
    print("Title       :", title or "(empty)")
    print("Description :", desc)

    # Language Detection + Translation
    translated = translate_to_english(raw_text)
    print("\n[2] LANGUAGE DETECTION & TRANSLATION")
    print("Translated Text:", translated)

    # Cleaning
    cleaned = clean_text(translated)
    print("\n[3] TEXT CLEANING")
    print("Cleaned Text:", cleaned)

    # Lemmatization
    lemmatized = lemmatize_and_clean_text(cleaned)
    print("\n[4] LEMMATIZATION & STOPWORD REMOVAL")
    print("Processed Text:", lemmatized)

    # Keyword Extraction
    translated_text, processed_text, keywords = preprocess_text(title, desc)
    print("\n[5] KEYWORD EXTRACTION (KeyBERT)")
    print("Extracted Keywords:", keywords or "(none)")

    # Model Prediction
    raw_pred = model_predict(processed_text)
    print("\n[6] TRANSFORMER MODEL PREDICTION")
    print("Predicted Category :", raw_pred["category"])
    print("Category Confidence:", raw_pred["category_confidence"])
    print("Predicted Priority :", raw_pred["priority"])
    print("Priority Confidence:", raw_pred["priority_confidence"])

    # Rule Engine
    final_cat, final_pri = apply_minimal_rules(processed_text, raw_pred)
    print("\n[7] RULE ENGINE OUTPUT")
    print("Final Category :", final_cat)
    print("Final Priority :", final_pri)

    # Entity Extraction
    entities = extract_entities(translated_text)
    print("\n[8] ENTITY EXTRACTION")
    print("Entities:", entities)

    # Final JSON
    final_output = predict_ticket_final(title, desc)
    print("\n[9] FINAL JSON OUTPUT (Saved to DB)")
    for k, v in final_output.items():
        print(f"{k:22}: {v}")

    print("\n" + "=" * 70)

print("\n✅ DEMO COMPLETED SUCCESSFULLY\n")
