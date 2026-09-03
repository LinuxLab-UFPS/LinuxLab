import { teacherApi } from "./api"
import type {
  Group,
  CreateGroupInput,
  Activity,
  ActivitySubmissionStudent,
  CreateActivityInput,
  AuditEntry,
  AuditFilters,
  AuditListResult,
  GroupProgressSummary,
  Gradebook,
  StudentPerformance,
  Enrollment,
  ProvisioningJobSummary,
  CatalogEntry,
  ManualSubmission,
  FinalizePreview,
  FinalizeResponse,
  GroupCertificates,
} from "./types"
import type { EnrollmentStudent } from "@/lib/features/auth/types"

export async function listGroups(): Promise<Group[]> {
  return teacherApi.listGroups()
}

export async function getGroup(id: string): Promise<Group | null> {
  try {
    return await teacherApi.getGroup(id)
  } catch {
    return null
  }
}

export async function createGroup(input: CreateGroupInput) {
  return teacherApi.createGroup(input)
}

/** Desactiva un curso. Es de una sola vía: el backend no sabe reactivar. */
export async function deactivateGroup(id: string): Promise<void> {
  await teacherApi.deactivateGroup(id)
}

/** Vista previa de la finalización de un curso activo. */
export async function getFinalizePreview(id: string): Promise<FinalizePreview | null> {
  try {
    return await teacherApi.getFinalizePreview(id)
  } catch {
    return null
  }
}

/** Finaliza el curso: emite certificados, encola los correos y destruye el entorno. */
export async function finalizeGroup(id: string): Promise<FinalizeResponse> {
  return teacherApi.finalizeGroup(id)
}

/** Certificados emitidos de un curso finalizado o archivado. */
export async function getGroupCertificates(id: string): Promise<GroupCertificates> {
  return teacherApi.getGroupCertificates(id)
}

export async function rotateGroupInvite(id: string): Promise<{ inviteUrl: string }> {
  return teacherApi.rotateInvite(id)
}

export async function deleteGroup(id: string): Promise<void> {
  await teacherApi.deleteGroup(id)
}

export async function getCheckCatalog(): Promise<CatalogEntry[]> {
  return teacherApi.getCheckCatalog()
}

export async function listGroupActivities(groupId: string): Promise<Activity[]> {
  return teacherApi.listGroupActivities(groupId)
}

export async function getGroupActivity(
  groupId: string,
  activityId: string,
): Promise<Activity | null> {
  try {
    return await teacherApi.getGroupActivity(groupId, activityId)
  } catch {
    return null
  }
}

export async function createActivity(
  groupId: string,
  input: CreateActivityInput,
): Promise<Activity> {
  return teacherApi.createActivity(groupId, input)
}

export async function updateActivity(
  groupId: string,
  activityId: string,
  input: CreateActivityInput,
): Promise<Activity> {
  return teacherApi.updateActivity(groupId, activityId, input)
}

/** Habilita o deshabilita una actividad publicada (RF-GRP-10). */
export async function setActivityEnabled(
  groupId: string,
  activityId: string,
  enabled: boolean,
): Promise<Activity> {
  return teacherApi.setActivityEnabled(groupId, activityId, enabled)
}

/** Extiende la fecha de cierre de una actividad (permitida aunque haya historial). */
export async function extendActivityDueDate(
  groupId: string,
  activityId: string,
  dueDate: string,
): Promise<Activity> {
  return teacherApi.extendActivityDueDate(groupId, activityId, dueDate)
}

export async function listActivitySubmissions(
  groupId: string,
  activityId: string,
): Promise<ActivitySubmissionStudent[]> {
  return teacherApi.listActivitySubmissions(groupId, activityId)
}

export async function listManualSubmissions(
  groupId: string,
  activityId: string,
): Promise<ManualSubmission[]> {
  return teacherApi.listManualSubmissions(groupId, activityId)
}

export async function submitActivity(_activityId: string): Promise<void> {
  throw new Error("Actividades: no implementado todavía")
}

export async function validateActivity(_activityId: string): Promise<never> {
  throw new Error("Actividades: no implementado todavía")
}

export async function listEnrollments(groupId: string): Promise<Enrollment[]> {
  return teacherApi.listEnrollments(groupId)
}

export async function listStudents(groupId: string): Promise<EnrollmentStudent[]> {
  return teacherApi.listStudents(groupId)
}

export async function addStudent(
  groupId: string,
  input: Omit<EnrollmentStudent, "id">,
): Promise<EnrollmentStudent> {
  return teacherApi.addStudent(groupId, input)
}

export async function importStudentsCsv(groupId: string, file: File) {
  return teacherApi.importStudentsCsv(groupId, file)
}

export async function listProvisioningJobs(groupId: string): Promise<ProvisioningJobSummary[]> {
  try {
    return await teacherApi.listProvisioningJobs(groupId)
  } catch {
    // El aprovisionamiento es un panel accesorio del resumen del curso: si no
    // se puede consultar se omite, en vez de tumbar toda la pantalla.
    return []
  }
}

export async function getProvisioningStatus() {
  return teacherApi.getProvisioningStatus()
}

export async function listAuditLog(filters?: AuditFilters): Promise<AuditListResult> {
  return teacherApi.listAuditLog(filters)
}

/** Bitácora acotada a un curso, para "Actividad reciente" en su resumen. */
export async function listGroupAuditLog(groupId: string, limit = 10): Promise<AuditEntry[]> {
  return teacherApi.listGroupAuditLog(groupId, limit)
}

export async function getGroupProgress(groupId: string): Promise<GroupProgressSummary> {
  return teacherApi.getGroupProgress(groupId)
}

export async function getGradebook(groupId: string): Promise<Gradebook> {
  return teacherApi.getGradebook(groupId)
}

export async function getStudentPerformance(
  groupId: string,
  studentId: string,
): Promise<StudentPerformance> {
  return teacherApi.getStudentPerformance(groupId, studentId)
}

export async function gradeSubmission(
  _submissionId: string,
  _score: number,
  _feedback?: string,
): Promise<void> {
  throw new Error("Submissions: no implementado todavía")
}
