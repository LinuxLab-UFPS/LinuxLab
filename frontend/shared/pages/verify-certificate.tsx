import Link from "next/link"
import { BadgeCheck, FileX2, Download } from "lucide-react"

/**
 * Verificacion publica de un certificado.
 *
 * La lee un tercero —una empresa, otra universidad— con el codigo impreso en
 * el PDF, asi que no pide sesion y no ensena nada que no este ya en el papel
 * que tiene delante.
 */

type StudentCertificate = {
  code: string
  holderName: string
  holderCode: string | null
  groupName: string
  groupNumber: number
  teacherName: string
  courseStartedAt: string
  topicsCompleted: number
  topicsTotal: number
  definitive: number | null
  issuedAt: string
}

type InstructorCertificate = {
  code: string
  holderName: string
  groupName: string
  groupNumber: number
  courseStartedAt: string
  issuedAt: string
}

export type VerifiedCertificate =
  | { role: "student"; certificate: StudentCertificate }
  | { role: "instructor"; certificate: InstructorCertificate }

const dateFmt = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" })
const formatDate = (value: string) => dateFmt.format(new Date(value))

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  )
}

/** Codigo valido: se muestra a quien pertenece y por que se emitio. */
export function CertificateFound({
  result,
  pdfUrl,
}: {
  result: VerifiedCertificate
  pdfUrl: string
}) {
  const { role, certificate } = result
  const isStudent = role === "student"
  const student = isStudent ? (certificate as StudentCertificate) : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <BadgeCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Certificado verificado</h1>
            <p className="text-sm text-muted-foreground">
              {isStudent ? "Certificado de finalización" : "Certificado de instructor"}
            </p>
          </div>
        </div>

        <p className="mt-6 text-2xl font-bold text-foreground">{certificate.holderName}</p>
        {student?.holderCode ? (
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            Código estudiantil {student.holderCode}
          </p>
        ) : null}

        <dl className="mt-6 grid grid-cols-1 gap-5 border-t border-border pt-6 sm:grid-cols-2">
          <Field label="Curso" value={certificate.groupName} />
          <Field label="Grupo" value={`N° ${certificate.groupNumber}`} />
          {student ? <Field label="Docente" value={student.teacherName} /> : null}
          {student ? (
            <Field label="Temas completados" value={`${student.topicsCompleted}/${student.topicsTotal}`} />
          ) : null}
          {student ? (
            <Field label="Definitiva" value={student.definitive == null ? "—" : String(student.definitive)} />
          ) : null}
          <Field label="Inicio del curso" value={formatDate(certificate.courseStartedAt)} />
          <Field label="Emitido" value={formatDate(certificate.issuedAt)} />
        </dl>

        <div className="mt-6 border-t border-border pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Código de verificación
          </p>
          <p className="mt-1 break-all font-mono text-sm text-foreground">{certificate.code}</p>
        </div>

        <a
          href={pdfUrl}
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          Descargar el PDF
        </a>
      </div>
    </main>
  )
}

/**
 * Codigo que no resuelve. No distingue entre "nunca existio" y "existio y ya
 * no": un codigo invalido es un codigo invalido, y decir mas ayudaria a quien
 * este probando codigos a ciegas.
 */
export function CertificateNotFound({ code }: { code: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-8 py-10 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
          <FileX2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Certificado no encontrado</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No hay ningún certificado con este código. Comprueba que lo copiaste
          completo y tal como aparece en el documento.
        </p>
        <p className="mt-4 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
          {code}
        </p>
        <Link
          href="/"
          className="mt-8 inline-block h-11 rounded-md bg-primary px-6 text-sm font-medium leading-[44px] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Ir a LinuxLab
        </Link>
      </div>
    </main>
  )
}
