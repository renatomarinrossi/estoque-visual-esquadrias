import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import type { StatusPagamentoDP } from "../../types/DepartamentoPessoal";

import { secundario, rotuloStatus } from "./utils";

export function Status({ status }: { status: StatusPagamentoDP }) {
  const cor =
    status === "PAGO"
      ? "bg-green-100 text-green-800"
      : status === "PARCIAL"
        ? "bg-blue-100 text-blue-800"
        : status === "CANCELADO"
          ? "bg-slate-100 text-slate-600"
          : "bg-amber-100 text-amber-800";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cor}`}
    >
      {rotuloStatus(status)}
    </span>
  );
}

export function Campo({
  nome,
  children,
}: {
  nome: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-1.5 block">{nome}</span>
      {children}
    </label>
  );
}

export function Modal({
  titulo,
  children,
  ocupado,
  fechar,
}: {
  titulo: string;
  children: ReactNode;
  ocupado: boolean;
  fechar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) fechar();
      }}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-800 shadow-xl backdrop:bg-slate-950/45"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={id} className="text-xl font-bold text-blue-900">
          {titulo}
        </h2>
        <button
          type="button"
          aria-label="Fechar"
          disabled={ocupado}
          onClick={fechar}
          className={secundario}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return <p className="py-10 text-center text-sm text-slate-500">{texto}</p>;
}
