# Developer Guide

## System Requirements 
### Prerequisites

The following tools are required for local development and building the application:

| Tool | Requirement | Purpose |
| --- | --- | --- |
| Node.js | Version 22.x, at least 22.12.0 | Runs the development server and build tools. This baseline aligns with the project's CI configuration and locked build-tool requirements. |
| npm | Installed alongside Node.js | Installs project dependencies and runs development, testing, and build commands. |
| Git | Required when cloning the repository | Downloads the source code and allows developers to select the appropriate project revision. |
| Web browser | JavaScript, IndexedDB, and file downloads enabled | Runs the application, stores writing-project data locally, and downloads backup and Excel files. |

Project dependencies, including React, TypeScript, Vite, and ExcelJS, are installed through npm and do not require separate manual installation.

Microsoft Excel is optional for running the application. It can be used to view and edit exported `.xlsx` planning workbooks.

### Reference Environment
- Node.js: 22.23.2
- npm: 10.9.8
- Git: 2.46.0 



## Cloning the Repository 

Open a terminal in the directory where you want to store the project, then clone the repository:

```bash
git clone https://github.com/Mackenziekk/T16-05-Workbench-elves.git
cd T16-05-Workbench-elves
```

If the repository is private, ensure that your GitHub account has access before cloning.

The project root contains `package.json` and `package-lock.json`. Run the installation, development, testing, and build commands in this guide from that directory.

To identify the current source revision, run:

```bash
git rev-parse --short HEAD
```



## Installing Dependencies

From the project root directory, which contains `package.json` and `package-lock.json`, run:

```bash
npm ci
```

This command installs the dependency versions recorded in `package-lock.json`. It also installs the development tools needed to run, test, and build the application.

If a `node_modules` directory already exists, `npm ci` removes it before installing the dependencies again.

Keep `package.json` and `package-lock.json` from the same project revision. If they are inconsistent, `npm ci` stops with an error.

After installation completes successfully, continue to Local Configuration.



## Local Configuration 

The current application does not require additional manual configuration for standard local development.

- **Environment variables:** No `.env` file or custom environment variables are required.
- **API keys and credentials:** No application API keys, database credentials, or backend service credentials are required.
- **Database setup:** The application stores data locally using the browser's IndexedDB. The database and its object stores are created or upgraded automatically when the application accesses them. No separate database server or manual database setup is required.
- **Application configuration:** The Vite configuration is provided in `vite.config.ts`. No changes to this file are required for the standard local setup.

Ensure that JavaScript and IndexedDB are available in the browser. Once dependencies have been installed successfully, proceed to running the application locally.



## Running the Application Locally

### Starting the Application

From the project root directory, start the Vite development server:

```bash
npm run dev
```

Once the server is ready, open the Local URL displayed in the terminal in your browser.

Keep the terminal process running while using the application. The terminal remains occupied because the development server is still running.

Wait for the application to finish loading existing browser data before editing a project.



### Stopping the Application

Before closing the application:

1. If you are using a form with a Create or Save button, click that button to confirm your changes, or Cancel to discard them.
2. Chapter titles and chapter notes save automatically. Wait for the project save indicator to display **Saved locally** before leaving.
3. Close the application tab.
4. In the terminal running the development server, press **Ctrl+C** to stop it.

Stopping the development server does not delete data already saved in the browser.

The **Saved locally** indicator covers writing projects and custom story structures. Author profile and notebook data are saved separately and are not covered by this indicator.

When restarting, use the same browser profile and local address to access previously saved data.



## Running Checks 

After installing the dependencies, run the following checks from the project root directory. The development server does not need to be running.

### Code Quality Check

Run ESLint:

```bash
npm run lint
```

This command checks the code against the rules defined in `eslint.config.js`.

A successful run finishes without lint errors. ESLint may return to the terminal prompt without displaying a separate success message.



### Automated Tests

Run the Jest test suite using the same options as the project's CI workflow:

```bash
npm test -- --ci --runInBand
```

The `--ci` option enables Jest's CI behavior, while `--runInBand` runs the tests sequentially in a single process. When the run finishes, review the test summary. A successful run reports that all test suites and tests have passed. If either check fails, review the reported errors and resolve them before continuing to the build step.



## Building and Previewing the Application 

### Building the Application

After completing the checks in Running Checks, run the following command from the project root:

```bash
npm run build
```

This command first runs the TypeScript checks using `tsc -b`, then generates the production build using Vite.

The generated files are placed in the `dist/` directory. The current configuration inlines the application's JavaScript and CSS into `dist/index.html`, while public assets are also copied into `dist/`.

If the command reports an error, resolve it before continuing to the preview step.



### Previewing the Build

After the build completes successfully, run:

```bash
npm run preview
```

Open the Local URL displayed in the terminal. This server serves the generated files from `dist/`, allowing you to check the production build locally.

