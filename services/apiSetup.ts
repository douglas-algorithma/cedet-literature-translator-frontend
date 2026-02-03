import { addRequestInterceptor, addResponseInterceptor } from "./httpClient";

let initialized = false;

export const initApiClient = () => {
  if (initialized) return;

  addRequestInterceptor((config) => {
    const headers = new Headers(config.headers);
    headers.set("Accept", "application/json");
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("cedet.auth.token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return { ...config, headers };
  });

  addResponseInterceptor(async (response) => {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    if (response.status === 403) {
      console.warn("Permissão insuficiente para acessar este recurso.");
    }

    if (response.status >= 500) {
      console.error("Erro interno do servidor.");
    }

    return response;
  });

  initialized = true;
};
