from django.urls import path
from tasks.views import TaskListView, TaskUpdateView

urlpatterns = [
    path("", TaskListView.as_view(), name="task-list"),
    path("<str:task_id>/", TaskUpdateView.as_view(), name="task-detail-update"),
]
