import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

export default function ActivityLog() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["bid_activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bid_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">History of all bid actions</p>
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
                    <span className="font-medium capitalize">{log.action.replace(/_/g, " ")}</span>
                    {details?.title && <span className="text-muted-foreground"> — {details.title}</span>}
                    {details?.from && <span className="text-muted-foreground"> ({details.from} → {details.to})</span>}
                  </p>
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
