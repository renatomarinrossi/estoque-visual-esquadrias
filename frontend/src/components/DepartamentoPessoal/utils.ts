import type { StatusPagamentoDP } from "../../types/DepartamentoPessoal";

export const campo =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";
export const botao =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
export const secundario =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
export const card = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
export const moeda = (n: number) =>
  Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const dataBR = (s?: string | null) =>
  s ? s.slice(0, 10).split("-").reverse().join("/") : "—";
export const dataISO = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dividirSalario = (n: number) => {
  const centavos = Math.round(Number(n) * 100);
  const adiantamento = Math.round(centavos * 0.4);
  return [adiantamento / 100, (centavos - adiantamento) / 100];
};
export const rotuloStatus = (status: StatusPagamentoDP) =>
  ({
    PAGO: "Pago",
    PARCIAL: "Parcial",
    EM_ABERTO: "Pendente",
    CANCELADO: "Cancelado",
  })[status];
