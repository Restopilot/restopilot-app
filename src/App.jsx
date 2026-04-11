import { useState, useEffect, useMemo, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend, PieChart, Pie, Cell, ComposedChart, ReferenceLine } from "recharts";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://yhvbnlgowccixqslijia.supabase.co", "sb_publishable_rURgUoNVrGxQm4e6OjrxsA_E5Skv2Tl");

const CATEGORIES = ["Viande", "Poisson", "Légumes", "Fruits", "Boissons", "Produits laitiers", "Épicerie", "Boulangerie", "Autre"];
const RATIO_ALERT_THRESHOLD = 28;

const JOURS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const JOURS_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const DEFAULT_OBJ = {0:2800,1:3000,2:3200,3:3500,4:4200,5:4800,6:2500};
const getDow = (ds) => { const d = new Date(ds + "T00:00:00"); return (d.getDay() + 6) % 7; };



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
    truck: <><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
  };
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[name]}</svg>);
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

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
  body, #root { font-family: 'Inter', sans-serif; background: var(--bg-primary); color: var(--text-primary); min-height: 100vh; -webkit-font-smoothing: antialiased; }
  .app-container { display: flex; min-height: 100vh; }
  .sidebar { width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; transition: transform 0.3s ease; }
  .sidebar-header { padding: 24px 20px; border-bottom: 1px solid var(--border); }
  .sidebar-logo { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 700; color: var(--accent); letter-spacing: -0.5px; }
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
  .page-title { font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 600; }
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
  .kpi-value { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 700; line-height: 1.1; }
  .kpi-value.green { color: var(--accent); }
  .kpi-value.gold { color: var(--gold); }
  .kpi-value.red { color: var(--red); }
  .kpi-value.blue { color: var(--blue); }
  .kpi-value.purple { color: var(--purple); }
  .kpi-sub { font-size: 12px; color: var(--text-secondary); margin-top: 6px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .form-input, .form-select { width: 100%; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; font-family: 'Inter', sans-serif; transition: border-color var(--transition); outline: none; }
  .form-input:focus, .form-select:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text-muted); }
  .form-select { appearance: none; cursor: pointer; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: all var(--transition); border: none; }
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
  .login-brand h1 { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
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
    --bg-primary: #F4F6F9;
    --bg-secondary: #FFFFFF;
    --bg-card: #FFFFFF;
    --bg-card-hover: #F8FAFB;
    --bg-input: #FFFFFF;
    --border: #E2E8F0;
    --border-light: #CBD5E1;
    --text-primary: #1B2A4A;
    --text-secondary: #475569;
    --text-muted: #94A3B8;
    --accent: #1A8C5B;
    --accent-dim: #15704A;
    --accent-bg: rgba(26,140,91,0.07);
    --accent-bg-strong: rgba(26,140,91,0.12);
    --gold: #D9536B;
    --gold-dim: #C44860;
    --gold-bg: rgba(217,83,107,0.07);
    --red: #D9536B;
    --red-dim: #C44860;
    --red-bg: rgba(217,83,107,0.06);
    --blue: #1B2A4A;
    --blue-bg: rgba(27,42,74,0.06);
    --purple: #1B2A4A;
    --purple-bg: rgba(27,42,74,0.06);
    --radius-sm: 6px;
    --radius: 8px;
    --radius-lg: 10px;
    --shadow: 0 1px 3px rgba(27,42,74,0.06);
    --shadow-lg: 0 4px 20px rgba(27,42,74,0.10);
  }
  [data-theme="light"] .sidebar {
    background: #1B2A4A;
    border-right: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  [data-theme="light"] .sidebar-logo { color: #FFFFFF; font-weight: 700; }
  [data-theme="light"] .sidebar-subtitle { color: rgba(255,255,255,0.5); }
  [data-theme="light"] .sidebar-header { border-bottom-color: rgba(255,255,255,0.08); }
  [data-theme="light"] .sidebar-footer { border-top-color: rgba(255,255,255,0.08); }
  [data-theme="light"] .nav-item { border-radius: 6px; color: rgba(255,255,255,0.75); }
  [data-theme="light"] .nav-item svg { stroke: rgba(255,255,255,0.55); }
  [data-theme="light"] .nav-item:hover { background: rgba(255,255,255,0.08); color: #FFFFFF; }
  [data-theme="light"] .nav-item:hover svg { stroke: #FFFFFF; }
  [data-theme="light"] .nav-item.active { background: #FFFFFF; color: #1B2A4A; border-color: transparent; }
  [data-theme="light"] .nav-item.active svg { stroke: #1B2A4A; }
  [data-theme="light"] .user-badge { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; }
  [data-theme="light"] .user-avatar { background: rgba(255,255,255,0.15); color: #FFFFFF; }
  [data-theme="light"] .user-name { color: #FFFFFF; }
  [data-theme="light"] .user-role { color: rgba(255,255,255,0.5); }
  [data-theme="light"] .top-bar {
    background: #F4F6F9;
    border-bottom: 1px solid #E2E8F0;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  [data-theme="light"] .page-title { color: #1B2A4A; }
  [data-theme="light"] .page-date { color: #94A3B8; }
  [data-theme="light"] .burger { color: #1B2A4A; }
  [data-theme="light"] .top-bar-right .btn-icon { color: #475569; border-color: #E2E8F0; }
  [data-theme="light"] .top-bar-right .btn-icon:hover { color: #1B2A4A; border-color: #CBD5E1; }
  [data-theme="light"] .theme-toggle { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; color: #475569; }
  [data-theme="light"] .theme-toggle:hover { background: #F1F5F9; color: #1B2A4A; }
  [data-theme="light"] .resto-picker-btn { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; color: #1B2A4A; }
  [data-theme="light"] .resto-picker-btn:hover { background: #F1F5F9; border-color: #CBD5E1; }
  [data-theme="light"] .resto-dropdown { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; box-shadow: 0 8px 30px rgba(27,42,74,0.15); }
  [data-theme="light"] .kpi-card { background: #fff; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(27,42,74,0.04); border-radius: 8px; }
  [data-theme="light"] .kpi-card:hover { border-color: #CBD5E1; box-shadow: 0 2px 8px rgba(27,42,74,0.07); transform: none; }
  [data-theme="light"] .kpi-card::before { border-radius: 8px 8px 0 0; }
  [data-theme="light"] .kpi-value.green { color: #1A8C5B; }
  [data-theme="light"] .kpi-value.blue { color: #1B2A4A; }
  [data-theme="light"] .kpi-value.gold { color: #D9536B; }
  [data-theme="light"] .kpi-value.red { color: #D9536B; }
  [data-theme="light"] .kpi-value.purple { color: #1B2A4A; }
  [data-theme="light"] .card { background: #fff; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(27,42,74,0.04); border-radius: 8px; }
  [data-theme="light"] .card-title { color: #1B2A4A; }
  [data-theme="light"] .form-input, [data-theme="light"] .form-select { background: #fff; border: 1px solid #CBD5E1; border-radius: 6px; }
  [data-theme="light"] .form-input:focus, [data-theme="light"] .form-select:focus { border-color: #1B2A4A; background: #fff; box-shadow: 0 0 0 2px rgba(27,42,74,0.15); }
  [data-theme="light"] .btn { border-radius: 6px; }
  [data-theme="light"] .btn-primary { background: #1B2A4A; color: #fff; }
  [data-theme="light"] .btn-primary:hover { background: #2C3E5A; }
  [data-theme="light"] .btn-secondary { background: #fff; border: 1px solid #CBD5E1; color: #1B2A4A; }
  [data-theme="light"] .btn-secondary:hover { background: #F1F5F9; border-color: #94A3B8; }
  [data-theme="light"] .toast { border-radius: 8px; }
  [data-theme="light"] .toast.success { background: #1A8C5B; color: #fff; border: none; }
  [data-theme="light"] .toast.error { background: #D9536B; color: #fff; border: none; }
  [data-theme="light"] .toast.info { background: #1B2A4A; color: #fff; border: none; }
  [data-theme="light"] .login-page { background: #1B2A4A; }
  [data-theme="light"] .login-page::before { background: radial-gradient(circle at 60% 30%, rgba(27,42,74,0.15), transparent 60%); }
  [data-theme="light"] .login-page::after { background: radial-gradient(circle at 30% 80%, rgba(26,140,91,0.08), transparent 60%); }
  [data-theme="light"] .login-card { background: #fff; border: none; box-shadow: 0 8px 40px rgba(0,0,0,0.2); border-radius: 10px; }
  [data-theme="light"] .login-brand h1 { color: #1B2A4A; }
  [data-theme="light"] .custom-tooltip { background: #fff !important; border: 1px solid #E2E8F0 !important; border-radius: 6px !important; box-shadow: 0 4px 12px rgba(27,42,74,0.10) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
  [data-theme="light"] .recharts-text { fill: #94A3B8 !important; }
  [data-theme="light"] .recharts-cartesian-grid-horizontal line,
  [data-theme="light"] .recharts-cartesian-grid-vertical line { stroke: #F1F5F9 !important; }
  [data-theme="light"] table th { color: #94A3B8; border-bottom: 1px solid #E2E8F0; }
  [data-theme="light"] table td { border-bottom: 1px solid #F1F5F9; color: #1B2A4A; }
  [data-theme="light"] tr:hover td { background: #F8FAFB; }
  [data-theme="light"] .invoice-item { border: 1px solid #E2E8F0; border-radius: 8px; }
  [data-theme="light"] .invoice-item:hover { background: #F8FAFB; border-color: #CBD5E1; }
  [data-theme="light"] .badge { border-radius: 4px; }
  [data-theme="light"] .badge-green { background: rgba(26,140,91,0.10); color: #1A8C5B; }
  [data-theme="light"] .badge-gold { background: rgba(217,83,107,0.10); color: #D9536B; }
  [data-theme="light"] .badge-red { background: rgba(217,83,107,0.08); color: #D9536B; }
  [data-theme="light"] .alert-banner.warning { background: rgba(217,83,107,0.05); border-color: rgba(217,83,107,0.15); }
  [data-theme="light"] ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
  [data-theme="light"] .remember-row { color: #475569; }

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
    font-family: 'Inter', sans-serif;
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
  .resto-picker-btn { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; transition: all var(--transition); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: var(--text-primary); }
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
  .obj-day-input { width: 100%; text-align: center; padding: 8px 4px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif; color: var(--text-primary); outline: none; transition: all var(--transition); }
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

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.from("app_users").select("*").eq("email", email).eq("password", password).single();
    setLoading(false);
    if (err || !data) { setError("Identifiants incorrects"); return; }
    const user = { id: data.id, email: data.email, name: data.name, role: data.role, restaurantId: data.restaurant_id };
    if (remember) { try { localStorage.setItem("rp_session", JSON.stringify(user)); localStorage.setItem("rp_session_expiry", String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch(e) {} }
    onLogin(user);
  };
  return (
    <div className="login-page"><div className="login-card"><div className="login-brand"><h1>RestoPilot</h1><p>Gestion & Performance</p></div>
    <form onSubmit={handleSubmit}>
      <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="Votre email" /></div>
      <div className="form-group"><label className="form-label">Mot de passe</label><input className="form-input" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="••••••••" /></div>
      <label className="remember-row"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Rester connecté</label>
      {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8, padding: "12px 20px" }} type="submit" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</button>
    </form>
    </div></div>
  );
};

const exportCSV = (data, restoName) => {
  const BOM = "\uFEFF";
  const headers = ["Date","CA TTC","CA HT","Objectif","Atteinte (%)","Achats HT","Ratio (%)","Factures"];
  const rows = data.map(d => {
    const ht = d.ca_ht || Math.round(d.ca / 1.1);
    const ta = d.invoices.reduce((s,i) => s + i.montant, 0);
    const att = d.objectif > 0 ? ((d.ca / d.objectif) * 100).toFixed(1) : "0";
    const rat = ht > 0 ? ((ta / ht) * 100).toFixed(1) : "0";
    const invStr = d.invoices.map(i => i.fournisseur + " " + i.montant + "€ (" + i.categorie + ")").join(" | ");
    return [d.date, d.ca, ht, d.objectif, att, ta, rat, invStr].join(";");
  });
  const csv = BOM + headers.join(";") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = (restoName || "restopilot") + "_export.csv"; a.click(); URL.revokeObjectURL(url);
};

const exportPDF = (data, restoName, periodLabel) => {
  const ht = data.reduce((s,d) => s + (d.ca_ht || Math.round(d.ca / 1.1)), 0);
  const ca = data.reduce((s,d) => s + d.ca, 0);
  const ta = data.reduce((s,d) => s + d.invoices.reduce((a,i) => a + i.montant, 0), 0);
  const rat = ht > 0 ? ((ta / ht) * 100).toFixed(1) : "0";
  const fc = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
  const w = window.open("", "_blank");
  w.document.write("<html><head><title>Export " + restoName + "</title><style>body{font-family:Inter,system-ui,sans-serif;padding:40px;color:#333}h1{font-size:22px;margin-bottom:4px}h2{font-size:14px;color:#666;margin-bottom:24px;font-weight:400}.summary{display:flex;gap:20px;margin-bottom:32px}.s-box{flex:1;padding:16px;border:1px solid #ddd;border-radius:8px}.s-label{font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px}.s-val{font-size:20px;font-weight:700;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;padding:8px 10px;border-bottom:2px solid #ddd;font-size:11px;text-transform:uppercase;color:#999}td{padding:8px 10px;border-bottom:1px solid #eee}.r{text-align:right}@media print{body{padding:20px}}</style></head><body>");
  w.document.write("<h1>" + restoName + "</h1><h2>" + periodLabel + " — " + data.length + " jours</h2>");
  w.document.write('<div class="summary"><div class="s-box"><div class="s-label">CA TTC</div><div class="s-val">' + fc(ca) + '</div></div><div class="s-box"><div class="s-label">CA HT</div><div class="s-val">' + fc(ht) + '</div></div><div class="s-box"><div class="s-label">Achats HT</div><div class="s-val">' + fc(ta) + '</div></div><div class="s-box"><div class="s-label">Ratio</div><div class="s-val">' + rat + '%</div></div></div>');
  w.document.write('<table><thead><tr><th>Date</th><th class="r">CA TTC</th><th class="r">CA HT</th><th class="r">Objectif</th><th class="r">Atteinte</th><th class="r">Achats HT</th><th class="r">Ratio</th></tr></thead><tbody>');
  data.forEach(d => {
    const dht = d.ca_ht || Math.round(d.ca / 1.1);
    const dta = d.invoices.reduce((s,i) => s + i.montant, 0);
    const datt = d.objectif > 0 ? ((d.ca / d.objectif) * 100).toFixed(1) + "%" : "-";
    const drat = dht > 0 ? ((dta / dht) * 100).toFixed(1) + "%" : "-";
    w.document.write('<tr><td>' + d.date + '</td><td class="r">' + fc(d.ca) + '</td><td class="r">' + fc(dht) + '</td><td class="r">' + fc(d.objectif) + '</td><td class="r">' + datt + '</td><td class="r">' + fc(dta) + '</td><td class="r">' + drat + '</td></tr>');
  });
  w.document.write("</tbody></table></body></html>");
  w.document.close();
  setTimeout(() => w.print(), 300);
};

const DashboardPage = ({ data, restoName, restoObjectives, restoOverrides, currentRestoId }) => {
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [zeltyLive, setZeltyLive] = useState(null);

  const [inventories, setInventories] = useState([]);
  const [comboHours, setComboHours] = useState(null);
  const [comboHoursPeriod, setComboHoursPeriod] = useState(null);

  useEffect(() => {
    setZeltyLive(null);
    fetch("/api/zelty-ca?date=" + today() + "&resto_id=" + (currentRestoId || ""))
      .then(r => r.ok ? r.json() : null)
      .then(z => { if (z && z.ca_ttc > 0) setZeltyLive(z); })
      .catch(() => {});
  }, [currentRestoId]);

  useEffect(() => {
    if (!currentRestoId) return;
    supabase.from("inventory").select("*").eq("restaurant_id", currentRestoId).order("date", { ascending: true })
      .then(({ data: rows }) => { if (rows) setInventories(rows); });
  }, [currentRestoId]);

  useEffect(() => {
    const COMBO_RESTOS = ["r1772490949804", "r1772494496631", "r1775159807169"];
    if (!COMBO_RESTOS.includes(currentRestoId)) { setComboHours(null); setComboHoursPeriod(null); return; }
    // KPI : heures J-1
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    fetch("/api/combo-hours?date=" + yStr + "&resto_id=" + currentRestoId)
      .then(r => r.ok ? r.json() : null)
      .then(c => { if (c && c.total_hours !== null) setComboHours({ ...c, date: yStr }); })
      .catch(() => {});
  }, [currentRestoId]);



  const periodLabel = period === "week" ? "Semaine en cours" : period === "month" ? "Mois en cours" : period === "quarter" ? "Trimestre en cours" : period === "year" ? "Année en cours" : "Période personnalisée";

  const filteredData = useMemo(() => {
    const now = new Date();
    if (period === "week") {
      const dow = (now.getDay() + 6) % 7;
      const ws = new Date(now); ws.setDate(now.getDate() - dow); ws.setHours(0,0,0,0);
      return data.filter(d => new Date(d.date + "T00:00:00") >= ws);
    }
    if (period === "month") {
      return data.filter(d => { const dt = new Date(d.date + "T00:00:00"); return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth(); });
    }
    if (period === "year") {
      return data.filter(d => { const dt = new Date(d.date + "T00:00:00"); return dt.getFullYear() === now.getFullYear(); });
    }
    if (period === "custom" && customFrom && customTo) {
      return data.filter(d => d.date >= customFrom && d.date <= customTo);
    }
    return data.filter(d => { const dt = new Date(d.date + "T00:00:00"); return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth(); });
  }, [data, period, customFrom, customTo]);

  useEffect(() => {
    const COMBO_RESTOS = ["r1772490949804", "r1772494496631", "r1775159807169"];
    if (!COMBO_RESTOS.includes(currentRestoId) || filteredData.length === 0) { setComboHoursPeriod(null); return; }
    const fromDate = filteredData[0].date;
    const toDate = filteredData[filteredData.length - 1].date;
    fetch("/api/combo-hours?from=" + fromDate + "&to=" + toDate + "&resto_id=" + currentRestoId)
      .then(r => r.ok ? r.json() : null)
      .then(c => { if (c && c.total_hours !== null) setComboHoursPeriod(c); })
      .catch(() => {});
  }, [currentRestoId, filteredData]);

  const todayData = data.find(d => d.date === today());
  const liveCa = zeltyLive ? zeltyLive.ca_ttc : 0;
  const liveCaHt = zeltyLive ? zeltyLive.ca_ht : 0;
  const todayObj = restoOverrides?.[today()] ?? restoObjectives?.[getDow(today())] ?? 0;
  const latest = todayData || { date: today(), ca: liveCa, ca_ht: liveCaHt, objectif: todayObj, invoices: [] };

  const stats = useMemo(() => {
    const totalAchats = latest.invoices.reduce((s, i) => s + i.montant, 0);
    const ht = latest.ca_ht || Math.round(latest.ca / 1.1);
    const ratio = ht > 0 ? (totalAchats / ht) * 100 : 0;
    const ecart = latest.ca - latest.objectif;
    const atteinte = latest.objectif > 0 ? (latest.ca / latest.objectif) * 100 : 0;
    const caP = filteredData.reduce((s, d) => s + d.ca, 0);
    const caPHt = filteredData.reduce((s, d) => s + (d.ca_ht || Math.round(d.ca / 1.1)), 0);
    const taP = filteredData.reduce((s, d) => s + d.invoices.reduce((a, i) => a + i.montant, 0), 0);
    const ratioP = caPHt > 0 ? (taP / caPHt) * 100 : 0;
    const avgAtteinte = filteredData.length > 0 ? filteredData.reduce((s, d) => s + (d.objectif > 0 ? (d.ca / d.objectif) * 100 : 0), 0) / filteredData.length : 0;
    // Calcul ratio corrigé avec inventaires
    let ratioCorrige = null;
    if (inventories.length >= 2 && filteredData.length > 0) {
      const dateDebut = filteredData[0].date;
      const dateFin = filteredData[filteredData.length - 1].date;
      const invDebut = [...inventories].reverse().find(i => i.date <= dateDebut);
      const invFin = [...inventories].reverse().find(i => i.date <= dateFin);
      if (invDebut && invFin && invFin.date !== invDebut.date) {
        const consommation = taP + invDebut.valeur_stock - invFin.valeur_stock;
        ratioCorrige = caPHt > 0 ? (consommation / caPHt) * 100 : 0;
      }
    }
    // Ratio production horaire J-1 — cherche dans data, sinon utilise CA HT moyen de la période
    const ratioProdHoraire = comboHours && comboHours.total_hours > 0
      ? (() => {
          const d = data.find(x => x.date === comboHours.date);
          if (d && (d.ca_ht || d.ca)) return (d.ca_ht || Math.round(d.ca / 1.1)) / comboHours.total_hours;
          // Fallback : CA HT moyen journalier de la période
          if (filteredData.length > 0 && caPHt > 0) return (caPHt / filteredData.length) / comboHours.total_hours;
          return null;
        })()
      : null;
    // Ratio production horaire période
    const ratioProdHorairePeriode = comboHoursPeriod && comboHoursPeriod.total_hours > 0 && caPHt > 0
      ? caPHt / comboHoursPeriod.total_hours : null;
    return { ca: latest.ca, ca_ht: ht, objectif: latest.objectif, totalAchats, ratio, ecart, atteinte, caP, caPHt, taP, ratioP, avgAtteinte, ratioCorrige, ratioProdHoraire, ratioProdHorairePeriode };
  }, [data, latest, filteredData, comboHours, comboHoursPeriod]);

  const chartData = useMemo(() => filteredData.slice(-30).map(d => {
    const ta = d.invoices.reduce((s, i) => s + i.montant, 0);
    const dht = d.ca_ht || Math.round(d.ca / 1.1);
    return { date: formatDateFR(d.date), "CA TTC": d.ca, "CA HT": dht, Objectif: d.objectif, Achats: ta, "Ratio (%)": dht > 0 ? parseFloat(((ta / dht) * 100).toFixed(1)) : 0 };
  }), [filteredData]);

  const monthlyRatioData = useMemo(() => {
    const months = {};
    data.forEach(d => {
      const m = d.date.substring(0, 7);
      if (!months[m]) months[m] = { ht: 0, ta: 0 };
      months[m].ht += d.ca_ht || Math.round(d.ca / 1.1);
      months[m].ta += d.invoices.reduce((s, i) => s + i.montant, 0);
    });
    return Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([m, v]) => {
      const [y, mo] = m.split("-");
      const label = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"][parseInt(mo) - 1] + " " + y.slice(2);
      return { mois: label, "Ratio (%)": v.ht > 0 ? parseFloat(((v.ta / v.ht) * 100).toFixed(1)) : 0, "CA HT": v.ht, "Achats HT": v.ta };
    });
  }, [data]);

  const categoryData = useMemo(() => {
    const cats = {};
    filteredData.forEach(d => d.invoices.forEach(i => { cats[i.categorie] = (cats[i.categorie] || 0) + i.montant; }));
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const periodBtnStyle = (p) => ({
    padding: "6px 14px", borderRadius: 6, border: period === p ? "none" : "1px solid var(--border)",
    background: period === p ? "var(--accent)" : "var(--bg-card)", color: period === p ? "#fff" : "var(--text-secondary)",
    fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s"
  });

  return (
    <div className="content-area">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={periodBtnStyle("week")} onClick={() => setPeriod("week")}>Semaine</button>
          <button style={periodBtnStyle("month")} onClick={() => setPeriod("month")}>Mois</button>
          <button style={periodBtnStyle("year")} onClick={() => setPeriod("year")}>Année</button>
          <button style={periodBtnStyle("custom")} onClick={() => setPeriod("custom")}>Personnalisé</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(filteredData, restoName)}><Icon name="download" size={14} /> CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportPDF(filteredData, restoName, periodLabel)}><Icon name="download" size={14} /> PDF</button>
        </div>
      </div>
      {period === "custom" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <input type="date" className="form-input" style={{ width: "auto" }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <input type="date" className="form-input" style={{ width: "auto" }} value={customTo} onChange={e => setCustomTo(e.target.value)} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{filteredData.length} jours</span>
        </div>
      )}
      {stats.ratioP > RATIO_ALERT_THRESHOLD && (<div className="alert-banner warning"><Icon name="alert" size={20} /><div><strong>Ratio matières trop élevé !</strong><div style={{ fontSize: 13, marginTop: 2 }}>Ratio période : {formatPct(stats.ratioP)} — seuil de {RATIO_ALERT_THRESHOLD}% dépassé. Achats HT : {formatCurrency(stats.taP)} / CA HT : {formatCurrency(stats.caPHt)}.</div></div></div>)}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi-card green"><div className="kpi-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>CA du jour (TTC){zeltyLive && <span style={{ fontSize: 9, background: "var(--accent)", color: "#fff", padding: "1px 6px", borderRadius: 4, textTransform: "none", letterSpacing: 0 }}>Zelty live</span>}</div><div className="kpi-value green">{formatCurrency(zeltyLive ? zeltyLive.ca_ttc : stats.ca)}</div><div className="kpi-sub">HT : {formatCurrency(zeltyLive ? zeltyLive.ca_ht : stats.ca_ht)} · Obj : {formatCurrency(stats.objectif)}</div></div>
        <div className="kpi-card blue"><div className="kpi-label">CA période (TTC)</div><div className="kpi-value blue">{formatCurrency(stats.caP)}</div><div className="kpi-sub">HT : {formatCurrency(stats.caPHt)} · {filteredData.length} jours</div></div>
        <div className={"kpi-card " + ((() => { const e = (zeltyLive ? zeltyLive.ca_ttc : stats.ca) - stats.objectif; return e >= 0 ? "green" : "red"; })())}><div className="kpi-label">Écart objectif du jour</div><div className={"kpi-value " + ((() => { const e = (zeltyLive ? zeltyLive.ca_ttc : stats.ca) - stats.objectif; return e >= 0 ? "green" : "red"; })())}>{(() => { const e = (zeltyLive ? zeltyLive.ca_ttc : stats.ca) - stats.objectif; return (e >= 0 ? "+" : "") + formatCurrency(e); })()}</div><div className="kpi-sub">{(() => { const e = (zeltyLive ? zeltyLive.ca_ttc : stats.ca) - stats.objectif; return e >= 0 ? "🚀 Au-dessus de l'objectif" : "⚠️ En-dessous de l'objectif"; })()}</div></div>
        <div className={"kpi-card " + ((stats.ratioCorrige ?? stats.ratioP) > RATIO_ALERT_THRESHOLD ? "red" : "gold")}><div className="kpi-label">Ratio matières période</div><div className={"kpi-value " + ((stats.ratioCorrige ?? stats.ratioP) > RATIO_ALERT_THRESHOLD ? "red" : "gold")}>{formatPct(stats.ratioCorrige ?? stats.ratioP)}</div><div className="kpi-sub">{stats.ratioCorrige !== null ? <span style={{ color: "var(--accent)", fontWeight: 600 }}>✓ Corrigé stock</span> : "Brut"} · Achats : {formatCurrency(stats.taP)}{stats.ratioCorrige !== null && <span> · Brut : {formatPct(stats.ratioP)}</span>}</div></div>
        <div className="kpi-card purple"><div className="kpi-label">Achats HT période</div><div className="kpi-value purple">{formatCurrency(stats.taP)}</div><div className="kpi-sub">vs CA HT : {formatCurrency(stats.caPHt)}</div></div>
        {(stats.ratioProdHoraire !== null || stats.ratioProdHorairePeriode !== null) ? (<div className="kpi-card blue"><div className="kpi-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>Prod. horaire {stats.ratioProdHorairePeriode !== null ? "période" : "J-1"}<span style={{ fontSize: 9, background: "var(--blue)", color: "#fff", padding: "1px 6px", borderRadius: 4 }}>Combo</span></div><div className="kpi-value blue">{formatCurrency(stats.ratioProdHorairePeriode ?? stats.ratioProdHoraire)}<span style={{ fontSize: 14, fontWeight: 400 }}>/h</span></div><div className="kpi-sub">{stats.ratioProdHorairePeriode !== null ? `${comboHoursPeriod?.total_hours}h · CA HT ${formatCurrency(stats.caPHt)}` : `J-1 · ${comboHours?.total_hours}h travaillées`}</div></div>) : <div />}
      </div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><div><div className="card-title">Évolution CA vs Objectif</div><div className="card-subtitle">{periodLabel}</div></div></div><div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A8C5B" stopOpacity={0.2} /><stop offset="95%" stopColor="#1A8C5B" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" /><XAxis dataKey="date" tick={{ fill: "#63636B", fontSize: 11 }} /><YAxis tick={{ fill: "#63636B", fontSize: 11 }} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="CA TTC" stroke="#1A8C5B" fill="url(#gradCA)" strokeWidth={2} name="CA TTC" /><Line type="monotone" dataKey="Objectif" stroke="#D9536B" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Objectif" /></AreaChart></ResponsiveContainer></div></div>
        <div className="card"><div className="card-header"><div><div className="card-title">Évolution du Ratio (période)</div><div className="card-subtitle">Seuil : {RATIO_ALERT_THRESHOLD}%</div></div></div><div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="gradRatio" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D9536B" stopOpacity={0.2} /><stop offset="95%" stopColor="#D9536B" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" /><XAxis dataKey="date" tick={{ fill: "#63636B", fontSize: 11 }} /><YAxis tick={{ fill: "#63636B", fontSize: 11 }} domain={[0, 45]} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="Ratio (%)" stroke="#D9536B" fill="url(#gradRatio)" strokeWidth={2} /><Line type="monotone" dataKey={() => RATIO_ALERT_THRESHOLD} stroke="#D9536B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Seuil" /></AreaChart></ResponsiveContainer></div></div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}><div className="card-header"><div><div className="card-title">Évolution du Ratio — Tendance mensuelle</div><div className="card-subtitle">12 derniers mois</div></div></div><div style={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={monthlyRatioData}><CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" /><XAxis dataKey="mois" tick={{ fill: "#63636B", fontSize: 11 }} /><YAxis tick={{ fill: "#63636B", fontSize: 11 }} domain={[0, 45]} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Ratio (%)" radius={[4, 4, 0, 0]}>{monthlyRatioData.map((entry, i) => (<Cell key={i} fill={entry["Ratio (%)"] > RATIO_ALERT_THRESHOLD ? "#D9536B" : "#1A8C5B"} opacity={0.85} />))}</Bar><ReferenceLine y={RATIO_ALERT_THRESHOLD} stroke="#D9536B" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: "Seuil " + RATIO_ALERT_THRESHOLD + "%", position: "right", fill: "#D9536B", fontSize: 11 }} /></ComposedChart></ResponsiveContainer></div></div>
      <div className="grid-2">
        <div className="card"><div className="card-header"><div><div className="card-title">Achats HT vs CA HT</div><div className="card-subtitle">{periodLabel}</div></div></div><div style={{ height: 260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#2C2C30" /><XAxis dataKey="date" tick={{ fill: "#63636B", fontSize: 11 }} /><YAxis tick={{ fill: "#63636B", fontSize: 11 }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="CA HT" fill="#1A8C5B" radius={[4, 4, 0, 0]} opacity={0.8} name="CA HT" /><Bar dataKey="Achats" fill="#D9536B" radius={[4, 4, 0, 0]} opacity={0.8} /></BarChart></ResponsiveContainer></div></div>
        <div className="card"><div className="card-header"><div><div className="card-title">Répartition des Achats</div><div className="card-subtitle">{periodLabel}</div></div></div><div style={{ height: 260, display: "flex", alignItems: "center" }}><ResponsiveContainer width="50%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>{categoryData.map((entry) => (<Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#94A3B8"} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer><div style={{ flex: 1, paddingLeft: 8 }}>{categoryData.slice(0, 6).map((c) => (<div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[c.name] || "#94A3B8" }} /><span style={{ color: "var(--text-secondary)", flex: 1 }}>{c.name}</span><span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrency(c.value)}</span></div>))}</div></div></div>
      </div>
    </div>
  );
};

const InputPage = ({ data, setData, addToast, isAdmin, restoObjectives, restoOverrides, suppliers, currentRestoId }) => {
  const todayStr = today();
  const existing = data.find((d) => d.date === todayStr);
  const [ca, setCa] = useState(existing?.ca?.toString() || "");
  const [caHt, setCaHt] = useState(existing?.ca_ht?.toString() || "");
  const [objectif, setObjectif] = useState(existing?.objectif?.toString() || "");
  const [invoices, setInvoices] = useState(existing?.invoices || []);
  const [newInvoice, setNewInvoice] = useState({ fournisseur: "", montant: "", categorie: CATEGORIES[0] });
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [zeltyLoading, setZeltyLoading] = useState(false);
  const [zeltyInfo, setZeltyInfo] = useState(null);
  const getRestoObj = (ds) => { if (restoOverrides && restoOverrides[ds]) return restoOverrides[ds]; if (restoObjectives) { const dow = getDow(ds); return restoObjectives[dow] || 0; } return 0; };
  
  const fetchZeltyCA = useCallback(async (date) => {
    setZeltyLoading(true);
    setZeltyInfo(null);
    try {
      const resp = await fetch("/api/zelty-ca?date=" + date + "&resto_id=" + (currentRestoId || ""));
      if (!resp.ok) throw new Error("Erreur API");
      const z = await resp.json();
      if (z.ca_ttc > 0) {
        setCa(z.ca_ttc.toString());
        setCaHt(z.ca_ht.toString());
        setZeltyInfo({ ttc: z.ca_ttc, ht: z.ca_ht, count: z.orders_count });
        addToast("CA importé depuis Zelty : " + z.orders_count + " commandes", "success");
      } else {
        setZeltyInfo({ ttc: 0, ht: 0, count: 0 });
      }
    } catch (e) {
      console.error("Zelty fetch error:", e);
    }
    setZeltyLoading(false);
  }, [addToast]);

  useEffect(() => {
    const dayData = data.find((d) => d.date === selectedDate);
    setCa(dayData?.ca?.toString() || "");
    setCaHt(dayData?.ca_ht?.toString() || "");
    const obj = dayData?.objectif || getRestoObj(selectedDate);
    setObjectif(obj ? obj.toString() : "");
    setInvoices(dayData?.invoices || []);
    setZeltyInfo(null);
    // Auto-fetch from Zelty if no CA saved yet for this date
    if (!dayData?.ca) {
      fetchZeltyCA(selectedDate);
    }
  }, [selectedDate, data, restoObjectives, restoOverrides]);

  const addInvoice = () => { if (!newInvoice.fournisseur || !newInvoice.montant) return; setInvoices([...invoices, { id: selectedDate + "-" + Date.now(), fournisseur: newInvoice.fournisseur, montant: parseFloat(newInvoice.montant), categorie: newInvoice.categorie, date: selectedDate }]); setNewInvoice({ fournisseur: "", montant: "", categorie: CATEGORIES[0] }); };
  const removeInvoice = (id) => setInvoices(invoices.filter((i) => i.id !== id));
  const saveDay = () => {
    if (!ca || !caHt) { addToast("Veuillez remplir CA TTC et CA HT", "error"); return; }
    if (isAdmin && !objectif) { addToast("Veuillez remplir l'objectif", "error"); return; }
    const dayEntry = { date: selectedDate, ca: parseFloat(ca), ca_ht: parseFloat(caHt), objectif: parseFloat(objectif) || getRestoObj(selectedDate) || 0, invoices };
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Chiffre d'affaires</div>
            <button className="btn btn-sm btn-secondary" onClick={() => fetchZeltyCA(selectedDate)} disabled={zeltyLoading} style={{ fontSize: 12, gap: 6 }}>
              {zeltyLoading ? "Chargement..." : "↻ Importer Zelty"}
            </button>
          </div>
          {zeltyInfo && zeltyInfo.count > 0 && (
            <div style={{ padding: "8px 12px", background: "var(--accent-bg)", borderRadius: 6, marginBottom: 12, fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>✓</span> CA Zelty importé — {zeltyInfo.count} commandes
            </div>
          )}
          <div className="form-row"><div className="form-group"><label className="form-label">CA TTC (€)</label><input className="form-input" type="number" value={ca} onChange={(e) => setCa(e.target.value)} placeholder="3 850" min="0" step="0.01" /></div><div className="form-group"><label className="form-label">CA HT (€)</label><input className="form-input" type="number" value={caHt} onChange={(e) => setCaHt(e.target.value)} placeholder="3 500" min="0" step="0.01" /></div></div>
          <div className="form-group"><label className="form-label">Objectif du jour (€){!isAdmin && " 🔒"}</label><input className="form-input" type="number" value={objectif} onChange={(e) => { if (isAdmin) setObjectif(e.target.value); }} placeholder="3 000" min="0" step="0.01" readOnly={!isAdmin} style={!isAdmin ? { opacity: 0.6, cursor: "not-allowed" } : {}} /></div>
        </div>
        <div className="card"><div className="card-header"><div className="card-title">Ajouter une facture fournisseur</div></div>
          <div className="form-row"><div className="form-group"><label className="form-label">Fournisseur</label><select className="form-select" value={newInvoice.fournisseur} onChange={(e) => { const sup = suppliers.find(s => s.name === e.target.value); setNewInvoice({ ...newInvoice, fournisseur: e.target.value, categorie: sup?.category || CATEGORIES[0] }); }}><option value="">— Choisir —</option>{suppliers.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.category})</option>)}</select></div><div className="form-group"><label className="form-label">Montant HT (€)</label><input className="form-input" type="number" value={newInvoice.montant} onChange={(e) => setNewInvoice({ ...newInvoice, montant: e.target.value })} placeholder="250" min="0" step="0.01" /></div></div>
          <button className="btn btn-primary" onClick={addInvoice} style={{ width: "100%", justifyContent: "center" }}><Icon name="plus" size={16} color="var(--bg-primary)" /> Ajouter la facture</button>
        </div>
      </div>
      <div>
        <div className="card" style={{ marginBottom: 20 }}><div className="card-header"><div className="card-title">Récapitulatif — {formatDateFR(selectedDate)}</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 14, background: "var(--accent-bg)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(74,222,128,0.15)" }}><div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total achats HT</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", fontFamily: "Inter, sans-serif", marginTop: 4 }}>{formatCurrency(totalAchats)}</div></div>
            <div style={{ padding: 14, background: ratio > RATIO_ALERT_THRESHOLD ? "var(--red-bg)" : "var(--gold-bg)", borderRadius: "var(--radius-sm)", border: "1px solid " + (ratio > RATIO_ALERT_THRESHOLD ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.15)") }}><div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ratio HT/HT</div><div style={{ fontSize: 22, fontWeight: 700, color: ratio > RATIO_ALERT_THRESHOLD ? "var(--red)" : "var(--gold)", fontFamily: "Inter, sans-serif", marginTop: 4 }}>{formatPct(ratio)}</div></div>
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

const AlertsPage = ({ data, addToast, currentRestoId }) => {
  const [recipients, setRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from("alert_recipients").select("*").eq("restaurant_id", currentRestoId).order("id").then(({ data: r }) => { if (r) setRecipients(r); });
  }, [currentRestoId]);

  const addRecipient = async () => {
    if (!newEmail || !newEmail.includes("@")) { addToast("Email invalide", "error"); return; }
    const { data: r, error } = await supabase.from("alert_recipients").insert({ email: newEmail.trim(), name: newName.trim() || null, active: true, restaurant_id: currentRestoId }).select().single();
    if (error) { addToast("Erreur : " + (error.message.includes("duplicate") ? "Email déjà ajouté" : error.message), "error"); return; }
    setRecipients([...recipients, r]);
    setNewEmail(""); setNewName("");
    addToast("Destinataire ajouté : " + newEmail, "success");
  };

  const toggleRecipient = async (id, active) => {
    await supabase.from("alert_recipients").update({ active: !active }).eq("id", id);
    setRecipients(recipients.map(r => r.id === id ? { ...r, active: !active } : r));
  };

  const removeRecipient = async (id) => {
    if (!window.confirm("Supprimer ce destinataire ?")) return;
    await supabase.from("alert_recipients").delete().eq("id", id);
    setRecipients(recipients.filter(r => r.id !== id));
    addToast("Destinataire supprimé", "info");
  };

  const sendTestEmail = async () => {
    const active = recipients.filter(r => r.active);
    if (!active.length) { addToast("Aucun destinataire actif", "error"); return; }
    setSending(true);
    // Choisir le bon endpoint selon le restaurant actif
    const WAFFLE_CERGY_ID = "r1772494496631";
    const WAFFLE_BELLE_EPINE_ID = "r1775159807169";
    const endpoint = currentRestoId === WAFFLE_CERGY_ID ? "/api/send-report-waffle"
      : currentRestoId === WAFFLE_BELLE_EPINE_ID ? "/api/send-report-belle-epine"
      : "/api/send-report";
    try {
      const resp = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true }) });
      const result = await resp.json();
      if (result.success) addToast("Email test envoyé à " + active.length + " destinataire(s)", "success");
      else addToast("Erreur envoi : " + (result.error || "inconnue"), "error");
    } catch (e) { addToast("Erreur : " + e.message, "error"); }
    setSending(false);
  };

  const alerts = useMemo(() => data.filter((d) => { const ta = d.invoices.reduce((s, i) => s + i.montant, 0); const ht = d.ca_ht || Math.round(d.ca / 1.1); return ht > 0 && (ta / ht) * 100 > RATIO_ALERT_THRESHOLD; }).reverse().slice(0, 20), [data]);

  return (
    <div className="content-area"><div className="grid-2" style={{ alignItems: "start" }}>
      <div>
        <div className="card" style={{ marginBottom: 20 }}><div className="card-header"><div><div className="card-title">Destinataires du rapport quotidien</div><div className="card-subtitle">Email envoyé chaque jour à 01h00</div></div></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input className="form-input" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ flex: 2 }} />
            <input className="form-input" placeholder="Nom (optionnel)" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={addRecipient}>Ajouter</button>
          </div>
          {recipients.length > 0 ? (
            <div>{recipients.map(r => (
              <div key={r.id} className="invoice-item" style={{ marginBottom: 6 }}>
                <div className="invoice-left">
                  <div className="invoice-icon" style={{ background: r.active ? "var(--accent-bg)" : "var(--bg-input)", cursor: "pointer" }} onClick={() => toggleRecipient(r.id, r.active)}>{r.active ? "✉️" : "⏸️"}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, opacity: r.active ? 1 : 0.5 }}>{r.email}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.name || "—"} · {r.active ? "Actif" : "Désactivé"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-icon" onClick={() => toggleRecipient(r.id, r.active)} style={{ padding: 4, border: "none" }}>{r.active ? "⏸" : "▶"}</button>
                  <button className="btn-icon" onClick={() => removeRecipient(r.id)} style={{ padding: 4, border: "none" }}><Icon name="trash" size={14} color="var(--red)" /></button>
                </div>
              </div>
            ))}</div>
          ) : (<div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>Aucun destinataire configuré</div>)}
          <button className="btn btn-secondary" onClick={sendTestEmail} disabled={sending} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}><Icon name="mail" size={16} /> {sending ? "Envoi en cours..." : "Envoyer un email test maintenant"}</button>
        </div>
        <div className="card"><div className="card-header"><div><div className="card-title">Configuration des alertes</div><div className="card-subtitle">Seuil ratio matières : {RATIO_ALERT_THRESHOLD}%</div></div></div>
          <div style={{ padding: 16, background: "var(--bg-input)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>
            <strong>Rapport quotidien</strong> envoyé à 01h00 avec le CA TTC, HT, objectif et écart de la veille.<br/>
            <strong>Alerte ratio</strong> : si le ratio dépasse <strong style={{ color: "var(--red)" }}>{RATIO_ALERT_THRESHOLD}%</strong>, un avertissement est inclus dans le mail.
          </div>
        </div>
      </div>
      <div className="card"><div className="card-header"><div><div className="card-title">Historique alertes ratio</div><div className="card-subtitle">{alerts.length} jour(s) en dépassement</div></div></div>
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
            <div className="obj-total"><div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>Total semaine</div><div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", fontFamily: "Inter, sans-serif", letterSpacing: "-0.5px" }}>{formatCurrency(weekTotal)}</div></div>
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

const SuppliersPage = ({ suppliers, setSuppliers, data, addToast, isAdmin, currentRestoId }) => {
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState(CATEGORIES[0]);
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");

  const addSupplier = async () => {
    if (!newName.trim()) { addToast("Nom requis", "error"); return; }
    // Vérifier si le fournisseur existe déjà (actif ou inactif) pour ce restaurant
    const { data: existing } = await supabase.from("suppliers").select("*").eq("name", newName.trim()).eq("restaurant_id", currentRestoId).single();
    if (existing) {
      if (existing.active) { addToast("Ce fournisseur existe déjà", "error"); return; }
      // Réactiver le fournisseur désactivé
      const { data: reactivated } = await supabase.from("suppliers").update({ active: true, category: newCat }).eq("id", existing.id).select().single();
      setSuppliers(prev => [...prev, reactivated]);
      setNewName(""); addToast("Fournisseur réactivé : " + newName, "success");
      return;
    }
    const { data: s, error } = await supabase.from("suppliers").insert({ name: newName.trim(), category: newCat, restaurant_id: currentRestoId, active: true }).select().single();
    if (error) { addToast(error.message, "error"); return; }
    setSuppliers(prev => [...prev, s]);
    setNewName(""); addToast("Fournisseur ajouté : " + newName, "success");
  };

  const removeSupplier = async (id) => {
    if (!window.confirm("Supprimer ce fournisseur ?")) return;
    await supabase.from("suppliers").update({ active: false }).eq("id", id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    addToast("Fournisseur supprimé", "info");
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    let filtered = data;
    if (period === "week") {
      const dow = (now.getDay() + 6) % 7;
      const ws = new Date(now); ws.setDate(now.getDate() - dow); ws.setHours(0,0,0,0);
      filtered = data.filter(d => new Date(d.date + "T00:00:00") >= ws);
    } else if (period === "month") {
      filtered = data.filter(d => { const dt = new Date(d.date + "T00:00:00"); return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth(); });
    } else if (period === "quarter") {
      const qm = Math.floor(now.getMonth() / 3) * 3;
      const qs = new Date(now.getFullYear(), qm, 1);
      filtered = data.filter(d => new Date(d.date + "T00:00:00") >= qs);
    } else if (period === "custom" && customFrom && customTo) {
      filtered = data.filter(d => d.date >= customFrom && d.date <= customTo);
    }
    return filtered;
  }, [data, period, customFrom, customTo]);

  const supplierStats = useMemo(() => {
    const stats = {};
    filteredData.forEach(d => d.invoices.forEach(i => {
      if (!stats[i.fournisseur]) stats[i.fournisseur] = { total: 0, count: 0, invoices: [] };
      stats[i.fournisseur].total += i.montant;
      stats[i.fournisseur].count++;
      stats[i.fournisseur].invoices.push({ ...i, dayDate: d.date });
    }));
    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  }, [filteredData]);

  const filteredStats = filterSupplier === "all" ? supplierStats : supplierStats.filter(([name]) => name === filterSupplier);

  const exportSupplierCSV = () => {
    const BOM = "\uFEFF";
    const headers = ["Fournisseur","Date","Montant HT","Catégorie"];
    const rows = [];
    filteredStats.forEach(([name, s]) => {
      s.invoices.forEach(i => rows.push([name, i.dayDate, i.montant, i.categorie].join(";")));
      rows.push([name, "TOTAL", s.total.toFixed(2), ""].join(";"));
      rows.push("");
    });
    const csv = BOM + headers.join(";") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "fournisseurs_export.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const exportSupplierPDF = () => {
    const fc = (v) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
    const periodLabel = period === "week" ? "Semaine en cours" : period === "month" ? "Mois en cours" : period === "quarter" ? "Trimestre en cours" : "Période personnalisée";
    const w = window.open("", "_blank");
    w.document.write("<html><head><title>Export Fournisseurs</title><style>body{font-family:Inter,system-ui,sans-serif;padding:40px;color:#333}h1{font-size:22px;margin-bottom:4px}h2{font-size:14px;color:#666;margin-bottom:24px}h3{font-size:16px;margin:24px 0 8px;padding-top:16px;border-top:2px solid #1B2A4A}table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px}th{text-align:left;padding:6px 10px;border-bottom:2px solid #ddd;font-size:11px;text-transform:uppercase;color:#999}td{padding:6px 10px;border-bottom:1px solid #eee}.r{text-align:right}.total{font-weight:700;background:#f4f6f9}@media print{body{padding:20px}}</style></head><body>");
    w.document.write("<h1>Export Fournisseurs</h1><h2>" + periodLabel + " — " + filteredData.length + " jours</h2>");
    filteredStats.forEach(([name, s]) => {
      w.document.write('<h3>' + name + ' — ' + fc(s.total) + ' (' + s.count + ' factures)</h3>');
      w.document.write('<table><thead><tr><th>Date</th><th>Catégorie</th><th class="r">Montant HT</th></tr></thead><tbody>');
      s.invoices.forEach(i => w.document.write('<tr><td>' + i.dayDate + '</td><td>' + i.categorie + '</td><td class="r">' + fc(i.montant) + '</td></tr>'));
      w.document.write('<tr class="total"><td colspan="2">Total ' + name + '</td><td class="r">' + fc(s.total) + '</td></tr></tbody></table>');
    });
    const grandTotal = filteredStats.reduce((s, [, v]) => s + v.total, 0);
    w.document.write('<h3 style="color:#1B2A4A">Total général : ' + fc(grandTotal) + '</h3>');
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const periodBtnStyle = (p) => ({
    padding: "6px 14px", borderRadius: 6, border: period === p ? "none" : "1px solid var(--border)",
    background: period === p ? "var(--accent)" : "var(--bg-card)", color: period === p ? "#fff" : "var(--text-secondary)",
    fontSize: 13, fontWeight: 500, cursor: "pointer"
  });

  return (
    <div className="content-area">
      {isAdmin && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">Ajouter un fournisseur</div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="form-input" placeholder="Nom du fournisseur" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 2 }} />
            <select className="form-select" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ flex: 1 }}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <button className="btn btn-primary btn-sm" onClick={addSupplier}>Ajouter</button>
          </div>
          {suppliers.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {suppliers.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}>
                  <span>{s.name}</span><span style={{ color: "var(--text-muted)", fontSize: 11 }}>({s.category})</span>
                  <button onClick={() => removeSupplier(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", fontSize: 14, padding: 0, marginLeft: 4 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={periodBtnStyle("week")} onClick={() => setPeriod("week")}>Semaine</button>
          <button style={periodBtnStyle("month")} onClick={() => setPeriod("month")}>Mois</button>
          <button style={periodBtnStyle("custom")} onClick={() => setPeriod("custom")}>Personnalisé</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select className="form-select" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{ width: "auto", fontSize: 13 }}>
            <option value="all">Tous les fournisseurs</option>
            {supplierStats.map(([name]) => <option key={name} value={name}>{name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={exportSupplierCSV}><Icon name="download" size={14} /> CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={exportSupplierPDF}><Icon name="download" size={14} /> PDF</button>
        </div>
      </div>
      {period === "custom" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <input type="date" className="form-input" style={{ width: "auto" }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <input type="date" className="form-input" style={{ width: "auto" }} value={customTo} onChange={e => setCustomTo(e.target.value)} />
        </div>
      )}
      {filteredStats.length > 0 ? filteredStats.map(([name, s]) => (
        <div key={name} className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div><div className="card-title">{name}</div><div className="card-subtitle">{s.count} facture(s)</div></div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(s.total)}</div>
          </div>
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Catégorie</th><th style={{ textAlign: "right" }}>Montant HT</th></tr></thead><tbody>
            {s.invoices.map((i, idx) => (<tr key={idx}><td>{formatDateFR(i.dayDate)}</td><td>{i.categorie}</td><td className="td-mono" style={{ textAlign: "right" }}>{formatCurrency(i.montant)}</td></tr>))}
          </tbody></table></div>
        </div>
      )) : <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Aucune facture sur cette période</div>}
    </div>
  );
};


const InventoryPage = ({ data, currentRestoId, addToast }) => {
  const [inventories, setInventories] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('inventory').select('*').eq('restaurant_id', currentRestoId).order('date', { ascending: false })
      .then(({ data: rows }) => { if (rows) setInventories(rows); setLoading(false); });
  }, [currentRestoId]);

  const addInventory = async () => {
    if (!newDate || !newValue) { addToast('Veuillez remplir la date et la valeur', 'error'); return; }
    const entry = { restaurant_id: currentRestoId, date: newDate, valeur_stock: parseFloat(newValue), notes: newNotes || null };
    const { data: row, error } = await supabase.from('inventory').upsert(entry, { onConflict: 'restaurant_id,date' }).select().single();
    if (error) { addToast('Erreur : ' + error.message, 'error'); return; }
    setInventories(prev => { const filtered = prev.filter(i => i.date !== newDate); return [row, ...filtered].sort((a,b) => b.date.localeCompare(a.date)); });
    setNewDate(''); setNewValue(''); setNewNotes('');
    addToast('Inventaire enregistré ✓', 'success');
  };

  const removeInventory = async (id) => {
    if (!window.confirm('Supprimer cet inventaire ?')) return;
    await supabase.from('inventory').delete().eq('id', id);
    setInventories(prev => prev.filter(i => i.id !== id));
    addToast('Inventaire supprimé', 'info');
  };

  // Calcul ratio corrigé par mois
  const monthlyStats = useMemo(() => {
    const months = {};
    data.forEach(d => {
      const m = d.date.substring(0, 7);
      if (!months[m]) months[m] = { ca: 0, ca_ht: 0, achats: 0 };
      months[m].ca += d.ca;
      months[m].ca_ht += d.ca_ht || Math.round(d.ca / 1.1);
      months[m].achats += d.invoices.reduce((s, i) => s + i.montant, 0);
    });

    return Object.entries(months).sort((a,b) => b[0].localeCompare(a[0])).map(([month, stats]) => {
      const [y, mo] = month.split('-');
      const label = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][parseInt(mo)-1] + ' ' + y;

      // Trouver inventaire fin de ce mois et fin du mois précédent
      const invFin = inventories.find(i => i.date.startsWith(month));
      const prevMonth = new Date(parseInt(y), parseInt(mo)-2, 1);
      const prevKey = prevMonth.getFullYear() + '-' + String(prevMonth.getMonth()+1).padStart(2,'0');
      const invDebut = inventories.find(i => i.date.startsWith(prevKey));

      const ratioBrut = stats.ca_ht > 0 ? (stats.achats / stats.ca_ht) * 100 : 0;

      let ratioCorrige = null;
      if (invFin && invDebut) {
        const consommation = stats.achats + invDebut.valeur_stock - invFin.valeur_stock;
        ratioCorrige = stats.ca_ht > 0 ? (consommation / stats.ca_ht) * 100 : 0;
      }

      return { month, label, ...stats, invFin, invDebut, ratioBrut, ratioCorrige };
    });
  }, [data, inventories]);

  return (
    <div className="content-area">
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">Saisir un inventaire</div></div>
            <div className="form-group"><label className="form-label">Date de l'inventaire</label><input className="form-input" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Valeur du stock (€ HT)</label><input className="form-input" type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="3 500" min="0" step="0.01" /></div>
            <div className="form-group"><label className="form-label">Notes (optionnel)</label><input className="form-input" type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Inventaire fin mars..." /></div>
            <button className="btn btn-primary" onClick={addInventory} style={{ width: '100%', justifyContent: 'center' }}><Icon name="check" size={16} color="var(--bg-primary)" /> Enregistrer l'inventaire</button>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Historique des inventaires</div><div className="card-subtitle">{inventories.length} entrée(s)</div></div>
            {loading ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Chargement...</div> :
            inventories.length > 0 ? inventories.map(inv => (
              <div key={inv.id} className="invoice-item" style={{ marginBottom: 8 }}>
                <div className="invoice-left">
                  <div className="invoice-icon" style={{ background: 'var(--accent-bg)', fontSize: 18 }}>📦</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDateFull(inv.date)}</div>
                    {inv.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inv.notes}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>{formatCurrency(inv.valeur_stock)}</span>
                  <button className="btn-icon" onClick={() => removeInventory(inv.id)} style={{ padding: 4, border: 'none' }}><Icon name="trash" size={14} color="var(--red)" /></button>
                </div>
              </div>
            )) : <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Aucun inventaire saisi</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><div className="card-title">Ratio corrigé par mois</div><div className="card-subtitle">Avec variation de stock</div></div></div>
          {monthlyStats.map(m => (
            <div key={m.month} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCurrency(m.ca)} CA</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Ratio brut</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: m.ratioBrut > 28 ? 'var(--red)' : 'var(--gold)' }}>{m.ratioBrut.toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Achats : {formatCurrency(m.achats)}</div>
                </div>
                <div style={{ padding: '10px 14px', background: m.ratioCorrige !== null ? 'var(--accent-bg)' : 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (m.ratioCorrige !== null ? 'rgba(74,222,128,0.2)' : 'var(--border)') }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Ratio corrigé</div>
                  {m.ratioCorrige !== null ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700, color: m.ratioCorrige > 28 ? 'var(--red)' : 'var(--accent)' }}>{m.ratioCorrige.toFixed(1)}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Stock: {formatCurrency(m.invDebut.valeur_stock)} → {formatCurrency(m.invFin.valeur_stock)}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Inventaires manquants</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {monthlyStats.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune donnée</div>}
        </div>
      </div>
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
  const [restaurants, setRestaurants] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [restoData, setRestoData] = useState({});
  const [currentRestoId, setCurrentRestoId] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const addToast = useCallback((message, type = "info") => { const id = Date.now(); setToasts((t) => [...t, { id, message, type }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000); }, []);

  // ---- Fetch all data from Supabase ----
  const fetchAll = useCallback(async () => {
    const { data: restos } = await supabase.from("restaurants").select("*").order("created_at");
    const { data: users } = await supabase.from("app_users").select("*").order("created_at");
    const { data: days } = await supabase.from("daily_data").select("*").order("date");
    const { data: invs } = await supabase.from("invoices").select("*").order("date");
    const { data: supps } = await supabase.from("suppliers").select("*").eq("active", true).order("name");
    const rList = (restos || []).map(r => ({
      id: r.id, name: r.name, address: r.address || "", color: r.color || "#4ADE80",
      objectives: r.objectives || DEFAULT_OBJ, dateOverrides: r.date_overrides || {}
    }));
    const uList = (users || []).map(u => ({
      id: u.id, email: u.email, password: u.password, name: u.name, role: u.role, restaurantId: u.restaurant_id
    }));
    const rd = {};
    rList.forEach(r => { rd[r.id] = []; });
    (days || []).forEach(d => {
      if (!rd[d.restaurant_id]) rd[d.restaurant_id] = [];
      rd[d.restaurant_id].push({
        date: d.date, ca: Number(d.ca), ca_ht: Number(d.ca_ht), objectif: Number(d.objectif),
        invoices: (invs || []).filter(i => i.restaurant_id === d.restaurant_id && i.date === d.date).map(i => ({
          id: String(i.id), fournisseur: i.fournisseur, montant: Number(i.montant), categorie: i.categorie, date: i.date
        }))
      });
    });
    Object.keys(rd).forEach(k => rd[k].sort((a, b) => a.date.localeCompare(b.date)));
    setRestaurants(rList);
    setAllUsers(uList);
    setRestoData(rd);
    setSuppliers((supps || []));
    setDbReady(true);
    return rList;
  }, []);

  // ---- Initial load after login ----
  useEffect(() => {
    if (!user) { setDbReady(false); return; }
    fetchAll().then(rList => {
      if (user.role === "admin") setCurrentRestoId(rList[0]?.id || null);
      else setCurrentRestoId(user.restaurantId);
    });
  }, [user, fetchAll]);

  const isAdmin = user?.role === "admin";
  const currentResto = restaurants.find(r => r.id === currentRestoId);
  const currentData = restoData[currentRestoId] || [];

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); try { localStorage.setItem("rp_theme", theme); } catch(e) {} }, [theme]);
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const handleLogout = () => { try { localStorage.removeItem("rp_session"); localStorage.removeItem("rp_session_expiry"); } catch(e) {} setUser(null); setCurrentRestoId(null); setPage("dashboard"); };

  // ---- Save day data to Supabase ----
  const setCurrentData = async (newData) => {
    if (!currentRestoId) return;
    setRestoData(prev => ({ ...prev, [currentRestoId]: newData }));
    // Find what changed (most recent save = last modified entry)
    const oldData = restoData[currentRestoId] || [];
    for (const entry of newData) {
      const old = oldData.find(d => d.date === entry.date);
      if (!old || old.ca !== entry.ca || old.ca_ht !== entry.ca_ht || old.objectif !== entry.objectif || JSON.stringify(old.invoices) !== JSON.stringify(entry.invoices)) {
        // Upsert daily_data
        await supabase.from("daily_data").upsert({
          restaurant_id: currentRestoId, date: entry.date,
          ca: entry.ca, ca_ht: entry.ca_ht, objectif: entry.objectif, updated_at: new Date().toISOString()
        }, { onConflict: "restaurant_id,date" });
        // Replace invoices for this day
        await supabase.from("invoices").delete().eq("restaurant_id", currentRestoId).eq("date", entry.date);
        if (entry.invoices.length > 0) {
          await supabase.from("invoices").insert(
            entry.invoices.map(i => ({ restaurant_id: currentRestoId, date: entry.date, fournisseur: i.fournisseur, montant: i.montant, categorie: i.categorie }))
          );
        }
      }
    }
  };

  // ---- Restaurant CRUD ----
  const handleUpdateObjectives = async (restoId, updates) => {
    setRestaurants(rs => rs.map(r => r.id === restoId ? { ...r, ...updates } : r));
    const upd = {};
    if (updates.objectives) upd.objectives = updates.objectives;
    if (updates.dateOverrides !== undefined) upd.date_overrides = updates.dateOverrides;
    await supabase.from("restaurants").update(upd).eq("id", restoId);
  };
  const handleAddResto = async (nr) => {
    const id = "r" + Date.now();
    const newR = { id, name: nr.name, address: nr.address, color: nr.color, objectives: { ...DEFAULT_OBJ }, dateOverrides: {} };
    setRestaurants(rs => [...rs, newR]);
    setRestoData(prev => ({ ...prev, [id]: [] }));
    await supabase.from("restaurants").insert({ id, name: nr.name, address: nr.address || "", color: nr.color, objectives: DEFAULT_OBJ, date_overrides: {} });
  };
  const handleDeleteResto = async (id) => {
    if (restaurants.length <= 1) { addToast("Impossible : il faut au moins 1 restaurant", "error"); return; }
    if (!window.confirm("Supprimer ce restaurant et toutes ses données ?")) return;
    setRestaurants(rs => rs.filter(r => r.id !== id));
    setRestoData(prev => { const n = { ...prev }; delete n[id]; return n; });
    setAllUsers(us => us.map(u => u.restaurantId === id ? { ...u, restaurantId: null } : u));
    if (currentRestoId === id) setCurrentRestoId(restaurants.find(r => r.id !== id)?.id || null);
    await supabase.from("invoices").delete().eq("restaurant_id", id);
    await supabase.from("daily_data").delete().eq("restaurant_id", id);
    await supabase.from("app_users").update({ restaurant_id: null }).eq("restaurant_id", id);
    await supabase.from("restaurants").delete().eq("id", id);
    addToast("Restaurant supprimé", "info");
  };

  // ---- User CRUD ----
  const handleAddUser = async (nu) => {
    if (allUsers.find(u => u.email === nu.email)) { addToast("Cet email existe déjà", "error"); return; }
    const newU = { email: nu.email, password: nu.password, name: nu.name, role: nu.role || "manager", restaurantId: nu.restaurantId || null };
    setAllUsers(us => [...us, newU]);
    await supabase.from("app_users").insert({ email: nu.email, password: nu.password, name: nu.name, role: nu.role || "manager", restaurant_id: nu.restaurantId || null });
  };
  const handleUpdateUser = async (email, updates) => {
    setAllUsers(us => us.map(u => u.email === email ? { ...u, ...updates } : u));
    const upd = {};
    if (updates.password) upd.password = updates.password;
    if (updates.name) upd.name = updates.name;
    if (updates.role) upd.role = updates.role;
    if (updates.restaurantId !== undefined) upd.restaurant_id = updates.restaurantId;
    await supabase.from("app_users").update(upd).eq("email", email);
  };
  const handleDeleteUser = async (email) => {
    setAllUsers(us => us.filter(u => u.email !== email));
    await supabase.from("app_users").delete().eq("email", email);
  };

  // ---- RAZ February ----
  const resetFebruaryData = async () => {
    if (!window.confirm("⚠️ Remettre à zéro les CA et supprimer toutes les factures de février ?\\n\\nCette action est irréversible.")) return;
    await supabase.from("invoices").delete().gte("date", "2025-02-01").lte("date", "2025-02-28");
    await supabase.from("daily_data").update({ ca: 0, ca_ht: 0 }).gte("date", "2025-02-01").lte("date", "2025-02-28");
    await fetchAll();
    addToast("Données de février remises à zéro", "info");
  };

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: "dashboard" },
    { id: "input", label: "Saisie du jour", icon: "input" },
    { id: "history", label: "Historique", icon: "history" },
    { id: "alerts", label: "Alertes & Emails", icon: "alert" },
    { id: "suppliers", label: "Fournisseurs", icon: "truck" },
    { id: "objectives", label: "Objectifs CA", icon: "target" },
    { id: "inventory", label: "Inventaire", icon: "inventory" },
    ...(isAdmin ? [{ id: "restos", label: "Restaurants", icon: "settings" }] : []),
  ];
  if (!user) return <><style>{CSS}</style><LoginPage onLogin={setUser} /></>;
  if (!dbReady) return <><style>{CSS}</style><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "Inter, sans-serif" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>RestoPilot</div><div style={{ color: "var(--text-muted)" }}>Chargement des données...</div></div></div></>;
  const pageTitles = { dashboard: "Tableau de bord", input: "Saisie quotidienne", history: "Historique", alerts: "Alertes & Emails", suppliers: "Fournisseurs", objectives: "Objectifs CA", inventory: "Inventaire", restos: "Restaurants & Managers" };
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
        {page === "dashboard" && <DashboardPage data={currentData} restoName={currentResto?.name || "RestoPilot"} restoObjectives={currentResto?.objectives} restoOverrides={currentResto?.dateOverrides} currentRestoId={currentRestoId} />}
        {page === "input" && <InputPage data={currentData} setData={setCurrentData} addToast={addToast} isAdmin={isAdmin} restoObjectives={currentResto?.objectives} restoOverrides={currentResto?.dateOverrides} suppliers={suppliers.filter(s => s.restaurant_id === currentRestoId)} currentRestoId={currentRestoId} />}
        {page === "history" && <HistoryPage data={currentData} />}
        {page === "alerts" && <AlertsPage data={currentData} addToast={addToast} currentRestoId={currentRestoId} />}
        {page === "suppliers" && <SuppliersPage suppliers={suppliers.filter(s => s.restaurant_id === currentRestoId)} setSuppliers={setSuppliers} data={currentData} addToast={addToast} isAdmin={isAdmin} currentRestoId={currentRestoId} />}
        {page === "objectives" && <ObjectivesPage restaurants={restaurants} currentRestoId={currentRestoId} isAdmin={isAdmin} onUpdateObjectives={handleUpdateObjectives} addToast={addToast} />}
        {page === "inventory" && <InventoryPage data={currentData} currentRestoId={currentRestoId} addToast={addToast} />}
        {isAdmin && page === "restos" && <RestosPage restaurants={restaurants} users={allUsers} currentUser={user} onAddResto={handleAddResto} onDeleteResto={handleDeleteResto} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onResetFebruary={resetFebruaryData} addToast={addToast} />}
      </main>
    </div></>
  );
}
