using TodoTaskApp.Models;

namespace TodoTaskApp.IRepository
{
    public interface ITodoTaskRepository
    {
        Task<IEnumerable<TodoTask>> GetAllTasksAsync(int userId);
        Task<TodoTask?> GetTaskByIdAsync(int id, int userId);
        Task<int> CreateTaskAsync(TodoTaskViewModel task, int userId);
        Task<bool> UpdateTaskAsync(TodoTaskViewModel task, int userId);
        Task<bool> DeleteTaskAsync(int id, int userId);
        Task<bool> UpdateTaskStatusAsync(int id, string status, int userId);
        Task<IEnumerable<TodoTask>> FilterTasksAsync(FilterViewModel filter, int userId);
        Task<IEnumerable<TodoTask>> FilterTasksByDateRangeAsync(FilterViewModel filter, int userId);
        Task<bool> CheckDuplicateTaskAsync(string title, int? excludeId, int userId);

    }
}