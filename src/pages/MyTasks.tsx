import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function MyTasks() {
  const { user } = useAuth();

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ["my_tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entry_tasks")
        .select("*, procurement_entries(title, client_name, deadline)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await supabase.from("entry_tasks").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", taskId);
    toast.success(newStatus === "completed" ? "Task completed" : "Task reopened");
    refetch();
  }

  // Group tasks by entry
  const grouped = tasks.reduce((acc, task) => {
    const entry = (task as any).procurement_entries;
    const key = task.entry_id;
    if (!acc[key]) acc[key] = { entry, tasks: [] };
    acc[key].tasks.push(task);
    return acc;
  }, {} as Record<string, { entry: any; tasks: typeof tasks }>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>My Tasks</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your assigned checklist items</p>
      </div>

      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-xs text-muted-foreground tabular-nums">{completed}/{tasks.length} tasks</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No tasks assigned yet.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([entryId, group]) => {
            const entryCompleted = group.tasks.filter((t) => t.status === "completed").length;
            const entryProgress = (entryCompleted / group.tasks.length) * 100;
            return (
              <div key={entryId} className="bg-card rounded-lg border p-4 shadow-sm animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-medium">{group.entry?.title || "Unknown Entry"}</h3>
                    <p className="text-xs text-muted-foreground">{group.entry?.client_name || ""}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{entryCompleted}/{group.tasks.length}</span>
                </div>
                <Progress value={entryProgress} className="h-1.5 mb-3" />
                <div className="space-y-1">
                  {group.tasks.map((task) => (
                    <label key={task.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={() => toggleTask(task.id, task.status)}
                      />
                      <span className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
