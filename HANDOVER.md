<h1 align="center">
  Author's Workbench
</h1>
<h2 align="center">
  A writing workbench for planning and managing your novel
</h2>

<div align="center">

[Demo][demo]&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Features](#features)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Documentation](#documentation)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[System Requirements](#system-requirements)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Installation Guide](#installation-guide)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Changelog](#changelog)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Traceability Matrix](#traceability-matrix)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[License](#license)

[![GitHub release][img-version-badge]][repo] [![PR Checks][img-ci-badge]][ci] [![Deploy][img-deploy-badge]][deploy]

</div>

**Author's Workbench** is a browser-based tool that helps authors plan and manage their writing efficiently — mapping plot points against chapter lengths and total word count, tracking characters, locations and key events, and exporting plans to Microsoft Excel.

<!--
Project handover document — T16-05-Workbench-elves (COMP30022)
Last updated: 2026-10-29
-->

## Important Notices
- All data is stored **locally in your browser** (IndexedDB). No server-side database is involved, and no account or API key is required.
- Use the built-in **Backup / Restore** and **Export to Excel** features to keep safe copies of your data.
- The repository is auto-deployed to GitHub Pages from the `main` branch; file paths referenced in this document are stable for the tagged releases.

## Table of Contents

[**TL;DR**](#tldr)

[**Project Background / Overview**](#project-background--overview)
  * [Client Profile](#client-profile)
  * [Client Requirements](#client-requirements)
  * [Team Members](#team-members)

[**Demo**](#demo)

[**Features**](#features)

[**Documentation**](#documentation)

[**System Requirements**](#system-requirements)

[**Installation Guide**](#installation-guide)

[**Changelog**](#changelog)

[**Traceability Matrix**](#traceability-matrix)

**Additional Info**
  * [Data & Storage Notes](#data--storage-notes)
  * [Common Problems](#common-problems)
  * [License](#license)
  * [Contact](#contact)

## TL;DR
Author's Workbench takes the pain out of novel planning: you structure your book chapter by chapter, keep an eye on your target word count, track characters/locations/events on a timeline, and export everything to Excel. Everything runs in the browser — no installation of a backend, no accounts, no API keys.

## Project Background / Overview

### Client Profile
Imbi Neeme is an administrator in the School of Computing and Information Systems, Faculty of Engineering and Information Technology, and is also a published author ([Penguin author page](https://www.penguin.com.au/authors/imbi-neeme)).

### Client Requirements
Imbi needs a workbench to help manage her writing efficiently, specifically with:

- mapping plot points in a flexible way that accommodates the total word count for a specific project as well as chapter lengths
- tracking character ages, locations, and key events
- a plot planning utility that integrates with Microsoft Excel

### Team Members

| Member | Name         | Role                               | Student ID | Email                          | GitHub Account  |
| :----: | ------------ | ---------------------------------- | ---------- | ------------------------------ | --------------- |
|   1    | Jiechang Che | Product Owner                      | 1389308    | cheaj@student.unimelb.edu.au   | AngelinaChe0621 |
|   2    | Kexin Meng   | Developer & Scrum Master (w1~3)    | 1447619    | mengkm@student.unimelb.edu.au  | Mackenziekk     |
|   3    | Ruting Kou   | Developer & Scrum Master (w4~6)    | 1674238    | rutingk@student.unimelb.edu.au | rtk2iscoding    |
|   4    | Yawen Xue    | Developer & Scrum Master (w7~9)    | 1524304    | yawxue3@student.unimelb.edu.au | A-XYW           |
|   5    | Guoxing Wu   | Developer & Scrum Master (w10~12)  | 1259517    | guwu@student.unimelb.edu.au    | Guoxing-Wu      |

## Demo

The application is hosted on GitHub Pages and is automatically deployed whenever changes are merged into `main`.

> **Live demo link:** to be confirmed — find the published URL under **GitHub → Settings → Pages** for this repository, then add it here (`[demo]: <url>` in the link references at the bottom of this file).

<!-- TODO: replace with the real Pages URL, e.g. [demo]: https://<owner>.github.io/T16-05-Workbench-elves/ -->

## Features

The application is organised into the following feature modules (`src/features/`):

| Feature | Description |
| --- | --- |
| **Overview dashboard** | Project overview, recently edited items and quick navigation. |
| **Projects & profile** | Manage multiple writing projects and author profile information. |
| **Chapter plan** | Plan chapters with target/actual word counts, progress bars, and drag-and-drop tags (including scene tags). Chapter counts adapt to each project's settings. |
| **Characters** | Track characters, their ages/birthdays and details across the story. |
| **Locations** | Maintain a list of locations used in the story. |
| **Events & scenes** | Plan events and scenes, with locations attached to scenes. |
| **Story structure** | Use built-in templates or create fully custom story structures. |
| **Timeline** | Visual timeline of story elements. |
| **Export to Excel** | Export the project plan to a Microsoft Excel workbook (ExcelJS). |
| **Backup & restore** | Local save status with recovery actions; back up and restore the whole database; manual failure simulation scripts. |
| **Help / FAQ** | In-app help and frequently asked questions. |
| **Sidebar & topbar** | Global navigation and page shell. |

User stories are organised by sprint in the project's [documentation hub](#documentation) (Confluence).

## Documentation

All project documentation — user stories, personas, motivational model, architecture and design documents, test plans and meeting minutes — lives in the project's Confluence space:

**Documentation hub:** [Project Confluence](https://student-team-edq1stef.atlassian.net/wiki/spaces/IP/overview)

Key artefacts previously stored in `Project_Files/` have been consolidated into Confluence so that the repository stays clean and the client can access one canonical source of truth.

## System Requirements

- **Node.js:** v22 (used by the CI pipeline)
- **Package manager:** npm (v10+ recommended)
- **Browser:** a modern evergreen browser (recent Chrome, Edge, Firefox or Safari)
- **Database:** none required — data is stored in the browser's built-in **IndexedDB**
- **Runtime dependencies** (see `package.json`):
  - `react` ^19.2, `react-dom` ^19.2
  - `exceljs` ^4.4 (Excel export)
  - `lucide-react` ^1.29 (icons)
- **Development dependencies:** Vite ^8, TypeScript ^5.7, Jest ^30 + Testing Library, ESLint ^9

## Installation Guide

```bash
git clone https://github.com/Mackenziekk/T16-05-Workbench-elves.git
cd T16-05-Workbench-elves
npm ci
npm run dev
```

Open the local URL displayed in the terminal. Run all npm commands from the repository root.

To check the application:

```bash
npm run lint
npm test -- --ci --runInBand
npm run build
```

To preview the production build:

```bash
npm run preview
```

### Deployment

The repository is deployed to **GitHub Pages** automatically by `.github/workflows/deploy.yml` on every push to `main`. The pipeline runs lint → tests → build before publishing. PRs are validated by `.github/workflows/ci.yml`.

## Changelog

### Sprint 4 (2026-10-26 → 2026-10-29)
- Overview improvements: chapter count now follows project settings; project page test fixes
- Help / FAQ page added

### Sprint 3 (2026-10-21 → 2026-10-25)
- Backup and restore integrated with database functions, with unit tests and manual failure scripts
- Excel export: modal + workbook generation, with unit tests for export functions
- Repository reorganisation: app moved to repository root, Vite updated
- Unit tests added for story structure, character, scene and event
- Chapter progress bar tracks the "actual words written" field
- Location added in the scene section; UI adjustments (unused sidebar items removed)
- Local save status and recovery actions

### Sprint 2 (2026-10-14 → 2026-10-18)
- Chapter plan: page split into ChapterCard / ChapterEditor / ChapterPage; drag-and-drop tags with scene tags
- Recently edited view with entity timestamps
- Profile page; backup feature
- Excel export: modal and ExcelJS dependency
- Timeline feature
- CI/CD: PR checks and automatic deployment to GitHub Pages
- README restructured with local setup instructions

### Sprint 1 (earlier)
- Initial application shell: side/top bar, overview, projects, profile
- Story structure planning with custom structures and templates
- Characters, locations, events and scenes pages

> Full release history is maintained in this document and in the GitHub Releases section once releases are tagged.

## Traceability Matrix

The matrix below maps each feature area to its implementation and test files. A full user-story-level matrix (user story → implementation → tests) is maintained in Confluence.

| User Story / Feature | Implementation | Tests |
| --- | --- | --- |
| Overview dashboard | `src/components/OverviewPage.tsx` | `src/components/OverviewPage.test.tsx` |
| Profile | `src/components/ProfilePage.tsx` | `src/components/ProfilePage.test.tsx` |
| Projects | `src/components/ProjectsPage.tsx` | `src/components/ProjectsPage.test.tsx` |
| Chapter plan | `src/features/ChapterPlan/` | `src/test/` (chapter-related suites) |
| Characters | `src/features/character/` | `src/features/character/tests/` |
| Locations | `src/features/Location/LocationPage.tsx` | `src/features/Location/LocationPage.test.tsx` |
| Events & scenes | `src/features/event-and-scene/` | `src/test/EventsPage.test.tsx`, `src/test/ScenesSection.test.tsx` |
| Story structure | `src/features/story-structure/` | `src/test/CustomStoryStructure.test.tsx` |
| Timeline | `src/features/TimeLine/TimeLinePage.tsx` | `src/features/TimeLine/LoadTimelineTest.tsx` |
| Sidebar / topbar | `src/features/Sidebar/` | `src/features/Sidebar/Sidebar.test.tsx`, `Topbar.test.tsx` |
| Backup & restore | `src/features/backup/BackupModal.tsx`, `src/lib/backup.ts` | backup + database integration tests |
| Export to Excel | `src/lib/exportExcel.ts`, `src/features/export/ExportModal.tsx` | export unit tests |
| Data layer (IndexedDB) | `src/lib/db.ts`, `src/lib/store.tsx` | `src/lib/domain.test.ts`, `useCollectionSync.test.ts` |

## Data & Storage Notes

- The application is a **client-side only** application: all data lives in the browser's IndexedDB. There is no server, no database credentials, and no third-party API keys to manage.
- Use **Backup / Restore** (backup tab in the app) to export/import a full backup file, and **Export to Excel** for a spreadsheet version of the plan.
- Clearing browser site data will remove locally stored project data — keep backups.

## Common Problems

- **Data seems lost / page is empty:** restore from a backup file (Backup feature). The repository includes manual failure scripts under `scripts/manual-tests/` used to simulate and verify save-failure recovery.
- **Local URL doesn't open:** make sure you ran `npm ci` before `npm run dev`, and that Node.js v22 is installed.
- **Excel export produces an old version:** re-build with `npm run build` or refresh the deployed page; deployments happen automatically on merge to `main`.

## License

The project currently has **no license file**. Before handover, an appropriate license transferring ownership to the client (as agreed) will be added here, together with a note on third-party licenses for the dependencies in `package.json` (React, ExcelJS, lucide-react, etc.).

## Contact

For any questions after handover, reach out to the team via the addresses in the [Team Members](#team-members) table above, or open an issue in the repository.

<!--
Repo References
-->

[repo]:https://github.com/Mackenziekk/T16-05-Workbench-elves
[demo]:#demo "Live demo (see Demo section)"
[ci]:https://github.com/Mackenziekk/T16-05-Workbench-elves/actions/workflows/ci.yml
[deploy]:https://github.com/Mackenziekk/T16-05-Workbench-elves/actions/workflows/deploy.yml

<!--
Badge References
-->

[img-version-badge]:https://img.shields.io/github/v/release/Mackenziekk/T16-05-Workbench-elves?style=for-the-badge
[img-ci-badge]:https://img.shields.io/github/actions/workflow/status/Mackenziekk/T16-05-Workbench-elves/ci.yml?label=PR%20Checks&style=for-the-badge
[img-deploy-badge]:https://img.shields.io/github/actions/workflow/status/Mackenziekk/T16-05-Workbench-elves/deploy.yml?label=Deploy&style=for-the-badge
