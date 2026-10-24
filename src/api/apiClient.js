const API_URL = "https://alertagro-api.onrender.com/api";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("alertagro_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data =
    response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Não foi possível concluir a operação.");
  }

  return data;
}
