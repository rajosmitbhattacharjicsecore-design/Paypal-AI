from datetime import date, timedelta
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, get_db, SessionLocal
from .models import Invoice, Expense, Approval, AuditEvent
from .schemas import InvoiceCreate, AgentRequest, ApprovalDecision
from .services.agent_engine import run_agent
from .services.paypal import paypal

app = FastAPI(title="PAYPILOT API", version="1.0.0",
              description="Prototype API for an AI financial operations copilot.")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    if db.query(Invoice).count() == 0:
        today = date.today()
        db.add_all([
            Invoice(customer="NovaTech Supplies", email="accounts@novatech.example", amount=1250, currency="USD", due_date=today-timedelta(days=4), status="Overdue"),
            Invoice(customer="Brightline Studio", email="finance@brightline.example", amount=850, currency="USD", due_date=today-timedelta(days=2), status="Sent"),
            Invoice(customer="Apex Retail", email="billing@apex.example", amount=2100, currency="USD", due_date=today+timedelta(days=8), status="Sent"),
            Invoice(customer="Orchid Works", email="payables@orchid.example", amount=640, currency="USD", due_date=today+timedelta(days=14), status="Paid"),
        ])
        db.add_all([
            Expense(name="NovaTech Supplies", amount=1800, due_date=today+timedelta(days=1)),
            Expense(name="Workspace rent", amount=950, due_date=today+timedelta(days=5)),
            Expense(name="Software subscriptions", amount=180, due_date=today+timedelta(days=9)),
        ])
        db.add(AuditEvent(event_type="Workspace created", description="Seeded fictional PAYPILOT demo workspace"))
        db.commit()
    db.close()

seed()

@app.get("/api")
def api_root():
    return {"name": "PAYPILOT API", "version": "1.0.0", "mode": "prototype"}

@app.get("/api/health")
def health():
    return {"status": "ok", "paypal_mode": paypal.mode}

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).all()
    expenses = db.query(Expense).filter(Expense.status == "Upcoming").all()
    overdue = [x for x in invoices if x.status != "Paid" and x.due_date < date.today()]
    receivables = sum(x.amount for x in invoices if x.status != "Paid")
    return {
        "revenue_label": "Demo receivables",
        "receivables": round(receivables, 2),
        "overdue_amount": round(sum(x.amount for x in overdue), 2),
        "overdue_count": len(overdue),
        "upcoming_expenses": round(sum(x.amount for x in expenses), 2),
        "invoice_count": len(invoices),
        "recent_invoices": [invoice_dict(x) for x in sorted(invoices, key=lambda a: a.id, reverse=True)[:5]],
        "data_mode": "Fictional demo data"
    }

def invoice_dict(x):
    return {"id": x.id, "customer": x.customer, "email": x.email, "amount": x.amount,
            "currency": x.currency, "due_date": x.due_date.isoformat(), "status": x.status,
            "provider": x.provider, "provider_reference": x.provider_reference}

@app.get("/api/invoices")
def list_invoices(db: Session = Depends(get_db)):
    return [invoice_dict(x) for x in db.query(Invoice).order_by(Invoice.id.desc()).all()]

@app.post("/api/invoices")
def create_invoice(payload: InvoiceCreate, db: Session = Depends(get_db)):
    inv = Invoice(customer=payload.customer, email=payload.email, amount=payload.amount,
                  currency=payload.currency.upper(), due_date=payload.due_date, status="Draft")
    db.add(inv)
    db.commit()
    db.refresh(inv)
    db.add(AuditEvent(event_type="Invoice created", description=f"Draft invoice #{inv.id} for {inv.customer}"))
    db.commit()
    return invoice_dict(inv)

@app.post("/api/invoices/{invoice_id}/paypal")
def create_paypal_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")
    result = paypal.create_invoice(inv)
    inv.provider = result["provider"]
    inv.provider_reference = result["reference"]
    db.add(AuditEvent(event_type="PayPal demo action", description=f"Prepared provider reference {result['reference']}"))
    db.commit()
    return {"invoice": invoice_dict(inv), "integration": result}

