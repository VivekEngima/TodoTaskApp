using TodoTaskApp.Models;

namespace TodoTaskApp.IRepository
{
    public interface ITaskAssignmentRepository
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<IEnumerable<TaskAssignmentViewModel>> GetTaskAssignmentsAsync(int taskId);
        Task<int> AssignTaskToUserAsync(int taskId, int assignedUserId, int assignedByUserId);
        Task<bool> RemoveTaskAssignmentAsync(int taskId, int assignedUserId);
        Task<bool> CanUserAccessTaskAsync(int taskId, int userId);

        // Updated to return the extended model with assignment info
        Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllAccessibleTasksAsync(int userId);

        Task<bool> IsTaskAssignedToMultipleUsersAsync(int taskId);
        Task<IEnumerable<int>> GetAssignedUserIdsAsync(int taskId);
    }
}