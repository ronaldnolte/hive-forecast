# Deployment Guide

This guide outlines the steps to deploy the Standalone Forecast App to Vercel.

## Prerequisites

-   **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
-   **GitHub Account**: Recommended for continuous deployment.

## Option 1: Deploy via GitHub (Recommended)

1.  **Create a GitHub Repository**:
    -   Go to GitHub and create a new repository (e.g., `standalone-forecast-app`).
    -   Do not initialize with README, .gitignore, or license (we have them).

2.  **Push Code to GitHub**:
    Run the following commands in your terminal:
    ```bash
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <YOUR_GITHUB_REPO_URL>
    git push -u origin main
    ```

3.  **Import Project in Vercel**:
    -   Go to your Vercel Dashboard.
    -   Click **"Add New..."** -> **"Project"**.
    -   Select **"Import"** next to your GitHub repository.
    -   **Configure Project**:
        -   **Framework Preset**: Next.js (should be auto-detected).
        -   **Root Directory**: `./` (default).
        -   **Build Command**: `next build` (default).
        -   **Output Directory**: `.next` (default).
        -   **Install Command**: `npm install` (default).
    -   Click **"Deploy"**.

## Option 2: Deploy via Vercel CLI

If you have the Vercel CLI installed (`npm i -g vercel`), you can deploy directly from the terminal:

1.  Run `vercel login` to authenticate.
2.  Run `vercel` in the project root.
3.  Follow the prompts:
    -   Set up and deploy? [Y]
    -   Which scope? [Your Name]
    -   Link to existing project? [N]
    -   Project name? [standalone-forecast-app]
    -   Directory? [./]
    -   Want to modify settings? [N]

## Verification

After deployment, Vercel will provide a production URL (e.g., `https://standalone-forecast-app.vercel.app`). Visit this URL to verify the application is running.
