from fastapi import FastAPI

from app.users.router import router as user_router
from app.conveyors.router import router as conveyor_router
from app.catalog.router import router as catalog_router
from app.audits.router import router as audit_router

from app.users.models import User, Role
from app.audits.models import Audit, AuditResult 
from app.conveyors.models import Conveyor
from app.catalog.models import Criteria, ComponentType, Component

app = FastAPI()

app.include_router(user_router)
app.include_router(conveyor_router)
app.include_router(catalog_router)
app.include_router(audit_router)
