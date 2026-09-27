# One-time setup: Admin dataset publisher

The Admin **Publish dataset** button starts a GitHub Actions job. The job downloads verified source images from Supabase, creates the ZIP packages, and uploads them to Hugging Face. It runs in the cloud, so the administrator does not need to leave a computer on.

## 1. Add GitHub Actions secrets

In the `K-mangda/SnakeDemo` GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**.

Create these four secrets:

- `NEXT_PUBLIC_SUPABASE_URL` — the project URL
- `SUPABASE_SECRET_KEY` — the Supabase default secret key
- `HF_DATASET_REPO` — `K-MangDa/nstru-thai-snake-dataset`
- `HF_TOKEN` — the Hugging Face Write token

Never put any of these values in the repository files.

## 2. Let the website start the job

Create a fine-grained GitHub personal access token that can access `K-mangda/SnakeDemo` and has **Actions: Read and write** permission. Store that token as this Vercel Production environment variable:

```text
GITHUB_DATASET_PUBLISH_TOKEN
```

Optionally set `GITHUB_DATASET_REPOSITORY=K-mangda/SnakeDemo` in Vercel if the repository ever moves.

## Usage

Visit Admin, enter a version such as `v1`, then select **Publish dataset**. The status box links to the GitHub Actions run. Reusing `v1` updates `releases/v1/` in Hugging Face with all verified images available at the time the job began.
