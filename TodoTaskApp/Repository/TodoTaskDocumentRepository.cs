using Dapper;
using System.Data;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.Models;

namespace TodoTaskApp.Repository
{
    public class TodoTaskDocumentRepository : ITodoTaskDocumentRepository
    {
        private readonly DapperContext _context;

        public TodoTaskDocumentRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TodoTaskDocument>> GetDocumentsByTaskIdAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<TodoTaskDocument>(
                "sp_GetDocumentsByTaskId",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<TodoTaskDocument?> GetDocumentByIdAsync(int id)
        {
            using var connection = _context.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<TodoTaskDocument>(
                "sp_GetDocumentById",
                new { Id = id },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateDocumentAsync(TodoTaskDocument document)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@TaskId", document.TaskId);
            parameters.Add("@DocumentName", document.DocumentName);
            parameters.Add("@DocumentData", document.DocumentData);
            parameters.Add("@FileSize", document.FileSize);
            parameters.Add("@ContentType", document.ContentType);

            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_InsertDocument",
                parameters,
                commandType: CommandType.StoredProcedure);

            return result;
        }

        public async Task<bool> DeleteDocumentAsync(int id)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_DeleteDocument",
                new { Id = id },
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

        public async Task<int> GetDocumentCountByTaskAsync(int taskId)
        {
            using var connection = _context.CreateConnection();
            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_GetDocumentCountByTask",
                new { TaskId = taskId },
                commandType: CommandType.StoredProcedure);

            return result;
        }
        public async Task<bool> UpdateDocumentAsync(TodoTaskDocument document)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("@Id", document.Id);
            parameters.Add("@DocumentName", document.DocumentName);
            parameters.Add("@DocumentData", document.DocumentData);
            parameters.Add("@FileSize", document.FileSize);
            parameters.Add("@ContentType", document.ContentType);
            parameters.Add("@UploadDate", document.UploadDate);

            var result = await connection.QuerySingleOrDefaultAsync<int>(
                "sp_UpdateDocument",
                parameters,
                commandType: CommandType.StoredProcedure);

            return result > 0;
        }

    }
}
