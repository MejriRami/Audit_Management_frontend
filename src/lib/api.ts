import axios from "axios";

// Backend base URL (comes from env vars)
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.warn("⚠️ VITE_API_URL is not defined");
}

// Create a single Axios instance for the whole app
export const api = axios.create({
  baseURL: API_URL,          // e.g. https://audit-backend-kbgea.ondigitalocean.app
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true,  // enable only if you use cookies/sessions
});
