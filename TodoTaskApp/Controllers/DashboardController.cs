using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoTaskApp.Extensions;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;

namespace TodoTaskApp.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly ITodoTaskService _todoTaskService;
        private readonly ITaskAssignmentService _taskAssignmentService;
        private readonly ILogger<DashboardController> _logger;

        // Constructor - gets services for dashboard data
        public DashboardController(ITodoTaskService todoTaskService, ITaskAssignmentService taskAssignmentService, ILogger<DashboardController> logger)
        {
            _todoTaskService = todoTaskService;
            _taskAssignmentService = taskAssignmentService;
            _logger = logger;
        }

        // Dashboard main page
        public async Task<IActionResult> Index()
        {
            try
            {
                _logger.LogInformation($"Dashboard Index - User authenticated: {User.Identity?.IsAuthenticated}, User name: {User.Identity?.Name}");
                var userId = User.GetUserId();
                var tasks = await _todoTaskService.GetAllTasksAsync(userId);

                // Calculate task counts
                ViewBag.TotalTasks = tasks.Count();
                ViewBag.CompletedTasks = tasks.Count(t => t.Status == "Completed");
                ViewBag.PendingTasks = tasks.Count(t => t.Status == "Pending");
                ViewBag.OverdueTasks = tasks.Count(t => t.DueDate < DateTime.Now && t.Status != "Completed");
                ViewBag.Username = User.GetUsername();

                // Show recent tasks
                ViewBag.RecentTasks = tasks.OrderByDescending(t => t.CreatedDate).Take(5);

                return View(tasks);
            }
            catch (Exception ex)
            {
                return View();
            }
        }

        // AJAX: Get dashboard statistics
        [HttpGet]
        public async Task<IActionResult> GetStatistics()
        {
            try
            {
                var userId = User.GetUserId();
                var tasks = await _todoTaskService.GetAllTasksAsync(userId);

                // Calculate statistics
                var totalTasks = tasks.Count();
                var completedTasks = tasks.Count(t => t.Status == "Completed");
                var pendingTasks = tasks.Count(t => t.Status == "Pending");
                var onHoldTasks = tasks.Count(t => t.Status == "Hold");
                
                // Improved upcoming tasks calculation - tasks due in the future (not completed)
                var currentDate = DateTime.Today; // Use today's date (start of day) for more accurate comparison
                var upcomingTasks = tasks.Count(t => t.DueDate >= currentDate && t.Status != "Completed");
                

                // Priority breakdown
                var highPriorityTasks = tasks.Count(t => t.Priority == "High");
                var normalPriorityTasks = tasks.Count(t => t.Priority == "Normal");
                var lowPriorityTasks = tasks.Count(t => t.Priority == "Low");

                // Monthly task creation data (10 days before and after today)
                // Include both tasks created by user AND tasks assigned to user
                var startDate = DateTime.Now.AddDays(-10);
                var endDate = DateTime.Now.AddDays(10);
                var monthlyData = new List<DailyTaskData>();

                // Get assignment dates for the user
                var assignmentDates = await _taskAssignmentService.GetTaskAssignmentDatesForUserAsync(userId);

                for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
                {
                    // Count tasks created by the user on this date
                    var tasksCreatedOnDate = tasks.Count(t => t.CreatedDate.Date == date);
                    
                    // Count tasks assigned to the user on this date
                    var tasksAssignedOnDate = assignmentDates.Count(d => d.Date == date);
                    
                    // Total tasks relevant to the user on this date
                    var totalTasksOnDate = tasksCreatedOnDate + tasksAssignedOnDate;
                    
                    monthlyData.Add(new DailyTaskData
                    {
                        Date = date,
                        DateLabel = date.ToString("MMM d"),
                        TasksCreated = totalTasksOnDate
                    });
                }

                // Task lists for dashboard - Updated to show most recent data
                var recentTasks = tasks.OrderByDescending(t => t.CreatedDate).Take(5).ToList();
                
                // Get tasks assigned TO the user (not created by them)
                var assignedTasks = await _taskAssignmentService.GetTasksAssignedToUserAsync(userId);
                var assignedTasksList = assignedTasks.Where(t => t.Status != "Completed").OrderByDescending(t => t.AssignedDate).Take(5).ToList();
                
                var upcomingTasksList = tasks.Where(t => t.DueDate >= DateTime.Today && t.Status != "Completed").OrderBy(t => t.DueDate).Take(5).ToList();

                var dashboardData = new DashboardViewModel
                {
                    TotalTasks = totalTasks,
                    CompletedTasks = completedTasks,
                    PendingTasks = pendingTasks,
                    OnHoldTasks = onHoldTasks,
                    UpcomingTasks = upcomingTasks,
                    HighPriorityTasks = highPriorityTasks,
                    NormalPriorityTasks = normalPriorityTasks,
                    LowPriorityTasks = lowPriorityTasks,
                    MonthlyTaskCreation = monthlyData,
                    RecentTasks = recentTasks,
                    AssignedTasks = assignedTasksList,
                    UpcomingTasksList = upcomingTasksList
                };

                return Json(new { success = true, data = dashboardData });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error loading dashboard statistics" });
            }
        }
    }
}
