import { useBids, STAGES, type Bid } from "@/hooks/useBids";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Target, TrendingUp, Layers, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { data: bids = [] } = useBids();

  const sumValue = (arr: Bid[]) => arr.reduce((s, b) => s + (Number(b.estimated_value) || 0), 0);
  const totalValue = sumValue(bids);
  const won = bids.filter((b) => b.stage === "won");
  const lost = bids.filter((b) => b.stage === "lost");
  const decided = won.length + lost.length;
  const winRate = decided > 0 ? Math.round((won.length / decided) * 100) : 0;

  const stats = [
    { label: "Total Bids", value: bids.length, icon: Layers, color: "text-foreground", bg: "bg-secondary" },
    { label: "Pipeline Value", value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active", value: bids.filter((b) => !["won", "lost"].includes(b.stage)).length, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Won", value: won.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Lost", value: lost.length, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Win Rate", value: `${winRate}%`, icon: Target, color: "text-primary", bg: "bg-accent" },
  ];

  const stageData = STAGES.map((s) => ({
    name: s.label,
    count: bids.filter((b) => b.stage === s.key).length,
    value: sumValue(bids.filter((b) => b.stage === s.key)),
    fill: s.color,
  }));

  const pieData = stageData.filter((d) => d.count > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ lineHeight: "1.1" }}>Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your bid pipeline</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stageData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bids by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
            {pieData.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-muted-foreground">{d.name} ({d.count})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
