from src.data import store
from src.database.connection import is_database_enabled, query
from src.utils.http import http_error


def find_current():
    if is_database_enabled():
        rows = query(
            "SELECT id, nome, email, telefone, endereco, criado_em FROM usuarios WHERE id = %(id)s",
            {"id": 1},
        )
        if not rows:
            http_error("Usuario padrao nao encontrado", 404)
        return rows[0]

    return store.usuario


def update(data):
    campos = ["nome", "email", "telefone", "endereco"]
    for campo in campos:
        if not data.get(campo) or not str(data.get(campo)).strip():
            http_error(f"Campo obrigatorio: {campo}", 400)

    usuario = {
        "nome": str(data["nome"]).strip(),
        "email": str(data["email"]).strip(),
        "telefone": str(data["telefone"]).strip(),
        "endereco": str(data["endereco"]).strip(),
    }

    if is_database_enabled():
        query(
            """
            UPDATE usuarios
            SET nome = %(nome)s, email = %(email)s, telefone = %(telefone)s, endereco = %(endereco)s
            WHERE id = 1
            """,
            usuario,
        )
        return find_current()

    store.usuario.update(usuario)
    return store.usuario
