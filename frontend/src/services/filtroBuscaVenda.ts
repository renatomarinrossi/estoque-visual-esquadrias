// Valores entre aspas evitam que vírgulas e parênteses do texto virem filtros.
export function filtroBuscaVenda(busca: string): string {
  const termo = busca.trim();
  if (!termo) return "";
  const padrao = JSON.stringify("%" + termo.replace(/[\\%_*]/g, "\\$&") + "%");
  return `cliente.ilike.${padrao},cidade.ilike.${padrao}`;
}
