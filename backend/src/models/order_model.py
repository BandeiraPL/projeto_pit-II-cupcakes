from datetime import datetime

from src.data import store
from src.database.connection import is_database_enabled, query
from src.models import cart_model, user_model
from src.utils.http import http_error


def find_all():
    if is_database_enabled():
        pedidos = query(
            """
            SELECT
              id,
              usuario_id,
              criado_em,
              status,
              endereco_entrega,
              forma_pagamento,
              subtotal,
              desconto,
              taxa_entrega,
              total
            FROM pedidos
            WHERE usuario_id = 1
            ORDER BY id DESC
            """
        )

        result = []
        for pedido in pedidos:
            pedido_id = int(pedido["id"])
            criado_em = pedido.get("criado_em")
            if hasattr(criado_em, "strftime"):
                data = criado_em.strftime("%d/%m/%Y")
            else:
                data = str(criado_em)
            result.append({
                "id": f"ORD-{pedido_id:03d}",
                "usuarioId": pedido["usuario_id"],
                "data": data,
                "status": pedido["status"],
                "endereco": pedido["endereco_entrega"],
                "pagamento": pedido["forma_pagamento"],
                "subtotal": float(pedido["subtotal"]),
                "desconto": float(pedido["desconto"]),
                "taxaEntrega": float(pedido["taxa_entrega"]),
                "total": float(pedido["total"]),
                "itens": find_items_by_order_id(pedido_id),
            })
        return result

    return store.pedidos


def create(data, session_id=""):
    if not data.get("endereco") or not str(data.get("endereco")).strip():
        http_error("Endereco de entrega obrigatorio", 400)

    carrinho = cart_model.get_summary(session_id)
    if not carrinho["itens"]:
        http_error("Carrinho vazio", 400)

    endereco = str(data["endereco"]).strip()
    pagamento = data.get("pagamento") or "Pix"
    usuario_id = user_model.find_or_create_for_order(data.get("usuario"), endereco, session_id)

    if is_database_enabled():
        result = query(
            """
            INSERT INTO pedidos
              (usuario_id, endereco_entrega, forma_pagamento, status, subtotal, desconto, taxa_entrega, total)
            VALUES
              (%(usuario_id)s, %(endereco)s, %(pagamento)s, 'recebido', %(subtotal)s, %(desconto)s, %(taxa_entrega)s, %(total)s)
            """,
            {
                "usuario_id": usuario_id,
                "endereco": endereco,
                "pagamento": pagamento,
                "subtotal": carrinho["subtotal"],
                "desconto": carrinho["desconto"],
                "taxa_entrega": carrinho["entrega"],
                "total": carrinho["total"],
            },
        )

        pedido_id = result["insertId"]
        for item in carrinho["itens"]:
            query(
                """
                INSERT INTO pedido_itens
                  (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, total)
                VALUES
                  (%(pedido_id)s, %(produto_id)s, %(nome_produto)s, %(quantidade)s, %(preco_unitario)s, %(total)s)
                """,
                {
                    "pedido_id": pedido_id,
                    "produto_id": item["produto"]["id"],
                    "nome_produto": item["produto"]["nome"],
                    "quantidade": item["quantidade"],
                    "preco_unitario": item["produto"]["preco"],
                    "total": item["total"],
                },
            )

        cart_model.clear(session_id)
        return build_order_response(pedido_id, endereco, pagamento, carrinho, usuario_id)

    pedido = build_order_response(len(store.pedidos) + 1, endereco, pagamento, carrinho, usuario_id)
    store.pedidos.insert(0, pedido)
    cart_model.clear(session_id)
    return pedido


def build_order_response(pedido_id, endereco, pagamento, carrinho, usuario_id=1):
    return {
        "id": f"ORD-{int(pedido_id):03d}",
        "usuarioId": usuario_id,
        "data": datetime.now().strftime("%d/%m/%Y"),
        "status": "Recebido",
        "endereco": endereco,
        "pagamento": pagamento,
        "itens": [
            {
                "produtoId": item["produto"]["id"],
                "nome": item["produto"]["nome"],
                "quantidade": item["quantidade"],
                "total": item["total"],
            }
            for item in carrinho["itens"]
        ],
        "total": carrinho["total"],
    }


def find_items_by_order_id(pedido_id):
    rows = query(
        """
        SELECT
          produto_id,
          nome_produto,
          quantidade,
          preco_unitario,
          total
        FROM pedido_itens
        WHERE pedido_id = %(pedido_id)s
        ORDER BY id ASC
        """,
        {"pedido_id": pedido_id},
    )
    return [
        {
            "produtoId": item["produto_id"],
            "nome": item["nome_produto"],
            "quantidade": item["quantidade"],
            "precoUnitario": float(item["preco_unitario"]),
            "total": float(item["total"]),
        }
        for item in rows
    ]
