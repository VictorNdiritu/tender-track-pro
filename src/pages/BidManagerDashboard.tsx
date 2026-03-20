import { useProcurementEntries } from "@/hooks/useProcurementEntries";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EntryTable from "@/components/procurement/EntryTable";
import EntryDetailSheet from "@/components/procurement/EntryDetailSheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign,
  Search,
  AlertTriangle 
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];

export default function BidManagerDashboard() {
  const { data: entries = [], isLoading } = useProcurementEntries({ type: "tender" });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Entry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter tenders and apply search
  const filteredEntries = useMemo(() => {
    let filtered = entries || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((e) => {
        if (!e.estimated_value) return false;
        const value = Number(e.estimated_value);
        if (priorityFilter === "high") return value >= 100000;
        if (priorityFilter === "medium") return value >= 50000 && value < 100000;
        if (priorityFilter === "low") return value < 50000;
        return true;
      });
    }

    return filtered;
  }, [entries, searchTerm, priorityFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = entries.filter((e) => e.status === "pending_approval");
    const approved = entries.filter((e) => e.status === "approved" || e.status === "in_progress");
    const won = entries.filter((e) => e.status === "completed");
    const lost = entries.filter((e) => e.status === "rejected");

    const pendingValue = pending.reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);
    const approvedValue = approved.reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);
    const wonValue = won.reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);
    const lostValue = lost.reduce((sum, e) => sum + (Number(e.estimated_value) || 0), 0);

    const totalPipeline = pendingValue + approvedValue + wonValue;
    const winRate = entries.length > 0 ? ((won.length / entries.length) * 100).toFixed(1) : "0";

    return {
      pending,
      approved,
      won,
      lost,
      pendingValue,
      approvedValue,
      wonValue,
      lostValue,
      totalPipeline,
      winRate,
    };
  }, [entries]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["procurement_entries"] });

  const handleQuickApprove = async (entry: Entry) => {
    if (!user) return;
    setActionLoading(entry.id);
    try {
      await supabase
        .from("procurement_entries")
        .update({
          status: "approved",
          approved_by: user.id,
        })
        .eq("id", entry.id);

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

      toast.success(`"${entry.title}" approved!`);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    {
      label: "Pipeline Value",
      value: `$${(stats.totalPipeline / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-blue-600 bg-blue-50",
      subtext: `${entries.length} tenders`,
    },
    {
      label: "Pending Approval",
      value: stats.pending.length,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
      subtext: `$${(stats.pendingValue / 1000).toFixed(0)}K value`,
    },
    {
      label: "Active/In Progress",
      value: stats.approved.length,
      icon: AlertTriangle,
      color: "text-sky-600 bg-sky-50",
      subtext: `$${(stats.approvedValue / 1000).toFixed(0)}K value`,
    },
    {
      label: "Won",
      value: stats.won.length,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50",
      subtext: `$${(stats.wonValue / 1000).toFixed(0)}K revenue`,
    },
    {
      label: "Lost",
      value: stats.lost.length,
      icon: XCircle,
      color: "text-red-600 bg-red-50",
      subtext: `$${(stats.lostValue / 1000).toFixed(0)}K lost`,
    },
    {
      label: "Win Rate",
      value: `${stats.winRate}%`,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-50",
      subtext: `${stats.won.length} wins`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ lineHeight: "1.1" }}>
          Bid Manager Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage tender submissions, approvals, and track your bid pipeline
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-card rounded-lg border p-4 shadow-sm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-bold mt-2 tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-2">{stat.subtext}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, client, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {["all", "high", "medium", "low"].map((priority) => (
              <Button
                key={priority}
                variant={priorityFilter === priority ? "default" : "outline"}
                size="sm"
                onClick={() => setPriorityFilter(priority as any)}
                className="capitalize"
              >
                {priority === "all" ? "All Priority" : `${priority} Value`}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} tenders
        </div>
      </div>

      {/* Tabbed View */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending ({stats.pending.length})
            {stats.pending.length > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                {stats.pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active ({stats.approved.length})</TabsTrigger>
          <TabsTrigger value="won">Won ({stats.won.length})</TabsTrigger>
          <TabsTrigger value="lost">Lost ({stats.lost.length})</TabsTrigger>
          <TabsTrigger value="all">All ({filteredEntries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {stats.pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending tenders</div>
          ) : (
            <div className="space-y-3">
              <EntryTableWithActions
                entries={stats.pending.filter((e) =>
                  filteredEntries.find((f) => f.id === e.id)
                )}
                onView={setSelected}
                onApprove={handleQuickApprove}
                loading={isLoading || actionLoading !== null}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <EntryTable
            entries={stats.approved.filter((e) => filteredEntries.find((f) => f.id === e.id))}
            onView={setSelected}
            loading={isLoading}
          />
        </TabsContent>

        <TabsContent value="won">
          <EntryTable
            entries={stats.won.filter((e) => filteredEntries.find((f) => f.id === e.id))}
            onView={setSelected}
            loading={isLoading}
          />
        </TabsContent>

        <TabsContent value="lost">
          <EntryTable
            entries={stats.lost.filter((e) => filteredEntries.find((f) => f.id === e.id))}
            onView={setSelected}
            loading={isLoading}
          />
        </TabsContent>

        <TabsContent value="all">
          <EntryTable
            entries={filteredEntries}
            onView={setSelected}
            loading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <EntryDetailSheet
        entry={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onUpdate={() => {
          refresh();
          setSelected(null);
        }}
      />
    </div>
  );
}

// Enhanced table with quick action buttons
function EntryTableWithActions({
  entries,
  onView,
  onApprove,
  loading,
}: {
  entries: Entry[];
  onView: (entry: Entry) => void;
  onApprove: (entry: Entry) => void;
  loading: boolean;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Client</th>
              <th className="text-right px-4 py-3 font-medium">Value</th>
              <th className="text-left px-4 py-3 font-medium">Deadline</th>
              <th className="text-center px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onView(entry)}
                    className="text-left font-medium hover:underline text-primary"
                  >
                    {entry.title}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{entry.client_name || "-"}</td>
                <td className="px-4 py-3 text-right font-mono">
                  ${Number(entry.estimated_value || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {entry.deadline
                    ? new Date(entry.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(entry)}
                      disabled={loading}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApprove(entry)}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
