# AW-Authors-Workbench 

**Live demo:** https://guoxing-wu.github.io/T16-05-Workbench-elves/
Built by Team T16-05 Workbenchelves for the COMP30022 IT Project, University of Melbourne.

## Table of Contents
- [Overview](#overview)
- [TL;DR](#tldr)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Team Members](#team-members)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Testing](#testing)
- [CI/CD and Deployment](#cicd-and-deployment)
- [Development Workflow](#development-workflow)
- [Project Documentation](#project-documentation)


## Overview
Author's Workbench is a browser-based planning tool that helps authors organise writing projects. The project README describes the client's needs as flexible plot-point planning against a target word count and chapter lengths, tracking character ages, locations and key events, and exporting a plot plan to Microsoft Excel.

**Client Profile:**
Imbi Neeme is an administrator in the School of Computing and Information Systems, Faculty of Engineering and Information Technology, and is also a published author (https://www.penguin.com.au/authors/imbi-neeme). 
**Client Requirements:**
Imbi has a need for a workbench to help manage her writing efficiently, specifically with:

- mapping plot points in a flexible way that accommodates the total wordcount for a specific project as well as chapter lengths
- tracking character ages, locations, and key events 
- a plot planning utility to integrate with Microsoft Excel

## TL;DR
```bash
git clone https://github.com/Guoxing-Wu/T16-05-Workbench-elves.git
cd T16-05-Workbench-elves
npm ci
npm run dev
```
Then open the local address printed in the terminal.

## Features
- Plan a story using a target word count, average chapter length and story structure.
- Organise chapters, characters, locations, events and scenes within a writing project.
- View story events on a timeline and track character ages at story dates.
- Export story-structure planning to an Excel workbook.
- Save and restore writing data locally in the browser.


## Tech Stack
| Tool                     | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| GitHub                   | Source control, pull requests, automated checks and deployment. |
| React and TypeScript     | Application interfaces and typed business logic.                |
| Vite                     | Local development and production builds.                        |
| Jest and Testing Library | Automated tests.                                                |
| ESLint                   | Code quality checks.                                            |
| ExcelJS                  | Excel workbook export.                                          |
| Visual Studio Code       | Code editing and debugging.                                     |



## Team Members
| Member | Name         | Role                               | Student ID | Email                          | GitHub Account  |
| :----: | ------------ | ---------------------------------- | ---------- | ------------------------------ | --------------- |
|   1    | Jiechang Che | Product Owner                      | 1389308    | cheaj@student.unimelb.edu.au   | AngelinaChe0621 |
|   2    | Kexin Meng   | Developer & Secrum Master (w1~3)   | 1447619    | mengkm@student.unimelb.edu.au  | Mackenziekk     |
|   3    | Ruting Kou   | Developer & Secrum Master (w4~6)   | 1674238    | rutingk@student.unimelb.edu.au | rtk2iscoding    |
|   4    | Yawen Xue    | Developer & Secrum Master (w7~9)   | 1524304    | yawxue3@student.unimelb.edu.au | A-XYW           |
|   5    | Guoxing Wu   | Developer & Secrum Master (w10~12) | 1259517    | guwu@student.unimelb.edu.au    | Guoxing-Wu      |


## Repository Structure
```text
T16-05-Workbench-elves/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy.yml
│   └── pull_request_template.md
├── public/
├── scripts/
│   └── manual-tests/
│       ├── restore-save-writes.js
│       └── simulate-save-failure.js
├── src/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── test/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── .gitignore
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── eslint.config.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.node.json
```

## Getting Started
```bash
# 1. Clone
git clone https://github.com/Guoxing-Wu/T16-05-Workbench-elves.git
cd T16-05-Workbench-elves
 
# 2. Install exact dependencies from package-lock.json
npm ci
 
# 3. Start the dev server
npm run dev
```
 
Before opening a pull request, run all three checks:
 
```bash
npm run lint
npm test -- --ci --runInBand
npm run build
```


To preview the production build:
```bash
npm run preview
```


## Testing
**Link:** [Test Report](https://student-team-edq1stef.atlassian.net/wiki/spaces/IP/folder/9764888)
- **Automated tests:** Jest with Testing Library, located in `src/test/`. Run with `npm test -- --ci --runInBand`.
- **Manual tests:** scripts in `scripts/manual-tests/` cover save and restore behaviour.
- **Coverage

  
## CI/CD and Deployment
- **CI:** `.github/workflows/ci.yml`
- **Deploy:**  `.github/workflows/deploy.yml`
- Publishes the production build to GitHub Pages: https://guoxing-wu.github.io/T16-05-Workbench-elves/

  
## Development Workflow
- Each developer works on their own branch and merges the latest `main` into it before pushing.
- Every change goes through a pull request using the template in `.github/pull_request_template.md`.
- A teammate pulls the branch, reviews and tests it, then merges.
- Work is planned in Agile sprints, with a review and retrospective at the end of each sprint.
  

 
### How a change reaches production
1. A developer works on their own branch and opens a pull request using the PR template.
2. CI runs automatically on the pull request. 
3. A teammate reviews and tests the branch, then merges it into `main`.
4. The deploy workflow publishes the new build to GitHub Pages.
5. The live site updates: https://guoxing-wu.github.io/T16-05-Workbench-elves/


### Environments
| Environment | How to run | Address |
|---|---|---|
| Local development | `npm run dev` | printed in the terminal |
| Local production preview | `npm run build`, then `npm run preview` | printed in the terminal |
| Production | published by `deploy.yml` | https://guoxing-wu.github.io/T16-05-Workbench-elves/ |



## Project Documentation
**Documentation hub:** [Project Confluence](https://student-team-edq1stef.atlassian.net/wiki/spaces/IP/overview)


