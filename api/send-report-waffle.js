const RESEND_API_KEY = "re_bkga53Ts_Dd5csNTcYDVyqskq58bgqvBi";
const ZELTY_API_KEY = "MjA0NjM664nf0UF8la0gk9/NK9dspRSJ6n8=";
const SUPABASE_URL = "https://yhvbnlgowccixqslijia.supabase.co";
const SUPABASE_KEY = "sb_publishable_rURgUoNVrGxQm4e6OjrxsA_E5Skv2Tl";
const WAFFLE_ID = "r1772494496631";

function lastSundayOf(year, month) {
  const last = new Date(Date.UTC(year, month, 0));
  last.setUTCDate(last.getUTCDate() - last.getUTCDay());
  return last;
}

function getParisOffset(date) {
  const year = parseInt(date.slice(0, 4));
  const month = parseInt(date.slice(5, 7));
  const day = parseInt(date.slice(8, 10));
  const dstStart = lastSundayOf(year, 3);
  const dstEnd = lastSundayOf(year, 10);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d >= dstStart && d < dstEnd ? "%2B02:00" : "%2B01:00";
}

function getParisDateString(now) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

async function fetchOrders(date, queryParams) {
  let totalTTC = 0, totalHT = 0, count = 0, offset = 0;
  while (true) {
    const url = `https://api.zelty.fr/2.7/orders?${queryParams}&limit=200&offset=${offset}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${ZELTY_API_KEY}` } });
    let raw = await resp.text();
    raw = raw.replace(/[\x00-\x1f]/g, " ");
    const data = JSON.parse(raw);
    const orders = data.orders || [];
    if (!orders.length) break;
    for (const o of orders) {
      if (o.status === "closed") {
        totalTTC += o.price.final_amount_inc_tax;
        totalHT += o.price.final_amount_exc_tax;
        count++;
      }
    }
    if (orders.length < 200) break;
    offset += 200;
  }
  return { totalTTC, totalHT, count };
}

async function getZeltyCA(date) {
  const tz = getParisOffset(date);
  let result = await fetchOrders(date, `from=${date}T00:00:00${tz}&to=${date}T23:59:59${tz}`);
  if (result.count === 0) result = await fetchOrders(date, `noz=${date}`);
  if (result.count === 0) result = await fetchOrders(date, `from=${date}T00:00:00&to=${date}T23:59:59`);
  return { ca_ttc: Math.round(result.totalTTC) / 100, ca_ht: Math.round(result.totalHT) / 100, orders_count: result.count };
}

