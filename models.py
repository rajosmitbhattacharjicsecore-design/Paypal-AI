from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    customer = Column(String(120), nullable=False)
    email = Column(String(160), default="")
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    due_date = Column(Date, nullable=False)
    status = Column(String(30), default="Draft")
    provider = Column(String(30), default="Local demo")
    provider_reference = Column(String(120), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(30), default="Upcoming")

class Approval(Base):
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True)
    action_type = Column(String(60), nullable=False)
    title = Column(String(180), nullable=False)
    description = Column(Text, default="")
    amount = Column(Float, nullable=True)
    currency = Column(String(3), default="USD")
    status = Column(String(30), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id = Column(Integer, primary_key=True)
    event_type = Column(String(80), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
