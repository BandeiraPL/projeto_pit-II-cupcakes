import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from src.app import create_server
from src.config.env import load_env
from src.database.connection import connect_database

load_env()
PORT = int(os.environ.get("PORT", "3000") or 3000)


def start():
    database = connect_database()
    print(database["message"])

    server = create_server(("0.0.0.0", PORT))
    print(f"CupcakeShop API rodando em http://localhost:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    try:
        start()
    except KeyboardInterrupt:
        print("Servidor finalizado.")
