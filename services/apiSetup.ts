import { addRequestInterceptor, addResponseInterceptor } from "./httpClient";
import { toast } from "sonner";
import { clearToken, getToken } from "./authService";

let initialized = false;

export const initApiClient = () => {
  if (initialized) return;

  addRequestInterceptor((config) => {
    const headers = new Headers(config.headers);
    headers.set("Accept", "application/json");
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return { ...config, headers };
  });

  addResponseInterceptor(async (response) => {
    if (response.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    if (response.status === 403) {
      toast.error("Você não tem permissão para acessar este recurso.");
    }

    if (response.status >= 500) {
      console.error("Erro interno do servidor.");
    }

    return response;
  });

  initialized = true;
};
