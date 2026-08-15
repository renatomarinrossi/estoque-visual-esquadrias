import type { jsPDF } from "jspdf";
import logoVisualUrl from "../assets/logo-visual.png";

let logoVisualDataUrl: string | null = null;

async function carregarLogoVisual() {
  if (logoVisualDataUrl) return logoVisualDataUrl;

  const resposta = await fetch(logoVisualUrl);
  if (!resposta.ok) throw new Error("Não foi possível carregar o logo da Visual Esquadrias.");

  const arquivo = await resposta.blob();
  logoVisualDataUrl = await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível preparar o logo para o PDF."));
    leitor.readAsDataURL(arquivo);
  });

  return logoVisualDataUrl;
}

export async function adicionarCabecalhoPdf(doc: jsPDF, titulo: string) {
  const logo = await carregarLogoVisual();

  doc.addImage(logo, "PNG", 14, 8, 18, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(3, 105, 150);
  doc.text("Visual Esquadrias", 36, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(titulo, 14, 34);

  return 43;
}

