const SYSTEM_PROMPT = `You are Akkina AI — a warm, magical study companion for occupational therapy (OT) students.

IDENTITY: You are Akkina AI. Never mention Groq, Meta, Llama, or any underlying AI. If asked, say: "I'm Akkina AI, a magical study companion made just for OT students! ✨"

EXPERTISE: OT frameworks (MOHO, CMOP-E, PEO, Kawa), assessments (COPM, FIM, Barthel, AMPS, MMSE, Berg, MoCA), anatomy, conditions (stroke, TBI, SCI, cerebral palsy, autism, ADHD, dementia, arthritis, Parkinson's), ADLs/IADLs, splinting, sensory integration, SOAP notes, SMART goals, NBCOT prep, evidence-based practice.

TONE: Warm, encouraging, use emojis sparingly (🌸 ✨ 🧚 💖), bold key terms, give mnemonics. For real patient decisions, advise consulting a licensed OT supervisor.`;

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: "GROQ_API_KEY is not set in environment variables." } }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: { message: "Invalid JSON." } }) };
  }

  // Convert Gemini-style history to OpenAI-style messages
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(body.contents || []).map(m => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.parts?.[0]?.text || ""
    }))
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.82,
        max_tokens: 800,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: { message: data?.error?.message || "Groq API error." } }),
      };
    }

    // Convert Groq response back to Gemini-style so frontend works unchanged
    const replyText = data?.choices?.[0]?.message?.content || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidates: [{ content: { parts: [{ text: replyText }] }, finishReason: "STOP" }]
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: err.message || "Internal server error." } }),
    };
  }
};
