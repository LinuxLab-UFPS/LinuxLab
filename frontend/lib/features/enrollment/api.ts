import { apiFetch } from "@/lib/api/client"

export interface GroupInviteInfo {
  name: string
  description: string
  teacherName: string | null
  /** null cuando quien consulta no tiene sesión de estudiante. */
  enrolled: boolean | null
}

export interface JoinResult {
  enrolled: boolean
  reason?: string
  groupName?: string
  student?: {
    id: string
    name: string
    email: string
    code: string | null
  }
  linuxProvisioned?: boolean
}

export const enrollApi = {
  getInfo: (groupId: string, token: string) =>
    apiFetch<GroupInviteInfo>(
      `/api/enroll/group/${encodeURIComponent(groupId)}/info?token=${encodeURIComponent(token)}`,
    ),
  join: (groupId: string, token: string) =>
    apiFetch<JoinResult>(`/api/enroll/group/${encodeURIComponent(groupId)}`, {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
}