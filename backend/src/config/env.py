import os
from pathlib import Path


def load_env(file_path=None):
    env_path = Path(file_path) if file_path else Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        value = line.strip()
        if not value or value.startswith("#") or "=" not in value:
            continue

        key, raw = value.split("=", 1)
        key = key.strip()
        raw = raw.strip().strip('"').strip("'")
        os.environ.setdefault(key, raw)


load_env()
