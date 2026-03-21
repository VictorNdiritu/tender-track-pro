import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProcurementEntries } from "@/hooks/useProcurementEntries";
import EntryTable from "@/components/procurement/EntryTable";
import EntryDetailSheet from "@/components/procurement/EntryDetailSheet";
import UploadEntryDialog from "@/components/procurement/UploadEntryDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle2, XCircle, TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Database } from "@/integrations/supabase/types";

type Entry = Database["public"]["Tables"]["procurement_entries"]["Row"];

export default function Tenders() {
  const { data: entries = [], isLoading } = useProcurementEntries({ type: "tender" });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Entry | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["procurement_entries"] });

  const pending = entries.filter((e) => e.status === "pending_approval");
  const active = entries.filter((e) => e.status === "approved" || e.status === "in_progress");
  const won = entries.filter((e) => e.status === "completed");
  const lost = entries.filter((e) => e.status === "rejected");

  const sumValue = (arr: Entry[]) => arr.reduce((s, e) => s + (Number(e.estimated_value) || 0), 0);
  const pendingValue = sumValue(pending);
  const activeValue = sumValue(active);
  const wonValue = sumValue(won);
  const lostValue = sumValue(lost);
  const decided = won.length + lost.length;
  const winRate = decided > 0 ? Math.round((won.length / decided) * 100) : 0;

  const pipelineStats = [
    { label: "Pending", count: pending.length, value: pendingValue, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Active / In Progress", count: active.length, value: activeValue, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Won", count: won.length, value: wonValue, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Lost", count: lost.length, value: lostValue, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Win Rate", count: `${winRate}%`, value: null, icon: Target, color: "text-primary", bg: "bg-accent" },
    { label: "Total Pipeline", count: entries.length, value: sumValue(entries), icon: BarChart3, color: "text-foreground", bg: "bg-secondary" },
  ];

  const pieData = [
    { name: "Pending", value: pending.length, fill: "hsl(38, 92%, 50%)" },
    { name: "Active", value: active.length, fill: "hsl(217, 91%, 60%)" },
    { name: "Won", value: won.length, fill: "hsl(152, 60%, 40%)" },
    { name: "Lost", value: lost.length, fill: "hsl(0, 72%, 51%)" },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Pending", value: pendingValue },
    { name: "Active", value: activeValue },
    { name: "Won", value: wonValue },
    { name: "Lost", value: lostValue },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Tenders</h1>
          <p className="text-sm text-muted-foreground mt-1">Tender pipeline overview & performance</p>
        </div>
        <UploadEntryDialog defaultType="tender" onCreated={refresh} />
      </div>

      {/* Pipeline stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {pipelineStats.map((stat, i) => (
          <Card key={stat.label} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-2 ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-semibold tabular-nums">{stat.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              {stat.value !== null && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="tabular-nums">{stat.value.toLocaleString()}</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline by Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No tender data yet</p>
              )}
            </div>
            {pieData.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-muted-foreground">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tenders ({entries.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="won">Won ({won.length})</TabsTrigger>
          <TabsTrigger value="lost">Lost ({lost.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <EntryTable entries={entries} onView={setSelected} loading={isLoading} />
        </TabsContent>
        <TabsContent value="pending">
          <EntryTable entries={pending} onView={setSelected} loading={isLoading} />
        </TabsContent>
        <TabsContent value="active">
          <EntryTable entries={active} onView={setSelected} loading={isLoading} />
        </TabsContent>
        <TabsContent value="won">
          <EntryTable entries={won} onView={setSelected} loading={isLoading} />
        </TabsContent>
        <TabsContent value="lost">
          <EntryTable entries={lost} onView={setSelected} loading={isLoading} />
        </TabsContent>
      </Tabs>

      <EntryDetailSheet entry={selected} open={!!selected} onClose={() => setSelected(null)} onUpdate={() => { refresh(); setSelected(null); }} />
    </div>
  );
}
