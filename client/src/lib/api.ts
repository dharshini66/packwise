export type Traveler = { id: string; name: string; email: string };
const API = import.meta.env.VITE_API_URL!;
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(API + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? "Something went wrong at the departure gate.");
  return data;
}
