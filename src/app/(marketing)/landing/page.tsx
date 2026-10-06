import type { Metadata } from "next";
import LandingPage, { generateMetadata as metadataLanding } from "../page";

// Vista previa de la landing nueva mientras `/` sigue redirigiendo a /login.
export async function generateMetadata(): Promise<Metadata> {
  return { ...(await metadataLanding()), robots: { index: false, follow: false } };
}

export default LandingPage;
