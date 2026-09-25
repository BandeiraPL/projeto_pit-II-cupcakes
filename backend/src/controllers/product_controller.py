from src.models import product_model
from src.utils.http import http_error


def index(context):
    query_params = context["query"]
    return product_model.find_all(
        busca=query_params.get("busca", [""])[0],
        categoria=query_params.get("categoria", [""])[0],
    )


def show(context):
    produto = product_model.find_by_id(context["params"]["id"])
    if not produto:
        http_error("Produto nao encontrado", 404)
    return produto
