import os
from dataclasses import dataclass
from functools import lru_cache


def _read_bool(name: str, default: bool) -> bool:
    value = str(os.getenv(name, "")).strip().lower()
    if not value:
        return default
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    return default


@dataclass(frozen=True)
class Settings:
    api_key: str
    model_name: str
    device: str
    compute_type: str
    cpu_threads: int
    num_workers: int
    cache_dir: str
    allow_language_detection: bool


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        api_key=str(os.getenv("WHISPER_FAST_API_KEY", "")).strip(),
        model_name=str(os.getenv("WHISPER_MODEL_NAME", "large-v3")).strip() or "large-v3",
        device=str(os.getenv("WHISPER_DEVICE", "auto")).strip() or "auto",
        compute_type=str(os.getenv("WHISPER_COMPUTE_TYPE", "auto")).strip() or "auto",
        cpu_threads=max(1, int(os.getenv("WHISPER_CPU_THREADS", "4"))),
        num_workers=max(1, int(os.getenv("WHISPER_NUM_WORKERS", "1"))),
        cache_dir=str(os.getenv("WHISPER_CACHE_DIR", "/models")).strip() or "/models",
        allow_language_detection=_read_bool("WHISPER_ALLOW_LANGUAGE_DETECTION", True),
    )
