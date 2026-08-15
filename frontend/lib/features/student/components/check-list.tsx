import { CheckCircle2, CircleDashed, XCircle } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { describeCheck, type CheckResult } from "@/lib/features/student/use-activity-check"

/** The assertions of an activity, with their verdict once it has been checked. */
export function CheckList({
  rows,
  evaluated,
  className,
}: {
  rows: CheckResult[]
  evaluated: boolean
  className?: string
}) {
  return (
    <ul className={cn("space-y-2", className)}>
      {rows.map((row) => {
        const Icon = !evaluated ? CircleDashed : row.passed ? CheckCircle2 : XCircle
        return (
          <li key={row.id} className="flex items-start gap-2.5 text-sm">
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                !evaluated
                  ? "text-muted-foreground"
                  : row.passed
                    ? "text-success"
                    : "text-danger",
              )}
            />
            <span className="min-w-0">
              <span className="block text-foreground">
                {describeCheck(row.type, row.params)}
              </span>
              {evaluated && row.detail && (
                <span
                  className={cn(
                    "block text-xs",
                    row.passed ? "text-muted-foreground" : "text-danger",
                  )}
                >
                  {row.detail}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