Keep the terminal process running while previewing the application. When finished, follow the steps in [Stopping the Application](#stopping-the-application).

If you change the source code, run `npm run build` again to update the files being previewed.

The preview server is intended for local verification. Running `npm run preview` does not publish the application to GitHub Pages or another hosting service.



## Deployment and Maintenance
### Deployment Overview

**Application URL:** https://mackenziekk.github.io/T16-05-Workbench-elves/

- The repository is configured to deploy Author’s Workbench as a static web application to GitHub Pages through GitHub Actions.

- The **Deploy to GitHub Pages** workflow runs when changes are pushed to the `main` branch. It can also be triggered manually.

- The workflow uses Node.js 22 and runs the following commands in order:
  ```bash
  npm ci
  npm run lint
  npm test -- --ci --runInBand
  npm run build
  ```

- If these steps succeed, the workflow uploads the generated `dist` directory and runs the GitHub Pages deployment job.
- Application data is stored locally in each user’s browser using IndexedDB. User data is not uploaded to GitHub Pages as part of deployment.



### Deploying Updates 
1. Create a working branch from the latest `main` branch and make the required changes.

2. Run the following checks from the repository root:
     ```bash
     npm run lint
     npm test -- --ci --runInBand
     npm run build
     ```

3. Commit and push the changes, then open a pull request targeting `main`. Describe the changes and the checks performed.

4. Confirm that the PR Checks workflow succeeds. Review the changes and resolve any issues before merging.

5. Merge the pull request into `main`. This triggers the Deploy to GitHub Pages workflow, which repeats the checks, builds the application, and deploys the generated files.

6. Open the repository’s Actions tab and select Deploy to GitHub Pages. Open the run associated with the merged commit and confirm that both the `build` and `deploy` jobs succeed.

7. Open the deployed application and complete the checks described in Verifying the Deployment. Record the deployed commit, deployment URL, and verification date in the handover or maintenance record.

If a workflow fails, inspect the failed step’s logs and correct the issue before attempting deployment again.



#### Manual Deployment

1. Open the repository’s **Actions** tab.
2. Select **Deploy to GitHub Pages**.
3. Click **Run workflow**.
4. Select the `main` branch and start the workflow.
5. Confirm that both jobs succeed, then verify the deployed application.





### Verifying the Deployment 

After the deployment workflow succeeds, verify the application at the deployed URL. Use a separate browser profile and disposable test data for these checks.

1. **Application loading**

   Open the deployment URL and confirm that the main interface loads and navigation works.

2. **Project editing and persistence**
   Create a test project and edit a chapter title and its notes. Wait until the project shows Saved locally, then reload the page. Confirm that the project and edits remain available.

3. **Story structure**
   Open the test project's story structure view. Confirm that acts, beats, and chapter mappings are displayed.

4. **Excel export**
   Export the test project's story structure. Open the downloaded `.xlsx` file in Excel or a compatible application and confirm that the STRUCTURE worksheet contains the expected chapter information.

5. **JSON backup and restore**
   Create a JSON backup using disposable data. Follow the Backup and Restore guide to test restoration, and confirm that the backed-up projects, custom structures, and any included profile and notebook settings are restored correctly.

6. **Verification record**
   Record the deployed commit, deployment URL, verification date, browser, and check results in the maintenance record. Include reproduction steps for any issues found.

If verification fails, investigate the issue before confirming the deployment as ready for use. Follow the rollback procedure if a previous working version needs to be restored.



### Rolling Back a Deployment 

If a deployed update introduces a serious issue, use the following procedure to restore working behaviour.

1. **Identify the affected changes**
   Record the issue, the problematic pull request or commits, and the last deployment verified to work correctly.

2. **Preserve user data**
   Where the application remains usable, affected users should export a JSON backup from their own browser before changing application versions. Follow the Backup and Restore guide.

3. **Check compatibility**
   Confirm that the rollback candidate supports the existing browser database and backup formats. Test compatibility in an isolated environment before publishing it.

4. **Prepare a rollback pull request**
   Open the merged pull request responsible for the issue and use GitHub’s Revert option to create a new pull request. Review the changes to ensure unrelated updates are retained. If the automatic revert encounters conflicts, a maintainer must prepare and resolve the revert on a working branch.

5. **Validate the rollback**
   Run lint, Jest tests, and the production build. Confirm that the original issue is resolved and that existing data remains accessible.

6. **Deploy the rollback**
   Merge the reviewed rollback pull request into `main`. Confirm that the resulting Deploy to GitHub Pages workflow completes both the `build` and `deploy` jobs successfully.

7. **Verify and record the result**
   Complete the Verifying the Deployment checks. Record the reason for the rollback, reverted changes, new deployed commit, date, and verification results.

#### Data Compatibility

- The current application uses IndexedDB schema version 2 and JSON backup format version 2. These are separate version numbers.

- The current backup parser accepts formats v1 and v2. Compatibility with an older application version must be checked before rollback.

- An older application that requests an IndexedDB version below the existing database version cannot open that database. If the rollback candidate is incompatible, prepare a corrective update that retains support for the current data formats.

- Redeploying application files does not restore an earlier copy of users’ browser data. Preserve existing browser storage and follow the separate Backup and Restore guide when data restoration is required.



### Routine Maintenance

#### Dependencies and Runtime

Periodically review available dependency updates and reported security vulnerabilities:

```bash
npm outdated
npm audit
```

Review the findings and make required updates on a working branch. Keep the dependency manifest and lockfile consistent, and include related changes in the same pull request.

After updating dependencies, run lint, Jest tests, and the production build. Preview the application locally and check the affected features before merging.

When changing the Node.js version, update both GitHub Actions workflows and the System Requirements documentation to match the tested version.



#### Investigating Issues

For failed automated checks or deployments, inspect the failed job and step in GitHub Actions.

For problems in the application, record:

- The deployed commit and application URL.
- The browser and version.
- Steps to reproduce the issue.
- Expected and actual behaviour.
- Relevant browser console errors.

Reproduce the issue using disposable test data before making changes.

The application loads fonts from Google Fonts. Check whether these external resources load correctly when investigating font or layout problems.



#### Data Compatibility

Before changing the IndexedDB schema or JSON backup format, verify compatibility with existing data and supported backup versions.

Test backup and restore using disposable data, including projects, custom structures, profile, and notebook settings where present.

Document any required migration steps in the Backup and Restore guide.



#### Documentation and Maintenance Records

Update the relevant documentation whenever commands, requirements, deployment settings, or application behaviour change.

For each published maintenance update, record the reason for the change, deployed commit, deployment date, and verification results.