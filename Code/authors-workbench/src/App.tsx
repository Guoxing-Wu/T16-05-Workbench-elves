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
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/Topbar";
import { RightSidebar } from "./components/RightSidebar";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { EventsPage } from "./components/EventsPage";
import { StoryStructurePage } from "./features/story-structure/StoryStructurePage";
import { ChapterPage } from "./components/ChapterPage";
import { CharactersPage } from "./features/character/CharactersPage";
import { TimelinePage } from "./features/TimeLine/TimeLinePage";
import { OverviewPage } from "./components/OverviewPage";
import { LocationsPage } from "./components/LocationPage";


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
  const { activeView, activeProject, setActiveProjectId, setActiveView} = useWorkbench();
  // Project page always shows the project list. Opening a project jumps to its Overview dashboard. 
  if (activeView === "projects") {
    const openProject = (id: string) => {
      setActiveProjectId(id);
      setActiveView("overview");
    };
    return (
      <ProjectsPage onOpen={openProject} />
    );
  }

  // Story structure displays the template selected for the active project.
  if (activeView === "storyStructure") {
    // StoryStructurePage now supports both states:
    // 1. A project is open -> show the project's story structure.
    // 2. No project is open -> show the global custom structure manager.
    return (
        <StoryStructurePage
            project={activeProject ?? undefined}
        />
    );

  }

  // Chapter Plan needs an active project to know which project's chapters to show.
  if (activeView === "chapterPlan") {
    if (!activeProject) {
      return (
        <PlaceholderPage
          eyebrow="MANUSCRIPT"
          title="Chapter Plan"
          icon={PLACEHOLDER_CONFIG.chapterPlan.icon}
          description="Open a project first to view its chapter plan."
        />
      );
    }
    return <ChapterPage project={activeProject} />;
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

  // Locations groups story events by place for the active project.
  if (activeView === "locations") {
    if (!activeProject) {
      return (
        <PlaceholderPage
          eyebrow="MANUSCRIPT"
          title="Locations"
          icon={PLACEHOLDER_CONFIG.locations.icon}
          description="Open a project first to see its character locations."
        />
      );
    }
    return <LocationsPage project={activeProject} />;
  }


  // Characters needs an active project to know which project's characters to show.
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
    return <CharactersPage project={activeProject} onBack={() => setActiveProjectId("overview")} />;
  }
  //Timeline needs an active project to know which project's events to show.
  if (activeView === "timeline") {
    if (!activeProject) {
      return (
        <PlaceholderPage
          eyebrow="MANUSCRIPT"
          title="Timeline"
          icon={PLACEHOLDER_CONFIG.timeline.icon}
          description="Open a project first to see and manage its story timeline."
        />
      );
    }
    return <TimelinePage project={activeProject} onManageEvents={() =>setActiveView("events")} onBack={() => setActiveProjectId(null)} />;
  }


  // Navigate to the overview page.
  if (activeView === "overview") {
    
    return <OverviewPage />;
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
