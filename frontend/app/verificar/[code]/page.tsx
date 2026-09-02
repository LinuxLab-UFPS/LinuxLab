import type { Metadata } from "next"
import { env } from "@/lib/config/env"
import {
  CertificateFound,
  CertificateNotFound,
  type VerifiedCertificate,
} from "@shared/pages/verify-certificate"

export const metadata: Metadata = {
  title: "Verificar certificado",
  description: "Comprueba la autenticidad de un certificado emitido por LinuxLab UFPS.",
}

// El endpoint es publico y los datos quedan congelados al emitir, pero el
// certificado podria revocarse: sin cache para no verificar contra una copia
// vieja.
export const dynamic = "force-dynamic"

async function verify(code: string): Promise<VerifiedCertificate | null> {
  try {
    const res = await fetch(`${env.serverBackendUrl}/api/certificates/${encodeURIComponent(code)}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return (await res.json()) as VerifiedCertificate
  } catch {
    // Backend caido o sin red: se trata como no verificable, que es lo unico
    // honesto que se le puede decir a quien consulta.
    return null
  }
}

export default async function VerificarPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const result = await verify(code)

  if (!result) return <CertificateNotFound code={code} />

  // El PDF lo sirve el backend, asi que el enlace apunta al navegador y no al
  // nombre interno del servicio.
  return (
    <CertificateFound
      result={result}
      pdfUrl={`${env.backendUrl}/api/certificates/${encodeURIComponent(code)}/pdf`}
    />
  )
}
