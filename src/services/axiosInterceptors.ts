import axiosInstance from "./axiosInstance";

axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("token");

    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);