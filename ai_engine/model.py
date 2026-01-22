import streamlit as st
import requests
import time
import pandas as pd
import numpy as np
import plotly.express as px
from wordcloud import WordCloud
import matplotlib.pyplot as plt
from datetime import datetime

# --- Page Config ---
st.set_page_config(page_title="ServiceDesk AI Pro", page_icon="🎫", layout="wide")

# --- Custom CSS ---
st.markdown("""
    <style>
    .stApp { background-color: #f4f7f9; }
    [data-testid="stSidebar"] { background-color: #0e1117; color: white; }
    .log-container {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        background-color: #1a1c23;
        color: #00e676;
        padding: 15px;
        border-radius: 10px;
        border: 1px solid #333;
        height: 220px;
        overflow-y: auto;
    }
    .main-title { font-weight: 800; color: #1e293b; border-bottom: 2px solid #4facfe; padding-bottom: 10px; }
    .status-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .entity-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        background-color: #e2e8f0;
        color: #475569;
        font-size: 0.85em;
        margin-right: 5px;
        margin-bottom: 5px;
        border: 1px solid #cbd5e1;
    }
    </style>
    """, unsafe_allow_html=True)

if 'history' not in st.session_state:
    st.session_state['history'] = []

# --- Sidebar ---
with st.sidebar:
    st.header("⚙️ System Control")
    page = st.radio("Navigation", ["🎫 Live Ticket Desk", "📊 Model Analytics", "📂 History & Export"])
    st.divider()
    st.subheader("Model Version")
    st.code("Transformer: BERT-v2\nLogic: Hybrid-Minimal")
    if st.button("🗑️ Clear All Sessions", use_container_width=True):
        st.session_state['history'] = []
        st.rerun()

# ==========================================
# PAGE 1: LIVE TICKET DESK
# ==========================================
if page == "🎫 Live Ticket Desk":
    st.markdown("<h1 class='main-title'>AI Classification Desk</h1>", unsafe_allow_html=True)
    
    col1, col2 = st.columns([1, 1.2], gap="large")

    with col1:
        st.subheader("📝 New Incident")
        with st.container(border=True):
            t_input = st.text_input("Subject", placeholder="Briefly state the problem...")
            d_input = st.text_area("Detailed Description", height=180, placeholder="Explain in any language...")
            
            if st.button("🚀 Process with AI", type="primary", use_container_width=True):
                if not d_input:
                    st.error("Description is required.")
                else:
                    log_placeholder = st.empty()
                    progress_bar = st.progress(0)
                    logs = []
                    
                    def add_log(msg):
                        logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
                        log_placeholder.markdown(f"<div class='log-container'>{'<br>'.join(logs)}</div>", unsafe_allow_html=True)

                    steps = [
                        ("Initiating Translation Engine...", 20),
                        ("Cleaning noise & lemmatizing...", 40),
                        ("Running BERT Inference (Category)...", 60),
                        ("Running BERT Inference (Priority)...", 80),
                        ("Applying minimal safety overrides...", 100)
                    ]
                    
                    for m, v in steps:
                        add_log(m)
                        progress_bar.progress(v)
                        time.sleep(0.3)

                    try:
                        res = requests.post("http://127.0.0.1:8000/classify", json={"title": t_input, "description": d_input})
                        if res.status_code == 200:
                            data = res.json()
                            # Store description for the history/archive
                            data['description'] = d_input
                            st.session_state['last_res'] = data
                            st.session_state['history'].append(data)
                            add_log("SUCCESS: Prediction generated.")
                        else: st.error("Inference Error")
                    except: st.error("Backend Offline")

    with col2:
        if 'last_res' in st.session_state:
            res = st.session_state['last_res']
            st.subheader("🔍 Analysis Result")
            
            # Key Results
            c1, c2, c3 = st.columns(3)
            with c1: st.metric("AI Category", res['category'].upper())
            with c2: st.metric("AI Priority", res['priority'].upper())
            with c3: st.metric("Confidence", f"{int(res['category_confidence']*100)}%")
            
            # Logic Summary
            with st.container():
                st.markdown(f"""
                <div class="status-card">
                    <p style='color: #64748b; font-size: 0.9em; margin-bottom: 5px;'>Auto-Generated Title</p>
                    <h3 style='margin-top: 0;'>{res['title']}</h3>
                    <hr>
                    <p><b>Status:</b> <span style="color: green;">● {res['status'].upper()}</span></p>
                    <p><b>Created At:</b> {res['created_at']}</p>
                </div>
                """, unsafe_allow_html=True)

            # Entity Display
            st.markdown("#### 🛠 Extracted Entities")
            e1, e2, e3 = st.columns(3)
            with e1:
                st.write("**Devices**")
                if res['entities']['devices']:
                    for d in res['entities']['devices']: st.markdown(f'<span class="entity-tag">{d}</span>', unsafe_allow_html=True)
                else: st.write("None")
            with e2:
                st.write("**Usernames**")
                if res['entities']['usernames']:
                    for u in res['entities']['usernames']: st.markdown(f'<span class="entity-tag">{u}</span>', unsafe_allow_html=True)
                else: st.write("None")
            with e3:
                st.write("**Error Codes**")
                if res['entities']['error_codes']:
                    for ec in res['entities']['error_codes']: st.markdown(f'<span class="entity-tag">{ec}</span>', unsafe_allow_html=True)
                else: st.write("None")
            
            with st.expander("📄 View Structured JSON Output"):
                st.json(res)
        else:
            st.info("Awaiting incident description for processing.")

