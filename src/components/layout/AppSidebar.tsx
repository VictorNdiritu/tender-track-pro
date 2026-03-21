import { ClipboardList, Layers, FileText, Shield, CheckSquare, ScrollText, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Bids Overview", icon: Layers, path: "/" },
  { label: "Tenders", icon: FileText, path: "/tenders" },
  { label: "Prequalifications", icon: Shield, path: "/prequalifications" },
  { label: "My Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Audit Log", icon: ScrollText, path: "/audit" },
];

const managerItems = [
  { label: "Bid Manager", icon: User, path: "/bid-manager" },
];

export default function AppSidebar() {
  const { profile, roles, signOut, isManagerOrAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-60 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      <div className="p-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-primary-foreground text-sm tracking-tight">ProcureFlow</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
              location.pathname === item.path
                ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}

        {isManagerOrAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <span className="text-[11px] font-medium text-sidebar-foreground/50 uppercase tracking-wider">Management</span>
            </div>
            {managerItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-foreground">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-primary-foreground truncate">{profile?.full_name || "User"}</p>
            <p className="text-[10px] text-sidebar-foreground/60 capitalize">{roles[0] || "staff"}</p>
          </div>
          <button onClick={signOut} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
