const ZELTY_API_KEY = "MTk4NzU68xOv4nIh5aqjJBgJrc9kWwKDo84=";
const ZELTY_API_URL = "https://api.zelty.fr/2.7/orders";

async function fetchOrders(queryParams) {
  let totalTTC = 0;
  let totalHT = 0;
  let count = 0;
  let offset = 0;
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
      if (o.status !== "cancelled") {
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

    // Essai 1 : par numéro de journée Zelty
    let result = await fetchOrders(`noz=${date}`);

    // Essai 2 : par plage horaire heure française
    if (result.count === 0) {
      result = await fetchOrders(`from=${date}T00:00:00%2B01:00&to=${date}T23:59:59%2B01:00`);
    }

    // Essai 3 : par plage horaire UTC
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
