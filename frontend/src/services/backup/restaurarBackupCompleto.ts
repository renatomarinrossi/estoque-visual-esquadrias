import { supabase } from "../supabase";
import type { BackupCompleto } from "./restaurarBackup";

export async function restaurarBackupCompleto(
  backup: BackupCompleto
) {
  // Remove todos os registros

  await supabase
    .from("lixeira")
    .delete()
    .neq("id", 0);

  await supabase
    .from("produtos")
    .delete()
    .neq("codigo", "");

  await supabase
    .from("fornecedores")
    .delete()
    .neq("id", 0);

  await supabase
    .from("usuarios")
    .delete()
    .neq("id", 0);

  // Insere novamente exatamente como estava

  if (backup.fornecedores.length > 0) {
    const { error } = await supabase
      .from("fornecedores")
      .insert(backup.fornecedores);

    if (error) throw error;
  }

  if (backup.produtos.length > 0) {
    const { error } = await supabase
      .from("produtos")
      .insert(backup.produtos);

    if (error) throw error;
  }

  if (backup.usuarios.length > 0) {
    const { error } = await supabase
      .from("usuarios")
      .insert(backup.usuarios);

    if (error) throw error;
  }

  if (backup.lixeira.length > 0) {
    const { error } = await supabase
      .from("lixeira")
      .insert(backup.lixeira);

    if (error) throw error;
  }
}
