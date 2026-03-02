import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend, PieChart, Pie, Cell } from "recharts";

const CATEGORIES = ["Viande", "Poisson", "Légumes", "Fruits", "Boissons", "Produits laitiers", "Épicerie", "Boulangerie", "Autre"];
const RATIO_ALERT_THRESHOLD = 28;

const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const JOURS_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const DEFAULT_OBJ = {0:2800,1:3000,2:3200,3:3500,4:4200,5:4800,6:2500};
const getDow = (ds) => { const d = new Date(ds + "T00:00:00"); return (d.getDay() + 6) % 7; };

const generateDemoData = (objectives) => {
  const obj = objectives || DEFAULT_OBJ;
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const ds = date.toISOString().split("T")[0];
    const dow = getDow(ds);
    const dayObj = obj[dow] || 3000;
    const ca = Math.round(dayObj * (0.7 + Math.random() * 0.6));
    const ca_ht = Math.round(ca / 1.1);
    const totalAchats = Math.round(ca_ht * (0.2 + Math.random() * 0.15));
    const invoices = [];
    const numInv = 2 + Math.floor(Math.random() * 4);
    const fournisseurs = ["Metro", "Rungis Express", "Transgourmet", "Pomona", "Brake France", "Davigel"];
    let remaining = totalAchats;
    for (let j = 0; j < numInv; j++) {
      const amt = j === numInv - 1 ? remaining : Math.round(remaining * (0.2 + Math.random() * 0.4));
      remaining -= amt;
      invoices.push({ id: ds + "-" + j, fournisseur: fournisseurs[Math.floor(Math.random() * fournisseurs.length)], montant: Math.max(amt, 50), categorie: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)], date: ds });
    }
    data.push({ date: ds, ca, ca_ht, objectif: dayObj, invoices });
  }
  return data;
};

const DEMO_RESTAURANTS = [
  { id: "r1", name: "Le Bistrot Parisien", address: "12 rue de Rivoli, Paris", color: "#4ADE80", objectives: { ...DEFAULT_OBJ }, dateOverrides: {} },
  { id: "r2", name: "La Table du Marché", address: "8 place Victor Hugo, Lyon", color: "#60A5FA", objectives: { 0:2200, 1:2500, 2:2800, 3:3000, 4:3800, 5:4200, 6:2000 }, dateOverrides: {} },
  { id: "r3", name: "Chez Marcel", address: "25 cours Mirabeau, Aix", color: "#FBBF24", objectives: { 0:1800, 1:2000, 2:2200, 3:2500, 4:3200, 5:3800, 6:1500 }, dateOverrides: {} },
];

const DEMO_USERS = [
  { email: "admin@restopilot.fr", password: "admin123", name: "Alexandre Dupont", role: "admin", restaurantId: null },
  { email: "marie@bistrot.fr", password: "manager123", name: "Marie Laurent", role: "manager", restaurantId: "r1" },
  { email: "lucas@table.fr", password: "manager123", name: "Lucas Martin", role: "manager", restaurantId: "r2" },
];

const formatCurrency = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
const formatPct = (v) => v.toFixed(1) + "%";
const formatDateFR = (d) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
const formatDateFull = (d) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const today = () => new Date().toISOString().split("T")[0];

