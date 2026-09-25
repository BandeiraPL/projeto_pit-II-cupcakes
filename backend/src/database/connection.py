import os
from src.config.env import load_env

load_env()


database_config = {
    "host": os.environ.get("DB_HOST", ""),
    "port": int(os.environ.get("DB_PORT", "3306") or 3306),
    "user": os.environ.get("DB_USER", ""),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", ""),
}


def is_database_enabled():
    if os.environ.get("APP_ENV") == "test" or os.environ.get("NODE_ENV") == "test":
        return False
    return bool(database_config["host"] and database_config["user"] and database_config["database"])


def get_connection():
    if not is_database_enabled():
        return None

    try:
        import mysql.connector
    except ImportError as exc:
        raise RuntimeError("Instale as dependencias com: pip install -r requirements.txt") from exc

    return mysql.connector.connect(
        host=database_config["host"],
        port=database_config["port"],
        user=database_config["user"],
        password=database_config["password"],
        database=database_config["database"],
    )


def connect_database():
    if not is_database_enabled():
        return {"connected": False, "message": "Banco nao configurado no .env."}

    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
    finally:
        cursor.close()
        connection.close()

    return {"connected": True, "message": f"Conectado ao MySQL no banco {database_config['database']}."}


def query(sql, params=None):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(sql, params or {})
        if cursor.with_rows:
            return cursor.fetchall()

        connection.commit()
        return {"insertId": cursor.lastrowid, "affectedRows": cursor.rowcount}
    finally:
        cursor.close()
        connection.close()
