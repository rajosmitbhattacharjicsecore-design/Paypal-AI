const BASE = import.meta.env.VITE_API_URL || ''; // same-origin API in cloud deployment
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}
export const api = {
  dashboard: () => request('/api/dashboard'),
  invoices: () => request('/api/invoices'),
  createInvoice: data => request('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),
  paypalInvoice: id => request(`/api/invoices/${id}/paypal`, { method: 'POST' }),
  chat: message => request('/api/agent/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  approvals: () => request('/api/approvals'),
  decide: (id, decision) => request(`/api/approvals/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) }),
  forecast: () => request('/api/forecast'),
  risks: () => request('/api/risks'),
  audit: () => request('/api/audit'),
  health: () => request('/api/health')
};
