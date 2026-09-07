import { fazerBackupCompleto } from "./backupService";
import { supabase } from "../supabase";

import type { BackupCompleto } from "./restaurarBackup";

export type ResultadoRestauracao = {
  sucesso: boolean;
  produtos: number;
  fornecedores: number;
  usuarios: number;
  vendas: number;
  parcelas: number;
  recebimentos: number;
  contas_pagar: number;
};

export async function restaurarBackupCompleto(
  backup: BackupCompleto
): Promise<ResultadoRestauracao> {
  await fazerBackupCompleto("PRE_RESTAURACAO");
  const { data, error } = await supabase.rpc("restaurar_backup_completo", {
    p_backup: backup,
  });

  if (error) {
    console.error(error);
    throw new Error(error.message || "Não foi possível restaurar o backup.");
  }

  return data as ResultadoRestauracao;
}

