import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProcurementEntries } from "@/hooks/useProcurementEntries";
import EntryTable from "@/components/procurement/EntryTable";
import EntryDetailSheet from "@/components/procurement/EntryDetailSheet";
import UploadEntryDialog from "@/components/procurement/UploadEntryDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Clock, CheckCircle2, XCircle, Target, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, startOfWeek, eachWeekOfInterval, subWeeks } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];

export default function Prequalifications() {
  const { data: entries = [], isLoading } = useProcurementEntries({ type: "prequalification" });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Entry | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["procurement_entries"] });

  // Summary stats
  const total = entries.length;
  const pending = entries.filter((e) => e.status === "pending_approval");
  const qualified = entries.filter((e) => e.status === "approved" || e.status === "completed");
  const disqualified = entries.filter((e) => e.status === "rejected");
  const decided = qualified.length + disqualified.length;
  const winRate = decided > 0 ? Math.round((qualified.length / decided) * 100) : 0;

  const summaryCards = [
    { label: "Total Prequalifications", value: total, icon: Shield, color: "text-primary", bg: "bg-accent" },
    { label: "Pending Review", value: pending.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Qualified", value: qualified.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Disqualified", value: disqualified.length, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  // Search + filter
  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.client_name && e.client_name.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }
    if (statusFilter === "pending") result = result.filter((e) => e.status === "pending_approval");
    else if (statusFilter === "qualified") result = result.filter((e) => e.status === "approved" || e.status === "completed");
    else if (statusFilter === "disqualified") result = result.filter((e) => e.status === "rejected");
    else if (statusFilter === "in_progress") result = result.filter((e) => e.status === "in_progress");
    return result;
  }, [entries, search, statusFilter]);

  // Weekly trend data (last 8 weeks)
  const trendData = useMemo(() => {
    const now = new Date();
    const start = subWeeks(now, 7);
    const weeks = eachWeekOfInterval({ start, end: now }, { weekStartsOn: 1 });
    return weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEntries = entries.filter((e) => {
        const d = new Date(e.created_at);
        return d >= weekStart && d < weekEnd;
      });
      return {
        week: format(weekStart, "dd MMM"),
        qualified: weekEntries.filter((e) => e.status === "approved" || e.status === "completed").length,
        disqualified: weekEntries.filter((e) => e.status === "rejected").length,
      };
    });
  }, [entries]);

  // Funnel data
  const funnelData = [
    { name: "Pending", value: pending.length },
    { name: "In Review", value: entries.filter((e) => e.status === "in_progress").length },
    { name: "Qualified", value: qualified.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Prequalifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage vendor prequalification submissions</p>
        </div>
        <UploadEntryDialog defaultType="prequalification" onCreated={refresh} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((stat, i) => (
          <Card key={stat.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="qualified" stroke="hsl(152, 60%, 40%)" strokeWidth={2} dot={{ r: 3 }} name="Qualified" />
                  <Line type="monotone" dataKey="disqualified" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} name="Disqualified" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualification Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" fontSize={11} tickLine={false} axisLine={false} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by company, project, or reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="disqualified">Disqualified</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Drill-down tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({entries.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="qualified">Qualified ({qualified.length})</TabsTrigger>
          <TabsTrigger value="disqualified">Disqualified ({disqualified.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <EntryTable entries={filtered} onView={setSelected} loading={isLoading} />
        </TabsContent>
        <TabsContent value="pending">
          <EntryTable entries={pending.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()))} onView={setSelected} loading={isLoading} />
        </TabsContent>
        <TabsContent value="qualified">
          <EntryTable entries={qualified.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()))} onView={setSelected} loading={isLoading} />
        </TabsContent>
        <TabsContent value="disqualified">
          <EntryTable entries={disqualified.filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()))} onView={setSelected} loading={isLoading} />
        </TabsContent>
      </Tabs>

      <EntryDetailSheet entry={selected} open={!!selected} onClose={() => setSelected(null)} onUpdate={() => { refresh(); setSelected(null); }} />
    </div>
  );
}
