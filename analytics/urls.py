from django.urls import path
from analytics.views import KPIAnalyticsView

urlpatterns = [
    path("kpis/", KPIAnalyticsView.as_view(), name="analytics-kpis"),
]
