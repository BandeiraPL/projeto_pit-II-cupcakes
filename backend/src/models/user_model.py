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



def find_or_create_for_order(data, endereco, session_id=""):
    usuario = data if isinstance(data, dict) else {}
    nome = clean(usuario.get("nome")) or "Cliente CupcakeShop"
    email = clean(usuario.get("email")).lower() or default_email(session_id)
    telefone = clean(usuario.get("telefone"))
    endereco_usuario = clean(usuario.get("endereco")) or endereco

    if is_database_enabled():
        rows = query(
            "SELECT id FROM usuarios WHERE email = %(email)s LIMIT 1",
            {"email": email},
        )
        payload = {
            "nome": nome,
            "email": email,
            "telefone": telefone,
            "endereco": endereco_usuario,
        }
        if rows:
            payload["id"] = rows[0]["id"]
            query(
                """
                UPDATE usuarios
                SET nome = %(nome)s, telefone = %(telefone)s, endereco = %(endereco)s
                WHERE id = %(id)s
                """,
                payload,
            )
            return int(rows[0]["id"])

        result = query(
            """
            INSERT INTO usuarios (nome, email, telefone, endereco, senha)
            VALUES (%(nome)s, %(email)s, %(telefone)s, %(endereco)s, NULL)
            """,
            payload,
        )
        return int(result["insertId"])

    store.usuario.update({
        "nome": nome,
        "email": email,
        "telefone": telefone,
        "endereco": endereco_usuario,
    })
    return int(store.usuario.get("id", 1))


def clean(value):
    return str(value or "").strip()


def default_email(session_id=""):
    key = "".join(char for char in str(session_id or "") if char.isalnum())[:16]
    return f"cliente_{key or 'padrao'}@cupcakeshop.local"
