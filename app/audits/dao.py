from app.core.base_dao import BaseDAO
from app.audits.models import Audit, AuditResult


class AuditDAO(BaseDAO):
    model = Audit


class AuditResultDAO(BaseDAO):
    model = AuditResult