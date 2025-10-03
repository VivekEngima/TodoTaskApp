using Dapper;
using System.Data;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.Models;

namespace TodoTaskApp.Repository
{
    public class TaskCommentRepository : ITaskCommentRepository
    {
        private readonly DapperContext _context;

        public TaskCommentRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TaskCommentViewModel>> GetCommentsByTaskIdAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TaskCommentViewModel>(
                "sp_GetCommentsByTaskId",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<TaskComment?> GetCommentByIdAsync(int commentId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<TaskComment>(
                "sp_GetCommentById",
                new { CommentId = commentId },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<int> CreateCommentAsync(TaskComment comment)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleAsync<int>(
                "sp_CreateComment",
                new
                {
                    TaskId = comment.TaskId,
                    UserId = comment.UserId,
                    Comment = comment.Comment,
                    FileName = comment.FileName,
                    CreatedDate = comment.CreatedDate
                },
                commandType: CommandType.StoredProcedure
            );
        }



        public async Task<bool> CanUserAccessCommentAsync(int commentId, int userId)
        {
            using var connection = _context.CreateConnection();
            var count = await connection.QuerySingleAsync<int>(
                "sp_CanUserAccessComment",
                new { CommentId = commentId, UserId = userId },
                commandType: CommandType.StoredProcedure
            );
            return count > 0;
        }



        public async Task<int> GetCommentCountByTaskIdAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleAsync<int>(
                "sp_GetCommentCountByTaskId",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure
            );
        }
    }
}