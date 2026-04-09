exports.handler = async function (event) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL   = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: "GEMINI_API_KEY is not set in environment variables." } }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: { message: "Invalid JSON body." } }) };
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
