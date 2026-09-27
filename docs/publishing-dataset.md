# Publishing a verified dataset release

This project publishes public dataset packages to `K-MangDa/nstru-thai-snake-dataset` on Hugging Face. The Node.js generator reads the private `prediction-images` bucket with the server-only Supabase key, then exports **only** records whose status is `verified` and have a valid final species and final bounding box.

It never exports predicted labels or predicted bounding boxes.

## One-time setup

1. Keep `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) in `.env.local`.
2. Set `HF_DATASET_REPO=K-MangDa/nstru-thai-snake-dataset` in `.env.local`.
3. Install the Hugging Face CLI, then authenticate locally:

   ```powershell
   hf auth login
   ```

   Paste a Hugging Face **Write** token in the terminal only. Never commit or paste it into `.env.local`.

## Create and publish a release

Run from the repository root:

```powershell
node scripts/publish_verified_dataset.mjs --version v1 --upload
```

The first run can take time because it downloads the verified source images once, builds `yolo.zip`, `coco.zip`, and `csv.zip`, then uploads them to:

```text
releases/v1/yolo.zip
releases/v1/coco.zip
releases/v1/csv.zip
releases/v1/manifest.json
```

The local `dataset-release/` folder is intentionally ignored by Git. Its manifest records the final image and class counts, plus records skipped because their final annotation was incomplete or invalid.

## Check before downloading images

This read-only command checks how many verified records have a complete final annotation. It does not download images or change anything:

```powershell
node scripts/publish_verified_dataset.mjs --version v1 --dry-run
```
