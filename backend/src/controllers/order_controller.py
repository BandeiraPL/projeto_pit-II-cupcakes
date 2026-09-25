from src.models import order_model


def index(context):
    return order_model.find_all()


def create(context):
    return order_model.create(context["body"])
