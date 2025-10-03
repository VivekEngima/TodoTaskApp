using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Services
{
    public class TodoTaskDocumentService : ITodoTaskDocumentService
    {
        private readonly ITodoTaskDocumentRepository _documentRepository;
        private readonly ILogger<TodoTaskDocumentService> _logger;

        public TodoTaskDocumentService(ITodoTaskDocumentRepository documentRepository, ILogger<TodoTaskDocumentService> logger)
        {
            _documentRepository = documentRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<DocumentViewModel>> GetDocumentsByTaskIdAsync(int taskId)
        {
            var documents = await _documentRepository.GetDocumentsByTaskIdAsync(taskId);
            return documents.Select(d => new DocumentViewModel
            {
                Id = d.Id,
                TaskId = d.TaskId,
                DocumentName = d.DocumentName,
                FileSize = d.FileSize,
                ContentType = d.ContentType,
                UploadDate = d.UploadDate
            });
        }

        public async Task<TodoTaskDocument?> GetDocumentByIdAsync(int id)
        {
            return await _documentRepository.GetDocumentByIdAsync(id);
        }

        public async Task<int> UploadDocumentAsync(DocumentUploadViewModel model)
        {
            if (model.File == null || model.File.Length == 0)
                throw new ArgumentException("File is required");

            // Check file size (5MB limit)
            const long maxFileSize = 5 * 1024 * 1024;
            if (model.File.Length > maxFileSize)
                throw new ArgumentException("File size cannot exceed 5MB");

            // Check document count (max 5 per task)
            var currentCount = await _documentRepository.GetDocumentCountByTaskAsync(model.TaskId);
            if (currentCount >= 5)
                throw new ArgumentException("Maximum 5 documents allowed per task");

            using var memoryStream = new MemoryStream();
            await model.File.CopyToAsync(memoryStream);

            var document = new TodoTaskDocument
            {
                TaskId = model.TaskId,
                DocumentName = model.File.FileName,
                DocumentData = memoryStream.ToArray(),
                FileSize = model.File.Length,
                ContentType = model.File.ContentType
            };

            return await _documentRepository.CreateDocumentAsync(document);
        }

        public async Task<bool> DeleteDocumentAsync(int id)
        {
            return await _documentRepository.DeleteDocumentAsync(id);
        }

        public async Task<int> GetDocumentCountByTaskAsync(int taskId)
        {
            return await _documentRepository.GetDocumentCountByTaskAsync(taskId);
        }

        public async Task<Dictionary<int, int>> GetDocumentCountsForTasksAsync(IEnumerable<int> taskIds)
        {
            var result = new Dictionary<int, int>();

            foreach (var taskId in taskIds)
            {
                var count = await GetDocumentCountByTaskAsync(taskId);
                result[taskId] = count;
            }

            return result;
        }
        public async Task<bool> ReplaceDocumentAsync(int documentId, IFormFile newFile)
        {
            if (newFile == null || newFile.Length == 0)
                throw new ArgumentException("File is required");

            // Check file size (5MB limit)
            const long maxFileSize = 5 * 1024 * 1024;
            if (newFile.Length > maxFileSize)
                throw new ArgumentException("File size cannot exceed 5MB");

            // Get existing document
            var existingDoc = await _documentRepository.GetDocumentByIdAsync(documentId);
            if (existingDoc == null)
                throw new ArgumentException("Document not found");

            using var memoryStream = new MemoryStream();
            await newFile.CopyToAsync(memoryStream);

            // Create updated document with new file data but same ID and TaskId
            var updatedDocument = new TodoTaskDocument
            {
                Id = existingDoc.Id,
                TaskId = existingDoc.TaskId, // Preserve task relationship
                DocumentName = newFile.FileName,
                DocumentData = memoryStream.ToArray(),
                FileSize = newFile.Length,
                ContentType = newFile.ContentType,
                UploadDate = DateTime.Now // Update upload date
            };

            return await _documentRepository.UpdateDocumentAsync(updatedDocument);
        }

    }
}
