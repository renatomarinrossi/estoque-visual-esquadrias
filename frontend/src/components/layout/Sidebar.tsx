import { NavLink } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
} from "lucide-react";

import useUsuario from "../../hooks/useUsuario";
import logoVisual from "../../assets/logo-visual.png";

type ItemMenu = {
  nome: string;
  rota: string;
  icone: typeof LayoutDashboard;
};

function ItemNavegacao({ item }: { item: ItemMenu }) {
  const Icon = item.icone;

  return (
    <NavLink
      to={item.rota}
      className={({ isActive }) =>
        `mx-2 flex min-h-10 items-center gap-2.5 rounded-r-lg border-l-[3px] px-2.5 py-2.5 text-[15px] font-medium transition-colors ${
          isActive
            ? "border-white bg-blue-700/80 text-white"
            : "border-transparent text-blue-50 hover:bg-blue-800/70 hover:text-white"
        }`
      }
    >
      <Icon size={18} strokeWidth={1.9} className="shrink-0" />
      <span className="whitespace-nowrap">{item.nome}</span>
    </NavLink>
  );
}

function TituloGrupo({ titulo }: { titulo: string }) {
  return (
    <div className="px-4 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-200">
      {titulo}
    </div>
  );
}

export default function Sidebar() {
  const usuario = useUsuario();
  const eDesenvolvedor = usuario?.perfil === "DESENVOLVEDOR";
  const podeVerFinanceiro = eDesenvolvedor || usuario?.perfil === "GERENCIAL";

  const menuEstoque: ItemMenu[] = [
    { nome: "Dashboard", rota: "/dashboard", icone: LayoutDashboard },
    { nome: "Produtos", rota: "/produtos", icone: Package },
    { nome: "Entrada", rota: "/entrada", icone: ArrowDownCircle },
    { nome: "Saída", rota: "/saida", icone: ArrowUpCircle },
    ...(eDesenvolvedor
      ? [{ nome: "Movimentações", rota: "/movimentacoes", icone: ClipboardList }]
      : []),
    { nome: "Compras", rota: "/compras", icone: ShoppingCart },
    { nome: "Fornecedores", rota: "/fornecedores", icone: Truck },
    { nome: "Lixeira", rota: "/lixeira", icone: Trash2 },
  ];

  const menuFinanceiro: ItemMenu[] = [
    ...(podeVerFinanceiro
      ? [{ nome: "Dashboard Financeiro", rota: "/dashboard-financeiro", icone: LayoutDashboard }]
      : []),
    { nome: "Vendas", rota: "/vendas", icone: DollarSign },
    { nome: "Obras Finalizadas", rota: "/obras-finalizadas", icone: ClipboardList },
    ...(eDesenvolvedor
      ? [{ nome: "Logs Financeiros", rota: "/logs-financeiros", icone: ClipboardList }]
      : []),
    { nome: "Contas a Receber", rota: "/contas-receber", icone: DollarSign },
    { nome: "Contas a Pagar", rota: "/contas-pagar", icone: CreditCard },
  ];

  const menuSistema: ItemMenu[] = [
    { nome: "Sistema", rota: "/sistema", icone: Settings },
  ];

  const menuAdministracao: ItemMenu[] = eDesenvolvedor
    ? [
        { nome: "Usuários", rota: "/usuarios", icone: Users },
      ]
    : [];

  return (
    <aside className="flex w-[218px] shrink-0 flex-col bg-blue-900 text-white">
      <div className="flex min-h-[82px] items-center gap-3 border-b border-blue-700/80 px-4 py-4">
        <img
          src={logoVisual}
          alt="Logo Visual Esquadrias"
          className="h-11 w-11 shrink-0 rounded-full bg-white object-contain"
        />
        <div className="text-lg font-semibold leading-tight tracking-tight">
          Visual
          <br />
          Esquadrias
        </div>
      </div>

      <nav
        className="mt-1 flex-1 overflow-y-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ msOverflowStyle: "none" }}
      >
        <TituloGrupo titulo="Estoque" />
        {menuEstoque.map((item) => <ItemNavegacao key={item.rota} item={item} />)}

        <div className="mx-4 mt-3 border-t border-blue-700/80" />
        <TituloGrupo titulo="Financeiro" />
        {menuFinanceiro.map((item) => <ItemNavegacao key={item.rota} item={item} />)}

        <div className="mx-4 mt-3 border-t border-blue-700/80" />
        <TituloGrupo titulo="Sistema" />
        {menuSistema.map((item) => <ItemNavegacao key={item.rota} item={item} />)}

        {menuAdministracao.length > 0 && (
          <>
            <div className="mx-4 mt-3 border-t border-blue-700/80" />
            <TituloGrupo titulo="Administração" />
            {menuAdministracao.map((item) => <ItemNavegacao key={item.rota} item={item} />)}
          </>
        )}
      </nav>
    </aside>
  );
}





