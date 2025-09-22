using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface ITodoTaskService
    {
        Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllTasksAsync(int userId);
        Task<TodoTask?> GetTaskByIdAsync(int id, int userId);
        Task<int> CreateTaskAsync(TodoTaskViewModel task, int userId);
        Task<bool> UpdateTaskAsync(TodoTaskViewModel task, int userId);
        Task<bool> DeleteTaskAsync(int id, int userId);
        Task<bool> UpdateTaskStatusAsync(int id, string status, int userId);

        // Updated filtering methods
        Task<IEnumerable<TodoTaskWithAssignmentInfo>> FilterTasksAsync(FilterViewModel filter, int userId);
        Task<IEnumerable<TodoTaskWithAssignmentInfo>> FilterTasksByDateRangeAsync(FilterViewModel filter, int userId);

        Task<bool> CheckDuplicateTaskAsync(string title, int? excludeId, int userId);
        FilterViewModel GetFilterOptions();
    }
}