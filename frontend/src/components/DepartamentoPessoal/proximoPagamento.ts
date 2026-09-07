import type { PagamentoDP } from "../../types/DepartamentoPessoal";
export function selecionarProximoPagamento(
  pagamentos: PagamentoDP[],
  hoje: string,
) {
  return pagamentos
    .filter((p) => p.status === "EM_ABERTO")
    .sort((a, b) => {
      const af = a.data_vencimento >= hoje ? 0 : 1;
      const bf = b.data_vencimento >= hoje ? 0 : 1;
      return (
        af - bf ||
        (af
          ? b.data_vencimento.localeCompare(a.data_vencimento)
          : a.data_vencimento.localeCompare(b.data_vencimento)) ||
        a.id - b.id
      );
    })[0];
}
