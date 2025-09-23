using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text;
using TodoTaskApp.Extensions;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Controllers
{
    public class TodoController : Controller
    {
        private readonly ITodoTaskService _todoTaskService;
        private readonly ITodoTaskDocumentService _documentService;
        private readonly ITaskAssignmentService _taskAssignmentService;
        private readonly ILogger<TodoController> _logger;

        // Constructor - gets services from dependency injection
        public TodoController(
            ITodoTaskService todoTaskService,
            ITodoTaskDocumentService documentService,
            ITaskAssignmentService taskAssignmentService,
            ILogger<TodoController> logger)
        {
            _todoTaskService = todoTaskService;
            _documentService = documentService;
            _taskAssignmentService = taskAssignmentService;
            _logger = logger;
        }

        // Main todo page
        public async Task<IActionResult> Index()
        {
            try
            {
                var userId = User.GetUserId();
                var tasks = await _todoTaskService.GetAllTasksAsync(userId);

                // Convert tasks to view models with assignment info
                var taskViewModels = new List<TodoTaskViewModel>();

                foreach (var t in tasks)
                {
                    var assignedUserIds = await _taskAssignmentService.GetAssignedUserIdsAsync(t.Id);
                    var assignments = await _taskAssignmentService.GetTaskAssignmentsAsync(t.Id);

                    taskViewModels.Add(new TodoTaskViewModel
                    {
                        Id = t.Id,
                        Title = t.Title,
                        Description = t.Description,
                        Priority = t.Priority,
                        Status = t.Status,
                        DueDate = t.DueDate,
                        CreatedDate = t.CreatedDate,
                        UpdatedDate = t.UpdatedDate,
                        CompletedDate = t.CompletedDate,
                        UserId = t.UserId,
                        CreatedByUsername = t.CreatedByUsername,
                        IsAssigned = t.IsAssigned,
                        AssignmentCount = t.AssignmentCount,
                        AssignedUserIds = assignedUserIds.ToList(),
                        Assignments = assignments.ToList()
                    });
                }

                var filterModel = _todoTaskService.GetFilterOptions();

                ViewBag.Tasks = taskViewModels;
                ViewBag.Filter = filterModel;

                return View(taskViewModels);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading todo tasks");
                return View(new List<TodoTaskViewModel>());
            }
        }

        // Get all tasks for AJAX calls
        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            try
            {
                var userId = User.GetUserId();
                var tasks = await _todoTaskService.GetAllTasksAsync(userId);
                var taskIds = tasks.Select(t => t.Id);
                var documentCounts = await _documentService.GetDocumentCountsForTasksAsync(taskIds);

                var tasksWithInfo = new List<object>();

                foreach (var t in tasks)
                {
                    var assignedUserIds = await _taskAssignmentService.GetAssignedUserIdsAsync(t.Id);
                    var isSharedTask = assignedUserIds.Any();

                    tasksWithInfo.Add(new
                    {
                        t.Id,
                        t.Title,
                        t.Description,
                        t.Priority,
                        t.Status,
                        t.DueDate,
                        t.CreatedDate,
                        t.UpdatedDate,
                        t.CompletedDate,
                        t.UserId,
                        CreatedByUsername = t.CreatedByUsername,
                        IsAssigned = t.IsAssigned,
                        AssignmentCount = t.AssignmentCount,
                        DocumentCount = documentCounts.ContainsKey(t.Id) ? documentCounts[t.Id] : 0,
                        AssignedUserIds = assignedUserIds.ToList(),
                        IsSharedTask = isSharedTask
                    });
                }

                return Json(new { success = true, data = tasksWithInfo });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks");
                return Json(new { success = false, message = "Error retrieving tasks" });
            }
        }

        // AJAX: Get task by ID with assignment info
        [HttpGet]
        public async Task<IActionResult> GetTask(int id)
        {
            try
            {
                var userId = User.GetUserId();
                var task = await _todoTaskService.GetTaskByIdAsync(id, userId);
                if (task == null)
                    return Json(new { success = false, message = "Task not found" });

                var assignedUserIds = await _taskAssignmentService.GetAssignedUserIdsAsync(id);
                var assignments = await _taskAssignmentService.GetTaskAssignmentsAsync(id);

                var taskWithAssignments = new
                {
                    task.Id,
                    task.Title,
                    task.Description,
                    task.Priority,
                    task.Status,
                    task.DueDate,
                    task.CreatedDate,
                    task.UpdatedDate,
                    task.CompletedDate,
                    task.UserId,
                    AssignedUserIds = assignedUserIds.ToList(),
                    Assignments = assignments.ToList()
                };

                return Json(new { success = true, data = taskWithAssignments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task {TaskId}", id);
                return Json(new { success = false, message = "Error retrieving task" });
            }
        }

        // Create new task
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateTask([FromBody] TodoTaskViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);
                    return Json(new { success = false, message = "Validation failed", errors = errors });
                }

                var userId = User.GetUserId();
                var taskId = await _todoTaskService.CreateTaskAsync(model, userId);

                if (taskId > 0)
                {
                    var newTask = await _todoTaskService.GetTaskByIdAsync(taskId, userId);
                    return Json(new { success = true, data = newTask, message = "Task created successfully" });
                }

                return Json(new { success = false, message = "Failed to create task" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return Json(new { success = false, message = "Error creating task" });
            }
        }

        // Update existing task
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateTask([FromBody] TodoTaskViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage);
                    return Json(new { success = false, message = "Validation failed", errors = errors });
                }

                var userId = User.GetUserId();
                var success = await _todoTaskService.UpdateTaskAsync(model, userId);

                if (success)
                {
                    var updatedTask = await _todoTaskService.GetTaskByIdAsync(model.Id, userId);
                    return Json(new { success = true, data = updatedTask, message = "Task updated successfully" });
                }

                return Json(new { success = false, message = "Failed to update task" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task {TaskId}", model.Id);
                return Json(new { success = false, message = "Error updating task" });
            }
        }

        // AJAX: Get users for assignment dropdown
        [HttpGet]
        public async Task<IActionResult> GetUsersForAssignment()
        {
            try
            {
                var userId = User.GetUserId();
                var users = await _taskAssignmentService.GetAllUsersForAssignmentAsync(userId);
                return Json(new { success = true, data = users });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users for assignment");
                return Json(new { success = false, message = "Error loading users" });
            }
        }

        // AJAX: Get task assignments
        [HttpGet]
        public async Task<IActionResult> GetTaskAssignments(int taskId)
        {
            try
            {
                var userId = User.GetUserId();

                // Check if user can access this task
                var canAccess = await _taskAssignmentService.CanUserAccessTaskAsync(taskId, userId);
                if (!canAccess)
                {
                    return Json(new { success = false, message = "Access denied" });
                }

                var assignments = await _taskAssignmentService.GetTaskAssignmentsAsync(taskId);
                return Json(new { success = true, data = assignments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task assignments for task {TaskId}", taskId);
                return Json(new { success = false, message = "Error getting assignments" });
            }
        }

        // AJAX: Delete task (with access check)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                var userId = User.GetUserId();
                var success = await _todoTaskService.DeleteTaskAsync(id, userId);

                if (success)
                    return Json(new { success = true, message = "Task deleted successfully" });

                return Json(new { success = false, message = "Failed to delete task" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task {TaskId}", id);
                return Json(new { success = false, message = "Error deleting task" });
            }
        }

        // AJAX: Update task status (with access check)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateTaskStatus(int id, string status)
        {
            try
            {
                var userId = User.GetUserId();
                var success = await _todoTaskService.UpdateTaskStatusAsync(id, status, userId);

                if (success)
                {
                    var updatedTask = await _todoTaskService.GetTaskByIdAsync(id, userId);
                    return Json(new { success = true, data = updatedTask, message = "Task status updated successfully" });
                }

                return Json(new { success = false, message = "Failed to update task status" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task status {TaskId}", id);
                return Json(new { success = false, message = "Error updating task status" });
            }
        }

        // AJAX: Filter tasks (now includes assigned tasks)
        [HttpPost]
        public async Task<IActionResult> FilterTasks([FromBody] FilterViewModel filter)
        {
            try
            {
                var userId = User.GetUserId();
                var tasks = await _todoTaskService.FilterTasksAsync(filter, userId);
                return Json(new { success = true, data = tasks });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering tasks");
                return Json(new { success = false, message = "Error filtering tasks" });
            }
        }

        // AJAX: Get filter options
        [HttpGet]
        public IActionResult GetFilterOptions()
        {
            try
            {
                var filter = _todoTaskService.GetFilterOptions();
                return Json(new { success = true, data = filter });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filter options");
                return Json(new { success = false, message = "Error getting filter options" });
            }
        }

        // Export tasks (now includes accessible tasks)
        [HttpGet]
        public async Task<IActionResult> ExportTasks()
        {
            try
            {
                var userId = User.GetUserId();
                var tasks = await _todoTaskService.GetAllTasksAsync(userId);

                var csv = new StringBuilder();
                csv.AppendLine("Title,Description,Priority,Status,DueDate,CreatedDate,CreatedBy,IsAssigned");

                foreach (var task in tasks)
                {
                    var createdBy = task.CreatedByUsername;
                    var isAssigned = task.IsAssigned;

                    csv.AppendLine($"\"{task.Title}\",\"{task.Description ?? ""}\",\"{task.Priority}\",\"{task.Status}\",\"{task.DueDate:yyyy-MM-dd}\",\"{task.CreatedDate:yyyy-MM-dd}\",\"{createdBy}\",\"{(isAssigned ? "Yes" : "No")}\"");
                }

                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                var fileName = $"TodoTasks_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

                return File(bytes, "text/csv", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting tasks");
                return Json(new { success = false, message = "Error exporting tasks" });
            }
        }

        // Import tasks from CSV
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ImportTasks(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return Json(new { success = false, message = "Please select a file" });
                if (!Path.GetExtension(file.FileName).Equals(".csv", StringComparison.OrdinalIgnoreCase))
                    return Json(new { success = false, message = "Only CSV files are supported" });

                var tasks = new List<TodoTaskViewModel>();
                using var reader = new StreamReader(file.OpenReadStream());
                var line = await reader.ReadLineAsync(); // Skip header
                int lineNumber = 1;
                var errors = new List<string>();
                var userId = User.GetUserId();

                while ((line = await reader.ReadLineAsync()) != null)
                {
                    lineNumber++;
                    try
                    {
                        var values = ParseCsvLine(line);
                        if (values.Length < 5)
                        {
                            errors.Add($"Line {lineNumber}: Insufficient columns");
                            continue;
                        }

                        var title = values[0]?.Trim().Trim('"') ?? "";
                        // Duplicate title check
                        if (await _todoTaskService.CheckDuplicateTaskAsync(title, null, userId))
                        {
                            errors.Add($"Line {lineNumber}: Task with title '{title}' already exists");
                            continue;
                        }

                        var task = new TodoTaskViewModel
                        {
                            Title = title,
                            Description = values[1]?.Trim().Trim('"'),
                            Priority = values[2]?.Trim().Trim('"') ?? "Normal",
                            Status = values[3]?.Trim().Trim('"') ?? "Pending",
                            DueDate = DateTime.TryParse(values[4]?.Trim().Trim('"'), out var dueDate)
                                ? dueDate : DateTime.Now.AddDays(7),
                            AssignedUserIds = new List<int>() // No assignments from CSV import
                        };

                        // Validate
                        if (string.IsNullOrEmpty(task.Title))
                        {
                            errors.Add($"Line {lineNumber}: Title is required");
                            continue;
                        }
                        if (!new[] { "High", "Normal", "Low" }.Contains(task.Priority))
                            task.Priority = "Normal";
                        if (!new[] { "Pending", "Hold", "Completed" }.Contains(task.Status))
                            task.Status = "Pending";

                        tasks.Add(task);
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Line {lineNumber}: {ex.Message}");
                    }
                }

                // Import valid tasks
                int imported = 0;
                foreach (var task in tasks)
                {
                    var taskId = await _todoTaskService.CreateTaskAsync(task, userId);
                    if (taskId > 0) imported++;
                }

                var message = $"Successfully imported {imported} tasks";
                if (errors.Any())
                    message += $". {errors.Count} errors occurred";

                return Json(new
                {
                    success = true,
                    message,
                    imported,
                    errors = errors.Take(5) // first 5 errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing tasks");
                return Json(new { success = false, message = "Error importing file" });
            }
        }

        // Helper method to parse CSV line
        private string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            var inQuotes = false;
            var current = new StringBuilder();
            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }
            result.Add(current.ToString());
            return result.ToArray();
        }

        [HttpPost]
        public async Task<IActionResult> FilterByDateRange([FromBody] FilterViewModel filter)
        {
            if (filter.StartDate.HasValue && filter.EndDate.HasValue
                && filter.StartDate > filter.EndDate)
            {
                return Json(new
                {
                    success = false,
                    message = "Start date must be on or before End date"
                });
            }
            var userId = User.GetUserId();
            var tasks = await _todoTaskService
                .FilterTasksByDateRangeAsync(filter, userId);

            return Json(new { success = true, data = tasks });
        }

        // AJAX: Get documents by task ID
        [HttpGet]
        public async Task<IActionResult> GetDocuments(int taskId)
        {
            try
            {
                var documents = await _documentService.GetDocumentsByTaskIdAsync(taskId);
                var documentCount = await _documentService.GetDocumentCountByTaskAsync(taskId);

                return Json(new
                {
                    success = true,
                    data = documents,
                    count = documentCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving documents for task {TaskId}", taskId);
                return Json(new { success = false, message = "Error retrieving documents" });
            }
        }

        // AJAX: Upload multiple documents
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UploadDocuments([FromForm] int TaskId, [FromForm] List<IFormFile> Files)
        {
            try
            {
                if (Files == null || Files.Count == 0)
                    return Json(new { success = false, message = "Please select files to upload" });

                // Validate TaskId
                if (TaskId <= 0)
                {
                    return Json(new { success = false, message = "Invalid task ID provided" });
                }

                // Check if adding these files would exceed the 5 document limit
                var currentCount = await _documentService.GetDocumentCountByTaskAsync(TaskId);
                if (currentCount + Files.Count > 5)
                    return Json(new { success = false, message = "Maximum 5 documents allowed per task" });

                var uploadedDocuments = new List<object>();
                
                foreach (var file in Files)
                {
                    if (file.Length > 0)
                    {
                        // Check file size (5MB limit)
                        const long maxFileSize = 5 * 1024 * 1024;
                        if (file.Length > maxFileSize)
                            return Json(new { success = false, message = $"File '{file.FileName}' size cannot exceed 5MB" });

                        var model = new DocumentUploadViewModel
                        {
                            TaskId = TaskId,
                            File = file
                        };

                        var documentId = await _documentService.UploadDocumentAsync(model);
                        uploadedDocuments.Add(new { id = documentId, name = file.FileName });
                    }
                }

                var documents = await _documentService.GetDocumentsByTaskIdAsync(TaskId);
                return Json(new
                {
                    success = true,
                    message = $"{uploadedDocuments.Count} document(s) uploaded successfully",
                    data = documents
                });
            }
            catch (ArgumentException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading documents for task {TaskId}", TaskId);
                return Json(new { success = false, message = "Error uploading documents" });
            }
        }

        // AJAX: Delete document
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteDocument([FromForm] int documentId)
        {
            try
            {
                var success = await _documentService.DeleteDocumentAsync(documentId);

                if (success)
                {
                    return Json(new
                    {
                        success = true,
                        message = "Document deleted successfully"
                    });
                }

                return Json(new { success = false, message = "Failed to delete document" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
                return Json(new { success = false, message = "Error deleting document" });
            }
        }

        // Download document
        [HttpGet]
        public async Task<IActionResult> DownloadDocument(int documentId)
        {
            try
            {
                var document = await _documentService.GetDocumentByIdAsync(documentId);

                if (document == null)
                    return NotFound();

                return File(document.DocumentData, document.ContentType, document.DocumentName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document {DocumentId}", documentId);
                return NotFound();
            }
        }

        // AJAX: Replace/Update existing document
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ReplaceDocument([FromForm] int documentId, [FromForm] IFormFile newFile)
        {
            try
            {
                if (newFile == null || newFile.Length == 0)
                    return Json(new { success = false, message = "Please select a file" });

                // Check file size (5MB limit)
                const long maxFileSize = 5 * 1024 * 1024;
                if (newFile.Length > maxFileSize)
                    return Json(new { success = false, message = "File size cannot exceed 5MB" });

                // Get existing document to preserve TaskId and other relationships
                var existingDoc = await _documentService.GetDocumentByIdAsync(documentId);
                if (existingDoc == null)
                    return Json(new { success = false, message = "Document not found" });

                // Replace the document
                var success = await _documentService.ReplaceDocumentAsync(documentId, newFile);

                if (success)
                {
                    var documents = await _documentService.GetDocumentsByTaskIdAsync(existingDoc.TaskId);
                    return Json(new
                    {
                        success = true,
                        message = "Document replaced successfully",
                        data = documents
                    });
                }

                return Json(new { success = false, message = "Failed to replace document" });
            }
            catch (ArgumentException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error replacing document {DocumentId}", documentId);
                return Json(new { success = false, message = "Error replacing document" });
            }
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}