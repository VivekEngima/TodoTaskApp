/**
 * Todo Core Module
 * Core task management functionality
 */
(function () {
  "use strict";

  // Module variables
  let todoTasks = [];
  let editingTodoTaskId = 0;
  let isModalBeingProcessed = false;

  // Expose to global scope
  window.TodoApp = window.TodoApp || {};
  window.TodoApp.Core = window.TodoApp.Core || {};

  /**
   * Initialize core todo functionality
   */
  window.TodoApp.Core.initialize = function () {
    loadAllTodos();
    setupCoreEventHandlers();
  };

  /**
   * Load all tasks from server
   */
  function loadAllTodos() {
    window.TodoApp.Utils.showLoading(true);

    // First check current user
    $.ajax({
      url: "/Todo/GetCurrentUser",
      type: "GET",
      cache: false,
    })
      .done((userResponse) => {
        // User info loaded successfully
      })
      .fail((xhr, status, error) => {
        // Failed to get user info
      });

    // Then load tasks
    $.ajax({
      url: "/Todo/GetAllTasks",
      type: "GET",
      cache: false,
    })
      .done((response) => {
        todoTasks = response.success ? response.data || [] : [];
        if (window.TodoApp.Filters) {
          window.TodoApp.Filters.displayFilteredTasks(todoTasks);
        }
      })
      .fail((xhr, status, error) => {
        window.TodoApp.Utils.showAlert("Error loading tasks", "danger");
        todoTasks = [];
        if (window.TodoApp.Filters) {
          window.TodoApp.Filters.displayFilteredTasks(todoTasks);
        }
      })
      .always(() => window.TodoApp.Utils.showLoading(false));
  }

  /**
   * Setup core event handlers
   */
  function setupCoreEventHandlers() {
    // Refresh button
    $("#refreshBtn")
      .off("click")
      .on("click", function () {
        if (window.TodoApp.Filters) {
          window.TodoApp.Filters.clearFilters();
        }
        loadAllTodos();
      });

    // Add task button
    $("#addTaskBtn")
      .off("click")
      .on("click", function () {
        if (window.TodoApp.Forms) {
          window.TodoApp.Forms.resetForm();
        }
        $("#taskModalLabel").html('<i class="fas fa-plus"></i> Add New Task');
        $("#saveTaskBtn").html('<i class="fas fa-save"></i> Save Task');

        // Reset assignments and reload users
        $("#currentAssignments").addClass("d-none");
        if (window.TodoApp.Assignments) {
          window.TodoApp.Assignments.initialize();
        }

        // Show modal
        new bootstrap.Modal(document.getElementById("taskModal")).show();
      });

    // Create/update form
    $("#taskForm")
      .off("submit")
      .on("submit", function (e) {
        e.preventDefault();
        saveTodoTask();
      });

    // Quick add button
    $(document)
      .off("click", "#quickAddBtn")
      .on("click", "#quickAddBtn", function () {
        quickAddTodoTask();
      });

    // Enter key support for quick add
    $(document)
      .off("keypress", "#quickAddInput")
      .on("keypress", "#quickAddInput", function (e) {
        if (e.which === 13) {
          // Enter key
          e.preventDefault();
          quickAddTodoTask();
        }
      });

    // Modal hide
    $("#taskModal")
      .off("hidden.bs.modal")
      .on("hidden.bs.modal", function () {
        isModalBeingProcessed = false; // Reset processing flag
        if (window.TodoApp.Forms) {
          window.TodoApp.Forms.resetForm();
        }
      });

    // Checkbox toggle
    $(document)
      .off("change", ".task-checkbox")
      .on("change", ".task-checkbox", function () {
        const id = $(this).data("task-id");
        toggleTodoTaskStatus(id, $(this).is(":checked"));
      });

    // Dashboard button
    $("#dashboardBtn")
      .off("click")
      .on("click", function () {
        window.location.href = "/Dashboard";
      });

    // Export button
    $("#exportBtn")
      .off("click")
      .on("click", function () {
        exportTasks();
      });

    // Import button
    $("#importBtn")
      .off("click")
      .on("click", function () {
        $("#importFileInput").click();
      });

    // Import file input change
    $("#importFileInput")
      .off("change")
      .on("change", function () {
        const file = this.files[0];
        if (file) {
          importTasks(file);
        }
      });
  }

  /**
   * Edit task
   * @param {number} id - Task ID
   */
  window.editTodoTask = function (id) {
    // Prevent multiple simultaneous edit operations
    if (isModalBeingProcessed) {
      console.log(
        "Modal is already being processed, ignoring duplicate edit request"
      );
      return;
    }

    isModalBeingProcessed = true;
    editingTodoTaskId = id;
    const task = todoTasks.find((x) => x.Id === id);
    // Edit task called
    if (task) {
      // Reset modal state first to prevent duplicate elements
      if (
        window.TodoApp.Assignments &&
        window.TodoApp.Assignments.resetAssignmentSection
      ) {
        window.TodoApp.Assignments.resetAssignmentSection();
      }

      // Clear any existing permission styling first
      if (window.TodoApp.Forms && window.TodoApp.Forms.clearPermissionStyling) {
        window.TodoApp.Forms.clearPermissionStyling();
      }

      // Populate form with task data (this will apply permission restrictions)
      if (window.TodoApp.Forms) {
        window.TodoApp.Forms.populateForm(task);
      }

      // Load assignment info
      if (window.TodoApp.Assignments) {
        window.TodoApp.Assignments.loadTaskAssignments(id, task.CanAssignTask);
      }

      $("#taskModal").modal("show");
    }

    // Reset the flag after a short delay to allow modal to fully load
    setTimeout(() => {
      isModalBeingProcessed = false;
    }, 500);
  };

  /**
   * Save (create/update) task
   */
  function saveTodoTask() {
    const assignedUserIds = window.TodoApp.Assignments
      ? window.TodoApp.Assignments.getSelectedAssignmentIds()
      : [];

    const model = {
      Id: parseInt($("#taskId").val()) || 0,
      Title: $("#taskTitle").val().trim(),
      Description: $("#taskDescription").val().trim(),
      Priority: $("#taskPriority").val(),
      Status: $("#taskStatus").val(),
      DueDate: $("#taskDueDate").val(),
      AssignedUserIds: assignedUserIds,
    };

    if (window.TodoApp.Forms && !window.TodoApp.Forms.validateForm(model)) {
      return;
    }

    const url = model.Id > 0 ? "/Todo/UpdateTask" : "/Todo/CreateTask";
    const btn = $("#saveTaskBtn"),
      txt = btn.html();
    btn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin"></i> Saving...');

    $.ajax({
      url,
      type: "POST",
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      contentType: "application/json",
      data: JSON.stringify(model),
    })
      .done((res) => {
        if (res.success) {
          $("#taskModal").modal("hide");
          loadAllTodos();
          window.TodoApp.Utils.showAlert(res.message, "success");
        } else {
          if (window.TodoApp.Forms) {
            window.TodoApp.Forms.showFormErrors(res.errors || [res.message]);
          }
        }
      })
      .fail(() => window.TodoApp.Utils.showAlert("Error saving task", "danger"))
      .always(() => btn.prop("disabled", false).html(txt));
  }

  /**
   * Quick add new task
   */
  function quickAddTodoTask() {
    const input = $("#quickAddInput");
    const title = (input.val() || "").trim();

    if (!title) {
      window.TodoApp.Utils.showAlert("Please enter a task title", "warning");
      input.focus();
      return;
    }

    if (title.length > 100) {
      window.TodoApp.Utils.showAlert(
        "Task title cannot exceed 100 characters",
        "warning"
      );
      return;
    }

    if (!/^[a-zA-Z0-9\s]*$/.test(title)) {
      window.TodoApp.Utils.showAlert(
        "Task title contains invalid characters",
        "warning"
      );
      return;
    }

    const task = {
      Id: 0,
      Title: title,
      Description: "",
      Priority: "Normal",
      Status: "Pending",
      DueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      AssignedUserIds: [],
    };

    // Show loading state
    const btn = $("#quickAddBtn");
    const originalHtml = btn.html();
    btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i>');
    input.prop("disabled", true);

    createTodoTask(task, (success) => {
      if (success) {
        input.val("").prop("disabled", false);
        loadAllTodos();
        window.TodoApp.Utils.showAlert("Task created successfully!", "success");
      } else {
        window.TodoApp.Utils.showAlert("Failed to create task", "danger");
        input.prop("disabled", false);
      }
      btn.prop("disabled", false).html(originalHtml);
    });
  }

  /**
   * Create task via AJAX
   * @param {Object} task - Task object
   * @param {Function} callback - Success callback
   */
  function createTodoTask(task, callback) {
    $.ajax({
      url: "/Todo/CreateTask",
      type: "POST",
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      contentType: "application/json",
      data: JSON.stringify(task),
    })
      .done((res) => {
        callback(res.success);
      })
      .fail((xhr, status, error) => {
        callback(false);
      });
  }

  /**
   * Delete task
   * @param {number} id - Task ID
   */
  window.deleteTodoTask = function (id) {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    const token = $('input[name="__RequestVerificationToken"]').val();

    $.ajax({
      url: "/Todo/DeleteTask",
      type: "POST",
      headers: {
        RequestVerificationToken: token,
      },
      data: { id },
    })
      .done((res) => {
        if (res.success) {
          loadAllTodos();
          window.TodoApp.Utils.showAlert(res.message, "success");
        } else {
          window.TodoApp.Utils.showAlert(res.message, "danger");
        }
      })
      .fail((xhr, status, error) => {
        window.TodoApp.Utils.showAlert("Error deleting task", "danger");
      });
  };

  /**
   * Toggle task status
   * @param {number} id - Task ID
   * @param {boolean} completed - Whether task is completed
   */
  window.toggleTodoTaskStatus = function (id, completed) {
    const status = completed ? "Completed" : "Pending";
    $.ajax({
      url: "/Todo/UpdateTaskStatus",
      type: "POST",
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      data: { id, status },
    })
      .done((res) => {
        if (res.success) loadAllTodos();
        else window.TodoApp.Utils.showAlert("Error updating status", "danger");
      })
      .fail(() =>
        window.TodoApp.Utils.showAlert("Error updating status", "danger")
      );
  };

  /**
   * Get all tasks
   * @returns {Array} Array of tasks
   */
  window.TodoApp.Core.getTasks = function () {
    return todoTasks;
  };

  /**
   * Refresh tasks
   */
  window.refreshTodos = function () {
    loadAllTodos();
  };

  // Expose functions to global scope for backward compatibility
  window.TodoApp.Core.loadAllTodos = loadAllTodos;

  /**
   * Export tasks to CSV
   */
  function exportTasks() {
    window.location.href = "/Todo/ExportTasks";
  }

  /**
   * Import tasks from CSV file
   * @param {File} file - CSV file to import
   */
  function importTasks(file) {
    if (!file) {
      window.TodoApp.Utils.showAlert(
        "Please select a file to import",
        "warning"
      );
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      window.TodoApp.Utils.showAlert("Only CSV files are supported", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Show loading state
    const importBtn = $("#importBtn");
    const originalHtml = importBtn.html();
    importBtn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin"></i> Importing...');

    $.ajax({
      url: "/Todo/ImportTasks",
      type: "POST",
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        if (response.success) {
          window.TodoApp.Utils.showAlert(
            "Tasks imported successfully!",
            "success"
          );
          loadAllTodos(); // Refresh the task list
        } else {
          window.TodoApp.Utils.showAlert(
            response.message || "Error importing tasks",
            "danger"
          );
        }
      },
      error: function (xhr, status, error) {
        window.TodoApp.Utils.showAlert(
          "Error importing tasks: " + error,
          "danger"
        );
      },
      complete: function () {
        importBtn.prop("disabled", false).html(originalHtml);
        $("#importFileInput").val(""); // Clear file input
      },
    });
  }
})();
