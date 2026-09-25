from src.models import user_model


def show(context):
    return user_model.find_current()


def update(context):
    return user_model.update(context["body"])
