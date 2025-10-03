using TodoTaskApp.Models;

namespace TodoTaskApp.IServices
{
    public interface ITodoTaskDocumentService
    {
        Task<IEnumerable<DocumentViewModel>> GetDocumentsByTaskIdAsync(int taskId);
        Task<TodoTaskDocument?> GetDocumentByIdAsync(int id);
        Task<int> UploadDocumentAsync(DocumentUploadViewModel model);
        Task<bool> DeleteDocumentAsync(int id);
        Task<int> GetDocumentCountByTaskAsync(int taskId);
        Task<Dictionary<int, int>> GetDocumentCountsForTasksAsync(IEnumerable<int> taskIds);
        Task<bool> ReplaceDocumentAsync(int documentId, IFormFile newFile);

    }
}
