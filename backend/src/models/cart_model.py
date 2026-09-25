from src.data import store
from src.database.connection import is_database_enabled, query
from src.models import product_model
from src.utils.http import http_error


def add_item(produto_id, quantidade=1):
    product_id = int(produto_id)
    amount = int(quantidade)
    produto = product_model.find_by_id(product_id)

    if not produto:
        http_error("Produto nao encontrado", 404)
    if amount < 1:
        http_error("Quantidade invalida", 400)

    if is_database_enabled():
        carrinho = get_open_cart()
        rows = query(
            "SELECT id, quantidade FROM carrinho_itens WHERE carrinho_id = %(carrinho_id)s AND produto_id = %(produto_id)s",
            {"carrinho_id": carrinho["id"], "produto_id": product_id},
        )

        if rows:
            query(
                "UPDATE carrinho_itens SET quantidade = quantidade + %(quantidade)s WHERE id = %(id)s",
                {"quantidade": amount, "id": rows[0]["id"]},
            )
        else:
            query(
                """
                INSERT INTO carrinho_itens (carrinho_id, produto_id, quantidade, preco_unitario)
                VALUES (%(carrinho_id)s, %(produto_id)s, %(quantidade)s, %(preco_unitario)s)
                """,
                {
                    "carrinho_id": carrinho["id"],
                    "produto_id": product_id,
                    "quantidade": amount,
                    "preco_unitario": produto["preco"],
                },
            )
        return get_summary()

    item = next((entry for entry in store.carrinho if entry["produtoId"] == product_id), None)
    if item:
        item["quantidade"] += amount
    else:
        store.carrinho.append({"produtoId": product_id, "quantidade": amount})
    return get_summary()


def update_item(produto_id, data):
    product_id = int(produto_id)

    if is_database_enabled():
        carrinho = get_open_cart()
        rows = query(
            "SELECT id, quantidade FROM carrinho_itens WHERE carrinho_id = %(carrinho_id)s AND produto_id = %(produto_id)s",
            {"carrinho_id": carrinho["id"], "produto_id": product_id},
        )
        if not rows:
            http_error("Item nao encontrado no carrinho", 404)

        item = rows[0]
        if "quantidade" in data:
            next_quantity = int(data["quantidade"])
        else:
            next_quantity = int(item["quantidade"]) + int(data.get("delta", 0))

        if next_quantity <= 0:
            query("DELETE FROM carrinho_itens WHERE id = %(id)s", {"id": item["id"]})
        else:
            query(
                "UPDATE carrinho_itens SET quantidade = %(quantidade)s WHERE id = %(id)s",
                {"quantidade": next_quantity, "id": item["id"]},
            )
        return get_summary()

    item = next((entry for entry in store.carrinho if entry["produtoId"] == product_id), None)
    if not item:
        http_error("Item nao encontrado no carrinho", 404)

    if "quantidade" in data:
        next_quantity = int(data["quantidade"])
    else:
        next_quantity = item["quantidade"] + int(data.get("delta", 0))

    item["quantidade"] = next_quantity
    if item["quantidade"] <= 0:
        remove_item(product_id)
    return get_summary()


def remove_item(produto_id):
    product_id = int(produto_id)

    if is_database_enabled():
        carrinho = get_open_cart()
        query(
            "DELETE FROM carrinho_itens WHERE carrinho_id = %(carrinho_id)s AND produto_id = %(produto_id)s",
            {"carrinho_id": carrinho["id"], "produto_id": product_id},
        )
        return get_summary()

    store.carrinho[:] = [entry for entry in store.carrinho if entry["produtoId"] != product_id]
    return get_summary()


def clear():
    if is_database_enabled():
        carrinho = get_open_cart()
        query("DELETE FROM carrinho_itens WHERE carrinho_id = %(carrinho_id)s", {"carrinho_id": carrinho["id"]})
        return

    store.carrinho.clear()


def get_summary():
    if is_database_enabled():
        carrinho = get_open_cart()
        rows = query(
            """
            SELECT
              ci.quantidade,
              ci.preco_unitario,
              p.id,
              p.nome,
              p.categoria,
              p.preco,
              p.imagem,
              p.destaque,
              p.descricao,
              p.ativo
            FROM carrinho_itens ci
            INNER JOIN produtos p ON p.id = ci.produto_id
            WHERE ci.carrinho_id = %(carrinho_id)s
            ORDER BY ci.id ASC
            """,
            {"carrinho_id": carrinho["id"]},
        )
        itens = []
        for row in rows:
            produto = {
                "id": row["id"],
                "nome": row["nome"],
                "categoria": row["categoria"],
                "preco": float(row["preco"]),
                "imagem": row["imagem"],
                "destaque": bool(row["destaque"]),
                "descricao": row["descricao"],
                "ativo": bool(row["ativo"]),
            }
            itens.append({
                "produto": produto,
                "quantidade": int(row["quantidade"]),
                "total": round_money(float(row["preco_unitario"]) * int(row["quantidade"])),
            })
        return build_summary(itens)

    itens = []
    for item in store.carrinho:
        produto = product_model.find_by_id(item["produtoId"])
        itens.append({
            "produto": produto,
            "quantidade": item["quantidade"],
            "total": round_money(produto["preco"] * item["quantidade"]),
        })
    return build_summary(itens)


def build_summary(itens):
    quantidade_total = sum(item["quantidade"] for item in itens)
    subtotal = round_money(sum(item["total"] for item in itens))
    desconto = round_money(subtotal * 0.1) if quantidade_total >= 6 else 0
    return {
        "itens": itens,
        "quantidadeTotal": quantidade_total,
        "subtotal": subtotal,
        "desconto": desconto,
        "entrega": 0,
        "total": round_money(subtotal - desconto),
    }


def get_open_cart():
    rows = query("SELECT id FROM carrinhos WHERE usuario_id = 1 AND status = 'aberto' ORDER BY id DESC LIMIT 1")
    if rows:
        return rows[0]

    result = query("INSERT INTO carrinhos (usuario_id, status) VALUES (1, 'aberto')")
    return {"id": result["insertId"]}


def round_money(value):
    return round(float(value) + 0.0000001, 2)
