const ZELTY_KEYS = {
  "r1772490949804": "MTk4NzU68xOv4nIh5aqjJBgJrc9kWwKDo84=",   // Afrik N Fusion
  "r1772494496631": "MjA0NjM664nf0UF8la0gk9/NK9dspRSJ6n8=",   // Waffle Factory Cergy
};

const ZELTY_API_URL = "https://api.zelty.fr/2.7/orders";

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

async function fetchOrders(queryParams, apiKey) {
  let totalTTC = 0, totalHT = 0, count = 0, offset = 0;
  while (true) {
    const url = `${ZELTY_API_URL}?${queryParams}&limit=200&offset=${offset}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    let raw = await resp.text();
    raw = raw.replace(/[\x00-\x1f]/g, " ");
    const data = JSON.parse(raw);
    const orders = data.orders || [];
    if (orders.length === 0) break;
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const restoId = req.query.resto_id || "r1772490949804"; // Afrik par défaut
    const apiKey = ZELTY_KEYS[restoId];

    if (!apiKey) {
      return res.status(400).json({ error: "Restaurant non reconnu ou clé Zelty manquante" });
    }

    const tz = getParisOffset(date);

    // Tentative 1 : timezone Paris auto (CET hiver / CEST été)
    let result = await fetchOrders(`from=${date}T00:00:00${tz}&to=${date}T23:59:59${tz}`, apiKey);
    // Tentative 2 : noz
    if (result.count === 0) {
      result = await fetchOrders(`noz=${date}`, apiKey);
    }
    // Tentative 3 : fallback UTC
    if (result.count === 0) {
      result = await fetchOrders(`from=${date}T00:00:00&to=${date}T23:59:59`, apiKey);
    }

    res.status(200).json({
      date,
      ca_ttc: Math.round(result.totalTTC) / 100,
      ca_ht: Math.round(result.totalHT) / 100,
      orders_count: result.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
