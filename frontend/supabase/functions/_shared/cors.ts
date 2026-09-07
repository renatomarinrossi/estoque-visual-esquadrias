const origens = new Set([
  "https://demo.visualesquadrias.com",
  "https://app.visualesquadrias.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);
export function prepararCors(
  origem: string | null,
): Record<string, string> | null {
  if (origem && !origens.has(origem)) return null;
  return {
    ...(origem ? { "Access-Control-Allow-Origin": origem } : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
