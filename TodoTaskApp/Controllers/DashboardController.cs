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
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ITodoTaskService todoTaskService, ILogger<DashboardController> logger)
        {
            _todoTaskService = todoTaskService;
            _logger = logger;
        }

        // Dashboard main page
        public async Task<IActionResult> Index()
        {
            try
            {
                var userId = User.GetUserId();
                var tasks = await _todoTaskService.GetAllTasksAsync(userId);

                // Dashboard statistics
                ViewBag.TotalTasks = tasks.Count();
                ViewBag.CompletedTasks = tasks.Count(t => t.Status == "Completed");
                ViewBag.PendingTasks = tasks.Count(t => t.Status == "Pending");
                ViewBag.OverdueTasks = tasks.Count(t => t.DueDate < DateTime.Now && t.Status != "Completed");
                ViewBag.Username = User.GetUsername();

                // Recent tasks (last 5)
                ViewBag.RecentTasks = tasks.OrderByDescending(t => t.CreatedDate).Take(5);

                return View(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading dashboard for user {UserId}", User.GetUserId());
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
                var upcomingTasks = tasks.Count(t => t.DueDate > DateTime.Now && t.Status != "Completed");

                // Priority breakdown
                var highPriorityTasks = tasks.Count(t => t.Priority == "High");
                var normalPriorityTasks = tasks.Count(t => t.Priority == "Normal");
                var lowPriorityTasks = tasks.Count(t => t.Priority == "Low");

                // Monthly task creation data (1 month before and after today)
                var startDate = DateTime.Now.AddMonths(-1);
                var endDate = DateTime.Now.AddMonths(1);
                var monthlyData = new List<DailyTaskData>();

                for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
                {
                    var tasksCreatedOnDate = tasks.Count(t => t.CreatedDate.Date == date);
                    monthlyData.Add(new DailyTaskData
                    {
                        Date = date,
                        DateLabel = date.ToString("MMM d"),
                        TasksCreated = tasksCreatedOnDate
                    });
                }

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
                    MonthlyTaskCreation = monthlyData
                };

                return Json(new { success = true, data = dashboardData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading dashboard statistics for user {UserId}", User.GetUserId());
                return Json(new { success = false, message = "Error loading dashboard statistics" });
            }
        }
    }
}
