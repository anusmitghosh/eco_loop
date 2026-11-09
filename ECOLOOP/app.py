import os
import sys
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import init_db
from seed_data import seed_all

from routes.auth_routes import router as auth_router
from routes.listings_routes import router as listings_router
from routes.requests_routes import router as requests_router
from routes.orders_routes import router as orders_router
from routes.logistics_routes import router as logistics_router
from routes.privacy_routes import router as privacy_router
from routes.impact_routes import router as impact_router
from routes.admin_routes import router as admin_router
from routes.notifications_routes import router as notifications_router
from routes.upload_routes import router as upload_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and seed data
    init_db()
    seed_all()
    print("EcoLoop Backend Engine Ready.")
    yield

app = FastAPI(
    title="EcoLoop - B2B Circular Economy Marketplace",
    description="Turning Leftovers Into Leverages: B2B material reuse, AI matching, live logistics and environmental impact platform.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Safe error handler (Prompt requirement #43: friendly error states, no stack traces or secrets)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Print internally for debug
    print(f"Unhandled Exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": "An internal service error occurred. Our operations team has been notified."}
    )

# Include API Routers
app.include_router(auth_router)
app.include_router(listings_router)
app.include_router(requests_router)
app.include_router(orders_router)
app.include_router(logistics_router)
app.include_router(privacy_router)
app.include_router(impact_router)
app.include_router(admin_router)
app.include_router(notifications_router)
app.include_router(upload_router)

# Mount Static Files
static_dir = os.path.join(os.path.dirname(__file__), "frontend", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Serve SPA
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_path = os.path.join(os.path.dirname(__file__), "frontend", "templates", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h2>EcoLoop is initializing... Please refresh shortly.</h2>")

@app.get("/favicon.ico")
async def favicon():
    return FileResponse(os.path.join(static_dir, "favicon.ico")) if os.path.exists(os.path.join(static_dir, "favicon.ico")) else JSONResponse(status_code=204, content={})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
