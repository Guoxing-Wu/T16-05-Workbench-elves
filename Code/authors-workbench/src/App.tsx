import {
  BookOpen,
  Calendar,
  FileText,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  Network,
  Settings,
  Users,
} from "lucide-react";
import { WorkbenchProvider, useWorkbench } from "./lib/store";
import type { WorkbenchView } from "./lib/store";
import { ProjectsPage } from "./components/ProjectsPage";
import { ProjectDetailPage } from "./components/ProjectDetailPage";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/Topbar";
import { RightSidebar } from "./components/RightSidebar";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { EventsPage } from "./components/EventsPage";
import { CharactersPage } from "./components/CharactersPage";
import { StoryStructurePage } from "./features/story-structure/StoryStructurePage";


// Configuration for every placeholder page: title, icon, eyebrow and description.
const PLACEHOLDER_CONFIG: Record<
  Exclude<WorkbenchView, "projects">,
  { title: string; icon: typeof LayoutDashboard; eyebrow: string; description: string }
> = {
  overview: {
    title: "Overview",
    icon: LayoutDashboard,
    eyebrow: "DASHBOARD",
    description:
      "A high-level dashboard showing your writing progress, recent activity and project health at a glance.",
  },
  storyStructure: {
    title: "Story Structure",
    icon: Network,
    eyebrow: "MANUSCRIPT",
    description:
      "Map out your story's acts, beats and plot points. Drag, rearrange and connect the structural pillars of your narrative.",
  },
  chapterPlan: {
    title: "Chapter Plan",
    icon: BookOpen,
    eyebrow: "MANUSCRIPT",
    description:
      "Plan chapter titles, status and notes.",
  },
  characters: {
    title: "Characters",
    icon: Users,
    eyebrow: "MANUSCRIPT",
    description:
      "Build detailed character profiles: backgrounds, motivations, relationships and arc trajectories.",
  },
  locations: {
    title: "Locations",
    icon: MapPin,
    eyebrow: "MANUSCRIPT",
    description:
      "Catalog the world of your story — settings, environments and the details that bring each place to life.",
  },
  events: {
    title: "Events",
    icon: Calendar,
    eyebrow: "MANUSCRIPT",
    description:
      "Track key story events, their chronology and the impact each one has on characters and plot.",
  },
  timeline: {
    title: "Timeline",
    icon: FileText,
    eyebrow: "MANUSCRIPT",
    description:
      "A chronological timeline of every story event, helping you maintain consistency across your narrative.",
  },
  settings: {
    title: "Settings",
    icon: Settings,
    eyebrow: "APPLICATION",
    description:
      "Configure the workbench: preferences, defaults, appearance and how your writing data is stored.",
  },
  help: {
    title: "Help",
    icon: HelpCircle,
    eyebrow: "SUPPORT",
    description:
      "Find guides, keyboard shortcuts and answers to common questions about using Author's Workbench.",
  },
};

// Decides which component to render in the main area based on the active view.
function CurrentView() {
  const { activeView, activeProject, setActiveProjectId } = useWorkbench();

  // "projects" is special: it shows either the list or the open project's detail page.
  if (activeView === "projects") {
    return activeProject ? (
      <ProjectDetailPage project={activeProject} onBack={() => setActiveProjectId(null)} />
    ) : (
      <ProjectsPage onOpen={setActiveProjectId} />
    );
  }

  // Story structure displays the template selected for the active project.
  if (activeView === "storyStructure") {
    // A project must be open before its story structure can be displayed.
    if (!activeProject) {
      return (
        <PlaceholderPage
          eyebrow="MANUSCRIPT"
          title="Story Structure"
          icon={PLACEHOLDER_CONFIG.storyStructure.icon}
          description="Open a project first to view its story structure."
        />
      );
    }

    return <StoryStructurePage project={activeProject} />;
  }



  // Events needs an active project to know which project's events to show.
  if (activeView === "events") {
    if (!activeProject) {
      return (
        <PlaceholderPage
          eyebrow="MANUSCRIPT"
          title="Events"
          icon={PLACEHOLDER_CONFIG.events.icon}
          description="Open a project first to see and manage its story events."
        />
      );
    }
    return <EventsPage project={activeProject} />;
  }
  // Characters needs an active project.
  if (activeView === "characters") {
    if (!activeProject) {
      return (
        <PlaceholderPage
          eyebrow="MANUSCRIPT"
          title="Characters"
          icon={PLACEHOLDER_CONFIG.characters.icon}
          description="Open a project first to see and manage its characters."
        />
      );
    }

    return <CharactersPage 
    project={activeProject} 
    onBack={() => setActiveProjectId("projects")}
    />;
  }
  


 // Every other view renders a friendly placeholder for now.
  const config = PLACEHOLDER_CONFIG[activeView];
  return (
    <PlaceholderPage
      eyebrow={config.eyebrow}
      title={config.title}
      icon={config.icon}
      description={config.description}
    />
  );
}

// The root layout: collapsible sidebar on the left, main content on the right.
function WorkbenchApp() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <div className="content-wrapper">
          <main className="main-workspace" id="main-content">
            <CurrentView />
          </main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WorkbenchProvider>
      <WorkbenchApp />
    </WorkbenchProvider>
  );
}


/*
// Static top bar with the website name, shown on every screen
function TopHeader() {
  return (
    <header className="top-header">
      <div className="header-greeting">
        <div className="brand-mark">
          <Feather size={18} strokeWidth={1.6} />
        </div>
        <div>
          <p>Author’s Workbench</p>
        </div>
      </div>
    </header>
  );
}

// The website currently has two screens: the projects overview and the detail page for whichever project is open. 
// A project's open is driven entirely by activeProject from the store.
function WorkbenchApp() {
  const { activeProject, setActiveProjectId } = useWorkbench();

  return (
    <div className="workbench-shell">
      <TopHeader />
      <main className="main-workspace" id="main-content">
        {activeProject ? (
          <ProjectDetailPage project={activeProject} onBack={() => setActiveProjectId(null)} />
        ) : (
          <ProjectsPage onOpen={setActiveProjectId} />
        )}
      </main>
    </div>
  );
}


export default function App() {
  return (
    <WorkbenchProvider>
      <WorkbenchApp />
    </WorkbenchProvider>
  );
}*/
