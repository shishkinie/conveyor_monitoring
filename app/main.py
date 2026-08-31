from pathlib import Path

from fastapi import FastAPI

from app.users.router import router as user_router
from app.conveyors.router import router as conveyor_router
from app.catalog.router import router as catalog_router
from app.audits.router import router as audit_router

from app.users.models import User, Role
from app.audits.models import Audit, AuditResult
from app.conveyors.models import Conveyor
from app.catalog.models import Component, ConveyorComponent, Criteria

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI()

app.include_router(user_router)
app.include_router(conveyor_router)
app.include_router(catalog_router)
app.include_router(audit_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


@app.get("/")
async def read_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))