# ==========================================
# PAGE 2: MODEL ANALYTICS
# ==========================================
elif page == "📊 Model Analytics":
    st.markdown("<h1 class='main-title'>Model Intelligence Dashboard</h1>", unsafe_allow_html=True)
    
    view_mode = st.radio("Select View Mode:", ["📈 Live Session Performance", "📜 Model Training Reports"], horizontal=True)
    st.divider()

    if view_mode == "📜 Model Training Reports":
        st.subheader("Final Training Evaluation (Kaggle Export)")
        st.info("The following visualizations were generated during the model training phase on the validation dataset.")

        tab1, tab2 = st.tabs(["🏷️ Category Model", "⚡ Priority Model"])

        with tab1:
            st.markdown("### Category Classification Performance")
            col_c1, col_c2 = st.columns(2)
            with col_c1: st.image("assets/category_confusion_matrix.png", caption="Category Confusion Matrix")
            with col_c2: st.image("assets/category_classification_report.png", caption="Category Report (Precision/Recall)")
            st.markdown("---")
            st.image("assets/category_epochs.png", caption="Category Training Loss & Accuracy per Epoch", use_container_width=True)

        with tab2:
            st.markdown("### Priority Classification Performance")
            col_p1, col_p2 = st.columns(2)
            with col_p1: st.image("assets/priority_confusion_matrix.png", caption="Priority Confusion Matrix")
            with col_p2: st.image("assets/priority_classification_report.png", caption="Priority Report (Precision/Recall)")
            st.markdown("---")
            col_p3, col_p4 = st.columns(2)
            with col_p3: st.image("assets/priority_epochs.png", caption="Priority Training Epochs")
            with col_p4: st.image("assets/priority_histogram.png", caption="Distribution of Priority Classes")

    else:
        if st.session_state['history']:
            df = pd.DataFrame(st.session_state['history'])
            m1, m2, m3 = st.columns(3)
            m1.metric("Total Processed", len(df))
            m2.metric("Avg AI Confidence", f"{round(df['category_confidence'].mean() * 100, 1)}%")
            m3.metric("Critical Tickets", len(df[df['priority'].str.lower() == 'critical']))
            
            st.divider()
            
            st.subheader("💡 Session Word Intelligence")
            text_data = " ".join([t['description'] for t in st.session_state['history']])
            wc = WordCloud(background_color="white", width=1200, height=500).generate(text_data)
            fig_wc, ax = plt.subplots(figsize=(12, 5))
            ax.imshow(wc, interpolation='bilinear'); ax.axis("off")
            st.pyplot(fig_wc)
        else:
            st.warning("No session data available. Submit tickets to generate live trends.")

# ==========================================
# PAGE 3: HISTORY & EXPORT
# ==========================================
elif page == "📂 History & Export":
    st.markdown("<h1 class='main-title'>Ticket Archive</h1>", unsafe_allow_html=True)
    if st.session_state['history']:
        # Prepare a clean DataFrame for display
        df = pd.DataFrame(st.session_state['history'])
        
        # Display simplified columns in the UI table
        display_df = df[['created_at', 'title', 'category', 'priority', 'status']]
        st.dataframe(display_df, use_container_width=True, hide_index=True)
        
        st.download_button("📥 Export History (CSV)", df.to_csv(index=False).encode('utf-8'), "tickets.csv", "text/csv")
    else:
        st.warning("No records found.")