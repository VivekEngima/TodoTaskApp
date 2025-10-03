using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Models;
using TodoTaskApp.Repository;
using TodoTaskApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register DapperContext for repositories
builder.Services.AddScoped<TodoTaskApp.Data.DapperContext>();

// Add Identity services with custom User model
builder.Services.AddIdentity<User, IdentityRole>(options => 
{
    options.SignIn.RequireConfirmedAccount = false;
    options.SignIn.RequireConfirmedEmail = false;
    options.SignIn.RequireConfirmedPhoneNumber = false;
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Add Google Authentication
builder.Services.AddAuthentication()
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
        options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
        options.CallbackPath = "/signin-google";
        options.SaveTokens = true;
        options.Scope.Add("email");
        options.Scope.Add("profile");
    });

// Configure Identity authentication
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/"; // Home page is now the login page
    options.LogoutPath = "/Auth/Logout";
    options.AccessDeniedPath = "/Auth/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromHours(24);
    options.SlidingExpiration = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// Register repositories
builder.Services.AddScoped<ITodoTaskRepository,TodoTaskRepository>();
builder.Services.AddScoped<ITaskAssignmentRepository, TaskAssignmentRepository>();
builder.Services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
builder.Services.AddScoped<ITodoTaskDocumentRepository, TodoTaskDocumentRepository>();

// Register application services
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();
builder.Services.AddScoped<ITaskAssignmentService, TaskAssignmentService>();
builder.Services.AddScoped<ITaskCommentService, TaskCommentService>();
builder.Services.AddScoped<ITodoTaskDocumentService, TodoTaskDocumentService>();
builder.Services.AddScoped<IUserService, UserService>();

// JSON formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
    });

var app = builder.Build();

// Error handling for production
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Check user login
app.UseAuthentication();
app.UseAuthorization();

// URL routing
app.MapControllerRoute(
    name: "Auth",
    pattern: "Auth/{action=Index}",
    defaults: new { controller = "Auth" });

app.MapControllerRoute(
    name: "Todo",
    pattern: "Todo/{action}/{id?}",
    defaults: new { controller = "Todo", action = "Index" }
);

app.MapControllerRoute(
    name: "Dashboard",
    pattern: "Dashboard/{action=Index}",
    defaults: new { controller = "Dashboard" }
);

// Main page - Home page shows login/signup
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}");

app.Run();