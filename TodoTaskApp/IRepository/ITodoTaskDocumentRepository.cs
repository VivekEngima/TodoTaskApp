using TodoTaskApp.Models;

namespace TodoTaskApp.IRepository
{
    public interface ITodoTaskDocumentRepository
    {
        Task<IEnumerable<TodoTaskDocument>> GetDocumentsByTaskIdAsync(int taskId);
        Task<TodoTaskDocument?> GetDocumentByIdAsync(int id);
        Task<int> CreateDocumentAsync(TodoTaskDocument document);
        Task<bool> DeleteDocumentAsync(int id);
        Task<int> GetDocumentCountByTaskAsync(int taskId);
        Task<bool> UpdateDocumentAsync(TodoTaskDocument document);

    }
}
