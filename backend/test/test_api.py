import json
import os
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path
import sys

os.environ["APP_ENV"] = "test"
os.environ["DB_HOST"] = ""
os.environ["DB_USER"] = ""
os.environ["DB_NAME"] = ""

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from src.app import create_server


class ApiTest(unittest.TestCase):
    def setUp(self):
        self.server = create_server(("127.0.0.1", 0))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.port = self.server.server_address[1]

    def tearDown(self):
        self.server.shutdown()
        self.thread.join(timeout=2)
        self.server.server_close()

    def request(self, method, path, body=None):
        connection = HTTPConnection("127.0.0.1", self.port)
        payload = json.dumps(body).encode("utf-8") if body is not None else None
        headers = {"Content-Type": "application/json"} if payload else {}
        connection.request(method, path, body=payload, headers=headers)
        response = connection.getresponse()
        data = response.read().decode("utf-8")
        connection.close()
        return response.status, json.loads(data)

    def test_lista_produtos_e_permite_criar_pedido(self):
        status, produtos = self.request("GET", "/api/produtos")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(produtos), 1)

        status, carrinho = self.request("POST", "/api/carrinho/itens", {
            "produtoId": 1,
            "quantidade": 2,
        })
        self.assertEqual(status, 201)
        self.assertEqual(carrinho["quantidadeTotal"], 2)

        status, pedido = self.request("POST", "/api/pedidos", {
            "endereco": "Rua das Flores, 123",
            "pagamento": "Pix",
        })
        self.assertEqual(status, 201)
        self.assertEqual(pedido["status"], "Recebido")


if __name__ == "__main__":
    unittest.main()
