export type Traveler = { id: string; name: string; email: string };

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  return import.meta.env.DEV ? "http://localhost:4000/api" : "/api";
};

const API = getApiUrl();

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(API + cleanPath, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !cleanPath.includes("/auth/login") && !cleanPath.includes("/auth/register")) {
      localStorage.removeItem("packwise_token");
      localStorage.removeItem("packwise_traveler");
      window.location.reload();
    }
    throw new Error(data.message ?? "Something went wrong at the departure gate.");
  }
  return data;
}
