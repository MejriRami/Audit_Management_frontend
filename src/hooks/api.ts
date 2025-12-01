import axios from "axios";

interface Api {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  headers?: any;
}

let api = ({ url, method, data, headers }: Api) => {
  return axios({
    url,
    method,
    data,
    headers
  });
};
export default api;
