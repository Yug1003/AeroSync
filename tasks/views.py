from bson.objectid import ObjectId
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from tasks.mongo_operations import (
    get_all_tasks,
    get_tasks_by_flight,
    get_task_by_id,
    update_task_status,
)


class TaskListView(APIView):
    """
    GET /api/tasks/ - List all tasks, optionally filtered by ?flight_id=<id>
    """

    def get(self, request):
        flight_id = request.query_params.get("flight_id")
        if flight_id:
            tasks = get_tasks_by_flight(flight_id)
        else:
            tasks = get_all_tasks()
        return Response(tasks, status=status.HTTP_200_OK)


class TaskUpdateView(APIView):
    """
    GET /api/tasks/<task_id>/ - Retrieve task by id
    PATCH /api/tasks/<task_id>/ - Update task status / delay_reason
    """

    def get(self, request, task_id):
        if not isinstance(task_id, str) or not ObjectId.is_valid(task_id):
            return Response(
                {"error": f"Invalid task_id format: '{task_id}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = get_task_by_id(task_id)
        if not task:
            return Response(
                {"error": f"Task with id '{task_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(task, status=status.HTTP_200_OK)

    def patch(self, request, task_id):
        if not isinstance(task_id, str) or not ObjectId.is_valid(task_id):
            return Response(
                {"error": f"Invalid task_id format: '{task_id}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_status = request.data.get("status")
        delay_reason = request.data.get("delay_reason")

        if not new_status:
            return Response(
                {"error": "Field 'status' is required for PATCH."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            updated_task = update_task_status(
                task_id, status=new_status, delay_reason=delay_reason
            )
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)

        if not updated_task:
            return Response(
                {"error": f"Task with id '{task_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(updated_task, status=status.HTTP_200_OK)
