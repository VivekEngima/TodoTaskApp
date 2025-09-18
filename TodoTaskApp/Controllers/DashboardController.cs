using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoTaskApp.Extensions;
using TodoTaskApp.IServices;

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
    }
}
