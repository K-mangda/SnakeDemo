"""Low-memory ONNX inference API for the Thai Snake Classification application."""

import io
import os
from pathlib import Path

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("SNAKE_MODEL_PATH", BASE_DIR / "best.int8.onnx"))
MAX_IMAGE_BYTES = 10 * 1024 * 1024
IMAGE_SIZE = 640
CONFIDENCE_THRESHOLD = 0.35
IOU_THRESHOLD = 0.5
CLASS_NAMES = [
    "Ahaetulla_nasuta", "Ahaetulla_prasina", "Boiga_cyanea", "Boiga_melanota",
    "Boiga_multomaculata", "Boiga_siamensis", "Bungarus_fasciatus", "Bungarus_wanghaotingi",
    "Calliophis_maculiceps_maculiceps", "Coelognathus_radiatus", "Cylindrophis_jodiae",
    "Daboia_siamensis", "Dendrelaphis_pictus", "Enhydris_enhydris", "Enhydris_plumbea",
    "Homalopsis_buccata", "Lycodon_davisonii", "Lycodon_laoensis", "Malayopython_reticulatus",
    "Naja_kaouthia", "Oligodon_taeniatus", "Psammodynastes_pulverulentus", "Ptyas_mucosa",
    "Trimeresurus_albolabris", "Trimeresurus_macrops",
]

app = FastAPI(title="Thai Snake Classification Inference API")
session: ort.InferenceSession | None = None


def get_session() -> ort.InferenceSession:
    global session
    if session is None:
        if not MODEL_PATH.exists():
            raise RuntimeError("Model file was not found on this service.")
        session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    return session


def letterbox(image: Image.Image) -> tuple[np.ndarray, float, int, int]:
    width, height = image.size
    scale = min(IMAGE_SIZE / width, IMAGE_SIZE / height)
    resized_width, resized_height = round(width * scale), round(height * scale)
    resized = image.resize((resized_width, resized_height), Image.Resampling.BILINEAR)
    canvas = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), (114, 114, 114))
    pad_x, pad_y = (IMAGE_SIZE - resized_width) // 2, (IMAGE_SIZE - resized_height) // 2
    canvas.paste(resized, (pad_x, pad_y))
    tensor = np.asarray(canvas, dtype=np.float32).transpose(2, 0, 1)[None] / 255.0
    return tensor, scale, pad_x, pad_y


def iou(box: np.ndarray, boxes: np.ndarray) -> np.ndarray:
    left, top = np.maximum(box[0], boxes[:, 0]), np.maximum(box[1], boxes[:, 1])
    right, bottom = np.minimum(box[2], boxes[:, 2]), np.minimum(box[3], boxes[:, 3])
    overlap = np.maximum(0, right - left) * np.maximum(0, bottom - top)
    area = (box[2] - box[0]) * (box[3] - box[1])
    areas = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
    return overlap / np.maximum(area + areas - overlap, 1e-6)


def non_max_suppression(boxes: np.ndarray, scores: np.ndarray) -> list[int]:
    keep: list[int] = []
    order = scores.argsort()[::-1]
    while order.size:
        current = order[0]
        keep.append(int(current))
        if order.size == 1:
            break
        order = order[1:][iou(boxes[current], boxes[order[1:]]) < IOU_THRESHOLD]
    return keep


def run_inference(image: Image.Image) -> list[dict]:
    original_width, original_height = image.size
    tensor, scale, pad_x, pad_y = letterbox(image)
    runtime = get_session()
    output = runtime.run(None, {runtime.get_inputs()[0].name: tensor})[0][0].T
    boxes, class_scores = output[:, :4], output[:, 4:]
    class_ids = class_scores.argmax(axis=1)
    confidences = class_scores[np.arange(class_scores.shape[0]), class_ids]
    mask = confidences >= CONFIDENCE_THRESHOLD
    boxes, class_ids, confidences = boxes[mask], class_ids[mask], confidences[mask]
    if not len(boxes):
        return []
    xyxy = np.column_stack((
        boxes[:, 0] - boxes[:, 2] / 2, boxes[:, 1] - boxes[:, 3] / 2,
        boxes[:, 0] + boxes[:, 2] / 2, boxes[:, 1] + boxes[:, 3] / 2,
    ))
    detections: list[dict] = []
    for class_id in np.unique(class_ids):
        indices = np.where(class_ids == class_id)[0]
        for index in indices[non_max_suppression(xyxy[indices], confidences[indices])]:
            x1, y1, x2, y2 = xyxy[index]
            x1, x2 = np.clip((x1 - pad_x) / scale, 0, original_width), np.clip((x2 - pad_x) / scale, 0, original_width)
            y1, y2 = np.clip((y1 - pad_y) / scale, 0, original_height), np.clip((y2 - pad_y) / scale, 0, original_height)
            raw_name = CLASS_NAMES[int(class_id)]
            detections.append({
                "class_name": raw_name,
                "scientific": raw_name.replace("_", " "),
                "confidence": round(float(confidences[index]), 4),
                "bbox": {
                    "x": round(float(x1 / original_width * 100), 2), "y": round(float(y1 / original_height * 100), 2),
                    "width": round(float((x2 - x1) / original_width * 100), 2), "height": round(float((y2 - y1) / original_height * 100), 2),
                },
            })
    return sorted(detections, key=lambda item: item["confidence"], reverse=True)


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
    try:
        detections = run_inference(Image.open(io.BytesIO(payload)).convert("RGB"))
    except Exception as error:
        raise HTTPException(status_code=500, detail="Model inference failed.") from error
    return {"detections": detections, "top_detection": detections[0] if detections else None}
