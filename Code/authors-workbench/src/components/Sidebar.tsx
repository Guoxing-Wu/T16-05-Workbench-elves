import { useState } from "react";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Feather,
  FileText,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Network,
  Settings,
  Share2,
  Users,
  FolderOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWorkbench } from "../lib/store";
import type { WorkbenchView } from "../lib/store";

// A single navigation entry: icon + label + the view it switches to.
interface NavItem {
  icon: LucideIcon;
  label: string;
  view: WorkbenchView;
}

// A grouped section of the sidebar (e.g. MANUSCRIPT, TOOLS).
interface NavGroup {
  title?: string;
  items: NavItem[];
}

// The main navigation structure. "projects" is the default landing page.
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { icon: FolderOpen, label: "Projects", view: "projects" },
      { icon: LayoutDashboard, label: "Overview", view: "overview" },
    ],
  },
  {
    title: "MANUSCRIPT",
    items: [
      { icon: Network, label: "Story Structure", view: "storyStructure" },
      { icon: BookOpen, label: "Chapter Plan", view: "chapterPlan" },
      { icon: Users, label: "Characters", view: "characters" },
      { icon: MapPin, label: "Locations", view: "locations" },
      { icon: Calendar, label: "Events", view: "events" },
      { icon: FileText, label: "Timeline", view: "timeline" },
    ],
  },
];

// Bottom navigation (settings / help) kept separate so it sticks to the bottom.
const BOTTOM_NAV: NavItem[] = [
  { icon: Settings, label: "Settings", view: "settings" },
  { icon: HelpCircle, label: "Help", view: "help" },
];
// Tool buttons do not navigate — they trigger an action instead.
interface ToolItem {
  icon: LucideIcon;
  label: string;
  action: () => void;
}

// One clickable row in the sidebar (nav item or tool button).
function SidebarButton({
  icon: Icon,
  label,
  collapsed,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sidebar-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      <Icon size={17} strokeWidth={1.7} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
// The collapsible left navigation rail.
export function Sidebar() {
  const { activeView, setActiveView} = useWorkbench();
  const [collapsed, setCollapsed] = useState(false);

  // Only top-level views (outside a project's manuscript) should close the open project.
  const TOP_LEVEL_VIEWS: WorkbenchView[] = ["projects", "overview"];

  // Switching to a top-level view closes any open project detail.
  /*const navigate = (view: WorkbenchView) => {
    setActiveView(view);
    if (view !== "projects") setActiveProjectId(null);
  };*/
  // Switching to a top-level view.
  const navigate = (view: WorkbenchView) => {
    setActiveView(view);
  };

  // Placeholder actions for the tool buttons — real functionality comes later.
  const tools: ToolItem[] = [
    {
      icon: Download,
      label: "Backup & Restore",
      action: () => console.log("[Workbench] Backup & Restore — not implemented yet"),
    },
    {
      icon: Share2,
      label: "Export",
      action: () => console.log("[Workbench] Export — not implemented yet"),
    },
  ];
  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand mark + collapse toggle */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Feather size={18} strokeWidth={1.6} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span>AUTHOR'S</span>
            <strong>WORKBENCH</strong>
          </div>
        )}
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Scrollable nav area */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="sidebar-group">
            {group.title && !collapsed && <p className="sidebar-group-title">{group.title}</p>}
            {group.items.map((item) => (
              <SidebarButton
                key={item.view}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                active={activeView === item.view}
                onClick={() => navigate(item.view)}
              />
            ))}
          </div>
        ))}

        {/* TOOLS group — action buttons, not navigation */}
        <div className="sidebar-group">
          {!collapsed && <p className="sidebar-group-title">TOOLS</p>}
          {tools.map((tool) => (
            <SidebarButton
              key={tool.label}
              icon={tool.icon}
              label={tool.label}
              collapsed={collapsed}
              onClick={tool.action}
            />
          ))}
        </div>
      </nav>

      {/* Bottom nav pinned to the bottom of the sidebar */}
      <div className="sidebar-bottom">
        {BOTTOM_NAV.map((item) => (
          <SidebarButton
            key={item.view}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={activeView === item.view}
            onClick={() => navigate(item.view)}
          />
        ))}
      </div>
    </aside>
  );
}


