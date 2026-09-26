from src.models import cart_model


def show(context):
    return cart_model.get_summary(context.get("session_id", ""))


def add_item(context):
    body = context["body"]
    return cart_model.add_item(body.get("produtoId"), body.get("quantidade", 1), context.get("session_id", ""))


def update_item(context):
    return cart_model.update_item(context["params"]["produtoId"], context["body"], context.get("session_id", ""))


def remove_item(context):
    return cart_model.remove_item(context["params"]["produtoId"], context.get("session_id", ""))
