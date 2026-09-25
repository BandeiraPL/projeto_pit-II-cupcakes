import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from src.config.env import load_env
from src.routes.router import handle_route
from src.utils.http import HttpError, json_ready

load_env()


class ApiHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        self.handle_request()

    def do_POST(self):
        self.handle_request()

    def do_PUT(self):
        self.handle_request()

    def do_PATCH(self):
        self.handle_request()

    def do_DELETE(self):
        self.handle_request()

    def log_message(self, format, *args):
        return

    def handle_request(self):
        try:
            parsed = urlparse(self.path)
            body = self.read_json_body()
            response = handle_route(self.command, parsed.path, parse_qs(parsed.query), body)
            self.send_json(response["status"], response["data"])
        except HttpError as error:
            self.send_json(error.status, {"erro": error.message, "detalhe": error.message})
        except Exception as error:
            self.send_json(500, {"erro": "Erro interno do servidor", "detalhe": str(error)})

    def read_json_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}

        raw = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw) if raw else {}
        except json.JSONDecodeError as exc:
            raise HttpError("JSON invalido", 400) from exc

    def send_json(self, status, data):
        payload = json.dumps(json_ready(data), ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")


def create_server(address=("127.0.0.1", 3000)):
    return ThreadingHTTPServer(address, ApiHandler)
