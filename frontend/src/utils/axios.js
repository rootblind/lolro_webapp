import axios from "axios"

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api"
const api = axios.create({
    baseURL: BASE_URL
});


// intercept responses
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 429) {
      window.dispatchEvent(new Event("rate-limited"));
    }
    return Promise.reject(error);
  }
);


export default api;