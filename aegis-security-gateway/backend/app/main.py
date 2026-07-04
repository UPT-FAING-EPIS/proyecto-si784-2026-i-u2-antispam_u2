import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import admin, antispam, apikeys, auth, ids, public, scanner, shield

app = FastAPI(
    title="Aegis Security Gateway",
    description="Gateway unificado de seguridad: Antispam, IDS y Web Scanner.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8082",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(public.router)
app.include_router(shield.router)
app.include_router(antispam.router)
app.include_router(ids.router)
app.include_router(scanner.router)
app.include_router(apikeys.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

    from .workers.ids_worker import start_ids_worker  # noqa: PLC0415
    ids_thread = threading.Thread(target=start_ids_worker, daemon=True, name="aegis-ids-worker")
    ids_thread.start()


@app.get("/health")
def health():
    return {"status": "ok", "service": "Aegis Security Gateway"}
