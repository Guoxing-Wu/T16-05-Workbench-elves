# AW-Authors-Workbench - T16-05-Workbench-elves

The goal of Author's Workbench is to help authors plan and manage their writing efficiently.
  
## Table of Contents
- [AW-Authors-Workbench - T16-05-Workbench-elves](#aw-authors-workbench---t16-05-workbench-elves)
  - [Table of Contents](#table-of-contents)
  - [Client Profile](#client-profile)
  - [Client Requirements](#client-requirements)
  - [Team Members](#team-members)
  - [Repository Structure](#repository-structure)
  - [Local Setup](#local-setup)
  - [Project Documentation](#project-documentation)
  - [Tools Used](#tools-used)

## Client Profile 
Imbi Neeme is an administrator in the School of Computing and Information Systems, Faculty of Engineering and Information Technology, and is also a published author (https://www.penguin.com.au/authors/imbi-neeme). 


## Client Requirements 
Imbi has a need for a workbench to help manage her writing efficiently, specifically with:

- mapping plot points in a flexible way that accommodates the total wordcount for a specific project as well as chapter lengths
- tracking character ages, locations, and key events 
- a plot planning utility to integrate with Microsoft Excel


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



## Local Setup
```bash
git clone https://github.com/Mackenziekk/T16-05-Workbench-elves.git
cd T16-05-Workbench-elves
npm ci
npm run dev
```
Open the local URL displayed in the terminal.
Run all npm commands from the repository root.

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

## Project Documentation
**Documentation hub:** [Project Confluence](https://student-team-edq1stef.atlassian.net/wiki/spaces/IP/overview)



## Tools Used

| Tool                     | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| GitHub                   | Source control, pull requests, automated checks and deployment. |
| React and TypeScript     | Application interfaces and typed business logic.                |
| Vite                     | Local development and production builds.                        |
| Jest and Testing Library | Automated tests.                                                |
| ESLint                   | Code quality checks.                                            |
| ExcelJS                  | Excel workbook export.                                          |
| Visual Studio Code       | Code editing and debugging.                                     |
