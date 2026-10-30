from datetime import date
from pydantic import BaseModel, Field

class InvoiceCreate(BaseModel):
    customer: str = Field(min_length=2, max_length=120)
    email: str = ""
    amount: float = Field(gt=0, le=10000000)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    due_date: date

class AgentRequest(BaseModel):
    message: str = Field(min_length=2, max_length=2000)

class ApprovalDecision(BaseModel):
    decision: str
