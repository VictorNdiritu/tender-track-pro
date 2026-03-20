import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

export default function AuditLog() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const actionLabels: Record<string, string> = {
    entry_uploaded: "Uploaded entry",
    entry_approved: "Approved entry",
    entry_rejected: "Rejected entry",
    task_completed: "Completed task",
    task_uncompleted: "Reopened task",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete history of all actions</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-muted/50 rounded-md animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No activity recorded yet.
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm divide-y">
          {logs.map((log, i) => {
            const details = log.details as Record<string, any> | null;
            return (
              <div key={log.id} className="px-4 py-3 flex items-start gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{actionLabels[log.action] || log.action}</span>
                    {details?.title && <span className="text-muted-foreground"> — {details.title}</span>}
                    {details?.task_title && <span className="text-muted-foreground"> — {details.task_title}</span>}
                  </p>
                  {details?.reason && (
                    <p className="text-xs text-destructive/70 mt-0.5">Reason: {details.reason}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {format(new Date(log.created_at), "dd MMM HH:mm")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
