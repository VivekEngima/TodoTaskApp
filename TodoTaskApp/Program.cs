using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TodoTaskApp.Data;
using TodoTaskApp.Models;

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

// Configure Identity authentication
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Auth/Index";
    options.LogoutPath = "/Auth/Logout";
    options.AccessDeniedPath = "/Auth/AccessDenied";
    options.ExpireTimeSpan = TimeSpan.FromHours(24);
    options.SlidingExpiration = true;
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// Register repositories
builder.Services.AddScoped<TodoTaskApp.IRepository.ITodoTaskRepository, TodoTaskApp.Repository.TodoTaskRepository>();
builder.Services.AddScoped<TodoTaskApp.IRepository.ITaskAssignmentRepository, TodoTaskApp.Repository.TaskAssignmentRepository>();
builder.Services.AddScoped<TodoTaskApp.IRepository.ITaskCommentRepository, TodoTaskApp.Repository.TaskCommentRepository>();
builder.Services.AddScoped<TodoTaskApp.IRepository.ITodoTaskDocumentRepository, TodoTaskApp.Repository.TodoTaskDocumentRepository>();

// Register application services
builder.Services.AddScoped<TodoTaskApp.IServices.ITodoTaskService, TodoTaskApp.Services.TodoTaskService>();
builder.Services.AddScoped<TodoTaskApp.IServices.ITaskAssignmentService, TodoTaskApp.Services.TaskAssignmentService>();
builder.Services.AddScoped<TodoTaskApp.IServices.ITaskCommentService, TodoTaskApp.Services.TaskCommentService>();
builder.Services.AddScoped<TodoTaskApp.IServices.ITodoTaskDocumentService, TodoTaskApp.Services.TodoTaskDocumentService>();
builder.Services.AddScoped<TodoTaskApp.IServices.IUserService, TodoTaskApp.Services.UserService>();

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

// Main page
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}");

app.Run();