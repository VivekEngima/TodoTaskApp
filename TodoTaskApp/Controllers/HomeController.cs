using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Diagnostics;
using TodoTaskApp.Models;

namespace TodoTaskApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly SignInManager<User> _signInManager;

        public HomeController(ILogger<HomeController> logger, SignInManager<User> signInManager)
        {
            _logger = logger;
            _signInManager = signInManager;
        }

        // Home page shows login/signup section
        public IActionResult Index(string? returnUrl = null)
        {
            // Debug: Log authentication status
            _logger.LogInformation($"Home Index - User authenticated: {User.Identity?.IsAuthenticated}, User name: {User.Identity?.Name}");
            
            // If user is already signed in, redirect to dashboard
            if (_signInManager.IsSignedIn(User))
            {
                _logger.LogInformation("User is signed in, redirecting to Dashboard");
                return RedirectToAction("Index", "Dashboard");
            }

            _logger.LogInformation("User not signed in, showing login/signup page");
            // Show login/signup page
            ViewBag.ReturnUrl = returnUrl;
            var authViewModel = new AuthViewModel();
            return View(authViewModel);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}