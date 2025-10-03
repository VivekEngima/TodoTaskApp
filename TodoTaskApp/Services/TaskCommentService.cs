using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class TaskCommentService : ITaskCommentService
    {
        private readonly ITaskCommentRepository _commentRepository;
        private readonly ITaskAssignmentRepository _taskAssignmentRepository;
        private readonly ILogger<TaskCommentService> _logger;

        public TaskCommentService(
            ITaskCommentRepository commentRepository,
            ITaskAssignmentRepository taskAssignmentRepository,
            ILogger<TaskCommentService> logger)
        {
            _commentRepository = commentRepository;
            _taskAssignmentRepository = taskAssignmentRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<TaskCommentViewModel>> GetCommentsByTaskIdAsync(int taskId, int userId)
        {
            try
            {
                // Check if user can access this task's comments
                var canAccess = await CanUserAccessTaskCommentsAsync(taskId, userId);
                if (!canAccess)
                {
                    return new List<TaskCommentViewModel>();
                }

                var comments = await _commentRepository.GetCommentsByTaskIdAsync(taskId);
                
                // Add permission flags for each comment
                var commentsWithPermissions = new List<TaskCommentViewModel>();
                foreach (var comment in comments)
                {
                    commentsWithPermissions.Add(new TaskCommentViewModel
                    {
                        Id = comment.Id,
                        TaskId = comment.TaskId,
                        UserId = comment.UserId,
                        Username = comment.Username,
                        Comment = comment.Comment,
                        CreatedDate = comment.CreatedDate,
                        UpdatedDate = comment.UpdatedDate,
                        CanEdit = false,
                        CanDelete = false
                    });
                }

                return commentsWithPermissions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comments for task {TaskId}", taskId);
                return new List<TaskCommentViewModel>();
            }
        }

        public async Task<TaskCommentViewModel?> GetCommentByIdAsync(int commentId, int userId)
        {
            try
            {
                var comment = await _commentRepository.GetCommentByIdAsync(commentId);
                if (comment == null)
                    return null;

                // Check if user can access this comment
                var canAccess = await _commentRepository.CanUserAccessCommentAsync(commentId, userId);
                if (!canAccess)
                    return null;

                var canEdit = false;
                var canDelete = false;

                return new TaskCommentViewModel
                {
                    Id = comment.Id,
                    TaskId = comment.TaskId,
                    UserId = comment.UserId,
                    Username = comment.User?.UserName ?? "",
                    Comment = comment.Comment,
                    CreatedDate = comment.CreatedDate,
                    UpdatedDate = comment.UpdatedDate,
                    CanEdit = canEdit,
                    CanDelete = canDelete
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comment {CommentId}", commentId);
                return null;
            }
        }

        public async Task<int> CreateCommentAsync(CreateCommentViewModel model, int userId)
        {
            try
            {
                // Check if user can access this task's comments
                var canAccess = await CanUserAccessTaskCommentsAsync(model.TaskId, userId);
                if (!canAccess)
                {
                    return 0;
                }

                var comment = new TaskComment
                {
                    TaskId = model.TaskId,
                    UserId = userId,
                    Comment = model.Comment,
                    CreatedDate = DateTime.Now
                };

                return await _commentRepository.CreateCommentAsync(comment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating comment for task {TaskId}", model.TaskId);
                return 0;
            }
        }



        public async Task<bool> CanUserAccessTaskCommentsAsync(int taskId, int userId)
        {
            try
            {
                // Check if user can access this task (owner, assigned user, or user who assigned the task)
                return await _taskAssignmentRepository.CanUserAccessTaskAsync(taskId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking access to task comments for task {TaskId}", taskId);
                return false;
            }
        }

        public async Task<int> GetCommentCountByTaskIdAsync(int taskId)
        {
            try
            {
                return await _commentRepository.GetCommentCountByTaskIdAsync(taskId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting comment count for task {TaskId}", taskId);
                return 0;
            }
        }
    }
}