from datetime import date, timedelta
from sqlalchemy.orm import Session
from ..models import Invoice, Expense, Approval, AuditEvent

def run_agent(message: str, db: Session):
    q = message.lower()
    if any(word in q for word in ["overdue", "outstanding", "unpaid", "reminder"]):
        rows = db.query(Invoice).filter(Invoice.status != "Paid", Invoice.due_date < date.today()).all()
        total = sum(x.amount for x in rows)
        if not rows:
            answer = "There are no overdue unpaid invoices in the current demo records."
        else:
            names = ", ".join(f"{x.customer} (${x.amount:,.2f})" for x in rows)
            answer = (f"I found {len(rows)} overdue invoice(s), totalling ${total:,.2f}: {names}. "
                      "I can prepare reminder drafts. No messages have been sent.")
        db.add(AuditEvent(event_type="Agent query", description="Checked overdue invoices"))
        db.commit()
        return {"answer": answer, "actions": [{"label": "Prepare reminder drafts", "type": "reminder_draft"}] if rows else [],
                "requires_approval": False, "mode": "rule-based demo agent"}
    if any(word in q for word in ["pay", "supplier", "settlement"]):
        expenses = db.query(Expense).filter(Expense.status == "Upcoming").all()
        total = sum(x.amount for x in expenses)
        amount = 1800.0
        if "1800" in q:
            amount = 1800.0
        approval = Approval(
            action_type="supplier_payment_proposal",
            title="Review supplier payment proposal",
            description=f"Proposed supplier payment of ${amount:,.2f}. This is a planning proposal only; no money will be moved.",
            amount=amount, currency="USD", status="Pending"
        )
        db.add(approval)
        db.add(AuditEvent(event_type="Approval requested", description=f"Prepared supplier payment proposal ${amount:,.2f}"))
        db.commit()
        return {"answer": (f"I prepared a supplier-payment proposal for ${amount:,.2f}. "
                           f"Upcoming expenses in the demo records total ${total:,.2f}. "
                           "I cannot verify a real account balance, so this is not a guarantee of affordability. "
                           "Review the proposal in Approvals. No payment has been made."),
                "actions": [{"label": "Review supplier payment proposal", "type": "approval", "id": approval.id}],
                "requires_approval": True, "mode": "rule-based demo agent"}
    if any(word in q for word in ["cash", "forecast", "balance", "runway"]):
        return {"answer": "I can calculate a demo cash-flow forecast from the invoices and expenses stored in this workspace. Open Cash Flow to review the assumptions and projected values. This is not a live bank or PayPal balance.",
                "actions": [{"label": "Open cash-flow forecast", "type": "navigate", "target": "forecast"}],
                "requires_approval": False, "mode": "rule-based demo agent"}
    return {"answer": ("I can help with overdue invoices, payment planning and cash-flow questions. "
                       "Try: “Check my overdue invoices” or “Can I pay my supplier 1800 tomorrow?” "
                       "This prototype uses a rule-based demo agent; LLM tool calling will be added in the next development phase."),
            "actions": [], "requires_approval": False, "mode": "rule-based demo agent"}
