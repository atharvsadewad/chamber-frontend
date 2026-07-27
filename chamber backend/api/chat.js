// ✅ Chamber AI Backend — PRODUCTION READY (FIXED)

export default async function handler(req, res) {

  // 🌐 CORS
  const allowedOrigins = [
    "https://chamber-beta.vercel.app",
    "http://localhost:3000"
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    // 🔐 SAFE BODY PARSE
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const message = body?.message;

    if (!message) {
      return res.status(400).json({
        response: "Message is required"
      });
    }

    // 🔐 ENV VARIABLES
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;

    if (!GROQ_KEY) {
      return res.status(500).json({
        response: "Groq API key missing."
      });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("❌ Supabase env missing");
    }

    // 🔍 STEP 1: FETCH CONTEXT FROM SUPABASE
    let context = "";

    try {
      const safeMessage = encodeURIComponent(message);

      const lawRes = await fetch(
        `${SUPABASE_URL}/rest/v1/laws?select=*&or=(title.ilike.%${safeMessage}%,content.ilike.%${safeMessage}%)&limit=3`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      const lawData = await lawRes.json();

      if (Array.isArray(lawData) && lawData.length > 0) {
        context = lawData.map(law => `
Title: ${law.title}
Content: ${law.content}
`).join("\n\n");
      }

    } catch (err) {
      console.error("⚠️ Supabase fetch error:", err);
    }

    // 🤖 STEP 2: GROQ PROMPT & CALL
    const systemPrompt = `You are Chamber AI, an Indian legal assistant.

If user asks to generate a draft:
- Format it properly
- Use formal legal language
- Structure it clearly

Use the following legal context if available:

${context || "No specific legal data found."}

Respond clearly in simple language.`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await groqResponse.json();

    console.log("🧠 Groq RAW:", JSON.stringify(data, null, 2));

    // ❌ GROQ ERROR HANDLING
    if (data.error) {
      console.error("❌ Groq API Error:", data.error);
      return res.status(500).json({
        response: "Groq error: " + data.error.message
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    // ❌ EMPTY RESPONSE HANDLING
    if (!reply) {
      return res.status(500).json({
        response: "AI could not generate response. Try again."
      });
    }

    // ✅ SUCCESS RESPONSE (VERY IMPORTANT)
    return res.status(200).json({
      response: reply
    });

  } catch (error) {
    console.error("💥 Backend Crash:", error);
    return res.status(500).json({
      response: "Internal server error"
    });
  }
}
