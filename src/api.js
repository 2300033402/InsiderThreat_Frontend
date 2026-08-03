import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("trustToken");
  if (token) config.headers["X-Device-ID"] = token;
  return config;
});

export default api;