import { teacherApi } from "./api"
import type {
  Group,
  CreateGroupInput,
  Activity,
  CreateActivityInput,
  AuditEntry,
  GroupProgressSummary,
  StudentGroupDetail,
  Enrollment,
  ProvisioningJobSummary,
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

export async function setGroupArchived(id: string, archived: boolean): Promise<void> {
  await teacherApi.setGroupArchived(id, archived)
}

export async function listBankActivities(): Promise<Activity[]> {
  return []
}

export async function listGroupActivities(_groupId: string): Promise<Activity[]> {
  return []
}

export async function getActivity(_id: string): Promise<Activity | null> {
  return null
}

export async function createActivity(_input: CreateActivityInput): Promise<Activity> {
  throw new Error("Actividades: no implementado todavía")
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

export async function gradeSubmission(
  _submissionId: string,
  _score: number,
  _feedback?: string,
): Promise<void> {
  throw new Error("Submissions: no implementado todavía")
}
