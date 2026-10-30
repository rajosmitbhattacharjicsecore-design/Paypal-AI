import React, { useEffect, useState } from 'react';
import { api } from './services/api';
import {
  LayoutDashboard, Bot, FileText, ArrowLeftRight, ChartNoAxesCombined,
  ShieldAlert, ClipboardCheck, Settings, Bell, Search, Plus, Send,
  ArrowUpRight, Clock3, CheckCircle2, AlertTriangle, Wallet, Menu,
  RefreshCw, Sparkles, CircleDollarSign, Activity, ChevronRight, X
} from 'lucide-react';

const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const nav = [
  ['Dashboard', LayoutDashboard], ['AI Copilot', Bot], ['Invoices', FileText],
  ['Payments', ArrowLeftRight], ['Cash Flow', ChartNoAxesCombined],
  ['Risk Centre', ShieldAlert], ['Approvals', ClipboardCheck], ['Activity Log', Activity]
];

function App() {
  const [page, setPage] = useState('Dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [risks, setRisks] = useState([]);
  const [audit, setAudit] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileNav, setMobileNav] = useState(false);

  async function refresh() {
    setError('');
    try {
      const [d, i, a, f, r, l, h] = await Promise.all([
        api.dashboard(), api.invoices(), api.approvals(), api.forecast(),
        api.risks(), api.audit(), api.health()
      ]);
      setDashboard(d); setInvoices(i); setApprovals(a); setForecast(f); setRisks(r); setAudit(l); setHealth(h);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  const go = name => { setPage(name); setMobileNav(false); };
  const pending = approvals.filter(a => a.status === 'Pending').length;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'show' : ''}`}>
      <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><div><b>PAYPILOT</b><small>FINANCIAL COPILOT</small></div><button className="close-nav" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="workspace"><div className="workspace-icon">N</div><div><b>NovaTech Supplies</b><small>Business workspace</small></div><ChevronRight size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(([name, Icon]) => <button key={name} className={`nav-item ${page===name?'active':''}`} onClick={()=>go(name)}><Icon size={18}/><span>{name}</span>{name==='Approvals' && pending>0 && <em>{pending}</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="secure-note"><ShieldAlert size={17}/><div><b>Human approval enabled</b><small>Money movement is gated</small></div></div><button className="nav-item" onClick={()=>go('Settings')}><Settings size={18}/>Settings</button><div className="profile"><div className="avatar">NR</div><div><b>NovaTech Owner</b><small>Administrator · Demo</small></div><ChevronRight size={15}/></div></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)} />}
    <main className="main">
      <header className="topbar"><div className="top-left"><button className="menu-btn" onClick={()=>setMobileNav(true)}><Menu/></button><div className="crumb">Workspace <ChevronRight size={14}/> <b>{page}</b></div></div><div className="top-actions"><span className="environment"><i/> DEMO ENVIRONMENT</span><button className="icon-btn" title="Notifications"><Bell size={18}/></button><div className="top-avatar">NR</div></div></header>
      {error && <div className="error-banner"><AlertTriangle size={17}/><span>Backend connection issue: {error}. Start the FastAPI server and refresh.</span><button onClick={refresh}><RefreshCw size={15}/> Retry</button></div>}
      <div className="content">
        {loading ? <div className="loading"><RefreshCw className="spin"/> Connecting to PAYPILOT workspace…</div> :
          <>
            {page==='Dashboard' && <Dashboard data={dashboard} risks={risks} go={go} refresh={refresh}/>}
            {page==='AI Copilot' && <Copilot refresh={refresh}/>}
            {page==='Invoices' && <Invoices invoices={invoices} refresh={refresh}/>}
            {page==='Payments' && <Payments invoices={invoices}/>}
            {page==='Cash Flow' && <CashFlow data={forecast}/>}
            {page==='Risk Centre' && <RiskCentre risks={risks}/>}
            {page==='Approvals' && <Approvals approvals={approvals} refresh={refresh}/>}
            {page==='Activity Log' && <ActivityLog audit={audit}/>}
            {page==='Settings' && <SettingsPage health={health}/>}
          </>
        }
      </div>
      <footer>PAYPILOT Prototype v1.0 <span>Fictional demo data · No real money movement</span></footer>
    </main>
  </div>;
}

function PageHeading({eyebrow,title,desc,action}) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{desc}</p></div>{action}</div>;
}
function Stat({label,value,sub,icon:Icon,tone='green'}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>;
}
function Status({value}) {
  const cls = value?.toLowerCase().includes('paid') ? 'paid' : value?.toLowerCase().includes('overdue') || value?.toLowerCase().includes('reject') ? 'danger' : value?.toLowerCase().includes('pending') || value?.toLowerCase().includes('draft') ? 'pending' : 'sent';
  return <span className={`status ${cls}`}><i/>{value}</span>;
}
function Dashboard({data,risks,go,refresh}) {
  if (!data) return <Empty title="Dashboard unavailable" />;
  return <>
    <PageHeading eyebrow="OVERVIEW" title="Good morning, NovaTech." desc="Here’s your business financial snapshot for today." action={<button className="btn secondary" onClick={refresh}><RefreshCw size={16}/> Refresh data</button>}/>
    <div className="demo-banner"><Sparkles size={17}/><div><b>You're viewing a demo workspace</b><span>All figures are fictional sample data. Connect a provider only after configuring the secure backend.</span></div><span className="demo-pill">DEMO</span></div>
    <div className="stats-grid">
      <Stat label="Outstanding receivables" value={money(data.receivables)} sub={`${data.invoice_count} invoices in workspace`} icon={CircleDollarSign}/>
      <Stat label="Overdue amount" value={money(data.overdue_amount)} sub={`${data.overdue_count} invoices need attention`} icon={Clock3} tone="orange"/>
      <Stat label="Upcoming expenses" value={money(data.upcoming_expenses)} sub="Scheduled demo expenses" icon={ArrowUpRight} tone="blue"/>
      <Stat label="Pending approvals" value="—" sub="Review action queue" icon={ClipboardCheck} tone="purple"/>
    </div>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><div><h3>Recent invoices</h3><p>Latest activity across your receivables</p></div><button className="text-btn" onClick={()=>go('Invoices')}>View all <ChevronRight size={15}/></button></div><InvoiceRows invoices={data.recent_invoices || []}/></section>
      <section className="panel"><div className="panel-head"><div><h3>AI action centre</h3><p>Recommended next steps</p></div><span className="ai-chip"><Sparkles size={13}/> AI</span></div>
        <div className="recommendation"><div className="rec-icon orange"><AlertTriangle size={17}/></div><div><b>Review overdue invoices</b><p>{data.overdue_count} unpaid invoice(s) are past their due date.</p><button className="inline-link" onClick={()=>go('AI Copilot')}>Ask PAYPILOT to prepare reminders <ChevronRight size={13}/></button></div></div>
        <div className="recommendation"><div className="rec-icon blue"><Wallet size={17}/></div><div><b>Review upcoming obligations</b><p>Upcoming demo expenses total {money(data.upcoming_expenses)}.</p><button className="inline-link" onClick={()=>go('Cash Flow')}>Review cash-flow outlook <ChevronRight size={13}/></button></div></div>
        <div className="recommendation"><div className="rec-icon purple"><ShieldAlert size={17}/></div><div><b>Risk review</b><p>{risks.length} rule-based alert(s) currently require attention.</p><button className="inline-link" onClick={()=>go('Risk Centre')}>Open risk centre <ChevronRight size={13}/></button></div></div>
      </section>
    </div>
    <section className="panel lower-panel"><div className="panel-head"><div><h3>How PAYPILOT works</h3><p>AI-assisted operations with human control</p></div></div><div className="steps"><div><span>01</span><b>Understand</b><small>Interpret your business request</small></div><div><span>02</span><b>Plan</b><small>Prepare a structured workflow</small></div><div><span>03</span><b>Approve</b><small>Review sensitive actions</small></div><div><span>04</span><b>Execute</b><small>Record verified outcomes</small></div></div></section>
  </>;
}
function InvoiceRows({invoices}) {
  if (!invoices?.length) return <div className="empty-inline">No invoices yet.</div>;
  return <div className="table-wrap"><table><thead><tr><th>CUSTOMER</th><th>DUE DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{invoices.map(x=><tr key={x.id}><td><b>{x.customer}</b><small>INV-{String(x.id).padStart(4,'0')}</small></td><td>{x.due_date}</td><td className="amount">{money(x.amount)}</td><td><Status value={x.status}/></td></tr>)}</tbody></table></div>;
}
function Copilot({refresh}) {
  const [messages,setMessages] = useState([{role:'assistant',text:"Hello! I'm PAYPILOT's demo financial copilot. I can check overdue invoices, prepare a supplier-payment proposal and explain the cash-flow forecast. I will not move money or send messages in this prototype."}]);
  const [input,setInput] = useState('');
  const [busy,setBusy] = useState(false);
  async function send(text=input) {
    if (!text.trim() || busy) return;
    setMessages(m=>[...m,{role:'user',text}]); setInput(''); setBusy(true);
    try { const result=await api.chat(text); setMessages(m=>[...m,{role:'assistant',text:result.answer,meta:result.mode,actions:result.actions}]); await refresh(); }
    catch(e) { setMessages(m=>[...m,{role:'assistant',text:`I couldn't complete that request: ${e.message}`}]); }
    finally { setBusy(false); }
  }
  return <><PageHeading eyebrow="AGENT WORKSPACE" title="AI Copilot" desc="Describe a financial task in plain language. Review the plan before taking action."/>
    <div className="copilot-layout"><section className="panel chat-panel"><div className="chat-top"><div className="bot-avatar"><Bot/></div><div><b>PAYPILOT Assistant</b><small><i/> Rule-based prototype agent · Online</small></div><span className="ai-chip"><Sparkles size={13}/> COPILOT</span></div>
      <div className="messages">{messages.map((m,i)=><div key={i} className={`message ${m.role}`}><div className="message-avatar">{m.role==='assistant'?<Bot size={16}/>: 'NR'}</div><div className="bubble"><p>{m.text}</p>{m.meta&&<small className="meta">{m.meta}</small>}{m.actions?.map((a,j)=><div className="action-chip" key={j}><CheckCircle2 size={14}/>{a.label}</div>)}</div></div>)}{busy&&<div className="typing">PAYPILOT is analysing your request…</div>}</div>
      <div className="suggestions"><button onClick={()=>send('Check my overdue invoices and prepare reminders')}>Check overdue invoices</button><button onClick={()=>send('Can I pay my supplier 1800 tomorrow?')}>Plan supplier payment</button><button onClick={()=>send('Show my cash flow forecast')}>Explain cash flow</button></div>
      <form className="chat-input" onSubmit={e=>{e.preventDefault();send();}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask PAYPILOT to analyse or prepare a task…"/><button disabled={busy||!input.trim()}><Send size={17}/></button></form>
      <div className="chat-disclaimer">Prototype agent · No real payments, emails or external messages are sent.</div>
    </section><aside className="panel agent-info"><h3>Agent controls</h3><p>Actions are processed through backend tools and recorded.</p><div className="control-row"><span>Read-only analysis</span><Status value="Enabled"/></div><div className="control-row"><span>Approval gate</span><Status value="Enabled"/></div><div className="control-row"><span>PayPal live mode</span><Status value="Disabled"/></div><div className="info-callout"><ShieldAlert size={17}/><span>Payment execution is disabled in this prototype. Approval records are demonstrative only.</span></div><h4>Try these instructions</h4><ul><li>Find overdue customer invoices.</li><li>Prepare a supplier-payment proposal.</li><li>Explain my expected cash position.</li></ul></aside></div>
  </>;
}
function Invoices({invoices,refresh}) {
  const [open,setOpen]=useState(false), [customer,setCustomer]=useState(''), [email,setEmail]=useState(''), [amount,setAmount]=useState(''), [due,setDue]=useState(''), [busy,setBusy]=useState(false), [notice,setNotice]=useState('');
  async function create(e) { e.preventDefault(); setBusy(true); setNotice(''); try { await api.createInvoice({customer,email,amount:Number(amount),currency:'USD',due_date:due}); setOpen(false); setCustomer('');setEmail('');setAmount('');setDue('');setNotice('Draft invoice created successfully.');await refresh(); } catch(e){setNotice(e.message);} finally{setBusy(false);} }
  async function provider(id) { try { const r=await api.paypalInvoice(id); setNotice(`Demo adapter prepared reference ${r.integration.reference}. No PayPal request was made.`); await refresh(); } catch(e){setNotice(e.message);} }
  return <><PageHeading eyebrow="RECEIVABLES" title="Invoices" desc="Create, organise and monitor customer invoices." action={<button className="btn primary" onClick={()=>setOpen(true)}><Plus size={16}/> New invoice</button>}/>
    {notice&&<div className="notice">{notice}</div>}
    <section className="panel"><div className="panel-head"><div><h3>All invoices</h3><p>{invoices.length} records · fictional demo workspace</p></div><span className="count-pill">{invoices.length} TOTAL</span></div><InvoiceRows invoices={invoices}/><div className="table-foot">Provider actions use a local demo adapter until PayPal sandbox credentials and API calls are implemented.</div></section>
    {open&&<div className="modal-backdrop"><form className="modal" onSubmit={create}><div className="modal-head"><div><h3>Create invoice draft</h3><p>Enter the customer and invoice details.</p></div><button type="button" className="icon-btn" onClick={()=>setOpen(false)}><X/></button></div><label>Customer name<input required minLength="2" value={customer} onChange={e=>setCustomer(e.target.value)} placeholder="e.g. Acme Studio"/></label><label>Customer email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="accounts@example.com"/></label><div className="form-row"><label>Amount (USD)<input required type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Due date<input required type="date" value={due} onChange={e=>setDue(e.target.value)}/></label></div><div className="modal-actions"><button type="button" className="btn secondary" onClick={()=>setOpen(false)}>Cancel</button><button disabled={busy} className="btn primary">{busy?'Saving…':'Create draft'}</button></div></form></div>}
  </>;
}
function Payments({invoices}) {
  return <><PageHeading eyebrow="TRANSACTIONS" title="Payments" desc="Payment records and provider references associated with invoices."/><div className="demo-banner"><Wallet size={17}/><div><b>Payment execution is not enabled</b><span>This page currently shows invoice-linked payment context. Connect and verify PayPal sandbox before adding live provider transactions.</span></div></div><section className="panel"><div className="panel-head"><div><h3>Payment-linked records</h3><p>Invoice status is not the same as a confirmed payment ledger.</p></div></div><div className="table-wrap"><table><thead><tr><th>REFERENCE</th><th>CUSTOMER</th><th>AMOUNT</th><th>INVOICE STATE</th><th>PROVIDER</th></tr></thead><tbody>{invoices.map(x=><tr key={x.id}><td>INV-{String(x.id).padStart(4,'0')}</td><td><b>{x.customer}</b></td><td className="amount">{money(x.amount)}</td><td><Status value={x.status}/></td><td>{x.provider}</td></tr>)}</tbody></table></div></section></>;
}
function CashFlow({data}) {
  if(!data)return <Empty title="Forecast unavailable"/>;
  return <><PageHeading eyebrow="FINANCIAL INTELLIGENCE" title="Cash Flow" desc="An illustrative projection based on local demo invoices and expenses."/><div className="demo-banner"><AlertTriangle size={17}/><div><b>Forecast is not a live account balance</b><span>Opening cash and receipt assumptions are fictional. Review assumptions before interpreting this projection.</span></div></div><div className="stats-grid"><Stat label="Opening cash (demo)" value={money(data.opening_cash_demo)} sub="Fictional assumption" icon={Wallet}/><Stat label="Expected receivables" value={money(data.expected_receivables)} sub="All unpaid invoices" icon={ArrowUpRight} tone="blue"/><Stat label="Upcoming expenses" value={money(data.upcoming_expenses)} sub="Scheduled demo expenses" icon={Clock3} tone="orange"/><Stat label="Illustrative net position" value={money(data.illustrative_net_position)} sub={`${data.horizon_days}-day simplified view`} icon={ChartNoAxesCombined} tone="purple"/></div><section className="panel"><h3>Forecast assumptions</h3><p className="muted">The current MVP uses a simple deterministic calculation.</p><ul className="assumption-list">{data.assumptions.map((x,i)=><li key={i}>{x}</li>)}</ul></section></>;
}
function RiskCentre({risks}) {
  return <><PageHeading eyebrow="MONITORING" title="Risk Centre" desc="Explainable operational flags based on demo records."/><div className="demo-banner"><ShieldAlert size={17}/><div><b>Rule-based alerts, not fraud certification</b><span>Each alert explains which operational condition was detected.</span></div></div><section className="panel"><div className="panel-head"><div><h3>Detected alerts</h3><p>{risks.length} alert(s)</p></div></div>{risks.length?risks.map((r,i)=><div className="risk-row" key={i}><div className={`risk-icon ${r.level}`}><AlertTriangle size={18}/></div><div><b>{r.title}</b><p>{r.detail}</p></div><span className={`risk-level ${r.level}`}>{r.level}</span></div>):<div className="empty-inline">No rule-based alerts detected.</div>}</section></>;
}
function Approvals({approvals,refresh}) {
  const [busy,setBusy]=useState(null), [note,setNote]=useState('');
  async function decide(id,d) {setBusy(id);setNote('');try{const r=await api.decide(id,d);setNote(r.message);await refresh();}catch(e){setNote(e.message);}finally{setBusy(null);}}
  return <><PageHeading eyebrow="CONTROL CENTRE" title="Approvals" desc="Review proposed sensitive actions. Approval here records a decision only; it does not move money."/><div className="demo-banner"><ShieldAlert size={17}/><div><b>Human-in-the-loop protection</b><span>Every proposal is reviewed. This prototype does not execute supplier payouts.</span></div></div>{note&&<div className="notice">{note}</div>}<div className="approval-list">{approvals.map(a=><section className="panel approval-card" key={a.id}><div className="approval-top"><span className="approval-icon"><ClipboardCheck/></span><Status value={a.status}/></div><h3>{a.title}</h3><p>{a.description}</p>{a.amount!=null&&<div className="approval-amount">{money(a.amount)}</div>}<div className="approval-actions">{a.status==='Pending'?<><button disabled={busy===a.id} className="btn secondary" onClick={()=>decide(a.id,'reject')}>Reject</button><button disabled={busy===a.id} className="btn primary" onClick={()=>decide(a.id,'approve')}>Approve proposal</button></>:<span className="muted">Decision recorded</span>}</div></section>)}{!approvals.length&&<section className="panel empty-inline">No pending approval proposals. Ask the AI Copilot to prepare a supplier-payment proposal.</section>}</div></>;
}
function ActivityLog({audit}) {
  return <><PageHeading eyebrow="TRACEABILITY" title="Activity Log" desc="A record of key events in the local demo workspace."/><section className="panel">{audit.length?audit.map(x=><div className="activity-row" key={x.id}><div className="activity-dot"/><div><b>{x.event_type}</b><p>{x.description}</p><small>{x.created_at?new Date(x.created_at).toLocaleString():'Just now'}</small></div></div>):<div className="empty-inline">No activity recorded.</div>}</section></>;
}
function SettingsPage({health}) {
  return <><PageHeading eyebrow="CONFIGURATION" title="Settings" desc="Workspace configuration and integration status."/><section className="panel"><h3>Integration status</h3><div className="settings-row"><div><b>PAYPILOT API</b><p>FastAPI backend connectivity</p></div><Status value={health?.status==='ok'?'Connected':'Unavailable'}/></div><div className="settings-row"><div><b>PayPal</b><p>Adapter mode: {health?.paypal_mode||'unknown'}</p></div><Status value="Demo only"/></div><div className="settings-row"><div><b>AI orchestration</b><p>Current engine uses deterministic rules; LLM integration is a next phase.</p></div><Status value="Prototype"/></div><div className="info-callout"><ShieldAlert size={17}/><span>Never enter API secrets in the browser. Configure credentials in the backend environment only.</span></div></section></>;
}
function Empty({title}) {return <section className="panel empty-inline">{title}</section>}

export default App;
