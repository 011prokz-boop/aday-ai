export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Тек POST сұранысы қабылданады." });
  }

  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "REPLICATE_API_TOKEN Vercel-де орнатылмаған." });
    }

    const { image, scale = 2, face_enhance = false } = req.body || {};

    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Сурет деректері дұрыс жіберілмеді." });
    }

    // Replicate data URLs are intended for small files. Keep the demo safe and simple.
    if (image.length > 1_350_000) {
      return res.status(413).json({
        error: "Сурет тым үлкен. Қазір 1 МБ-тан кіші суретпен сынап көріңіз."
      });
    }

    const allowedScales = [2, 4, 6, 8];
    const selectedScale = Number(scale);
    if (!allowedScales.includes(selectedScale)) {
      return res.status(400).json({ error: "Масштаб 2×, 4×, 6× немесе 8× болуы керек." });
    }

    const response = await fetch(
      "https://api.replicate.com/v1/models/nightmareai/real-esrgan/predictions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "wait=60"
        },
        body: JSON.stringify({
          input: {
            image,
            scale: selectedScale,
            face_enhance: Boolean(face_enhance)
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.detail || data?.error || "Replicate API қатесі."
      });
    }

    if (data.status === "succeeded" && data.output) {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      return res.status(200).json({ output });
    }

    if (data.status === "failed") {
      return res.status(500).json({ error: data.error || "AI өңдеу сәтсіз аяқталды." });
    }

    return res.status(202).json({
      prediction_id: data.id,
      status: data.status,
      message: "AI өңдеуі әлі жүріп жатыр. Қайта сұрау керек."
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Белгісіз сервер қатесі." });
  }
}
