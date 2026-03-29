const RESEND_API_KEY = "re_bkga53Ts_Dd5csNTcYDVyqskq58bgqvBi";
const ZELTY_API_KEY = "MTk4NzU68xOv4nIh5aqjJBgJrc9kWwKDo84=";
const SUPABASE_URL = "https://yhvbnlgowccixqslijia.supabase.co";
const SUPABASE_KEY = "sb_publishable_rURgUoNVrGxQm4e6OjrxsA_E5Skv2Tl";

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
  const isSummer = d >= dstStart && d < dstEnd;
  return isSummer ? "%2B02:00" : "%2B01:00";
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
  // Tentative 1 : from/to avec timezone Paris auto (CET ou CEST)
  let result = await fetchOrders(date, `from=${date}T00:00:00${tz}&to=${date}T23:59:59${tz}`);
  // Tentative 2 : noz
  if (result.count === 0) {
    result = await fetchOrders(date, `noz=${date}`);
  }
  // Tentative 3 : fallback UTC
  if (result.count === 0) {
    result = await fetchOrders(date, `from=${date}T00:00:00&to=${date}T23:59:59`);
  }
  return { ca_ttc: Math.round(result.totalTTC) / 100, ca_ht: Math.round(result.totalHT) / 100, orders_count: result.count };
}
