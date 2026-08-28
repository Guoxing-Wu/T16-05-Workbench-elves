import { Feather } from "lucide-react";
import { WorkbenchProvider, useWorkbench } from "./lib/store";
import { ProjectsPage } from "./components/ProjectsPage";
import { ProjectDetailPage } from "./components/ProjectDetailPage";

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
}
