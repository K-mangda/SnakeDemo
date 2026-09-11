"""Public YOLO inference API for the Thai Snake Classification application."""

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("SNAKE_MODEL_PATH", BASE_DIR / "best.pt"))
MAX_IMAGE_BYTES = 10 * 1024 * 1024

app = FastAPI(title="Thai Snake Classification Inference API")
model: YOLO | None = None


def get_model() -> YOLO:
    global model
    if model is None:
        if not MODEL_PATH.exists():
            raise RuntimeError("Model file was not found on this service.")
        model = YOLO(str(MODEL_PATH))
    return model


@app.get("/health")
def health() -> dict:
    return {"status": "ready" if MODEL_PATH.exists() else "model_missing"}


@app.post("/predict")
async def predict(image: UploadFile = File(...)) -> dict:
    if image.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=415, detail="Only JPEG and PNG images are accepted.")

    payload = await image.read()
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(payload) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image size must not exceed 10 MB.")

    suffix = ".jpg" if image.content_type == "image/jpeg" else ".png"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(payload)
            temp_path = temp_file.name

        result = get_model().predict(temp_path, conf=0.35, iou=0.5, verbose=False)[0]
        height, width = result.orig_shape
        detections = []
        for box in result.boxes:
            x1, y1, x2, y2 = (float(value) for value in box.xyxy[0].tolist())
            class_id = int(box.cls[0])
            raw_name = str(result.names[class_id])
            detections.append({
                "class_name": raw_name,
                "scientific": raw_name.replace("_", " "),
                "confidence": round(float(box.conf[0]), 4),
                "bbox": {
                    "x": round((x1 / width) * 100, 2),
                    "y": round((y1 / height) * 100, 2),
                    "width": round(((x2 - x1) / width) * 100, 2),
                    "height": round(((y2 - y1) / height) * 100, 2),
                },
            })
        detections.sort(key=lambda item: item["confidence"], reverse=True)
        return {"detections": detections, "top_detection": detections[0] if detections else None}
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
