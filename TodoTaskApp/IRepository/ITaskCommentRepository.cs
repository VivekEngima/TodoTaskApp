using TodoTaskApp.Models;

namespace TodoTaskApp.IRepository
{
    public interface ITaskCommentRepository
    {
        Task<IEnumerable<TaskCommentViewModel>> GetCommentsByTaskIdAsync(int taskId);
        Task<TaskComment?> GetCommentByIdAsync(int commentId);
        Task<int> CreateCommentAsync(TaskComment comment);
        Task<bool> CanUserAccessCommentAsync(int commentId, int userId);
        Task<int> GetCommentCountByTaskIdAsync(int taskId);
    }
}