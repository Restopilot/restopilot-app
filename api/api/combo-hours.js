const COMBO_KEYS = {
  "r1772490949804": { key: "NtlQR2cKMITVgAneX3xK5JuWmBZWDX0VSr-2TLne7Sw", location_id: "c66b876f-fccc-40bf-9743-769be1091257" }, // Afrik N Fusion
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const restoId = req.query.resto_id || "r1772490949804";
    const config = COMBO_KEYS[restoId];

    if (!config) {
      return res.status(200).json({ date, total_hours: null, shifts_count: 0, error: "Pas de config Combo pour ce restaurant" });
    }

    const url = `https://partner.combohr.com/api/v1/plannings?start_date=${date}&end_date=${date}&location_id=${config.location_id}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      return res.status(200).json({ date, total_hours: null, shifts_count: 0, error: `Combo API error ${resp.status}` });
    }

    const shifts = await resp.json();

    // Calcul des heures travaillées pour la date demandée uniquement
    const dayShifts = shifts.filter(s => s.date === date);
    let totalMinutes = 0;

    dayShifts.forEach(shift => {
      const start = new Date(shift.starts_at);
      const end = new Date(shift.ends_at);
      const durationMinutes = (end - start) / 60000; // ms -> minutes
      const breakMinutes = shift.break_duration || 0;
      const workedMinutes = Math.max(0, durationMinutes - breakMinutes);
      totalMinutes += workedMinutes;
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // arrondi à 0.1h

    return res.status(200).json({
      date,
      total_hours: totalHours,
      shifts_count: dayShifts.length,
      location: config.location_id,
    });

  } catch (err) {
    return res.status(200).json({ date: req.query.date, total_hours: null, shifts_count: 0, error: err.message });
  }
}
