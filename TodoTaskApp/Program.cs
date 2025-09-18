using TodoTaskApp.Data;
using TodoTaskApp.IRepository;
using TodoTaskApp.IServices;
using TodoTaskApp.Repository;
using TodoTaskApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Add Dapper Context
builder.Services.AddScoped<DapperContext>();

builder.Services.AddScoped<ITodoTaskRepository, TodoTaskRepository>();
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();
// Add document repositories and services
builder.Services.AddScoped<ITodoTaskDocumentRepository, TodoTaskDocumentRepository>();
builder.Services.AddScoped<ITodoTaskDocumentService, TodoTaskDocumentService>();


// Add JSON options for better serialization
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.WriteIndented = true;
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "Todo",
    pattern: "Todo/{action=Index}",
    defaults: new { controller = "Todo" });


// Default Home Route
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Dashboard}/{action=Index}");

app.Run();