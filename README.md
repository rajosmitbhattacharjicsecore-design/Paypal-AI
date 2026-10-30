# PAYPILOT — Autonomous Financial Operations Copilot

**From financial management to autonomous financial operations.**

A prototype for small businesses, freelancers and sellers. It demonstrates invoice workflows, an offline deterministic copilot, illustrative cash-flow projections, operational alerts, approval records and a PayPal demo adapter.

## Capability status

| Capability | Status |
|---|---|
| React dashboard and navigation | Prototype implemented |
| FastAPI API and SQLite persistence | Prototype implemented |
| Invoice create/list | Prototype implemented |
| Offline rule-based copilot | Prototype implemented |
| Demo forecast and operational alerts | Prototype implemented |
| Approval decision record | Implemented; does not move money |
| PayPal | Demo adapter only; no real sandbox API calls |
| Authentication / multi-tenancy | Not implemented |
| Claude structured tool calling | Not implemented |
| Signed immutable approvals | Not implemented |
| PayPal webhook verification | Not implemented |
| Production financial security | Not ready |

**Safety:** seeded records and opening cash are fictional demo data. This is not a bank balance, accounting system, payment processor, fraud detector or financial advice. Do not enter real customer or financial information.

## Structure

```text
PAYPILOT/
├── frontend/ (React + Vite)
├── backend/ (FastAPI + SQLAlchemy + SQLite)
├── docs/
├── .github/workflows/ci.yml
├── Dockerfile
├── render.yaml
├── LICENSE
└── README.md
```

## Local run

Backend terminal:
```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend terminal:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`; API docs at `http://127.0.0.1:8000/docs`.

## Cloud deployment

The Dockerfile builds the frontend and serves it from FastAPI on one origin. Push this repository to GitHub, then in Render choose **New → Blueprint** and connect it. Review plan/disk charges before applying. The Blueprint is `render.yaml` at repository root. Check `/api/health` after deployment. GitHub Pages cannot host the Python backend.

## Docs

- [Architecture](docs/architecture.md)
- [API overview](docs/api.md)
- [Demo script](docs/demo-script.md)
- [Engineering decisions](docs/decisions.md)

## Security notes

Before production use, implement authentication, tenant isolation, rate limiting, integer minor-unit money storage, secure approval hashes and revalidation, webhook verification, idempotency, secret management, comprehensive tests and an independent security review. The LLM must never authorize money movement.
