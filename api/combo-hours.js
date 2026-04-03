const COMBO_KEYS = {
  "r1772490949804": { key: "NtlQR2cKMITVgAneX3xK5JuWmBZWDX0VSr-2TLne7Sw", location_id: "c66b876f-fccc-40bf-9743-769be1091257" },
};

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

    // Support date unique (date=) ou plage (from= & to=)
    const singleDate = req.query.date;
    const fromDate = req.query.from || singleDate;
    const toDate = req.query.to || singleDate;

    if (!fromDate) {
      return res.status(200).json({ total_hours: null, shifts_count: 0, error: "Paramètre date ou from/to manquant" });
    }

    // Combo retourne max 40 jours — on peut passer from/to directement
    const url = `https://partner.combohr.com/api/v1/plannings?start_date=${fromDate}&end_date=${toDate}&location_id=${config.location_id}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      return res.status(200).json({ total_hours: null, shifts_count: 0, error: `Combo API error ${resp.status}` });
    }

    const allShifts = await resp.json();

    // Filtrer uniquement les shifts dont la date est dans la plage demandée
    const shifts = allShifts.filter(s => s.date >= fromDate && s.date <= toDate);

    let totalMinutes = 0;
    shifts.forEach(shift => {
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
      shifts_count: shifts.length,
    });

  } catch (err) {
    return res.status(200).json({ total_hours: null, shifts_count: 0, error: err.message });
  }
}
