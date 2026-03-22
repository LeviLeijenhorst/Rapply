import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import HTTPException, UploadFile, status


def _guess_suffix(upload: UploadFile) -> str:
    filename = str(upload.filename or "").strip().lower()
    if "." in filename:
        return Path(filename).suffix or ".bin"

    content_type = str(upload.content_type or "").strip().lower()
    if content_type in {"audio/wav", "audio/x-wav"}:
        return ".wav"
    if content_type in {"audio/mpeg", "audio/mp3"}:
        return ".mp3"
    if content_type in {"audio/webm", "video/webm"}:
        return ".webm"
    if content_type in {"audio/mp4", "audio/m4a", "audio/aac"}:
        return ".m4a"
    if content_type in {"audio/ogg", "audio/opus"}:
        return ".ogg"
    return ".bin"


@asynccontextmanager
async def store_uploaded_audio(upload: UploadFile) -> AsyncIterator[str]:
    if upload is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing audio file")

    suffix = _guess_suffix(upload)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_path = temp_file.name

    try:
        total_bytes = 0
        while True:
            chunk = await upload.read(1024 * 1024)
            if not chunk:
                break
            total_bytes += len(chunk)
            temp_file.write(chunk)

        temp_file.flush()
        temp_file.close()

        if total_bytes <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audio payload is empty")

        yield temp_path
    finally:
        try:
            temp_file.close()
        except Exception:
            pass
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
