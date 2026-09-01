"use client"

import { Award, Download, FileText, GraduationCap } from "lucide-react"
import { env } from "@/lib/config/env"
import { useGroupCertificates } from "@/lib/api/queries"
import { Skeleton } from "@shared/components/skeleton"

/**
 * Certificados emitidos de un curso finalizado (o archivado): el acta del
 * curso, el certificado de instructor y el de cada estudiante, todos
 * descargables de nuevo desde las columnas congeladas del backend.
 */
export function GroupCertificatesPanel({ groupId }: { groupId: string }) {
  const query = useGroupCertificates(groupId)
  const data = query.data

  if (query.isLoading) {
    return (
      <div className="mb-6 rounded-xl border border-table-line bg-card p-5">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
    )
  }
  if (!data) return null

  const { certificates, instructorCertificate } = data
  const actaHref = `${env.backendUrl}/api/groups/${groupId}/certificates/acta`

  return (
    <div className="mb-6 rounded-xl border border-table-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">
              Certificados emitidos: {certificates.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {instructorCertificate
                ? `${instructorCertificate.studentsCertified} de ${instructorCertificate.studentsTotal} estudiantes cumplieron la regla de certificación.`
                : "Aún no hay certificados para este curso."}
            </p>
          </div>
        </div>
        <a
          href={actaHref}
          className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <FileText className="h-4 w-4" />
          Descargar acta
        </a>
      </div>

      {instructorCertificate && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-table-line px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Award className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">
              Certificado de instructor — {instructorCertificate.holderName}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {instructorCertificate.code}
            </span>
          </div>
          <a
            href={`${env.backendUrl}/api/certificates/${instructorCertificate.code}/pdf`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
        </div>
      )}

      {certificates.length > 0 && (
        <div className="mt-3 space-y-2">
          {certificates.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-table-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{c.holderName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.holderCode ? `Código ${c.holderCode} · ` : ""}Temas {c.topicsCompleted}/
                  {c.topicsTotal} · Definitiva {c.definitive} ·{" "}
                  <span className="font-mono">{c.code}</span>
                </p>
              </div>
              <a
                href={`${env.backendUrl}/api/certificates/${c.code}/pdf`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
