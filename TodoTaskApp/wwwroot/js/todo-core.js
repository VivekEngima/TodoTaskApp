/**
 * Todo Core Module
 * Core task management functionality
 */
(function() {
    'use strict';

    // Module variables
    let todoTasks = [];
    let editingTodoTaskId = 0;

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Core = window.TodoApp.Core || {};

    /**
     * Initialize core todo functionality
     */
    window.TodoApp.Core.initialize = function() {
        loadAllTodos();
        setupCoreEventHandlers();
    };

    /**
     * Load all tasks from server
     */
    function loadAllTodos() {
        window.TodoApp.Utils.showLoading(true);
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
            .fail(() => {
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
            .on("click", function() {
                if (window.TodoApp.Filters) {
                    window.TodoApp.Filters.clearFilters();
                }
                loadAllTodos();
            });

        // Add task button
        $("#addTaskBtn")
            .off("click")
            .on("click", function() {
                if (window.TodoApp.Forms) {
                    window.TodoApp.Forms.resetForm();
                }
                $("#taskModalLabel").html('<i class="fas fa-plus"></i> Add New Task');
                $("#saveTaskBtn").html('<i class="fas fa-save"></i> Save Task');

                // Reset assignments and reload users
                $("#currentAssignments").addClass("d-none");
                if (window.TodoApp.Assignments) {
                    window.TodoApp.Assignments.loadUsersForAssignment();
                }

                // Show modal
                new bootstrap.Modal(document.getElementById("taskModal")).show();
            });

        // Create/update form
        $("#taskForm")
            .off("submit")
            .on("submit", function(e) {
                e.preventDefault();
                saveTodoTask();
            });

        // Quick add button
        $(document)
            .off("click", "#quickAddBtn")
            .on("click", "#quickAddBtn", function() {
                quickAddTodoTask();
            });

        // Enter key support for quick add
        $(document)
            .off("keypress", "#quickAddInput")
            .on("keypress", "#quickAddInput", function(e) {
                if (e.which === 13) { // Enter key
                    e.preventDefault();
                    quickAddTodoTask();
                }
            });

        // Modal hide
        $("#taskModal")
            .off("hidden.bs.modal")
            .on("hidden.bs.modal", function() {
                if (window.TodoApp.Forms) {
                    window.TodoApp.Forms.resetForm();
                }
            });

        // Checkbox toggle
        $(document)
            .off("change", ".task-checkbox")
            .on("change", ".task-checkbox", function() {
                const id = $(this).data("task-id");
                toggleTodoTaskStatus(id, $(this).is(":checked"));
            });

        // Dashboard button
        $("#dashboardBtn")
            .off("click")
            .on("click", function() {
                window.location.href = "/Dashboard";
            });
    }

    /**
     * Edit task
     * @param {number} id - Task ID
     */
    window.editTodoTask = function(id) {
        editingTodoTaskId = id;
        const task = todoTasks.find((x) => x.Id === id);
        if (task) {
            if (window.TodoApp.Forms) {
                window.TodoApp.Forms.populateForm(task);
            }
            $("#taskModalLabel").html('<i class="fas fa-edit"></i> Edit Task');
            $("#saveTaskBtn").html('<i class="fas fa-save"></i> Update Task');

            // Load assignment info
            if (window.TodoApp.Assignments) {
                window.TodoApp.Assignments.loadTaskAssignments(id);
            }

            $("#taskModal").modal("show");
        }
    };

    /**
     * Save (create/update) task
     */
    function saveTodoTask() {
        const assignedUserIds = window.TodoApp.Assignments ? 
            window.TodoApp.Assignments.getSelectedAssignmentIds() : [];

        const model = {
            Id: parseInt($("#taskId").val()) || 0,
            Title: $("#taskTitle").val().trim(),
            Description: $("#taskDescription").val().trim(),
            Priority: $("#taskPriority").val(),
            Status: $("#taskStatus").val(),
            DueDate: $("#taskDueDate").val(),
            AssignedUserIds: assignedUserIds
        };

        if (window.TodoApp.Forms && !window.TodoApp.Forms.validateForm(model)) {
            return;
        }

        const url = model.Id > 0 ? "/Todo/UpdateTask" : "/Todo/CreateTask";
        const btn = $("#saveTaskBtn"),
            txt = btn.html();
        btn.prop("disabled", true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');

        $.ajax({
            url,
            type: "POST",
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
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
            window.TodoApp.Utils.showAlert("Task title cannot exceed 100 characters", "warning");
            return;
        }

        if (!/^[a-zA-Z0-9\s]*$/.test(title)) {
            window.TodoApp.Utils.showAlert("Task title contains invalid characters", "warning");
            return;
        }

        const task = {
            Id: 0,
            Title: title,
            Description: "",
            Priority: "Normal",
            Status: "Pending",
            DueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            AssignedUserIds: []
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
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            contentType: "application/json",
            data: JSON.stringify(task),
        })
            .done((res) => callback(res.success))
            .fail(() => callback(false));
    }

    /**
     * Delete task
     * @param {number} id - Task ID
     */
    window.deleteTodoTask = function(id) {
        if (!confirm("Are you sure you want to delete this task?")) return;

        $.ajax({
            url: "/Todo/DeleteTask",
            type: "POST",
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
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
            .fail(() => window.TodoApp.Utils.showAlert("Error deleting task", "danger"));
    };

    /**
     * Toggle task status
     * @param {number} id - Task ID
     * @param {boolean} completed - Whether task is completed
     */
    window.toggleTodoTaskStatus = function(id, completed) {
        const status = completed ? "Completed" : "Pending";
        $.ajax({
            url: "/Todo/UpdateTaskStatus",
            type: "POST",
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            data: { id, status },
        })
            .done((res) => {
                if (res.success) loadAllTodos();
                else window.TodoApp.Utils.showAlert("Error updating status", "danger");
            })
            .fail(() => window.TodoApp.Utils.showAlert("Error updating status", "danger"));
    };

    /**
     * Get all tasks
     * @returns {Array} Array of tasks
     */
    window.TodoApp.Core.getTasks = function() {
        return todoTasks;
    };

    /**
     * Refresh tasks
     */
    window.refreshTodos = function() {
        loadAllTodos();
    };

    // Expose functions to global scope for backward compatibility
    window.TodoApp.Core.loadAllTodos = loadAllTodos;

})();
