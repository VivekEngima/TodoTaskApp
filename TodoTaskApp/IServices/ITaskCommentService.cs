using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface ITaskCommentService
    {
        Task<IEnumerable<TaskCommentViewModel>> GetCommentsByTaskIdAsync(int taskId, int userId);
        Task<TaskCommentViewModel?> GetCommentByIdAsync(int commentId, int userId);
        Task<int> CreateCommentAsync(CreateCommentViewModel model, int userId);
        Task<bool> CanUserAccessTaskCommentsAsync(int taskId, int userId);
        Task<int> GetCommentCountByTaskIdAsync(int taskId);
    }
}