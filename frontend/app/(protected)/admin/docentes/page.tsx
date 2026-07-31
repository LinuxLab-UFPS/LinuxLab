"use client"

import { TeachersTable } from "@/components/admin/teachers-table"
import { RoleGuard } from "@/components/shared/role-guard"

export default function DocentesPage() {
  return (
    <RoleGuard roles={["admin"]}>
      <div className="p-8">
        <TeachersTable />
      </div>
    </RoleGuard>
  )
}
