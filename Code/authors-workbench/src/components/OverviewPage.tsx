import {
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  MapPin,
  Network,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader, EmptyState } from "./primitives";
import { useWorkbench } from "../lib/store";
import type { WorkbenchView } from "../lib/store";
import { wordsWritten } from "../lib/domain";
import { getStoryStructureOption } from "../features/story-structure/storyStructureTemplate";

// One clickable dashboard module: an icon, a label and the view it opens.
interface ModuleCard {
  view: WorkbenchView;
  icon: LucideIcon;
  accent: "coral" | "blue" | "mustard" | "sage";
  title: string;
}

const MODULES: ModuleCard[] = [
  {
    view: "storyStructure",
    icon: Network,
    accent: "coral",
    title: "Story Structure",
  },
  {
    view: "chapterPlan",
    icon: BookOpen,
    accent: "blue",
    title: "Chapter Plan",
  },
  {
    view: "characters",
    icon: Users,
    accent: "mustard",
    title: "Characters",
  },
  {
    view: "locations",
    icon: MapPin,
    accent: "sage",
    title: "Locations",
  },
  {
    view: "events",
    icon: Calendar,
    accent: "coral",
    title: "Events",
  },
  {
    view: "timeline",
    icon: FileText,
    accent: "blue",
    title: "Timeline",
  },
];

// The overview page shows details of the most recently opened project with clickable submodules. 
export function OverviewPage() {
  const { projects, setActiveView, setActiveProjectId } = useWorkbench();


  const featured = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

  // Making sure the featured project is active firstly to open mudules.
  const openModule = (view: WorkbenchView) => {
    if (featured) setActiveProjectId(featured.id);
    setActiveView(view);
  };



  if (!featured) {
    return (
      <div className="page-stack core-page">
        <PageHeader title="Overview" />

        <EmptyState
          title="Nothing to show yet"
          copy="Create a writing project to see your progress here."
        />
      </div>
    );
  }



  const written = wordsWritten(featured);
  const target = featured.targetWordCount || 0;
  const progress = target > 0 ? Math.min(100, Math.round((written / target) * 100)) : 0;
  const structure = getStoryStructureOption(featured.storyStructure)

  return (
    <div className="page-stack core-page overview-page">
      {/* Overview title */}
      <PageHeader title="Overview" />

      <section className="settings-card overview-current">
        {/* Current manuscript heading */}
        <div className="overview-current-head">
          <span className="section-kicker">CURRENT MANUSCRIPT</span>
        </div>

        {/* Project title */}
        <h2>{featured.title}</h2>

        {/* Progress */}
        <div className="progress-track compact">
          <i style={{ width: `${progress}%` }} />
        </div>

        <div className="overview-current-meta">
          <span>
            {written.toLocaleString()} of {target.toLocaleString()} words
          </span>
          <b>{progress}% drafted</b>
        </div>

        {/* Manuscript statistics */}
        <div className="overview-stat-row">
          <div>
            <BookOpen size={16} />
            <span>
              <strong>{(featured.chapters || []).length}</strong>
              <small>Chapters</small>
            </span>
          </div>

          <div>
            <Users size={16} />
            <span>
              <strong>{(featured.characters || []).length}</strong>
              <small>Characters</small>
            </span>
          </div>

          <div>
            <Calendar size={16} />
            <span>
              <strong>{(featured.events || []).length}</strong>
              <small>Events</small>
            </span>
          </div>

          <div>
            <Network size={16} />
            <span>
              <strong>{structure.name}</strong>
              <small>Structure</small>
            </span>
          </div>
        </div>
      </section>

      {/* Navigation modules */}
      <section className="overview-modules">
        {MODULES.map((module) => (
          <button
            key={module.view}
            className="overview-module-card"
            onClick={() => openModule(module.view)}
          >
            <div
              className={`overview-module-icon accent-${module.accent}`}
            >
              <module.icon size={18} />
            </div>

            <h3>{module.title}</h3>

            <span className="section-link">
              Open <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}