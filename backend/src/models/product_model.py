from src.data import store
from src.database.connection import is_database_enabled, query


def find_all(busca="", categoria=""):
    if is_database_enabled():
        params = {"busca": f"%{busca}%", "categoria": categoria}
        sql = """
            SELECT id, nome, categoria, preco, imagem, destaque, descricao, ativo, criado_em
            FROM produtos
            WHERE ativo = TRUE AND nome LIKE %(busca)s
        """
        if categoria:
            sql += " AND categoria = %(categoria)s"
        sql += " ORDER BY destaque DESC, nome ASC"
        return [normalize_product(produto) for produto in query(sql, params)]

    termo = busca.lower()
    result = []
    for produto in store.produtos:
        bate_busca = termo in produto["nome"].lower()
        bate_categoria = not categoria or produto["categoria"] == categoria
        if bate_busca and bate_categoria:
            result.append(produto)
    return result


def find_by_id(produto_id):
    product_id = int(produto_id)
    if is_database_enabled():
        rows = query(
            """
            SELECT id, nome, categoria, preco, imagem, destaque, descricao, ativo, criado_em
            FROM produtos
            WHERE id = %(id)s AND ativo = TRUE
            """,
            {"id": product_id},
        )
        return normalize_product(rows[0]) if rows else None

    return next((produto for produto in store.produtos if produto["id"] == product_id), None)


def normalize_product(produto):
    item = dict(produto)
    item["preco"] = float(item["preco"])
    item["destaque"] = bool(item["destaque"])
    item["ativo"] = bool(item.get("ativo", True))
    return item
