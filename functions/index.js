const {onRequest} = require("firebase-functions/v2/https");
const axios = require("axios");

// 🔥 Armazena o token em memória para reutilização
let tokenCache = null;
let tokenExpiration = null;

/**
 * 🚀 Função para obter o Token de Acesso
 * Obtém um novo token OAuth2.0 da Zendry e armazena na memória.
 */
async function getToken() {
  if (tokenCache && tokenExpiration > Date.now()) {
    return tokenCache;
  }
  try {
    const response = await axios.post("https://api.zendry.com.br/oauth/token", {
      client_id: "0d4a44fe-44fe-b8d1-45c5a33d-880ecc747244", // SEU CLIENT_ID
      client_secret: "d0c7582b-8f09-4ae5-b3ec-0387b46fdf9d", // SEU CLIENT_SECRET
      grant_type: "client_credentials",
    });

    tokenCache = response.data.access_token;
    tokenExpiration = Date.now() + response.data.expires_in * 1000;

    console.log("✅ Token obtido com sucesso:", tokenCache);
    return tokenCache;
  } catch (error) {
    console.error("❌ Erro ao obter token:", error.response?.data || error.message);
    throw new Error("Falha ao autenticar na API da Zendry.");
  }
}

/**
 * 🚀 Função para testar se o token está sendo gerado corretamente
 * Acesse esta função para validar a autenticação com a Zendry.
 */
exports.testarToken = onRequest(async (req, res) => {
  try {
    const token = await getToken();
    res.status(200).send({ token });
  } catch (error) {
    res.status(500).send({ error: "Erro ao gerar token" });
  }
});
