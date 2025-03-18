import axios from "axios";
import { getAuthToken } from "./AuthApi"; // ✅ Agora pegamos o token corretamente

const api = axios.create({
  baseURL: "https://api.zendry.com.br/v1",
  headers: { "Content-Type": "application/json" }
});

// 🔹 Intercepta requisições para adicionar o token automaticamente
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken(); // ✅ Obtém o token de forma correta
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