@app.post("/api/agent/chat")
def agent_chat(payload: AgentRequest, db: Session = Depends(get_db)):
    return run_agent(payload.message, db)

@app.get("/api/approvals")
def list_approvals(db: Session = Depends(get_db)):
    rows = db.query(Approval).order_by(Approval.id.desc()).all()
    return [{"id": x.id, "action_type": x.action_type, "title": x.title,
             "description": x.description, "amount": x.amount, "currency": x.currency,
             "status": x.status, "created_at": x.created_at.isoformat() if x.created_at else None} for x in rows]

@app.post("/api/approvals/{approval_id}/decision")
def decide_approval(approval_id: int, payload: ApprovalDecision, db: Session = Depends(get_db)):
    row = db.query(Approval).filter(Approval.id == approval_id).first()
    if not row:
        raise HTTPException(404, "Approval not found")
    decision = payload.decision.lower()
    if decision not in ["approve", "reject"]:
        raise HTTPException(400, "Decision must be approve or reject")
    if row.status != "Pending":
        raise HTTPException(409, "This approval has already been decided")
    row.status = "Approved — proposal only" if decision == "approve" else "Rejected"
    db.add(AuditEvent(event_type="Approval decision", description=f"{row.title}: {row.status}. No payment was executed."))
    db.commit()
    return {"id": row.id, "status": row.status, "message": "Decision recorded. This prototype does not execute payouts."}

@app.get("/api/forecast")
def forecast(db: Session = Depends(get_db)):
    today = date.today()
    invoices = db.query(Invoice).all()
    expenses = db.query(Expense).filter(Expense.status == "Upcoming").all()
    expected_in = sum(x.amount for x in invoices if x.status != "Paid")
    expected_out = sum(x.amount for x in expenses)
    # Demo opening cash is explicitly illustrative, not an account balance.
    opening = 5000.0
    return {
        "opening_cash_demo": opening,
        "expected_receivables": round(expected_in, 2),
        "upcoming_expenses": round(expected_out, 2),
        "illustrative_net_position": round(opening + expected_in - expected_out, 2),
        "horizon_days": 30,
        "assumptions": [
            "Opening cash of $5,000 is a fictional demonstration assumption.",
            "All unpaid invoices are treated as expected receipts without collection probability weighting.",
            "Upcoming expenses are assumed to be paid within the forecast horizon.",
            "This is not a live bank or PayPal balance and is not financial advice."
        ]
    }

@app.get("/api/risks")
def risks(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).all()
    today = date.today()
    alerts = []
    for x in invoices:
        if x.status != "Paid" and x.due_date < today:
            alerts.append({"level": "warning", "title": f"Overdue invoice: {x.customer}",
                           "detail": f"${x.amount:,.2f} was due on {x.due_date.isoformat()}."})
    seen = set()
    for x in invoices:
        key = (x.customer.lower(), round(x.amount, 2), x.due_date)
        if key in seen:
            alerts.append({"level": "danger", "title": "Possible duplicate invoice",
                           "detail": f"More than one invoice matches {x.customer} and ${x.amount:,.2f}."})
        seen.add(key)
    return alerts

@app.get("/api/audit")
def audit(db: Session = Depends(get_db)):
    rows = db.query(AuditEvent).order_by(AuditEvent.id.desc()).limit(30).all()
    return [{"id": x.id, "event_type": x.event_type, "description": x.description,
             "created_at": x.created_at.isoformat() if x.created_at else None} for x in rows]

# In the cloud container, the React build is copied to /app/frontend_dist.
# FastAPI serves the UI and API from one origin, so users only need one URL.
FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend_dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def frontend_fallback(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API route not found")
        requested = (FRONTEND_DIST / full_path).resolve()
        if requested.is_file() and FRONTEND_DIST.resolve() in requested.parents:
            return FileResponse(requested)
        return FileResponse(FRONTEND_DIST / "index.html")
