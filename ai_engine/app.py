from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn
from scripts.inference import predict_ticket_final

app = FastAPI(title="AI Ticket Classification API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TicketInput(BaseModel):
    title: str
    description: str

# Health check endpoint
@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Ticket Classification API",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/ (GET)",
            "classify": "/classify (POST)"
        }
    }

# Health check endpoint (alternative)
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "AI Ticket Classification API",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/classify")
async def classify_ticket(data: TicketInput):
    try:
        print(f"DEBUG: Received request - Title: {data.title}")
        print(f"DEBUG: Description length: {len(data.description)} chars")
        
        # Generate dynamic prediction from your BERT model
        prediction = predict_ticket_final(
            title=data.title,
            description=data.description
        )

        # Log to server console so you can see the raw model output
        print(f"DEBUG: Model Output -> {prediction}")

        response = {
            "title": prediction.get("title", data.title),
            "category": prediction.get("category", "general").lower(),
            "priority": prediction.get("priority", "medium").lower(),
            "entities": prediction.get("entities", {"devices": [], "usernames": [], "error_codes": []}),
            "status": "open",
            "created_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "category_confidence": float(prediction.get("category_confidence", 0.5)),
            "priority_confidence": float(prediction.get("priority_confidence", 0.5)),
            "description": data.description
        }
        
        print(f"DEBUG: Sending response -> {response}")
        return response
        
    except Exception as e:
        print(f"SERVER ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting AI Ticket Classification API...")
    print("Service will be available at: http://127.0.0.1:8000")
    print("Health check: http://127.0.0.1:8000/health")
    print("Classification endpoint: http://127.0.0.1:8000/classify")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)