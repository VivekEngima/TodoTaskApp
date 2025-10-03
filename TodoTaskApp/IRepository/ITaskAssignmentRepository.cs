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
        Task<bool> CanUserEditTaskAsync(int taskId, int userId);
        Task<bool> CanUserAssignTaskAsync(int taskId, int userId);

        // Updated to return the extended model with assignment info
        Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetAllAccessibleTasksAsync(int userId);

        Task<bool> IsTaskAssignedToMultipleUsersAsync(int taskId);
        Task<IEnumerable<int>> GetAssignedUserIdsAsync(int taskId);
        
        // Get tasks assigned TO a specific user (not created by them)
        Task<IEnumerable<TodoTaskWithAssignmentInfo>> GetTasksAssignedToUserAsync(int userId);
        
        // Get task assignment dates for a user (when tasks were assigned to them)
        Task<IEnumerable<DateTime>> GetTaskAssignmentDatesForUserAsync(int userId);
        
        // Check if task is already assigned to prevent reassignment
        Task<bool> IsTaskAlreadyAssignedAsync(int taskId);
        
        // Get assignment status for a task
        Task<TaskAssignmentStatus> GetTaskAssignmentStatusAsync(int taskId);
        
        // Get the original assigner of a task
        Task<int?> GetOriginalAssignerAsync(int taskId);
    }
}