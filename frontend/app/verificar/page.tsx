import type { Metadata } from "next"
import { VerifyCertificateForm } from "@shared/pages/verify-certificate-form"

export const metadata: Metadata = {
  title: "Verificar certificado",
  description: "Comprueba la autenticidad de un certificado emitido por LinuxLab UFPS.",
}

// Publica, sin sesion: la usa quien recibe un certificado y quiere comprobarlo.
export default function VerificarFormPage() {
  return <VerifyCertificateForm />
}
