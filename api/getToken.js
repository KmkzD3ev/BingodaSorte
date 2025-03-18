export default async function handler(req, res) {
  console.log("✅ Recebendo requisição para gerar token...");

  console.log("✅ Recebendo requisição para gerar token...");

  // 🔹 Adicionando cabeçalhos CORS para permitir requisições de outros domínios
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 🔹 Se a requisição for um OPTIONS (pré-verificação do CORS), retorna OK imediatamente
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const response = await fetch("https://api.zendry.com.br/auth/generate_token", {
      method: "POST",
      headers: {
        "Authorization": "Basic OWVhYjc2MTAtZTgzZC00NDUyLTg5M2MtMzFhYWNjNzYzNDI3OmFhYTIzZmFhLThkOWItNGU1OC04MmVhLTE0NDIyMzA2MzQyZQ==",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ grant_type: "client_credentials" })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro na API da Zendry:", errorData);
      return res.status(response.status).json({ error: errorData.error || "Erro ao gerar token" });
    }

    const data = await response.json();
    console.log("✅ Token gerado com sucesso:", data.access_token);

    return res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    });
  } catch (error) {
    console.error("❌ Erro interno ao gerar token:", error);
    return res.status(500).json({ error: "Erro interno ao gerar token", details: error.message });
  }
}