async function getRecipients() {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/alert_recipients?active=eq.true&restaurant_id=eq.${WAFFLE_ID}&select=email,name`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return resp.json();
}

async function getRestoInfo() {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?select=id,name,objectives,date_overrides&id=eq.${WAFFLE_ID}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const rows = await resp.json();
  return rows?.[0] || { id: WAFFLE_ID, name: "Waffle Factory Cergy", objectives: {}, date_overrides: {} };
}

function getObjectifFromResto(resto, date) {
  const overrides = resto.date_overrides || {};
  if (overrides[date] !== undefined) return overrides[date];
  const d = new Date(date + "T00:00:00");
  const dow = (d.getDay() + 6) % 7;
  const objectives = resto.objectives || {};
  return objectives[dow] || 0;
}

async function saveCAToSupabase(date, ca_ttc, ca_ht, restoId, restoObjectif) {
  const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/daily_data?restaurant_id=eq.${restoId}&date=eq.${date}&select=id,objectif`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const existing = await checkResp.json();
  if (existing && existing.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/daily_data?id=eq.${existing[0].id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ ca: ca_ttc, ca_ht: ca_ht }),
    });
    return existing[0].objectif || restoObjectif;
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/daily_data`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ restaurant_id: restoId, date, ca: ca_ttc, ca_ht: ca_ht, objectif: restoObjectif }),
    });
    return restoObjectif;
  }
}

function formatEUR(v) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);
}

async function getMonthlyRatio(date, restoId) {
  const yearMonth = date.substring(0, 7);
  const monthStart = yearMonth + "-01";
  const monthEnd = yearMonth + "-31";
  try {
    const daysResp = await fetch(`${SUPABASE_URL}/rest/v1/daily_data?restaurant_id=eq.${restoId}&date=gte.${monthStart}&date=lte.${monthEnd}&select=ca_ht`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const days = await daysResp.json();
    const totalHT = (days || []).reduce((s, d) => s + Number(d.ca_ht || 0), 0);
    const invsResp = await fetch(`${SUPABASE_URL}/rest/v1/invoices?restaurant_id=eq.${restoId}&date=gte.${monthStart}&date=lte.${monthEnd}&select=montant`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const invs = await invsResp.json();
    const totalAchats = (invs || []).reduce((s, i) => s + Number(i.montant || 0), 0);
    if (totalHT > 0) return (totalAchats / totalHT) * 100;
    return null;
  } catch (e) {
    return null;
  }
}

function buildEmailHTML(date, ca, monthlyRatio, restoName) {
  const dateFR = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const ecart = ca.ca_ttc - ca.objectif;
  const isAbove = ecart >= 0;
  const emoji = isAbove ? "🚀" : "⚠️";
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:Inter,system-ui,sans-serif;background:#F4F6F9;padding:32px 16px;margin:0">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #E2E8F0">
  <div style="background:#4ADE80;padding:24px 28px">
    <div style="color:#fff;font-size:20px;font-weight:700">RestoPilot</div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:2px">RAPPORT QUOTIDIEN — ${restoName.toUpperCase()}</div>
  </div>
  <div style="padding:28px">
    <div style="font-size:14px;color:#94A3B8;margin-bottom:4px">Rapport du</div>
    <div style="font-size:18px;font-weight:600;color:#1B2A4A;margin-bottom:24px">${dateFR}</div>
    <div style="background:#F4F6F9;border-radius:8px;padding:24px;text-align:center;margin-bottom:20px">
      <div style="font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">CA du jour</div>
      <div style="font-size:36px;font-weight:700;color:#1A8C5B;margin:4px 0">${formatEUR(ca.ca_ttc)}</div>
      <div style="font-size:13px;color:#475569">HT : ${formatEUR(ca.ca_ht)} · ${ca.orders_count} commandes</div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:20px">
      <div style="flex:1;background:#F4F6F9;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:11px;color:#94A3B8;text-transform:uppercase">Objectif</div>
        <div style="font-size:20px;font-weight:700;color:#1B2A4A;margin-top:4px">${formatEUR(ca.objectif)}</div>
      </div>
      <div style="flex:1;background:${isAbove ? '#f0fdf4' : '#fef2f2'};border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:11px;color:#94A3B8;text-transform:uppercase">Écart</div>
        <div style="font-size:20px;font-weight:700;color:${isAbove ? '#1A8C5B' : '#D9536B'};margin-top:4px">${isAbove ? '+' : ''}${formatEUR(ecart)}</div>
      </div>
    </div>
    <div style="text-align:center;font-size:14px;color:#475569;padding:12px;background:${isAbove ? '#f0fdf4' : '#fef2f2'};border-radius:8px">
      ${emoji} ${isAbove ? 'Au-dessus' : 'En-dessous'} de l'objectif ${ca.objectif > 0 ? '(' + (((ca.ca_ttc / ca.objectif) * 100).toFixed(1)) + '%)' : ''}
    </div>
    ${monthlyRatio !== null ? `<div style="margin-top:16px;padding:16px;background:#F4F6F9;border-radius:8px;text-align:center">
      <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px">Ratio matières — mois en cours</div>
      <div style="font-size:28px;font-weight:700;color:${monthlyRatio > 28 ? '#D9536B' : '#1A8C5B'};margin:4px 0">${monthlyRatio.toFixed(1)}%</div>
      <div style="font-size:12px;color:#94A3B8">Seuil : 28%${monthlyRatio > 28 ? ' ⚠️ Dépassé' : ' ✅'}</div>
    </div>` : ''}
  </div>
  <div style="padding:16px 28px;background:#F4F6F9;font-size:11px;color:#94A3B8;text-align:center">
    Rapport généré automatiquement par RestoPilot à 23:55
  </div>
</div>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const now = new Date();
    let body = {};
    try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch(e) {}

    const targetDate = getParisDateString(now);

    const [ca, recipients, resto] = await Promise.all([
      getZeltyCA(targetDate),
      getRecipients(),
      getRestoInfo(),
    ]);

    const restoObjectif = getObjectifFromResto(resto, targetDate);
    const objectif = await saveCAToSupabase(targetDate, ca.ca_ttc, ca.ca_ht, resto.id, restoObjectif);
    ca.objectif = objectif;

    const monthlyRatio = await getMonthlyRatio(targetDate, resto.id);

    if (!recipients.length) {
      return res.status(200).json({ success: false, error: "Aucun destinataire actif" });
    }

    const html = buildEmailHTML(targetDate, ca, monthlyRatio, resto.name);
    const dateFR = new Date(targetDate + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

    const emailResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "RestoPilot <rapport@afrikngroup.eu>",
        to: recipients.map((r) => r.email),
        subject: `Rapport CA Waffle Factory Cergy – ${dateFR}`,
        html,
      }),
    });

    const emailResult = await emailResp.json();

    if (emailResp.ok) {
      return res.status(200).json({ success: true, sent_to: recipients.length, date: targetDate, ca_ttc: ca.ca_ttc, ca_ht: ca.ca_ht, objectif, saved: true });
    } else {
      return res.status(200).json({ success: false, error: emailResult?.message || "Erreur Resend" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
