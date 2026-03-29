const ZELTY_API_KEY = "MTk4NzU68xOv4nIh5aqjJBgJrc9kWwKDo84=";
const ZELTY_API_URL = "https://api.zelty.fr/2.7/orders";

// Calcule le bon offset Paris (CET +01:00 hiver / CEST +02:00 été)
function getParisOffset(date) {
  const year = parseInt(date.slice(0, 4));
  const month = parseInt(date.slice(5, 7));
  const day = parseInt(date.slice(8, 10));

  // Dernier dimanche de mars = début CEST
  const dstStart = lastSundayOf(year, 3);
  // Dernier dimanche d'octobre = fin CEST
  const dstEnd = lastSundayOf(year, 10);

  const d = new Date(Date.UTC(year, month - 1, day));
  const isSummer = d >= dstStart && d < dstEnd;
  return isSummer ? "%2B02:00" : "%2B01:00";
}

function lastSundayOf(year, month) {
  // Dernier jour du mois
  const last = new Date(Date.UTC(year, month, 0));
  // Reculer jusqu'au dimanche (0 = dimanche)
  last.setUTCDate(last.getUTCDate() - last.getUTCDay());
  return last;
}

async function fetchOrders(queryParams) {
  let totalTTC = 0, totalHT = 0, count = 0, offset = 0;
  while (true) {
    const url = `${ZELTY_API_URL}?${queryParams}&limit=200&offset=${offset}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${ZELTY_API_KEY}` },
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
    const tz = getParisOffset(date);

    // Tentative 1 : from/to avec timezone Paris auto (CET ou CEST)
    let result = await fetchOrders(`from=${date}T00:00:00${tz}&to=${date}T23:59:59${tz}`);

    // Tentative 2 : noz (numéro de service Zelty)
    if (result.count === 0) {
      result = await fetchOrders(`noz=${date}`);
    }

    // Tentative 3 : fallback UTC
    if (result.count === 0) {
      result = await fetchOrders(`from=${date}T00:00:00&to=${date}T23:59:59`);
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
