import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type EntryStatus = Database["public"]["Enums"]["entry_status"];

const statusConfig: Record<EntryStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "status-badge-pending" },
  pending_approval: { label: "Pending", className: "status-badge-pending" },
  approved: { label: "Approved", className: "status-badge-approved" },
  rejected: { label: "Rejected", className: "status-badge-rejected" },
  in_progress: { label: "In Progress", className: "status-badge-in-progress" },
  completed: { label: "Completed", className: "status-badge-completed" },
};

export default function StatusBadge({ status }: { status: EntryStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", config.className)}>
      {config.label}
    </span>
  );
}
