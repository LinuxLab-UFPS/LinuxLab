import { teacherApi } from "./api"
import type {
  Group,
  CreateGroupInput,
  Activity,
  ActivitySubmissionStudent,
  CreateActivityInput,
  AuditEntry,
  GroupProgressSummary,
  Gradebook,
  StudentGroupDetail,
  StudentPerformance,
  Enrollment,
  ProvisioningJobSummary,
  CatalogEntry,
  ManualSubmission,
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

export async function listAuditLog(): Promise<AuditEntry[]> {
  return []
}

/** Bitácora acotada a un curso, para "Actividad reciente" en su resumen. */
export async function listGroupAuditLog(_groupId: string): Promise<AuditEntry[]> {
  // El backend todavía no expone la bitácora por curso.
  return []
}

export async function clearAuditLog(): Promise<void> {
  throw new Error("Audit log: no implementado todavía")
}

const EMPTY_SUMMARY: GroupProgressSummary = {
  enrolledCount: 0,
  averageProgress: 0,
  completedToday: 0,
  activeNow: 0,
  rows: [],
}

export async function getGroupProgress(_groupId: string): Promise<GroupProgressSummary> {
  return EMPTY_SUMMARY
}

export async function getStudentGroupDetail(
  _groupId: string,
  _studentId: string,
): Promise<StudentGroupDetail | null> {
  return null
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
