from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, status

from .audio import store_uploaded_audio
from .service import transcribe_audio
from .settings import get_settings

app = FastAPI(title="Self-Hosted Whisper Worker")


def require_bearer_auth(authorization: Annotated[str | None, Header()] = None) -> None:
    api_key = get_settings().api_key
    if not api_key:
        return

    token = str(authorization or "").strip()
    expected = f"Bearer {api_key}"
    if token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@app.get("/health")
def health() -> dict[str, object]:
    settings = get_settings()
    return {
        "ok": True,
        "model": settings.model_name,
        "device": settings.device,
    }


@app.post("/transcribe")
async def transcribe(
    audio: Annotated[UploadFile, File(...)],
    language: Annotated[str | None, Form()] = None,
    _: None = Depends(require_bearer_auth),
) -> dict[str, object]:
    async with store_uploaded_audio(audio) as audio_path:
        result = transcribe_audio(audio_path, language)

    if not str(result.get("transcript") or "").strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No transcript returned")

    return result
