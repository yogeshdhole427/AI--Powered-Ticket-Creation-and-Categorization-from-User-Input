import re
import torch
import numpy as np
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import spacy
from keybert import KeyBERT
from langdetect import detect
from deep_translator import GoogleTranslator
import nltk
from spacy.lang.en.stop_words import STOP_WORDS
from datetime import datetime

nltk.download('punkt')

# ===============================
# Device & Absolute Paths
# ===============================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Get the absolute path of the current script's directory (the 'scripts' folder)
CURRENT_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Go up one level to the project root (e.g., .../ai_engine/)
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_SCRIPT_DIR, ".."))

# 3. Define model paths starting from the Root
CATEGORY_MODEL_PATH = os.path.join(ROOT_DIR, "models", "category_model")
PRIORITY_MODEL_PATH = os.path.join(ROOT_DIR, "models", "priority_model")

# ===============================
# Load Transformer Models
# ===============================
# Loading using absolute paths to prevent "Repository Not Found" errors
category_tokenizer = AutoTokenizer.from_pretrained(CATEGORY_MODEL_PATH)
category_model = AutoModelForSequenceClassification.from_pretrained(CATEGORY_MODEL_PATH).to(device)
category_model.eval()
cat_id2label = category_model.config.id2label

priority_tokenizer = AutoTokenizer.from_pretrained(PRIORITY_MODEL_PATH)
priority_model = AutoModelForSequenceClassification.from_pretrained(PRIORITY_MODEL_PATH).to(device)
priority_model.eval()
pri_id2label = priority_model.config.id2label

# NLP Models for Preprocessing
nlp = spacy.load("en_core_web_sm")
kw_model = KeyBERT()

# ===============================
# Preprocessing Logic
# ===============================
def translate_to_english(text):
    try:
        lang = detect(text)
        if lang != "en":
            translated = GoogleTranslator(source=lang, target='en').translate(text)
            return translated if translated else text
        return text
    except:
        return text

def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-zA-Z0-9\s\?\.!]", "", text)
    return " ".join(text.split())

def lemmatize_and_clean_text(text):
    doc = nlp(text)
    tokens = [token.lemma_.lower() for token in doc 
              if token.pos_ in ["NOUN", "PROPN", "VERB", "ADJ"] 
              and token.lemma_.lower() not in STOP_WORDS]
    return " ".join(tokens)

# ===============================
# Entity Extraction for JSON
# ===============================
def extract_entities(text):
    doc = nlp(text)
    entities = {"devices": [], "usernames": [], "error_codes": []}
    
    # Simple keyword-based device extraction
    device_list = ["laptop", "mouse", "printer", "keyboard", "monitor", "server", "wifi"]
    for token in doc:
        if token.text.lower() in device_list:
            entities["devices"].append(token.text.lower())
    
    # Regex for usernames (@name) and Error Codes (0x... or ERR_...)
    entities["usernames"] = list(set(re.findall(r"@[a-zA-Z0-9_]+", text)))
    entities["error_codes"] = list(set(re.findall(r"\b(?:0x[0-9A-F]+|ERR_[0-9]+|[A-Z]+-[0-9]+)\b", text)))
    
    entities["devices"] = list(set(entities["devices"]))
    return entities

def preprocess_text(title=None, description=None):
    text = f"{title} {description}" if title and description else (title or description or "")
    translated = translate_to_english(text)
    cleaned = clean_text(translated)
    processed = lemmatize_and_clean_text(cleaned)
    
    keywords = ""
    try:
        kw = kw_model.extract_keywords(processed, keyphrase_ngram_range=(1,2), stop_words='english', top_n=3)
        keywords = " ".join([k[0] for k in kw])
    except: pass
    
    return translated, processed, keywords

# ===============================
# Prediction & Minimal Rules
# ===============================
def model_predict(text):
    inputs = category_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=256).to(device)
    with torch.no_grad():
        cat_logits = category_model(**inputs).logits
        pri_logits = priority_model(**inputs).logits
        cat_probs = torch.softmax(cat_logits, dim=1).cpu().numpy()[0]
        pri_probs = torch.softmax(pri_logits, dim=1).cpu().numpy()[0]

    cat_id = int(np.argmax(cat_probs))
    pri_id = int(np.argmax(pri_probs))

    return {
        "category": cat_id2label[cat_id],
        "category_confidence": float(cat_probs[cat_id]),
        "priority": pri_id2label[pri_id],
        "priority_confidence": float(pri_probs[pri_id])
    }

def apply_minimal_rules(text, pred, threshold=0.4):
    text_lower = text.lower().strip()
    if not text_lower or len(text_lower) < 5:
        return "Needs Manual Review", "Low", 1.0

    final_cat = pred["category"]
    final_pri = pred["priority"]
    
    critical_keywords = r"server down|production down|security breach|ransomware|data loss|critical error"
    if re.search(critical_keywords, text_lower):
        final_pri = "Critical"

    if pred["category_confidence"] < threshold:
        final_cat = "Needs Manual Review"
        
    return final_cat, final_pri

# ===============================
# FINAL PIPELINE (Updated for JSON)
# ===============================
def predict_ticket_final(title=None, description=None):
    translated_text, processed, keywords = preprocess_text(title, description)
    raw_pred = model_predict(processed)
    final_cat, final_pri = apply_minimal_rules(processed, raw_pred)

    # Fetch entities from translated text
    entities = extract_entities(translated_text)

    auto_title = title if title and title.strip() else keywords.title() or "New Support Ticket"

    # Strict JSON Format Return
    return {
        "title": auto_title,
        "category": final_cat.lower(),
        "priority": final_pri.lower(),
        "entities": entities,
        "status": "open",
        "created_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "category_confidence": round(raw_pred["category_confidence"], 3),
        "priority_confidence": round(raw_pred["priority_confidence"], 3)
    }