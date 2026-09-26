import re

from src.controllers import cart_controller, order_controller, product_controller, user_controller
from src.database.connection import is_database_enabled
from src.utils.http import http_error


routes = [
    ("GET", re.compile(r"^/$"), lambda context: {
        "nome": "CupcakeShop API",
        "versao": "1.0.0",
        "arquitetura": "MVC",
        "rotas": ["/api/health", "/api/produtos", "/api/carrinho", "/api/pedidos"],
    }, False, 200),
    ("GET", re.compile(r"^/api/health$"), lambda context: {
        "status": "ok",
        "bancoDeDados": "configurado" if is_database_enabled() else "pendente",
    }, False, 200),
    ("GET", re.compile(r"^/api/produtos$"), product_controller.index, False, 200),
    ("GET", re.compile(r"^/api/produtos/(?P<id>\d+)$"), product_controller.show, False, 200),
    ("GET", re.compile(r"^/api/usuario$"), user_controller.show, False, 200),
    ("PUT", re.compile(r"^/api/usuario$"), user_controller.update, True, 200),
    ("GET", re.compile(r"^/api/carrinho$"), cart_controller.show, False, 200),
    ("POST", re.compile(r"^/api/carrinho/itens$"), cart_controller.add_item, True, 201),
    ("PATCH", re.compile(r"^/api/carrinho/itens/(?P<produtoId>\d+)$"), cart_controller.update_item, True, 200),
    ("DELETE", re.compile(r"^/api/carrinho/itens/(?P<produtoId>\d+)$"), cart_controller.remove_item, False, 200),
    ("GET", re.compile(r"^/api/pedidos$"), order_controller.index, False, 200),
    ("POST", re.compile(r"^/api/pedidos$"), order_controller.create, True, 201),
]


def handle_route(method, path, query, body, session_id=""):
    for route_method, pattern, handler, read_body, status in routes:
        match = pattern.match(path)
        if route_method == method and match:
            data = handler({
                "query": query,
                "body": body if read_body else {},
                "params": match.groupdict(),
                "session_id": session_id,
            })
            return {"status": status, "data": data}

    http_error("Rota nao encontrada", 404)