const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    input: <><path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="2"/></>,
    history: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
  };
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>);
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

  :root {
    --bg-primary: #111114;
    --bg-secondary: #18181B;
    --bg-card: #1E1E22;
    --bg-card-hover: #26262B;
    --bg-input: #141417;
    --border: #2C2C30;
    --border-light: #3A3A40;
    --text-primary: #ECECEE;
    --text-secondary: #9898A0;
    --text-muted: #63636B;
    --accent: #4ADE80;
    --accent-dim: #22C55E;
    --accent-bg: rgba(74, 222, 128, 0.08);
    --accent-bg-strong: rgba(74, 222, 128, 0.15);
    --gold: #FBBF24;
    --gold-dim: #D97706;
    --gold-bg: rgba(251, 191, 36, 0.1);
    --red: #F87171;
    --red-dim: #EF4444;
    --red-bg: rgba(248, 113, 113, 0.1);
    --blue: #60A5FA;
    --blue-bg: rgba(96, 165, 250, 0.1);
    --purple: #A78BFA;
    --purple-bg: rgba(167, 139, 250, 0.1);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
    --shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
    --shadow-lg: 0 4px 20px rgba(0,0,0,0.4);
    --transition: 0.2s ease;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { font-family: 'DM Sans', sans-serif; background: var(--bg-primary); color: var(--text-primary); min-height: 100vh; -webkit-font-smoothing: antialiased; }
  .app-container { display: flex; min-height: 100vh; }
  .sidebar { width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; transition: transform 0.3s ease; }
  .sidebar-header { padding: 24px 20px; border-bottom: 1px solid var(--border); }
  .sidebar-logo { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--accent); letter-spacing: -0.5px; }
  .sidebar-subtitle { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
  .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-secondary); transition: all var(--transition); border: 1px solid transparent; }
  .nav-item:hover { background: var(--bg-card); color: var(--text-primary); }
  .nav-item.active { background: var(--accent-bg-strong); color: var(--accent); border-color: rgba(74, 222, 128, 0.2); }
  .sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--border); }
  .user-badge { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--bg-card); }
  .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent-bg-strong); display: flex; align-items: center; justify-content: center; color: var(--accent); }
  .user-info { flex: 1; }
  .user-name { font-size: 13px; font-weight: 600; }
  .user-role { font-size: 11px; color: var(--text-muted); }
  .main-content { flex: 1; margin-left: 260px; min-height: 100vh; }
  .top-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid var(--border); background: var(--bg-secondary); position: sticky; top: 0; z-index: 50; }
  .top-bar-left { display: flex; align-items: center; gap: 12px; }
  .burger { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 8px; }
  .page-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 600; }
  .page-date { font-size: 13px; color: var(--text-muted); }
  .top-bar-right { display: flex; align-items: center; gap: 12px; }
  .content-area { padding: 28px 32px; }
  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow); }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
  .card-subtitle { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
  .kpi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; position: relative; overflow: hidden; transition: all var(--transition); }
  .kpi-card:hover { border-color: var(--border-light); transform: translateY(-1px); }
  .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .kpi-card.green::before { background: var(--accent); }
  .kpi-card.gold::before { background: var(--gold); }
  .kpi-card.red::before { background: var(--red); }
  .kpi-card.blue::before { background: var(--blue); }
  .kpi-card.purple::before { background: var(--purple); }
  .kpi-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
  .kpi-value { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 700; line-height: 1.1; }
  .kpi-value.green { color: var(--accent); }
  .kpi-value.gold { color: var(--gold); }
  .kpi-value.red { color: var(--red); }
  .kpi-value.blue { color: var(--blue); }
  .kpi-value.purple { color: var(--purple); }
  .kpi-sub { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .form-input, .form-select { width: 100%; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; font-family: 'DM Sans', sans-serif; transition: border-color var(--transition); outline: none; }
  .form-input:focus, .form-select:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text-muted); }
  .form-select { appearance: none; cursor: pointer; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all var(--transition); border: none; }
  .btn-primary { background: var(--accent); color: var(--bg-primary); }
  .btn-primary:hover { background: var(--accent-dim); }
  .btn-secondary { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); }
  .btn-secondary:hover { border-color: var(--border-light); background: var(--bg-card-hover); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn-icon { padding: 8px; background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; transition: all var(--transition); }
  .btn-icon:hover { border-color: var(--border-light); color: var(--text-primary); }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid var(--border); }
  td { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid var(--border); }
  tr:hover td { background: var(--bg-card-hover); }
  .td-mono { font-variant-numeric: tabular-nums; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-green { background: var(--accent-bg); color: var(--accent); }
  .badge-gold { background: var(--gold-bg); color: var(--gold); }
  .badge-red { background: var(--red-bg); color: var(--red); }
  .alert-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: var(--radius); margin-bottom: 20px; border: 1px solid; }
  .alert-banner.warning { background: var(--red-bg); border-color: rgba(248,113,113,0.3); color: var(--red); }
  .invoice-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-bottom: 8px; transition: all var(--transition); }
  .invoice-item:hover { border-color: var(--border-light); }
  .invoice-left { display: flex; align-items: center; gap: 12px; }
  .invoice-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
  .toast { padding: 14px 20px; border-radius: var(--radius); font-size: 14px; font-weight: 500; animation: slideIn 0.3s ease; box-shadow: var(--shadow-lg); max-width: 360px; }
  .toast.success { background: #166534; color: #BBF7D0; border: 1px solid #22C55E; }
  .toast.error { background: #7F1D1D; color: #FECACA; border: 1px solid #EF4444; }
  .toast.info { background: #1E3A5F; color: #BFDBFE; border: 1px solid #3B82F6; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); position: relative; overflow: hidden; }
  .login-page::before { content: ''; position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(74,222,128,0.06), transparent 70%); top: -200px; right: -200px; }
  .login-page::after { content: ''; position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(251,191,36,0.04), transparent 70%); bottom: -100px; left: -100px; }
  .login-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 48px 40px; width: 420px; max-width: 90vw; box-shadow: var(--shadow-lg); position: relative; z-index: 1; }
  .login-brand { text-align: center; margin-bottom: 36px; }
  .login-brand h1 { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
  .login-brand p { font-size: 13px; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; }
  .custom-tooltip { background: var(--bg-secondary) !important; border: 1px solid var(--border) !important; border-radius: var(--radius-sm) !important; padding: 12px 16px !important; box-shadow: var(--shadow-lg) !important; }
  .custom-tooltip .label { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .custom-tooltip .item { font-size: 13px; margin-bottom: 3px; }
  @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .grid-2 { grid-template-columns: 1fr; } }
  @media (max-width: 768px) { .sidebar { transform: translateX(-100%); } .sidebar.open { transform: translateX(0); } .main-content { margin-left: 0; } .burger { display: block; } .content-area { padding: 20px 16px; } .top-bar { padding: 12px 16px; } .kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; } .kpi-card { padding: 14px; } .kpi-value { font-size: 22px; } .form-row { grid-template-columns: 1fr; } .card { padding: 16px; } .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; } }
  @media (max-width: 480px) { .kpi-grid { grid-template-columns: 1fr; } }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .recharts-text { fill: var(--text-muted) !important; font-size: 11px !important; }
  .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: var(--border) !important; }

  /* ========== LIGHT THEME (Apple style) ========== */
  [data-theme="light"] {
    --bg-primary: #F5F5F7;
    --bg-secondary: rgba(255,255,255,0.82);
    --bg-card: #FFFFFF;
    --bg-card-hover: #F9FAFB;
    --bg-input: #F5F5F7;
    --border: rgba(0,0,0,0.06);
    --border-light: rgba(0,0,0,0.1);
    --text-primary: #1D1D1F;
    --text-secondary: #6E6E73;
    --text-muted: #86868B;
    --accent: #34C759;
    --accent-dim: #248A3D;
    --accent-bg: rgba(52,199,89,0.08);
    --accent-bg-strong: rgba(52,199,89,0.12);
    --gold: #FF9500;
    --gold-dim: #C93400;
    --gold-bg: rgba(255,149,0,0.08);
    --red: #FF3B30;
    --red-dim: #D70015;
    --red-bg: rgba(255,59,48,0.06);
    --blue: #007AFF;
    --blue-bg: rgba(0,122,255,0.06);
    --purple: #AF52DE;
    --purple-bg: rgba(175,82,222,0.08);
    --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
    --shadow-lg: 0 8px 30px rgba(0,0,0,0.1);
  }
  [data-theme="light"] .sidebar {
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
  }
  [data-theme="light"] .top-bar {
    background: rgba(245,245,247,0.72);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
  }
  [data-theme="light"] .nav-item:hover { background: rgba(0,0,0,0.04); }
  [data-theme="light"] .nav-item.active { background: rgba(0,122,255,0.1); color: #007AFF; border-color: rgba(0,122,255,0.15); }
  [data-theme="light"] .nav-item.active svg { stroke: #007AFF; }
  [data-theme="light"] .kpi-card { box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
  [data-theme="light"] .kpi-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  [data-theme="light"] .kpi-value.green { color: #248A3D; }
  [data-theme="light"] .kpi-value.blue { color: #007AFF; }
  [data-theme="light"] .kpi-value.gold { color: #C93400; }
  [data-theme="light"] .kpi-value.red { color: #D70015; }
  [data-theme="light"] .kpi-value.purple { color: #7D2FA5; }
  [data-theme="light"] .toast.success { background: rgba(52,199,89,0.95); color: #fff; border: none; }
  [data-theme="light"] .toast.error { background: rgba(255,59,48,0.95); color: #fff; border: none; }
  [data-theme="light"] .toast.info { background: rgba(0,122,255,0.95); color: #fff; border: none; }
  [data-theme="light"] .login-page { background: #F5F5F7; }
  [data-theme="light"] .login-page::before { background: radial-gradient(circle, rgba(52,199,89,0.06), transparent 70%); }
  [data-theme="light"] .login-page::after { background: radial-gradient(circle, rgba(0,122,255,0.04), transparent 70%); }
  [data-theme="light"] .login-card { background: #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
  [data-theme="light"] .login-brand h1 { color: #1D1D1F; }
  [data-theme="light"] .sidebar-logo { color: #1D1D1F; }
  [data-theme="light"] .custom-tooltip { background: rgba(255,255,255,0.95) !important; backdrop-filter: blur(20px) !important; }
  [data-theme="light"] .recharts-text { fill: #86868B !important; }
  [data-theme="light"] .recharts-cartesian-grid-horizontal line,
  [data-theme="light"] .recharts-cartesian-grid-vertical line { stroke: rgba(0,0,0,0.05) !important; }
  [data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }

  /* Theme toggle switch */
  .theme-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    background: var(--bg-input);
    border: 1px solid var(--border);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all var(--transition);
    margin-bottom: 12px;
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    justify-content: center;
  }
  .theme-toggle:hover { border-color: var(--border-light); color: var(--text-primary); }
  .theme-switch {
    position: relative;
    width: 36px;
    height: 20px;
    background: var(--border);
    border-radius: 10px;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
  .theme-switch.on { background: var(--accent); }
  .theme-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .theme-switch.on::after { left: 18px; }

  /* Remember me checkbox */
  .remember-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-secondary);
  }
  .remember-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
    border-radius: 4px;
    cursor: pointer;
  }


  /* Restaurant picker */
  .resto-picker { position: relative; }
  .resto-picker-btn { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; transition: all var(--transition); font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; color: var(--text-primary); }
  .resto-picker-btn:hover { border-color: var(--border-light); }
  .resto-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .resto-dropdown { position: absolute; top: calc(100% + 6px); right: 0; min-width: 280px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-lg); z-index: 200; overflow: hidden; animation: scaleIn 0.2s ease; }
  .resto-dd-item { display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer; transition: all var(--transition); font-size: 14px; }
  .resto-dd-item:hover { background: var(--bg-input); }
  .resto-dd-item.active { background: var(--accent-bg); }
  .resto-dd-name { font-weight: 500; flex: 1; }
  .resto-dd-addr { font-size: 11px; color: var(--text-muted); }

  /* Objectives grid */
  .obj-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 20px; }
  .obj-day { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 10px; text-align: center; transition: all var(--transition); }
  .obj-day:hover { border-color: var(--border-light); }
  .obj-day.today { border-color: var(--accent); background: var(--accent-bg); }
  .obj-day-name { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .obj-day.today .obj-day-name { color: var(--accent); }
  .obj-day-input { width: 100%; text-align: center; padding: 8px 4px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; font-family: 'DM Sans', sans-serif; color: var(--text-primary); outline: none; transition: all var(--transition); }
  .obj-day-input:focus { border-color: var(--accent); }
  .obj-day-input:read-only { opacity: 0.7; cursor: default; }
  .obj-day-input:read-only:focus { border-color: var(--border); }
  .obj-total { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-radius: var(--radius); background: var(--accent-bg); border: 1px solid rgba(74,222,128,0.15); }
  .ovr-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: 4px; background: var(--bg-input); border: 1px solid var(--border); }

  /* Resto cards */
  .resto-card { border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; margin-bottom: 10px; transition: all var(--transition); background: var(--bg-card); }
  .resto-card:hover { border-color: var(--border-light); box-shadow: var(--shadow); }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 300; animation: fadeIn 0.2s ease; }
  .modal-content { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 32px; max-width: 480px; width: 90vw; box-shadow: var(--shadow-lg); animation: scaleIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

  @media (max-width: 768px) { .obj-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width: 480px) { .obj-grid { grid-template-columns: repeat(2, 1fr); } }

`;

const CATEGORY_COLORS = {
  Viande: "#F87171", Poisson: "#60A5FA", "Légumes": "#4ADE80", Fruits: "#FBBF24",
  Boissons: "#A78BFA", "Produits laitiers": "#F9A8D4", "Épicerie": "#FB923C",
  Boulangerie: "#E879F9", Autre: "#94A3B8",
};
const CATEGORY_EMOJIS = {
  Viande: "🥩", Poisson: "🐟", "Légumes": "🥬", Fruits: "🍎",
  Boissons: "🍷", "Produits laitiers": "🧀", "Épicerie": "🧂",
  Boulangerie: "🥖", Autre: "📦",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (<div className="custom-tooltip"><div className="label">{label}</div>{payload.map((p, i) => (<div key={i} className="item" style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === "number" && p.name?.includes("Ratio") ? formatPct(p.value) : formatCurrency(p.value)}</strong></div>))}</div>);
};

const ToastContainer = ({ toasts }) => (<div className="toast-container">{toasts.map((t) => (<div key={t.id} className={"toast " + t.type}>{t.message}</div>))}</div>);


const RestoPicker = ({ restaurants, current, setCurrent, isAdmin }) => {
  const [open, setOpen] = useState(false);
  const r = restaurants.find(x => x.id === current);
  if (!isAdmin || restaurants.length <= 1) return r ? <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}><div className="resto-dot" style={{ background: r.color }} />{r.name}</div> : null;
  return (
    <div className="resto-picker">
      <button className="resto-picker-btn" onClick={() => setOpen(!open)}><div className="resto-dot" style={{ background: r?.color || "var(--text-muted)" }} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{r?.name || "Choisir"}</span><Icon name="chevronDown" size={14} color="var(--text-muted)" /></button>
      {open && <><div style={{ position: "fixed", inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} /><div className="resto-dropdown">{restaurants.map(x => (
        <div key={x.id} className={"resto-dd-item" + (x.id === current ? " active" : "")} onClick={() => { setCurrent(x.id); setOpen(false); }}>
          <div className="resto-dot" style={{ background: x.color }} />
          <div><div className="resto-dd-name">{x.name}</div><div className="resto-dd-addr">{x.address}</div></div>
          {x.id === current && <Icon name="check" size={16} color="var(--accent)" />}
        </div>
      ))}</div></>}
    </div>
  );
};

const LoginPage = ({ onLogin, users }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const handleSubmit = (e) => { e.preventDefault(); const user = users.find((u) => u.email === email && u.password === password); if (user) { if (remember) { try { localStorage.setItem("rp_session", JSON.stringify(user)); localStorage.setItem("rp_session_expiry", String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch(e) {} } onLogin(user); } else setError("Identifiants incorrects"); };
  return (
    <div className="login-page"><div className="login-card"><div className="login-brand"><h1>RestoPilot</h1><p>Gestion & Performance</p></div>
    <form onSubmit={handleSubmit}>
      <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="Votre email" /></div>
      <div className="form-group"><label className="form-label">Mot de passe</label><input className="form-input" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" /></div>
      <label className="remember-row"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Rester connecté</label>
      {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "12px 20px" }} type="submit">Se connecter</button>
    </form>
    </div></div>
  );
};

const DashboardPage = ({ data }) => {
  const todayData = data.find((d) => d.date === today());
  const latest = todayData || data[data.length - 1];
  const stats = useMemo(() => {
    if (!latest) return null;
    const totalAchats = latest.invoices.reduce((s, i) => s + i.montant, 0);
    const ht = latest.ca_ht || Math.round(latest.ca / 1.1);
    const ratio = ht > 0 ? (totalAchats / ht) * 100 : 0;
    const ecart = latest.ca - latest.objectif;
    const atteinte = latest.objectif > 0 ? (latest.ca / latest.objectif) * 100 : 0;
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
    const weekData = data.filter((d) => new Date(d.date + "T00:00:00") >= weekAgo);
    const monthData = data.filter((d) => new Date(d.date + "T00:00:00") >= monthAgo);
    const caW = weekData.reduce((s, d) => s + d.ca, 0);
    const caWHt = weekData.reduce((s, d) => s + (d.ca_ht || Math.round(d.ca / 1.1)), 0);
    const caM = monthData.reduce((s, d) => s + d.ca, 0);
    const caMHt = monthData.reduce((s, d) => s + (d.ca_ht || Math.round(d.ca / 1.1)), 0);
    const taM = monthData.reduce((s, d) => s + d.invoices.reduce((a, i) => a + i.montant, 0), 0);
    const ratioM = caMHt > 0 ? (taM / caMHt) * 100 : 0;
    const avgAtteinte = (arr) => { if (!arr.length) return 0; return arr.reduce((s, d) => s + (d.objectif > 0 ? (d.ca / d.objectif) * 100 : 0), 0) / arr.length; };
    return { ca: latest.ca, ca_ht: ht, objectif: latest.objectif, totalAchats, ratio, ecart, atteinte, caW, caWHt, caM, caMHt, taM, ratioM, monthAtteinte: avgAtteinte(monthData) };
  }, [data, latest]);
  const chartData = useMemo(() => data.slice(-14).map((d) => { const ta = d.invoices.reduce((s, i) => s + i.montant, 0); const ht = d.ca_ht || Math.round(d.ca / 1.1); return { date: formatDateFR(d.date), "CA TTC": d.ca, "CA HT": ht, Objectif: d.objectif, Achats: ta, "Ratio (%)": ht > 0 ? parseFloat(((ta / ht) * 100).toFixed(1)) : 0 }; }), [data]);
  const categoryData = useMemo(() => { const last7 = data.slice(-7); const cats = {}; last7.forEach((d) => d.invoices.forEach((i) => { cats[i.categorie] = (cats[i.categorie] || 0) + i.montant; })); return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value); }, [data]);
  if (!stats) return <div className="content-area"><p>Aucune donnée disponible.</p></div>;
  return (
    <div className="content-area">
      {stats.ratioM > RATIO_ALERT_THRESHOLD && (<div className="alert-banner warning"><Icon name="alert" size={20} /><div><strong>Ratio matières mensuel trop élevé !</strong><div style={{ fontSize: 13, marginTop: 2 }}>Ratio mensuel : {formatPct(stats.ratioM)} — seuil de {RATIO_ALERT_THRESHOLD}% dépassé. Achats HT : {formatCurrency(stats.taM)} / CA HT : {formatCurrency(stats.caMHt)}.</div></div></div>)}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi-card green"><div className="kpi-label">CA du jour (TTC)</div><div className="kpi-value green">{formatCurrency(stats.ca)}</div><div className="kpi-sub">HT : {formatCurrency(stats.ca_ht)} · Obj : {formatCurrency(stats.objectif)}</div></div>
        <div className="kpi-card blue"><div className="kpi-label">CA hebdomadaire (TTC)</div><div className="kpi-value blue">{formatCurrency(stats.caW)}</div><div className="kpi-sub">HT : {formatCurrency(stats.caWHt)}</div></div>
        <div className="kpi-card green"><div className="kpi-label">CA mensuel (TTC)</div><div className="kpi-value green">{formatCurrency(stats.caM)}</div><div className="kpi-sub">HT : {formatCurrency(stats.caMHt)}</div></div>
        <div className={"kpi-card " + (stats.ratioM > RATIO_ALERT_THRESHOLD ? "red" : "gold")}><div className="kpi-label">Ratio matières mensuel (HT/HT)</div><div className={"kpi-value " + (stats.ratioM > RATIO_ALERT_THRESHOLD ? "red" : "gold")}>{formatPct(stats.ratioM)}</div><div className="kpi-sub">Achats HT : {formatCurrency(stats.taM)} / CA HT : {formatCurrency(stats.caMHt)}</div></div>
        <div className={"kpi-card " + (stats.atteinte >= 100 ? "green" : "blue")}><div className="kpi-label">Atteinte objectif du jour</div><div className={"kpi-value " + (stats.atteinte >= 100 ? "green" : "blue")}>{formatPct(stats.atteinte)}</div><div className="kpi-sub">Écart : {stats.ecart >= 0 ? "+" : ""}{formatCurrency(stats.ecart)}</div></div>
        <div className="kpi-card gold"><div className="kpi-label">Moy. mensuelle objectif</div><div className={"kpi-value " + (stats.monthAtteinte >= 100 ? "green" : "gold")}>{formatPct(stats.monthAtteinte)}</div><div className="kpi-sub">Sur les 30 derniers jours</div></div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><div><div className="card-title">Évolution CA vs Objectif</div><div className="card-subtitle">14 derniers jours</div></div></div><div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ADE80" stopOpacity={0.2} /><stop offset="95%" stopColor="#4ADE80" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" /><XAxis dataKey="date" tick={{ fill: "#63636B", fontSize: 11 }} /><YAxis tick={{ fill: "#63636B", fontSize: 11 }} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="CA TTC" stroke="#4ADE80" fill="url(#gradCA)" strokeWidth={2} name="CA TTC" /><Line type="monotone" dataKey="Objectif" stroke="#FBBF24" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Objectif" /></AreaChart></ResponsiveContainer></div></div>
        <div className="card"><div className="card-header"><div><div className="card-title">Évolution du Ratio</div><div className="card-subtitle">Seuil : {RATIO_ALERT_THRESHOLD}%</div></div></div><div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="gradRatio" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FBBF24" stopOpacity={0.2} /><stop offset="95%" stopColor="#FBBF24" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" /><XAxis dataKey="date" tick={{ fill: "#63636B", fontSize: 11 }} /><YAxis tick={{ fill: "#63636B", fontSize: 11 }} domain={[0, 45]} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="Ratio (%)" stroke="#FBBF24" fill="url(#gradRatio)" strokeWidth={2} /><Line type="monotone" dataKey={() => RATIO_ALERT_THRESHOLD} stroke="#F87171" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Seuil" /></AreaChart></ResponsiveContainer></div></div>
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><div><div className="card-title">Achats HT vs CA HT</div><div className="card-subtitle">14 derniers jours</div></div></div><div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" /><XAxis dataKey="date" tick={{ fill: "#63636B", fontSize: 11 }} /><YAxis tick={{ fill: "#63636B", fontSize: 11 }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="CA HT" fill="#4ADE80" radius={[4, 4, 0, 0]} opacity={0.8} name="CA HT" /><Bar dataKey="Achats" fill="#F87171" radius={[4, 4, 0, 0]} opacity={0.8} /></BarChart></ResponsiveContainer></div></div>
        <div className="card"><div className="card-header"><div><div className="card-title">Répartition des Achats</div><div className="card-subtitle">7 derniers jours</div></div></div><div style={{ height: 260, display: "flex", alignItems: "center" }}><ResponsiveContainer width="50%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>{categoryData.map((entry) => (<Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#94A3B8"} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer><div style={{ flex: 1, paddingLeft: 8 }}>{categoryData.slice(0, 6).map((c) => (<div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[c.name] || "#94A3B8" }} /><span style={{ color: "var(--text-secondary)", flex: 1 }}>{c.name}</span><span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(c.value)}</span></div>))}</div></div></div>
      </div>
    </div>
  );
};

const InputPage = ({ data, setData, addToast, isAdmin }) => {
  const todayStr = today();
  const existing = data.find((d) => d.date === todayStr);
  const [ca, setCa] = useState(existing?.ca?.toString() || "");
  const [caHt, setCaHt] = useState(existing?.ca_ht?.toString() || "");
  const [objectif, setObjectif] = useState(existing?.objectif?.toString() || "");
  const [invoices, setInvoices] = useState(existing?.invoices || []);
  const [newInvoice, setNewInvoice] = useState({ fournisseur: "", montant: "", categorie: CATEGORIES[0] });
  const [selectedDate, setSelectedDate] = useState(todayStr);
  useEffect(() => { const dayData = data.find((d) => d.date === selectedDate); setCa(dayData?.ca?.toString() || ""); setCaHt(dayData?.ca_ht?.toString() || ""); setObjectif(dayData?.objectif?.toString() || ""); setInvoices(dayData?.invoices || []); }, [selectedDate, data]);
  const addInvoice = () => { if (!newInvoice.fournisseur || !newInvoice.montant) return; setInvoices([...invoices, { id: selectedDate + "-" + Date.now(), fournisseur: newInvoice.fournisseur, montant: parseFloat(newInvoice.montant), categorie: newInvoice.categorie, date: selectedDate }]); setNewInvoice({ fournisseur: "", montant: "", categorie: CATEGORIES[0] }); };
  const removeInvoice = (id) => setInvoices(invoices.filter((i) => i.id !== id));
  const saveDay = () => {
    if (!ca || !caHt || !objectif) { addToast("Veuillez remplir CA TTC, CA HT et objectif", "error"); return; }
    const dayEntry = { date: selectedDate, ca: parseFloat(ca), ca_ht: parseFloat(caHt), objectif: parseFloat(objectif), invoices };
    const idx = data.findIndex((d) => d.date === selectedDate);
    const newData = [...data];
    if (idx >= 0) newData[idx] = dayEntry; else { newData.push(dayEntry); newData.sort((a, b) => a.date.localeCompare(b.date)); }
    setData(newData);
    addToast("Données du " + formatDateFull(selectedDate) + " enregistrées ✓", "success");
    const totalAchats = invoices.reduce((s, i) => s + i.montant, 0);
    const ratio = parseFloat(caHt) > 0 ? (totalAchats / parseFloat(caHt)) * 100 : 0;
    if (ratio > RATIO_ALERT_THRESHOLD) setTimeout(() => addToast("⚠️ Ratio à " + formatPct(ratio) + " — seuil dépassé !", "error"), 500);
  };
  const totalAchats = invoices.reduce((s, i) => s + i.montant, 0);
  const htVal = parseFloat(caHt) || 0;
  const ratio = htVal > 0 ? (totalAchats / htVal) * 100 : 0;
  return (
    <div className="content-area"><div className="grid-2" style={{ alignItems: "start" }}>
      <div>
        <div className="card" style={{ marginBottom: 20 }}><div className="card-header"><div className="card-title">Saisie journalière</div></div>
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div>
          <div className="form-row"><div className="form-group"><label className="form-label">CA TTC (€)</label><input className="form-input" type="number" value={ca} onChange={(e) => setCa(e.target.value)} placeholder="3 850" min="0" step="0.01" /></div><div className="form-group"><label className="form-label">CA HT (€)</label><input className="form-input" type="number" value={caHt} onChange={(e) => setCaHt(e.target.value)} placeholder="3 500" min="0" step="0.01" /></div></div>
          <div className="form-group"><label className="form-label">Objectif du jour (€){!isAdmin && " 🔒"}</label><input className="form-input" type="number" value={objectif} onChange={(e) => { if (isAdmin) setObjectif(e.target.value); }} placeholder="3 000" min="0" step="0.01" readOnly={!isAdmin} style={!isAdmin ? { opacity: 0.6, cursor: "not-allowed" } : {}} /></div>
        </div>
        <div className="card"><div className="card-header"><div className="card-title">Ajouter une facture fournisseur</div></div>
          <div className="form-row"><div className="form-group"><label className="form-label">Fournisseur</label><input className="form-input" value={newInvoice.fournisseur} onChange={(e) => setNewInvoice({ ...newInvoice, fournisseur: e.target.value })} placeholder="Nom du fournisseur" /></div><div className="form-group"><label className="form-label">Montant HT (€)</label><input className="form-input" type="number" value={newInvoice.montant} onChange={(e) => setNewInvoice({ ...newInvoice, montant: e.target.value })} placeholder="250" min="0" step="0.01" /></div></div>
          <div className="form-group"><label className="form-label">Catégorie</label><select className="form-select" value={newInvoice.categorie} onChange={(e) => setNewInvoice({ ...newInvoice, categorie: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <button className="btn btn-secondary" onClick={addInvoice} style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={16} /> Ajouter la facture</button>
        </div>
      </div>
      <div>
        <div className="card" style={{ marginBottom: 20 }}><div className="card-header"><div className="card-title">Récapitulatif — {formatDateFR(selectedDate)}</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 14, background: "var(--accent-bg)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(74,222,128,0.15)" }}><div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total achats HT</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", fontFamily: "Fraunces, serif", marginTop: 4 }}>{formatCurrency(totalAchats)}</div></div>
            <div style={{ padding: 14, background: ratio > RATIO_ALERT_THRESHOLD ? "var(--red-bg)" : "var(--gold-bg)", borderRadius: "var(--radius-sm)", border: "1px solid " + (ratio > RATIO_ALERT_THRESHOLD ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.15)") }}><div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ratio HT/HT</div><div style={{ fontSize: 22, fontWeight: 700, color: ratio > RATIO_ALERT_THRESHOLD ? "var(--red)" : "var(--gold)", fontFamily: "Fraunces, serif", marginTop: 4 }}>{formatPct(ratio)}</div></div>
          </div>
          {invoices.length > 0 ? (<div style={{ maxHeight: 340, overflowY: "auto" }}>{invoices.map((inv) => (<div key={inv.id} className="invoice-item"><div className="invoice-left"><div className="invoice-icon" style={{ background: (CATEGORY_COLORS[inv.categorie] || "#94A3B8") + "22" }}>{CATEGORY_EMOJIS[inv.categorie] || "📦"}</div><div><div style={{ fontSize: 14, fontWeight: 500 }}>{inv.fournisseur}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.categorie}</div></div></div><div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(inv.montant)}</span><button className="btn-icon" onClick={() => removeInvoice(inv.id)} style={{ padding: 4, border: "none" }}><Icon name="trash" size={14} color="var(--red)" /></button></div></div>))}</div>) : (<div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Aucune facture ajoutée</div>)}
        </div>
        <button className="btn btn-primary" onClick={saveDay} style={{ width: "100%", justifyContent: "center", padding: "14px 20px" }}><Icon name="check" size={18} color="var(--bg-primary)" /> Enregistrer la journée</button>
      </div>
    </div></div>
  );
};

const HistoryPage = ({ data }) => {
  const [period, setPeriod] = useState("30");
  const filteredData = useMemo(() => data.slice(-parseInt(period)), [data, period]);
  return (
    <div className="content-area"><div className="card"><div className="card-header"><div className="card-title">Historique journalier</div><div style={{ display: "flex", gap: 8 }}>{[{ v: "7", l: "7J" }, { v: "14", l: "14J" }, { v: "30", l: "30J" }].map((p) => (<button key={p.v} className={"btn btn-sm " + (period === p.v ? "btn-primary" : "btn-secondary")} onClick={() => setPeriod(p.v)}>{p.l}</button>))}</div></div>
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>CA TTC</th><th>CA HT</th><th>Objectif</th><th>Achats HT</th><th>Ratio</th><th>Atteinte</th><th>Écart</th></tr></thead>
    <tbody>{[...filteredData].reverse().map((d) => { const ta = d.invoices.reduce((s, i) => s + i.montant, 0); const ht = d.ca_ht || Math.round(d.ca / 1.1); const ratio = ht > 0 ? (ta / ht) * 100 : 0; const atteinte = d.objectif > 0 ? (d.ca / d.objectif) * 100 : 0; const ecart = d.ca - d.objectif; return (<tr key={d.date}><td style={{ fontWeight: 500 }}>{formatDateFR(d.date)}</td><td className="td-mono">{formatCurrency(d.ca)}</td><td className="td-mono" style={{ color: "var(--text-secondary)" }}>{formatCurrency(ht)}</td><td className="td-mono">{formatCurrency(d.objectif)}</td><td className="td-mono">{formatCurrency(ta)}</td><td><span className={"badge " + (ratio > RATIO_ALERT_THRESHOLD ? "badge-red" : ratio > 25 ? "badge-gold" : "badge-green")}>{formatPct(ratio)}</span></td><td><span className={"badge " + (atteinte >= 100 ? "badge-green" : atteinte >= 90 ? "badge-gold" : "badge-red")}>{formatPct(atteinte)}</span></td><td className="td-mono" style={{ color: ecart >= 0 ? "var(--accent)" : "var(--red)" }}>{ecart >= 0 ? "+" : ""}{formatCurrency(ecart)}</td></tr>); })}</tbody></table></div></div></div>
  );
};

const AlertsPage = ({ data, addToast }) => {
  const alerts = useMemo(() => data.filter((d) => { const ta = d.invoices.reduce((s, i) => s + i.montant, 0); const ht = d.ca_ht || Math.round(d.ca / 1.1); return ht > 0 && (ta / ht) * 100 > RATIO_ALERT_THRESHOLD; }).reverse().slice(0, 20), [data]);
  const latest = data[data.length - 1];
  const latestHt = latest ? (latest.ca_ht || Math.round(latest.ca / 1.1)) : 0;
  const latestTa = latest ? latest.invoices.reduce((s, i) => s + i.montant, 0) : 0;
  const latestRatio = latestHt > 0 ? (latestTa / latestHt) * 100 : 0;
  const latestAtteinte = latest && latest.objectif > 0 ? (latest.ca / latest.objectif) * 100 : 0;
  return (
    <div className="content-area"><div className="grid-2" style={{ alignItems: "start" }}>
      <div>
        <div className="card" style={{ marginBottom: 20 }}><div className="card-header"><div><div className="card-title">Configuration des alertes</div><div className="card-subtitle">Seuil actuel : {RATIO_ALERT_THRESHOLD}%</div></div></div>
          <div style={{ padding: 20, background: "var(--bg-input)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: 16 }}><div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>Lorsque le ratio <strong style={{ color: "var(--gold)" }}>coût matières HT / CA HT</strong> dépasse <strong style={{ color: "var(--red)" }}>{RATIO_ALERT_THRESHOLD}%</strong>, une alerte est déclenchée.</div></div>
          <button className="btn btn-secondary" onClick={() => addToast("📧 Email récapitulatif simulé", "info")} style={{ width: "100%", justifyContent: "center" }}><Icon name="mail" size={16} /> Simuler envoi récapitulatif</button>
        </div>
        {latest && (<div className="card"><div className="card-header"><div className="card-title">Aperçu email</div></div>
          <div style={{ background: "var(--bg-input)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}><div><strong>De :</strong> RestoPilot</div><div><strong>Objet :</strong> Récap du {formatDateFull(latest.date)}</div></div>
            <div style={{ padding: 20, fontSize: 14, lineHeight: 1.8, color: "var(--text-secondary)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[{ label: "CA TTC", value: formatCurrency(latest.ca), color: "var(--accent)" },{ label: "CA HT", value: formatCurrency(latestHt), color: "var(--accent)" },{ label: "Objectif", value: formatCurrency(latest.objectif), color: "var(--gold)" },{ label: "Atteinte", value: formatPct(latestAtteinte), color: latestAtteinte >= 100 ? "var(--accent)" : "var(--red)" },{ label: "Achats HT", value: formatCurrency(latestTa), color: "var(--text-primary)" },{ label: "Ratio HT/HT", value: formatPct(latestRatio), color: latestRatio > RATIO_ALERT_THRESHOLD ? "var(--red)" : "var(--gold)" }].map((item) => (<div key={item.label} style={{ padding: 10, background: "var(--bg-card)", borderRadius: 6, border: "1px solid var(--border)" }}><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.label}</div><div style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "Fraunces, serif" }}>{item.value}</div></div>))}
              </div>
              {latestRatio > RATIO_ALERT_THRESHOLD && (<div style={{ padding: 12, background: "var(--red-bg)", borderRadius: 6, border: "1px solid rgba(248,113,113,0.2)", color: "var(--red)", fontSize: 13 }}>⚠️ Ratio HT/HT dépasse {RATIO_ALERT_THRESHOLD}%.</div>)}
            </div>
          </div>
        </div>)}
      </div>
      <div className="card"><div className="card-header"><div><div className="card-title">Historique alertes</div><div className="card-subtitle">{alerts.length} jour(s) en dépassement</div></div></div>
        {alerts.length > 0 ? (<div style={{ maxHeight: 600, overflowY: "auto" }}>{alerts.map((d) => { const ta = d.invoices.reduce((s, i) => s + i.montant, 0); const ht = d.ca_ht || Math.round(d.ca / 1.1); const ratio = (ta / ht) * 100; return (<div key={d.date} className="invoice-item" style={{ borderColor: "rgba(248,113,113,0.2)" }}><div className="invoice-left"><div className="invoice-icon" style={{ background: "var(--red-bg)" }}>⚠️</div><div><div style={{ fontSize: 14, fontWeight: 500 }}>{formatDateFR(d.date)}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>CA HT: {formatCurrency(ht)} | Achats: {formatCurrency(ta)}</div></div></div><span className="badge badge-red">{formatPct(ratio)}</span></div>); })}</div>) : (<div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>✅ Aucune alerte</div>)}
      </div>
    </div></div>
  );
};


const ObjectivesPage = ({ restaurant, restaurants, currentRestoId, isAdmin, onUpdateObjectives, addToast }) => {
  const resto = restaurants.find(r => r.id === currentRestoId);
  const [draft, setDraft] = useState({ ...(resto?.objectives || DEFAULT_OBJ) });
  const [oD, setOD] = useState("");
  const [oV, setOV] = useState("");
  const todayDow = getDow(today());
  const weekTotal = useMemo(() => Object.values(draft).reduce((s, v) => s + (parseFloat(v) || 0), 0), [draft]);

  useEffect(() => { if (resto) setDraft({ ...(resto.objectives || DEFAULT_OBJ) }); }, [currentRestoId, resto]);

  const saveDraft = () => {
    const p = {};
    for (let i = 0; i < 7; i++) p[i] = parseFloat(draft[i]) || 0;
    onUpdateObjectives(currentRestoId, { objectives: p });
    addToast("Objectifs enregistrés pour " + resto.name, "success");
  };
  const addOverride = () => {
    if (!oD || !oV) return;
    onUpdateObjectives(currentRestoId, { dateOverrides: { ...(resto.dateOverrides || {}), [oD]: parseFloat(oV) } });
    addToast("Exception ajoutée", "success");
    setOD(""); setOV("");
  };
  const rmOverride = (d) => {
    const n = { ...(resto.dateOverrides || {}) }; delete n[d];
    onUpdateObjectives(currentRestoId, { dateOverrides: n });
    addToast("Exception supprimée", "info");
  };
  const sortedOverrides = Object.entries(resto?.dateOverrides || {}).sort((a, b) => b[0].localeCompare(a[0]));

  if (!resto) return <div className="content-area"><p>Sélectionnez un restaurant.</p></div>;

  return (
    <div className="content-area">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}><div className="resto-dot" style={{ background: resto.color, width: 14, height: 14, borderRadius: 7 }} /><span style={{ fontSize: 16, fontWeight: 600 }}>{resto.name}</span>{!isAdmin && <span className="badge badge-gold" style={{ marginLeft: 8 }}>Lecture seule</span>}</div>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div><div className="card-title">Objectifs hebdomadaires</div><div className="card-subtitle">Objectif CA TTC par jour</div></div></div>
            <div className="obj-grid">{JOURS.map((j, i) => (
              <div key={i} className={"obj-day" + (i === todayDow ? " today" : "")}>
                <div className="obj-day-name">{JOURS_SHORT[i]}</div>
                <input className="obj-day-input" type="number" value={draft[i] || ""} onChange={(e) => setDraft({ ...draft, [i]: e.target.value })} min="0" step="100" placeholder="0" readOnly={!isAdmin} />
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>€/jour</div>
              </div>
            ))}</div>
            <div className="obj-total"><div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>Total semaine</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", fontFamily: "Fraunces, serif", letterSpacing: "-0.5px" }}>{formatCurrency(weekTotal)}</div></div>
            {isAdmin && <button className="btn btn-primary" onClick={saveDraft} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}><Icon name="check" size={16} color="var(--bg-primary)" /> Enregistrer les objectifs</button>}
          </div>
        </div>
        <div>
          {isAdmin && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><div className="card-title">Exception par date</div></div>
              <div className="form-row" style={{ marginBottom: 12 }}><div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Date</label><input className="form-input" type="date" value={oD} onChange={(e) => setOD(e.target.value)} /></div><div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Objectif (€)</label><input className="form-input" type="number" value={oV} onChange={(e) => setOV(e.target.value)} placeholder="5 000" min="0" step="100" /></div></div>
              <button className="btn btn-secondary" onClick={addOverride} style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={15} /> Ajouter</button>
            </div>
          )}
          <div className="card">
            <div className="card-header"><div><div className="card-title">Exceptions enregistrées</div><div className="card-subtitle">{sortedOverrides.length} exception(s)</div></div></div>
            {sortedOverrides.length > 0 ? sortedOverrides.map(([d, v]) => (
              <div key={d} className="ovr-item">
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>{formatDateFull(d)}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(v)}</div>
                  {isAdmin && <button className="btn-icon" onClick={() => rmOverride(d)} style={{ padding: 4, border: "none" }}><Icon name="x" size={14} color="var(--red)" /></button>}
                </div>
              </div>
            )) : <div style={{ textAlign: "center", padding: 36, color: "var(--text-muted)", fontSize: 14 }}>Aucune exception</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const RestosPage = ({ restaurants, users, currentUser, onAddResto, onDeleteResto, onAddUser, onUpdateUser, onDeleteUser, onResetFebruary, addToast }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [nr, setNr] = useState({ name: "", address: "", color: "#4ADE80" });
  const [showAddUser, setShowAddUser] = useState(false);
  const [nu, setNu] = useState({ name: "", email: "", password: "", role: "manager", restaurantId: "" });
  const [editUser, setEditUser] = useState(null);
  const [editPw, setEditPw] = useState("");
  const colors = ["#4ADE80", "#60A5FA", "#FBBF24", "#F87171", "#A78BFA", "#F9A8D4", "#FB923C", "#E879F9"];
  const confirmDelete = (email, name) => { if (email === currentUser?.email) { addToast("Impossible de supprimer votre propre compte", "error"); return; } if (window.confirm("Supprimer le compte de " + name + " (" + email + ") ?")) { onDeleteUser(email); addToast("Compte supprimé : " + name, "info"); } };
  const addR = () => { if (!nr.name) return; onAddResto(nr); addToast("Restaurant créé : " + nr.name, "success"); setNr({ name: "", address: "", color: "#4ADE80" }); setShowAdd(false); };
  const addU = () => { if (!nu.name || !nu.email || !nu.password) { addToast("Remplissez tous les champs", "error"); return; } if (nu.role === "manager" && !nu.restaurantId) { addToast("Choisissez un restaurant pour le manager", "error"); return; } onAddUser(nu); addToast((nu.role === "admin" ? "Admin" : "Manager") + " ajouté : " + nu.name, "success"); setNu({ name: "", email: "", password: "", role: "manager", restaurantId: "" }); setShowAddUser(false); };
  const savePw = () => { if (!editPw || editPw.length < 4) { addToast("Mot de passe trop court (min. 4)", "error"); return; } onUpdateUser(editUser.email, { password: editPw }); addToast("Mot de passe modifié pour " + editUser.name, "success"); setEditUser(null); setEditPw(""); };
  return (
    <div className="content-area"><div className="grid-2" style={{ alignItems: "start" }}>
      <div><div className="card"><div className="card-header"><div className="card-title">Restaurants ({restaurants.length})</div><button className="btn btn-sm btn-primary" onClick={() => setShowAdd(true)}><Icon name="plus" size={14} color="var(--bg-primary)" /> Nouveau</button></div>
        {restaurants.map(r => { const mgrs = users.filter(u => u.restaurantId === r.id); return (
          <div key={r.id} className="resto-card"><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}><div style={{ width: 14, height: 14, borderRadius: 7, background: r.color, flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{r.address || "—"}</div></div><button className="btn-icon" onClick={() => onDeleteResto(r.id)} style={{ padding: 4, border: "none" }} title="Supprimer"><Icon name="trash" size={14} color="var(--red)" /></button></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{mgrs.length > 0 ? mgrs.map(m => <span key={m.email} className="badge badge-green" style={{ fontSize: 11 }}>{m.name}</span>) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Aucun manager</span>}</div></div>
        ); })}
      </div></div>
      <div><div className="card"><div className="card-header"><div className="card-title">Utilisateurs ({users.length})</div><button className="btn btn-sm btn-primary" onClick={() => setShowAddUser(true)}><Icon name="plus" size={14} color="var(--bg-primary)" /> Nouveau</button></div>
        {users.map(u => { const r = restaurants.find(x => x.id === u.restaurantId); const isSelf = u.email === currentUser?.email; return (
          <div key={u.email} className="invoice-item"><div className="invoice-left"><div className="user-avatar" style={{ width: 38, height: 38, background: u.role === "admin" ? "var(--gold-bg)" : "var(--accent-bg-strong)" }}><Icon name="user" size={16} color={u.role === "admin" ? "var(--gold)" : "var(--accent)"} /></div><div><div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}{isSelf ? " (vous)" : ""}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div></div></div><div style={{ display: "flex", alignItems: "center", gap: 6 }}>{u.role === "admin" ? <span className="badge badge-gold">Admin</span> : r ? <span className="badge" style={{ background: r.color + "22", color: r.color, fontSize: 11 }}>{r.name}</span> : <span className="badge badge-red">Non assigné</span>}<button className="btn-icon" onClick={() => { setEditUser(u); setEditPw(""); }} style={{ padding: 4, border: "none" }} title="Modifier mdp"><Icon name="settings" size={14} /></button>{!isSelf && <button className="btn-icon" onClick={() => confirmDelete(u.email, u.name)} style={{ padding: 4, border: "none" }} title="Supprimer"><Icon name="trash" size={14} color="var(--red)" /></button>}</div></div>
        ); })}
      </div></div>
    </div>
    {showAdd && <div className="modal-overlay" onClick={() => setShowAdd(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Nouveau restaurant</div><div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={nr.name} onChange={e => setNr({ ...nr, name: e.target.value })} placeholder="Le Petit Bistrot" /></div><div className="form-group"><label className="form-label">Adresse</label><input className="form-input" value={nr.address} onChange={e => setNr({ ...nr, address: e.target.value })} placeholder="12 rue de la Paix" /></div><div className="form-group"><label className="form-label">Couleur</label><div style={{ display: "flex", gap: 8 }}>{colors.map(c => <div key={c} onClick={() => setNr({ ...nr, color: c })} style={{ width: 32, height: 32, borderRadius: 10, background: c, cursor: "pointer", border: nr.color === c ? "3px solid var(--text-primary)" : "3px solid transparent" }} />)}</div></div><div style={{ display: "flex", gap: 10, marginTop: 20 }}><button className="btn btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: "center" }}>Annuler</button><button className="btn btn-primary" onClick={addR} style={{ flex: 1, justifyContent: "center" }}>Créer</button></div></div></div>}
    <div style={{ marginTop: 24 }}><div className="card" style={{ borderColor: "rgba(248,113,113,0.2)" }}><div className="card-header"><div><div className="card-title" style={{ color: "var(--red)" }}>Zone de danger</div><div className="card-subtitle">Actions irréversibles</div></div></div><button className="btn" onClick={onResetFebruary} style={{ width: "100%", justifyContent: "center", background: "var(--red-bg)", color: "var(--red)", border: "1px solid rgba(248,113,113,0.2)" }}><Icon name="trash" size={16} color="var(--red)" /> RAZ février : CA à 0 + supprimer factures</button></div></div>
    {showAddUser && <div className="modal-overlay" onClick={() => setShowAddUser(false)}><div className="modal-content" onClick={e => e.stopPropagation()}><div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Nouvel utilisateur</div><div className="form-group"><label className="form-label">Rôle</label><div style={{ display: "flex", gap: 8 }}><button className={"btn btn-sm " + (nu.role === "admin" ? "btn-primary" : "btn-secondary")} onClick={() => setNu({ ...nu, role: "admin", restaurantId: "" })}>Admin</button><button className={"btn btn-sm " + (nu.role === "manager" ? "btn-primary" : "btn-secondary")} onClick={() => setNu({ ...nu, role: "manager" })}>Manager</button></div></div><div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={nu.name} onChange={e => setNu({ ...nu, name: e.target.value })} placeholder="Jean Dupont" /></div><div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} placeholder="jean@restaurant.fr" /></div><div className="form-group"><label className="form-label">Mot de passe</label><input className="form-input" value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} placeholder="Min. 4 caractères" /></div>{nu.role === "manager" && <div className="form-group"><label className="form-label">Restaurant</label><select className="form-select" value={nu.restaurantId} onChange={e => setNu({ ...nu, restaurantId: e.target.value })}><option value="">— Choisir —</option>{restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>}<div style={{ display: "flex", gap: 10, marginTop: 20 }}><button className="btn btn-secondary" onClick={() => setShowAddUser(false)} style={{ flex: 1, justifyContent: "center" }}>Annuler</button><button className="btn btn-primary" onClick={addU} style={{ flex: 1, justifyContent: "center" }}>Créer</button></div></div></div>}
    {editUser && <div className="modal-overlay" onClick={() => setEditUser(null)}><div className="modal-content" onClick={e => e.stopPropagation()}><div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Modifier le mot de passe</div><div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>{editUser.name} ({editUser.email})</div><div className="form-group"><label className="form-label">Nouveau mot de passe</label><input className="form-input" type="text" value={editPw} onChange={e => setEditPw(e.target.value)} placeholder="Nouveau mot de passe" autoFocus /></div><div style={{ display: "flex", gap: 10, marginTop: 16 }}><button className="btn btn-secondary" onClick={() => setEditUser(null)} style={{ flex: 1, justifyContent: "center" }}>Annuler</button><button className="btn btn-primary" onClick={savePw} style={{ flex: 1, justifyContent: "center" }}><Icon name="check" size={15} color="var(--bg-primary)" /> Enregistrer</button></div></div></div>}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem("rp_session");
      const exp = localStorage.getItem("rp_session_expiry");
      if (s && exp && Date.now() < parseInt(exp)) return JSON.parse(s);
      localStorage.removeItem("rp_session");
      localStorage.removeItem("rp_session_expiry");
    } catch(e) {}
    return null;
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("rp_theme") || "dark"; } catch(e) { return "dark"; }
  });
  const [page, setPage] = useState("dashboard");
  const [restaurants, setRestaurants] = useState(DEMO_RESTAURANTS);
  const [allUsers, setAllUsers] = useState(() => {
    try { const s = localStorage.getItem("rp_users"); if (s) return JSON.parse(s); } catch(e) {}
    return DEMO_USERS;
  });
  useEffect(() => { try { localStorage.setItem("rp_users", JSON.stringify(allUsers)); } catch(e) {} }, [allUsers]);
  const [restoData, setRestoData] = useState(() => {
    const rd = {};
    DEMO_RESTAURANTS.forEach(r => { rd[r.id] = generateDemoData(r.objectives); });
    return rd;
  });
  const [currentRestoId, setCurrentRestoId] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") setCurrentRestoId(restaurants[0]?.id || null);
    else setCurrentRestoId(user.restaurantId);
  }, [user]);

  const isAdmin = user?.role === "admin";
  const currentResto = restaurants.find(r => r.id === currentRestoId);
  const currentData = restoData[currentRestoId] || [];
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); try { localStorage.setItem("rp_theme", theme); } catch(e) {} }, [theme]);
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const handleLogout = () => { try { localStorage.removeItem("rp_session"); localStorage.removeItem("rp_session_expiry"); } catch(e) {} setUser(null); setCurrentRestoId(null); setPage("dashboard"); };
  const addToast = (message, type = "info") => { const id = Date.now(); setToasts((t) => [...t, { id, message, type }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000); };

  const setCurrentData = (newData) => { if (currentRestoId) setRestoData(prev => ({ ...prev, [currentRestoId]: newData })); };
  const handleUpdateObjectives = (restoId, updates) => { setRestaurants(rs => rs.map(r => r.id === restoId ? { ...r, ...updates } : r)); };
  const handleAddResto = (nr) => { const id = "r" + Date.now(); const newR = { id, name: nr.name, address: nr.address, color: nr.color, objectives: { ...DEFAULT_OBJ }, dateOverrides: {} }; setRestaurants(rs => [...rs, newR]); setRestoData(prev => ({ ...prev, [id]: [] })); };
  const handleDeleteResto = (id) => { if (restaurants.length <= 1) { addToast("Impossible : il faut au moins 1 restaurant", "error"); return; } if (!window.confirm("Supprimer ce restaurant et toutes ses données ?")) return; setRestaurants(rs => rs.filter(r => r.id !== id)); setRestoData(prev => { const n = { ...prev }; delete n[id]; return n; }); setAllUsers(us => us.map(u => u.restaurantId === id ? { ...u, restaurantId: null } : u)); if (currentRestoId === id) setCurrentRestoId(restaurants.find(r => r.id !== id)?.id || null); addToast("Restaurant supprimé", "info"); };
  const handleAddUser = (nu) => { if (allUsers.find(u => u.email === nu.email)) { addToast("Cet email existe déjà", "error"); return; } setAllUsers(us => [...us, { email: nu.email, password: nu.password, name: nu.name, role: nu.role || "manager", restaurantId: nu.restaurantId || null }]); };
  const handleUpdateUser = (email, updates) => { setAllUsers(us => us.map(u => u.email === email ? { ...u, ...updates } : u)); };
  const handleDeleteUser = (email) => { setAllUsers(us => us.filter(u => u.email !== email)); };
  const resetFebruaryData = () => { if (!window.confirm("⚠️ Remettre à zéro les CA et supprimer toutes les factures de février 2025 ?\n\nCette action est irréversible.")) return; setRestoData(prev => { const n = {}; Object.keys(prev).forEach(rid => { n[rid] = prev[rid].map(d => { if (d.date.startsWith("2025-02")) return { ...d, ca: 0, ca_ht: 0, invoices: [] }; return d; }); }); return n; }); addToast("Données de février remises à zéro", "info"); };

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: "dashboard" },
    { id: "input", label: "Saisie du jour", icon: "input" },
    { id: "history", label: "Historique", icon: "history" },
    { id: "alerts", label: "Alertes & Emails", icon: "alert" },
    { id: "objectives", label: "Objectifs CA", icon: "target" },
    ...(isAdmin ? [{ id: "restos", label: "Restaurants", icon: "settings" }] : []),
  ];
  if (!user) return <><style>{CSS}</style><LoginPage onLogin={setUser} users={allUsers} /></>;
  const pageTitles = { dashboard: "Tableau de bord", input: "Saisie quotidienne", history: "Historique", alerts: "Alertes & Emails", objectives: "Objectifs CA", restos: "Restaurants & Managers" };
  return (
    <><style>{CSS}</style><ToastContainer toasts={toasts} />
    <div className="app-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={"sidebar " + (sidebarOpen ? "open" : "")}>
        <div className="sidebar-header"><div className="sidebar-logo">RestoPilot</div><div className="sidebar-subtitle">Gestion & Performance</div></div>
        <nav className="sidebar-nav">{navItems.map((item) => (<div key={item.id} className={"nav-item " + (page === item.id ? "active" : "")} onClick={() => { setPage(item.id); setSidebarOpen(false); }}><Icon name={item.icon} size={18} />{item.label}</div>))}</nav>
        <div className="sidebar-footer">{currentResto && <div style={{ padding: "8px 10px", marginBottom: 8, borderRadius: "var(--radius-sm)", background: "var(--bg-input)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", border: "1px solid var(--border)" }}><div style={{ width: 8, height: 8, borderRadius: 4, background: currentResto.color }} /><span style={{ fontWeight: 600 }}>{currentResto.name}</span></div>}<button className="theme-toggle" onClick={toggleTheme}>{theme === "dark" ? "☀️" : "🌙"}<span>{theme === "dark" ? "Thème clair" : "Thème sombre"}</span><div className={"theme-switch" + (theme === "light" ? " on" : "")} /></button><div className="user-badge"><div className="user-avatar"><Icon name="user" size={16} /></div><div className="user-info"><div className="user-name">{user.name}</div><div className="user-role">{user.role === "admin" ? "Administrateur" : "Manager"}</div></div><button className="btn-icon" onClick={handleLogout} title="Déconnexion" style={{ border: "none", padding: 4 }}><Icon name="logout" size={16} color="var(--text-muted)" /></button></div></div>
      </aside>
      <main className="main-content">
        <div className="top-bar"><div className="top-bar-left"><button className="burger" onClick={() => setSidebarOpen(true)}><Icon name="menu" size={22} /></button><div><div className="page-title">{pageTitles[page]}</div><div className="page-date">{formatDateFull(today())}</div></div></div><div className="top-bar-right"><RestoPicker restaurants={restaurants} current={currentRestoId} setCurrent={setCurrentRestoId} isAdmin={isAdmin} /><button className="btn btn-sm btn-primary" onClick={() => setPage("input")}><Icon name="plus" size={14} color="var(--bg-primary)" /> Saisie</button></div></div>
        {page === "dashboard" && <DashboardPage data={currentData} />}
        {page === "input" && <InputPage data={currentData} setData={setCurrentData} addToast={addToast} isAdmin={isAdmin} />}
        {page === "history" && <HistoryPage data={currentData} />}
        {page === "alerts" && <AlertsPage data={currentData} addToast={addToast} />}
        {page === "objectives" && <ObjectivesPage restaurants={restaurants} currentRestoId={currentRestoId} isAdmin={isAdmin} onUpdateObjectives={handleUpdateObjectives} addToast={addToast} />}
        {isAdmin && page === "restos" && <RestosPage restaurants={restaurants} users={allUsers} currentUser={user} onAddResto={handleAddResto} onDeleteResto={handleDeleteResto} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onResetFebruary={resetFebruaryData} addToast={addToast} />}
      </main>
    </div></>
  );
}
