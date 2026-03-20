import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "./StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Check, X, AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];
type Task = Database["public"]["Tables"]["entry_tasks"]["Row"];

interface EntryDetailSheetProps {
  entry: Entry | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const defaultTasks = [
  "Collect Mandatory Documents (MAF, Tax Compliance, CR12)",
  "Prepare Company Profile",
  "Obtain Statutory Declarations",
  "Prepare Financial Statements",
  "Complete Technical Proposal",
  "Complete Financial Proposal",
  "Compile and Bind Documents",
  "Quality Check & Review",
  "Submit Before Deadline",
];

export default function EntryDetailSheet({ entry, open, onClose, onUpdate }: EntryDetailSheetProps) {
  const { user, isBidsOfficerOrAbove, isManagerOrAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry && open) fetchTasks();
  }, [entry, open]);

  async function fetchTasks() {
    if (!entry) return;
    const { data } = await supabase
      .from("entry_tasks")
      .select("*")
      .eq("entry_id", entry.id)
      .order("sort_order");
    if (data) setTasks(data);
  }

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  async function handleApprove() {
    if (!entry || !user) return;
    setLoading(true);
    try {
      await supabase.from("procurement_entries").update({
        status: "approved",
        approved_by: user.id,
      }).eq("id", entry.id);

      // Create default tasks
      const tasksToInsert = defaultTasks.map((title, i) => ({
        entry_id: entry.id,
        title,
        sort_order: i,
      }));
      await supabase.from("entry_tasks").insert(tasksToInsert);

      await supabase.from("audit_log").insert({
        user_id: user.id,
        entry_id: entry.id,
        action: "entry_approved",
        details: { title: entry.title },
      });

      toast.success("Entry approved and tasks created");
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!entry || !user || !rejectionReason.trim()) return;
    setLoading(true);
    try {
      await supabase.from("procurement_entries").update({
        status: "rejected",
        rejection_reason: rejectionReason,
        approved_by: user.id,
      }).eq("id", entry.id);

      await supabase.from("audit_log").insert({
        user_id: user.id,
        entry_id: entry.id,
        action: "entry_rejected",
        details: { title: entry.title, reason: rejectionReason },
      });

      toast.success("Entry rejected");
      setShowRejectInput(false);
      setRejectionReason("");
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await supabase.from("entry_tasks").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", task.id);

    await supabase.from("audit_log").insert({
      user_id: user?.id,
      entry_id: entry?.id,
      action: newStatus === "completed" ? "task_completed" : "task_uncompleted",
      details: { task_title: task.title },
    });

    fetchTasks();

    // Check if all tasks completed
    const updatedTasks = tasks.map((t) => t.id === task.id ? { ...t, status: newStatus } : t);
    const allDone = updatedTasks.every((t) => (t.id === task.id ? newStatus : t.status) === "completed");
    if (allDone && entry) {
      await supabase.from("procurement_entries").update({ status: "completed" }).eq("id", entry.id);
      toast.success("All tasks completed! Entry marked as completed.");
      onUpdate();
    }
  }

  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-lg">{entry.title}</SheetTitle>
            <StatusBadge status={entry.status} />
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="capitalize font-medium">{entry.entry_type}</span>
            </div>
            {entry.client_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client</span>
                <span className="font-medium">{entry.client_name}</span>
              </div>
            )}
            {entry.deadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium tabular-nums">{format(new Date(entry.deadline), "dd MMM yyyy")}</span>
              </div>
            )}
            {entry.estimated_value && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value</span>
                <span className="font-medium tabular-nums">${Number(entry.estimated_value).toLocaleString()}</span>
              </div>
            )}
            {entry.description && (
              <div className="pt-2">
                <p className="text-muted-foreground text-xs mb-1">Description</p>
                <p className="text-sm">{entry.description}</p>
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {entry.status === "rejected" && entry.rejection_reason && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-1.5 text-destructive text-xs font-medium mb-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason
              </div>
              <p className="text-sm text-destructive/80">{entry.rejection_reason}</p>
            </div>
          )}

          {/* Approval actions */}
          {entry.status === "pending_approval" && isBidsOfficerOrAbove && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={handleApprove} disabled={loading} className="flex-1 gap-1.5" size="sm">
                  <Check className="w-4 h-4" /> Approve
                </Button>
                <Button variant="destructive" onClick={() => setShowRejectInput(true)} disabled={loading} className="flex-1 gap-1.5" size="sm">
                  <X className="w-4 h-4" /> Reject
                </Button>
              </div>
              {showRejectInput && (
                <div className="space-y-2">
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    rows={2}
                  />
                  <Button variant="destructive" size="sm" onClick={handleReject} disabled={!rejectionReason.trim() || loading}>
                    Confirm Rejection
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Task checklist */}
          {(entry.status === "approved" || entry.status === "in_progress" || entry.status === "completed") && tasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Task Checklist</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{completedCount}/{tasks.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="space-y-1">
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={() => isBidsOfficerOrAbove && toggleTask(task)}
                      disabled={!isBidsOfficerOrAbove}
                    />
                    <span className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
