import axios from "axios";

const API_URL = "https://bingodasorte2-f9u6qndyf-eduardos-projects-77342803.vercel.app/api/getToken";

// 🔹 Função para buscar um novo token
export const fetchToken = async () => {
  try {
    console.log("🔄 Buscando novo token...");

    const response = await axios.post(API_URL);
    const { access_token, expires_in } = response.data;

    const expirationTime = Date.now() + expires_in * 1000;

    // 🔹 Armazena no localStorage para reutilizar depois
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("expires_at", expirationTime);

    console.log("✅ Token obtido com sucesso:", access_token);
    return access_token;
  } catch (error) {
    console.error("❌ Erro ao obter token:", error);
    return null;
  }
};

// 🔹 Função para obter o token atual ou buscar um novo se expirado
export const getAuthToken = async () => {
  const storedToken = localStorage.getItem("access_token");
  const expiresAt = localStorage.getItem("expires_at");

  if (!storedToken || Date.now() > expiresAt) {
    return await fetchToken();
  }

  return storedToken;
};
