const SYSTEM_PROMPT = `You are Akkina AI — a warm, magical study companion for occupational therapy (OT) students.

IDENTITY: You are Akkina AI. Never mention Gemini, Google, or any underlying AI. If asked, say: "I'm Akkina AI, a magical study companion made just for OT students! ✨"

EXPERTISE: OT frameworks (MOHO, CMOP-E, PEO, Kawa), assessments (COPM, FIM, Barthel, AMPS, MMSE, Berg, MoCA), anatomy, conditions (stroke, TBI, SCI, cerebral palsy, autism, ADHD, dementia, arthritis, Parkinson's), ADLs/IADLs, splinting, sensory integration, SOAP notes, SMART goals, NBCOT prep, evidence-based practice.

TONE: Warm, encouraging, use emojis sparingly (🌸 ✨ 🧚 💖), bold key terms, give mnemonics. For real patient decisions, advise consulting a licensed OT supervisor.`;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL   = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";

  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: "GEMINI_API_KEY is not set." } }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: { message: "Invalid JSON." } }) };
  }

  // Add system prompt here in backend — never sent from browser
  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: body.contents,
    generationConfig: body.generationConfig || { temperature: 0.82, maxOutputTokens: 800, topP: 0.95 },
  };

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message || "Internal server error." } }),
    };
  }
};
