import type { Metadata } from "next";
import { ComparadorPaletas } from "@/components/propuesta-colores";

export const metadata: Metadata = {
  title: "Propuesta de colores de gráficas",
  robots: { index: false, follow: false },
};

export default function PropuestaColoresPage() {
  return <ComparadorPaletas />;
}
