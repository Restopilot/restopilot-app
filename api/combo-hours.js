const COMBO_KEYS = {
  "r1772490949804": { key: "NtlQR2cKMITVgAneX3xK5JuWmBZWDX0VSr-2TLne7Sw", location_id: "c66b876f-fccc-40bf-9743-769be1091257" }, // Afrik N Fusion
  "r1772494496631": { key: "9rr_XzyWSeZpxX42nNCuHbk0JG9RgnSg1WQywZHIQN4", location_id: "bc7bc040-8248-4d57-bb93-13c95bd01d11" }, // Waffle Factory Cergy
  "r1775159807169": { key: "FSowgEZYNvwOM0t6mchemjYtMc-9YxatfcfRrdEZetk", location_id: "ee5c8263-71fc-4f86-b1e6-bc4c2b4ce216" }, // Waffle Factory Belle Épine
};

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function diffDays(from, to) {
  return Math.round((new Date(to + "T00:00:00") - new Date(from + "T00:00:00")) / 86400000);
}

async function fetchChunk(fromDate, toDate, config) {
  const url = `https://partner.combohr.com/api/v1/plannings?start_date=${fromDate}&end_date=${toDate}&location_id=${config.location_id}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) return [];
  const shifts = await resp.json();
  return shifts.filter(s => s.date >= fromDate && s.date <= toDate);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const restoId = req.query.resto_id || "r1772490949804";
    const config = COMBO_KEYS[restoId];

    if (!config) {
      return res.status(200).json({ total_hours: null, shifts_count: 0, error: "Pas de config Combo pour ce restaurant" });
    }

    const singleDate = req.query.date;
    const fromDate = req.query.from || singleDate;
    const toDate = req.query.to || singleDate;

    if (!fromDate) {
      return res.status(200).json({ total_hours: null, shifts_count: 0, error: "Paramètre date ou from/to manquant" });
    }

    // Découper en chunks de 39 jours max si période > 40 jours
    const MAX_DAYS = 39;
    const totalDays = diffDays(fromDate, toDate);
    let allShifts = [];

    if (totalDays <= MAX_DAYS) {
      allShifts = await fetchChunk(fromDate, toDate, config);
    } else {
      let chunkFrom = fromDate;
      while (chunkFrom <= toDate) {
        const chunkTo = addDays(chunkFrom, MAX_DAYS) > toDate ? toDate : addDays(chunkFrom, MAX_DAYS);
        const chunk = await fetchChunk(chunkFrom, chunkTo, config);
        allShifts = allShifts.concat(chunk);
        if (chunkTo >= toDate) break;
        chunkFrom = addDays(chunkTo, 1);
      }
    }

    // Calcul total heures
    let totalMinutes = 0;
    allShifts.forEach(shift => {
      const start = new Date(shift.starts_at);
      const end = new Date(shift.ends_at);
      const durationMinutes = (end - start) / 60000;
      const breakMinutes = shift.break_duration || 0;
      totalMinutes += Math.max(0, durationMinutes - breakMinutes);
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return res.status(200).json({
      from: fromDate,
      to: toDate,
      total_hours: totalHours,
      shifts_count: allShifts.length,
    });

  } catch (err) {
    return res.status(200).json({ total_hours: null, shifts_count: 0, error: err.message });
  }
}
