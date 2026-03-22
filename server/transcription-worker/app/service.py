from functools import lru_cache

from faster_whisper import WhisperModel

from .settings import get_settings


@lru_cache(maxsize=1)
def get_model() -> WhisperModel:
    settings = get_settings()
    return WhisperModel(
        settings.model_name,
        device=settings.device,
        compute_type=settings.compute_type,
        cpu_threads=settings.cpu_threads,
        num_workers=settings.num_workers,
        download_root=settings.cache_dir,
    )


def transcribe_audio(audio_path: str, language: str | None) -> dict[str, object]:
    settings = get_settings()
    normalized_language = str(language or "").strip().lower() or None
    if not settings.allow_language_detection and not normalized_language:
        normalized_language = "nl"

    segments, info = get_model().transcribe(
        audio_path,
        language=normalized_language,
        vad_filter=True,
    )

    parts: list[str] = []
    for segment in segments:
        text = str(getattr(segment, "text", "") or "").strip()
        if text:
            parts.append(text)

    transcript = " ".join(parts).strip()
    detected_language = str(getattr(info, "language", "") or "").strip().lower()
    duration_seconds = getattr(info, "duration", None)

    return {
        "transcript": transcript,
        "text": transcript,
        "language": detected_language or normalized_language or None,
        "durationSeconds": float(duration_seconds) if isinstance(duration_seconds, (int, float)) else None,
    }
