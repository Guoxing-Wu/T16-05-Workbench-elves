# AW-Authors-Workbench - T16-05-Workbench-elves

The goal of Author's Workbench is to help authors plan and manage their writing efficiently.
  
## Table of Contents

1. [Client profiles](#client-profile)
2. [Client Requirements](#client-requirements)
3. [Team Members](#team-members)
4. [Repository Structure](#repository-structure)
5. [Tools used](#tools-used)

## Client Profile 
Imbi Neeme is an administrator in the School of Computing and Information Systems, Faculty of Engineering and Information Technology, and is also a published author (https://www.penguin.com.au/authors/imbi-neeme). 

## Client Requirements 

Imbi has a need for a workbench to help manage her writing efficiently, specifically with:

- mapping plot points in a flexible way that accommodates the total wordcount for a specific project as well as chapter lengths
- tracking character ages, locations, and key events 
- a plot planning utility to integrate with Microsoft Excel



## Team Members

| Member | Name | Role | Student ID | Email | GitHub Account |
| :---: | --- | --- | --- | --- | --- |
| 1 | Jiechang Che | Product Owner | 1389308 | cheaj@student.unimelb.edu.au | AngelinaChe0621 |
| 2 | Ruting Kou | Secrum Master | 1674238 | rutingk@student.unimelb.edu.au | rtk2iscoding |
| 3 | Kexin Meng | Developer | 1447619 | mengkm@student.unimelb.edu.au | Mackenziekk |
| 4 | Yawen Xue | Developer | 1524304 | yawxue3@student.unimelb.edu.au | A-XYW |
| 5 | Guoxing Wu | Developer | 1259517 | guwu@student.unimelb.edu.au | Guoxing-Wu |


## Repository Structure

- T16-05-Workbench-elves/
  - [Code/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Code)
    - authors-workbench/
      - public/
      - src/
      - package.json
      - vite.config.ts
  - Project\_Files/
    - Design\_Files/
      - [Architectural\_goals\_and\_constraints/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Architectural_goals_and_constraints/Architecture%20Goals%20and%20Constraints.pdf)
      - [Architecture\_Diagram/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Architecture_Diagram/Architecture%20Diagram.drawio.png)
      - [Database\_Diagram/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Database_Diagram/database%20diagram.drawio.png)
      - [Design\_Diagram/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Design_Diagram/Design%20diagram.drawio.png)
      - [Domain\_Diagram/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Domain_Diagram/Domain%20diagram.png)
      - Frontend\_design/
        - [Hi-fi\_Prototype.png](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Frontend_design/Hi-fi_Prototype.png)
        - [Lo-fi\_Prototype.png](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Frontend_design/Lo-fi_Prototype.png)
      - [Sequence\_Diagram/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/Sequence_Diagram/Sequence%20Diagram.png)
      - [User\_Flow/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Design_Files/User_Flow/User%20Flow.png)
    - [Meetings/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Project_Files/Meetings)
    - Requirement\_Files/
      - [Elicitation/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Requirement_Files/Elicitation/Do_Be_Feel_Who.pdf)
      - [Motivational\_Model/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Requirement_Files/Motivational_Model/Motivational_model.png)
      - [Persona/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Requirement_Files/Persona/persona.png)
      - User\_Stories & MoSCoW/
        - [Author's Workbench User Stories.md](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Requirement_Files/User_Stories%20%26%20MoSCoW/Author's%20Workbench%20User%20Stories.md)
        - [MoSCoW for user stories - Sheet1.pdf](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Requirement_Files/User_Stories%20%26%20MoSCoW/MoSCoW%20for%20user%20stories%20-%20Sheet1.pdf)
    - Sprint/
      - [Decision\_made/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Project_Files/Sprint/Decision_made)
      - [Sprint\_1/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Project_Files/Sprint/Sprint_1)
      - [Sprint\_2/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Project_Files/Sprint/Sprint_2)
      - [Sprint\_3/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Project_Files/Sprint/Sprint_3)
    - Team\_Progress1/
      - [ClientCommunication/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Project_Files/Team_Progress1/ClientCommunication)
      - [Team\_Internal\_Communication/](https://github.com/Mackenziekk/T16-05-Workbench-elves/tree/main/Project_Files/Team_Progress1/Team_Internal_Communication)
      - [Tool Used/](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tool%20Used.pdf)
      - [Coding\_Standard](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Coding_Standard.pdf)
      - [Deployment\_Report](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Deployment_Report.pdf)
      - [Test\_Plan](https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Test_Plan.pdf)
  - README.md



## Tools Used

| Tool | Logo | Purpose | Description |
| --- | :---: | --- | --- |
| GitHub | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/github.png?raw=true" width="100"> | Code and file management | Store and manage all project files, including source code, design artefacts, and documentation. |
| Draw.io | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/drawio.png?raw=true" width="100"> | Diagram design | Create design diagrams, such as architecture, domain, database, and sequence diagrams. |
| Outlook | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/outlook.png?raw=true" width="100"> | Client communication | Communicate formally with the client, confirm requirements, and report project progress. |
| Slack | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/slack.png?raw=true" width="100"> | Team communication | Support communication among team members and with the supervisor. |
| Google Drive | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/google%20driven.png?raw=true" width="100"> | Shared file management | Share and collaboratively edit files before their final versions are pushed to GitHub. |
| Visual Studio Code | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/VS%20code.png?raw=true" width="100"> | Software development | Write, run, debug, and maintain the application code during development. |
| Figma | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/Figma.png?raw=true" width="100"> | Prototype design | Create high-fidelity and low-fidelity user-interface prototypes. |
| Canva | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/canva.png?raw=true" width="100"> | Visual material design | Create slides and other visual materials for presentations. |
| Zoom | <img src="https://github.com/Mackenziekk/T16-05-Workbench-elves/blob/main/Project_Files/Team_Progress1/Tool%20Used/Tools_Logos/zoom.png?raw=true" width="100"> | Online meetings | Conduct online meetings with team members and the client. |
