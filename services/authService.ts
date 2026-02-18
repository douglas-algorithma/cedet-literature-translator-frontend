const STORAGE_KEY = "cedet.auth.token";

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
};

export const isAuthenticated = (): boolean => Boolean(getToken());

type LoginResult = { success: true; token: string } | { success: false; message: string };

export const login = async (username: string, password: string): Promise<LoginResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/backend-api";
  const url = `${baseUrl.replace(/\/$/, "")}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    const message =
      (data?.detail as string) ?? (typeof data?.detail === "object" ? "Credenciais inválidas" : "Erro ao autenticar");
    return { success: false, message };
  }
  const token = data?.access_token;
  if (!token) return { success: false, message: "Resposta inválida" };
  setToken(token);
  return { success: true, token };
};

export const logout = (): void => {
  clearToken();
};
