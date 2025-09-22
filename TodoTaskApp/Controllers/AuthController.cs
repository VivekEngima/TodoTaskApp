using Microsoft.AspNetCore.Mvc;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace TodoTaskApp.Controllers
{
    public class AuthController : Controller
    {
        private readonly IUserService _userService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserService userService, ILogger<AuthController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        // GET: Auth/Login
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        // POST: Auth/Login
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            try
            {
                var result = await _userService.LoginAsync(model);

                if (!result.Success)
                {
                    ModelState.AddModelError(string.Empty, result.Message);
                    return View(model);
                }

                // Create authentication claims
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, result.User!.Username),
                    new Claim(ClaimTypes.NameIdentifier, result.User.Id.ToString()),
                    new Claim("UserId", result.User.Id.ToString())
                };

                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = model.RememberMe,
                    ExpiresUtc = model.RememberMe ? DateTimeOffset.UtcNow.AddDays(7) : DateTimeOffset.UtcNow.AddHours(24)
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity),
                    authProperties);

                _logger.LogInformation("User {Username} logged in successfully", result.User.Username);

                // Redirect to return URL or dashboard
                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return Redirect(returnUrl);
                }

                return RedirectToAction("Index", "Dashboard");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login process for user {Username}", model.Username);
                ModelState.AddModelError(string.Empty, "An unexpected error occurred. Please try again.");
                return View(model);
            }
        }

        // GET: Auth/Signup
        [HttpGet]
        public IActionResult Signup()
        {
            return View();
        }

        // POST: Auth/Signup
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Signup(SignupViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            try
            {
                var result = await _userService.SignupAsync(model);

                if (!result.Success)
                {
                    ModelState.AddModelError(string.Empty, result.Message);
                    return View(model);
                }

                _logger.LogInformation("New user {Username} registered successfully", result.User!.Username);

                // after successful signup
                var loginModel = new LoginViewModel
                {
                    Username = model.Username,
                    Password = model.Password
                };

                var loginResult = await _userService.LoginAsync(loginModel);

                if (loginResult.Success)
                {
                    // Create authentication claims
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.Name, loginResult.User!.Username),
                        new Claim(ClaimTypes.NameIdentifier, loginResult.User.Id.ToString()),
                        new Claim("UserId", loginResult.User.Id.ToString())
                    };

                    var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

                    await HttpContext.SignInAsync(
                        CookieAuthenticationDefaults.AuthenticationScheme,
                        new ClaimsPrincipal(claimsIdentity));
                }

                TempData["SuccessMessage"] = "Account created successfully! Welcome to TodoTaskApp!";
                return RedirectToAction("Index", "Dashboard");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during signup process for user {Username}", model.Username);
                ModelState.AddModelError(string.Empty, "An unexpected error occurred. Please try again.");
                return View(model);
            }
        }

        // POST: Auth/Logout
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var username = User.Identity?.Name;
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return RedirectToAction("Login", "Auth");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout process");
                return RedirectToAction("Login", "Auth");
            }
        }

        // AJAX: Check username availability
        [HttpPost]
        public async Task<IActionResult> CheckUsername(string username)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username))
                {
                    return Json(new { available = false, message = "Username is required" });
                }

                var exists = await _userService.UsernameExistsAsync(username);

                return Json(new
                {
                    available = !exists,
                    message = exists ? "Username is already taken" : "Username is available"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking username availability for {Username}", username);
                return Json(new { available = false, message = "Error checking username" });
            }
        }

        // GET: Auth/AccessDenied
        [HttpGet]
        public IActionResult AccessDenied()
        {
            return View();
        }
    }
}
