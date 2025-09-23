(function () {
    // Scoped variables
    let currentTodoFilter = { 
        status: null, 
        priority: null, 
        searchTerm: null, 
        dateFilter: null,
        dateRange: { startDate: null, endDate: null, includeCompleted: false }
    };
    let editingTodoTaskId = 0;
    let todoTasks = [];
    let allUsers = []; // Store users for assignment
    let currentDocumentTaskId = 0;
    let currentReplaceDocumentId = 0;
    let currentReplaceDocumentName = "";

    // Initialize when DOM is ready
    $(document).ready(function () {
        initializeTodoPage();
        loadAllTodos();
        loadUsersForAssignment(); // Load users for assignment dropdown
        setupTodoEventHandlers();
        setupDocumentEventHandlers(); // Initialize document modal handlers
    });

    // Set up page defaults
    function initializeTodoPage() {
        // Default due date = today + 7 days
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        $("#taskDueDate").val(defaultDueDate.toISOString().split("T")[0]);
        setupAntiForgeryToken();
    }

    // ========== ASSIGNMENT FUNCTIONS ==========

    // Load users for assignment
    function loadUsersForAssignment() {
        $("#assignmentLoading").removeClass("d-none");
        $("#userAssignmentList").html('<i class="fas fa-spinner fa-spin"></i> Loading users...');

        $.ajax({
            url: "/Todo/GetUsersForAssignment",
            type: "GET",
            cache: false,
        })
            .done((response) => {
                allUsers = response.success ? response.data || [] : [];
                populateUserAssignmentList();
            })
            .fail((xhr, status, error) => {
                showTodoAlert("Error loading users for assignment", "warning");
                allUsers = [];
                $("#userAssignmentList").html('<i class="fas fa-exclamation-triangle"></i> Error loading users');
            })
            .always(() => {
                $("#assignmentLoading").addClass("d-none");
            });
    }

    // Populate user assignment list
    function populateUserAssignmentList(selectedUserIds = []) {
        const container = $("#userAssignmentList");
        container.empty();

        if (!allUsers.length) {
            container.html('<small class="text-muted"><i class="fas fa-info-circle"></i> No other users available for assignment.</small>');
            return;
        }

        allUsers.forEach(user => {
            const isSelected = selectedUserIds.includes(user.Id);

            const itemHtml = `
                <div class="form-check">
                    <input class="form-check-input assignment-checkbox" type="checkbox" 
                           value="${user.Id}" ${isSelected ? 'checked' : ''}>
                    <label class="form-check-label">
                        ${escapeHtml(user.Username)}
                    </label>
                </div>
            `;
            container.append(itemHtml);
        });
    }

    // Get selected assignment user IDs
    function getSelectedAssignmentIds() {
        const selected = $(".assignment-checkbox:checked").map(function () {
            return parseInt($(this).val());
        }).get();
        return selected;
    }

    // Display current assignments (for edit mode)
    function displayCurrentAssignments(assignments) {
        const container = $("#currentAssignmentsList");
        const section = $("#currentAssignments");

        container.empty();

        if (!assignments || !assignments.length) {
            section.addClass("d-none");
            return;
        }

        section.removeClass("d-none");

        assignments.forEach(assignment => {
            const itemHtml = `
                <div class="assignment-item border rounded p-2 mb-2 bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong><i class="fas fa-user"></i> ${escapeHtml(assignment.AssignedUserName)}</strong>
                            <br>
                            <small class="text-muted">
                                Assigned by ${escapeHtml(assignment.AssignedByUserName)}
                                <br>
                                <i class="fas fa-calendar-alt"></i> ${new Date(assignment.AssignedDate).toLocaleDateString()}
                            </small>
                        </div>
                    </div>
                </div>
            `;
            container.append(itemHtml);
        });
    }

    // Load task assignments for editing
    function loadTaskAssignments(taskId) {
        console.log('TodoApp: Loading task assignments for task:', taskId);
        $("#assignmentLoading").removeClass("d-none");

        $.ajax({
            url: "/Todo/GetTaskAssignments",
            type: "GET",
            data: { taskId: taskId },
            cache: false,
        })
            .done((response) => {
                if (response.success) {
                    const assignments = response.data || [];
                    const assignedUserIds = assignments.map(a => a.AssignedUserId);

                    // Populate assignment checkboxes with current assignments
                    populateUserAssignmentList(assignedUserIds);

                    // Show current assignments
                    displayCurrentAssignments(assignments);
                } else {
                    console.error('TodoApp: Failed to load task assignments:', response.message);
                }
            })
            .fail(() => {
                console.error('TodoApp: Error loading task assignments');
                populateUserAssignmentList([]);
            })
            .always(() => $("#assignmentLoading").addClass("d-none"));
    }

    // ========== EVENT HANDLERS SETUP ==========

    // Bind UI event handlers
    function setupTodoEventHandlers() {
        // Refresh button
        $("#refreshBtn")
            .off("click")
            .on("click", function () {
                // Clear filters
                currentTodoFilter = { 
                    status: null, 
                    priority: null, 
                    searchTerm: null, 
                    dateFilter: null,
                    dateRange: { startDate: null, endDate: null, includeCompleted: false }
                };
                $(".status-btn, .priority-btn, .filter-btn").removeClass("active");
                $("#searchInput").val("");
                // Reload tasks
                loadAllTodos();
            });

        // Add task button
        $("#addTaskBtn")
            .off("click")
            .on("click", function () {
                resetTodoTaskForm();
                $("#taskModalLabel").html('<i class="fas fa-plus"></i> Add New Task');
                $("#saveTaskBtn").html('<i class="fas fa-save"></i> Save Task');

                // Reset assignments and reload users
                $("#currentAssignments").addClass("d-none");
                loadUsersForAssignment();

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

        // Search
        $("#searchInput")
            .off("keyup")
            .on("keyup", debounce(function () {
                let val = $(this).val();
                if (typeof val !== "string") val = "";
                currentTodoFilter.searchTerm = val.trim() || null;
                displayFilteredTasks();
            }, 300));

        // FIXED Quick add - proper event handling
        $(document)
            .off("click", "#quickAddBtn")
            .on("click", "#quickAddBtn", function () {
                quickAddTodoTask();
            });

        // FIXED: Enter key support for quick add
        $(document)
            .off("keypress", "#quickAddInput")
            .on("keypress", "#quickAddInput", function (e) {
                if (e.which === 13) { // Enter key
                    e.preventDefault();
                    quickAddTodoTask();
                }
            });

        // Status filter
        $(".status-btn")
            .off("click")
            .on("click", function () {
                const statusValue = $(this).data("status");
                const wasActive = $(this).hasClass("active");

                $(".status-btn").removeClass("active");
                currentTodoFilter.status = wasActive ? null : statusValue;
                // Clear date range when status filter is applied
                currentTodoFilter.dateRange = { startDate: null, endDate: null, includeCompleted: false };
                if (!wasActive) $(this).addClass("active");

                displayFilteredTasks();
            });

        // Priority filter
        $(".priority-btn")
            .off("click")
            .on("click", function () {
                const priorityValue = $(this).data("priority");
                const wasActive = $(this).hasClass("active");

                $(".priority-btn").removeClass("active");
                currentTodoFilter.priority = wasActive ? null : priorityValue;
                // Clear date range when priority filter is applied
                currentTodoFilter.dateRange = { startDate: null, endDate: null, includeCompleted: false };
                if (!wasActive) $(this).addClass("active");

                displayFilteredTasks();
            });

        // Date filter (upcoming, today, calendar)
        $(".filter-btn")
            .off("click")
            .on("click", function () {
                const filterValue = $(this).data("filter");
                const wasActive = $(this).hasClass("active");

                if (filterValue === 'calendar') {
                    // Show simple prompt for date range
                    showSimpleDateRangePrompt();
                } else {
                    // Handle upcoming and today filters normally
                    $(".filter-btn").removeClass("active");
                    currentTodoFilter.dateFilter = wasActive ? null : filterValue;
                    currentTodoFilter.dateRange = { startDate: null, endDate: null, includeCompleted: false }; // Clear date range
                    if (!wasActive) $(this).addClass("active");
                    displayFilteredTasks();
                }
            });

        // Modal hide
        $("#taskModal")
            .off("hidden.bs.modal")
            .on("hidden.bs.modal", resetTodoTaskForm);

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

    }

    // ========== TASK MANAGEMENT FUNCTIONS ==========

    // Load tasks from server with assignment info
    function loadAllTodos() {
        showTodoLoading(true);
        $.ajax({
            url: "/Todo/GetAllTasks",
            type: "GET",
            cache: false,
        })
            .done((response) => {
                todoTasks = response.success ? response.data || [] : [];
                displayFilteredTasks();
            })
            .fail(() => {
                showTodoAlert("Error loading tasks", "danger");
                todoTasks = [];
                displayFilteredTasks();
            })
            .always(() => showTodoLoading(false));
    }

    // Edit task with assignment loading
    window.editTodoTask = function (id) {
        editingTodoTaskId = id;
        const t = todoTasks.find((x) => x.Id === id);
        if (t) {
            populateTodoTaskForm(t);
            $("#taskModalLabel").html('<i class="fas fa-edit"></i> Edit Task');
            $("#saveTaskBtn").html('<i class="fas fa-save"></i> Update Task');

            // Load assignment info
            loadTaskAssignments(id);

            $("#taskModal").modal("show");
        }
    };

    // Save (create/update) task with assignments
    function saveTodoTask() {
        const assignedUserIds = getSelectedAssignmentIds();

        const model = {
            Id: parseInt($("#taskId").val()) || 0,
            Title: $("#taskTitle").val().trim(),
            Description: $("#taskDescription").val().trim(),
            Priority: $("#taskPriority").val(),
            Status: $("#taskStatus").val(),
            DueDate: $("#taskDueDate").val(),
            AssignedUserIds: assignedUserIds // Include assignments
        };

        if (!validateTodoTaskForm(model)) return;

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
                    showTodoAlert(res.message, "success");
                } else {
                    showTodoTaskFormErrors(res.errors || [res.message]);
                }
            })
            .fail(() => showTodoAlert("Error saving task", "danger"))
            .always(() => btn.prop("disabled", false).html(txt));
    }

    // Display filtered tasks
    function displayFilteredTasks() {
        let list = todoTasks.slice();

        // Text search
        if (currentTodoFilter.searchTerm) {
            const term = currentTodoFilter.searchTerm.toLowerCase();
            list = list.filter(
                (t) =>
                    (t.Title || "").toLowerCase().includes(term) ||
                    (t.Description || "").toLowerCase().includes(term)
            );
        }
        // Status
        if (currentTodoFilter.status) {
            list = list.filter((t) => t.Status === currentTodoFilter.status);
        }
        // Priority
        if (currentTodoFilter.priority) {
            list = list.filter((t) => t.Priority === currentTodoFilter.priority);
        }
        // Date filter
        if (currentTodoFilter.dateFilter) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today
            
            list = list.filter((t) => {
                if (!t.DueDate) return false;
                
                const taskDate = new Date(t.DueDate);
                taskDate.setHours(0, 0, 0, 0); // Start of task due date
                
                switch (currentTodoFilter.dateFilter) {
                    case 'today':
                        return taskDate.getTime() === today.getTime();
                    case 'upcoming':
                        return taskDate.getTime() >= today.getTime();
                    default:
                        return true;
                }
            });
        }

        // Date range filter
        if (currentTodoFilter.dateRange.startDate && currentTodoFilter.dateRange.endDate) {
            const startDate = new Date(currentTodoFilter.dateRange.startDate);
            const endDate = new Date(currentTodoFilter.dateRange.endDate);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999); // End of day
            
            list = list.filter((t) => {
                if (!t.DueDate) return false;
                
                const taskDate = new Date(t.DueDate);
                
                // Check if task is within date range
                const isInRange = taskDate >= startDate && taskDate <= endDate;
                
                // If includeCompleted is false, exclude completed tasks
                if (!currentTodoFilter.dateRange.includeCompleted && t.Status === "Completed") {
                    return false;
                }
                
                return isInRange;
            });
        }

        renderTaskTable(list);
    }

    // FIXED: Render task table with proper column alignment
    function renderTaskTable(tasks) {
        const tbody = $("#tasksBody").empty();
        tbody.append(createQuickAddRow());

        if (!tasks.length) {
            tbody.append(`
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        No tasks found. Create your first task above!
                    </td>
                </tr>
            `);
        } else {
            tasks.forEach((t) => tbody.append(createTodoTaskRow(t)));
        }
        updateTodoTaskCount(tasks.length);
    }

    // Quick add row spanning FULL WIDTH across all empty columns
    function createQuickAddRow() {
        return `
            <tr class="quick-add-row bg-light">
                <td class="text-center align-middle">
                    <i class="fas fa-plus text-primary"></i>
                </td>
                <td colspan="6" class="p-2">
                    <div class="input-group">
                        <input type="text" id="quickAddInput" class="form-control" 
                               placeholder="Quick add task (press Enter or click +)" 
                               maxlength="100">
                        <button class="btn btn-primary" type="button" id="quickAddBtn" title="Add Task">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // FIXED: Single task row HTML with proper column alignment
    function createTodoTaskRow(t) {
        const isCompleted = t.Status === "Completed";
        const txtClass = isCompleted ? "text-decoration-line-through text-muted" : "";

        // Document count display - make it clickable
        const docCount = t.DocumentCount || 0;
        const docIcon = docCount > 0
            ? `<span class="badge bg-info" style="cursor: pointer;" onclick="openDocumentModal(${t.Id})" title="Click to manage documents"><i class="fas fa-file"></i> ${docCount}</span>`
            : `<span class="text-muted" style="cursor: pointer;" onclick="openDocumentModal(${t.Id})" title="Click to manage documents"><i class="fas fa-file"></i> 0</span>`;

        // Assignment badge - show "Shared" if task is shared with others
        let assignmentBadge = "";
        if (t.IsSharedTask) {
            assignmentBadge = `<span class="badge bg-warning text-dark ms-1">Shared</span>`;
        }

        // Owner indicator - show if current user is assigned to someone else's task
        let ownerIndicator = "";
        if (t.IsAssigned) {
            ownerIndicator = `<br><small class="text-muted"> 
                Assign by ${escapeHtml(t.CreatedByUsername)}</small>`;
        }

        return `
            <tr class="task-row" data-task-id="${t.Id}">
                <td class="text-center align-middle">
                    <div class="form-check d-flex justify-content-center">
                        <input class="form-check-input task-checkbox" type="checkbox" 
                               data-task-id="${t.Id}" ${isCompleted ? 'checked' : ''}>
                    </div>
                </td>
                <td class="align-middle">
                    ${assignmentBadge}
                    <strong class="${txtClass}">${escapeHtml(t.Title)}</strong>
                    ${ownerIndicator}
                    ${t.Description ? `<br><small class="text-muted ${txtClass}">${escapeHtml(t.Description)}</small>` : ""}
                </td>
                <td class="text-center align-middle">
                    <span class="badge ${getBadgeClass(t.Priority, 'priority')}">${t.Priority}</span>
                </td>
                <td class="text-center align-middle">
                    <span class="badge ${getBadgeClass(t.Status, 'status')}">${t.Status}</span>
                </td>
                <td class="text-center align-middle">
                    <small>${formatTodoDate(t.DueDate)}</small>
                </td>
                <td class="text-center align-middle">
                    ${docIcon}
                </td>
                <td class="text-center align-middle">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="editTodoTask(${t.Id})" 
                                title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteTodoTask(${t.Id})" 
                                title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // FIXED: Quick add new task with proper validation
    function quickAddTodoTask() {
        const input = $("#quickAddInput");
        const title = (input.val() || "").trim();

        if (!title) {
            showTodoAlert("Please enter a task title", "warning");
            input.focus();
            return;
        }

        if (title.length > 100) {
            showTodoAlert("Task title cannot exceed 100 characters", "warning");
            return;
        }

        if (!/^[a-zA-Z0-9\s]*$/.test(title)) {
            showTodoAlert("Task title contains invalid characters", "warning");
            return;
        }

        const task = {
            Id: 0,
            Title: title,
            Description: "",
            Priority: "Normal",
            Status: "Pending",
            DueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            AssignedUserIds: [] // No assignments for quick add
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
                showTodoAlert("Task created successfully!", "success");
            } else {
                showTodoAlert("Failed to create task", "danger");
                input.prop("disabled", false);
            }
            btn.prop("disabled", false).html(originalHtml);
        });
    }

    // Create task via AJAX
    function createTodoTask(task, cb) {
        $.ajax({
            url: "/Todo/CreateTask",
            type: "POST",
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            contentType: "application/json",
            data: JSON.stringify(task),
        })
            .done((res) => cb(res.success))
            .fail(() => cb(false));
    }

    // Delete task
    window.deleteTodoTask = function (id) {
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
                    showTodoAlert(res.message, "success");
                } else showTodoAlert(res.message, "danger");
            })
            .fail(() => showTodoAlert("Error deleting task", "danger"));
    };

    // Toggle status
    window.toggleTodoTaskStatus = function (id, completed) {
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
                else showTodoAlert("Error updating status", "danger");
            })
            .fail(() => showTodoAlert("Error updating status", "danger"));
    };

    // ========== FORM MANAGEMENT FUNCTIONS ==========

    function populateTodoTaskForm(t) {
        $("#taskId").val(t.Id);
        $("#taskTitle").val(t.Title);
        $("#taskDescription").val(t.Description);
        $("#taskPriority").val(t.Priority);
        $("#taskStatus").val(t.Status);
        $("#taskDueDate").val(t.DueDate.split("T")[0]);
    }

    function resetTodoTaskForm() {
        $("#taskForm")[0].reset();
        $("#taskId").val(0);
        $(".is-invalid").removeClass("is-invalid");
        $(".invalid-feedback").hide();
        $("#taskAlert").addClass("d-none");
        $("#currentAssignments").addClass("d-none");
        populateUserAssignmentList([]);
        initializeTodoPage();
    }

    // ========== SIMPLE DATE RANGE FILTER FUNCTIONS ==========

    // Show simple date range prompt
    function showSimpleDateRangePrompt() {
        const today = new Date();
        const todayString = today.toISOString().split("T")[0];
        
        // Ask for start date
        const startDate = prompt("Enter start date (YYYY-MM-DD):", todayString);
        if (startDate === null) return; // User cancelled
        
        // Ask for end date
        const endDate = prompt("Enter end date (YYYY-MM-DD):", todayString);
        if (endDate === null) return; // User cancelled
        
        // Validate dates
        if (!startDate || !endDate) {
            alert("Please enter both start and end dates");
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert("Start date cannot be after end date");
            return;
        }
        
        // Clear other date filters
        $(".filter-btn").removeClass("active");
        currentTodoFilter.dateFilter = null;
        
        // Set date range filter (always include completed tasks)
        currentTodoFilter.dateRange = {
            startDate: startDate,
            endDate: endDate,
            includeCompleted: true
        };

        // Apply filter
        displayFilteredTasks();
    }

    // ========== HELPER FUNCTIONS ==========

    function getBadgeClass(val, type) {
        if (type === "priority") {
            return val === "High" ? "bg-danger" : val === "Low" ? "bg-info" : "bg-secondary";
        } else {
            return val === "Completed" ? "bg-success" : val === "Hold" ? "bg-warning text-dark" : "bg-primary";
        }
    }

    function formatTodoDate(d) {
        const dt = new Date(d);
        return dt.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function escapeHtml(t) {
        if (!t) return '';
        const e = document.createElement("div");
        e.textContent = t;
        return e.innerHTML;
    }

    function validateTodoTaskForm(m) {
        let ok = true;
        $(".is-invalid").removeClass("is-invalid");
        $(".invalid-feedback").hide();

        const title = m.Title || "";
        if (title.trim() === "") {
            $("#taskTitle").addClass("is-invalid");
            $("#titleError").text("Title is required").show();
            ok = false;
        } else if (title.length > 100) {
            $("#taskTitle").addClass("is-invalid");
            $("#titleError").text("Title cannot exceed 100 characters").show();
            ok = false;
        } else {
            const invalidChars = title.match(/[^a-zA-Z0-9 ]/g);
            if (invalidChars) {
                const unique = [...new Set(invalidChars)].join(", ");
                $("#taskTitle").addClass("is-invalid");
                $("#titleError")
                    .text(`Invalid character${invalidChars.length > 1 ? "s" : ""}: ${unique}`)
                    .show();
                ok = false;
            }
        }

        if (m.Description) {
            const desc = m.Description;
            if (desc.length > 500) {
                $("#taskDescription").addClass("is-invalid");
                $("#descriptionError")
                    .text("Description cannot exceed 500 characters")
                    .show();
                ok = false;
            }
        }

        if (!m.DueDate) {
            $("#taskDueDate").addClass("is-invalid");
            $("#dueDateError").text("Due date is required").show();
            ok = false;
        }

        return ok;
    }

    function showTodoTaskFormErrors(errs) {
        let html = "Please fix the following errors:<br>";
        errs.forEach((e) => (html += "• " + e + "<br>"));
        $("#taskAlert")
            .removeClass("d-none alert-info")
            .addClass("alert-danger")
            .html(html);
    }

    function showTodoAlert(msg, type) {
        const id = "alert-" + Date.now();
        const el = $(`
            <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999;" id="${id}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${msg}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        $("body").append(el);
        setTimeout(() => el.alert("close"), 5000);
    }

    function setupAntiForgeryToken() {
        const token = $('input[name="__RequestVerificationToken"]').val();
        if (token)
            $.ajaxSetup({
                beforeSend: (xhr) =>
                    xhr.setRequestHeader("RequestVerificationToken", token),
            });
    }

    function debounce(fn, ms) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    function showTodoLoading(flag) {
        flag
            ? $("#loadingSpinner").removeClass("d-none")
            : $("#loadingSpinner").addClass("d-none");
    }

    function updateTodoTaskCount(c) {
        $("#taskCount").text(`${c} task${c !== 1 ? "s" : ""}`);
    }

    // Expose refresh function globally
    window.refreshTodos = () => {
        loadAllTodos();
    };

    // ========== DOCUMENT MANAGEMENT FUNCTIONS ==========

    // Open document modal for a specific task
    window.openDocumentModal = function(taskId) {
        console.log('Opening document modal for task ID:', taskId);
        
        if (!taskId || taskId <= 0) {
            showTodoAlert('Invalid task ID. Please try again.', 'danger');
            return;
        }
        
        // Set the current document task ID
        currentDocumentTaskId = parseInt(taskId);
        console.log('Set currentDocumentTaskId to:', currentDocumentTaskId);
        $('#docTaskId').val(taskId);
        
        // Store the task ID in the modal data attribute as backup
        $('#documentModal').data('taskId', taskId);
        
        // Show the modal first
        $('#documentModal').modal('show');
        
        // Load documents after modal is shown
        setTimeout(() => {
            loadDocumentsForTask(currentDocumentTaskId);
        }, 100);
    };

    // Load documents for a specific task
    function loadDocumentsForTask(taskId) {
        $.ajax({
            url: '/Todo/GetDocuments',
            type: 'GET',
            data: { taskId: taskId },
            success: function(response) {
                if (response.success) {
                    displayDocuments(response.data);
                } else {
                    showTodoAlert('Error loading documents: ' + (response.message || 'Unknown error'), 'danger');
                }
            },
            error: function(xhr, status, error) {
                showTodoAlert('Error loading documents: ' + error, 'danger');
            }
        });
    }

    // Display documents in the modal
    function displayDocuments(documents) {
        const container = $('#documentsContainer');
        const countBadge = $('#documentCountBadge');
        
        // Update document count badge
        countBadge.text(`${documents.length}/5`);
        
        if (documents.length === 0) {
            container.html('<div class="text-center text-muted py-3"><small>No documents uploaded yet</small></div>');
            return;
        }

        let html = '';
        documents.forEach(doc => {
            // Fix property name casing - use DocumentName instead of documentName
            const documentName = doc.DocumentName || doc.documentName || 'Unknown Document';
            const fileSize = doc.FileSize || doc.fileSize || 0;
            const docId = doc.Id || doc.id;
            
            html += `
                <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-file me-2 text-primary"></i>
                        <div class="fw-medium">${escapeHtml(documentName)}</div>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-sm" onclick="downloadDocument(${docId})" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-outline-warning btn-sm" onclick="replaceDocument(${docId}, '${escapeHtml(documentName)}')" title="Replace">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteDocument(${docId})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.html(html);
    }

    // Download document
    window.downloadDocument = function(documentId) {
        window.open(`/Todo/DownloadDocument?documentId=${documentId}`, '_blank');
    };

    // Replace document
    window.replaceDocument = function(documentId, documentName) {
        currentReplaceDocumentId = documentId;
        currentReplaceDocumentName = documentName;
        $('#currentDocumentName').text(documentName);
        $('#replaceDocumentId').val(documentId);
        $('#replaceDocumentModal').modal('show');
    };

    // Delete document
    window.deleteDocument = function(documentId) {
        if (!confirm('Are you sure you want to delete this document?')) return;

        $.ajax({
            url: '/Todo/DeleteDocument',
            type: 'POST',
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            data: { documentId: documentId },
            success: function(response) {
                if (response.success) {
                    showTodoAlert('Document deleted successfully', 'success');
                    loadDocumentsForTask(currentDocumentTaskId);
                    loadAllTodos(); // Refresh task list to update document count
                } else {
                    showTodoAlert(response.message || 'Error deleting document', 'danger');
                }
            },
            error: function() {
                showTodoAlert('Error deleting document', 'danger');
            }
        });
    };

    // Setup document modal event handlers
    function setupDocumentEventHandlers() {
        // Remove any existing event handlers to prevent duplicates
        $('#documentUploadForm').off('submit');
        $('#replaceDocumentForm').off('submit');
        $('#documentModal').off('hidden.bs.modal');
        $('#replaceDocumentModal').off('hidden.bs.modal');
        
        // Document upload form
        $('#documentUploadForm').on('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted, currentDocumentTaskId:', currentDocumentTaskId);
            uploadDocuments();
        });

        // Replace document form
        $('#replaceDocumentForm').on('submit', function(e) {
            e.preventDefault();
            replaceDocumentFile();
        });

        // Document modal close
        $('#documentModal').on('hidden.bs.modal', function() {
            console.log('Document modal closed, resetting currentDocumentTaskId');
            $('#documentFile').val('');
            $('#documentsContainer').html('');
            currentDocumentTaskId = 0; // Reset the current document task ID
            $('#documentModal').removeData('taskId'); // Clear backup task ID
        });

        // Replace modal close
        $('#replaceDocumentModal').on('hidden.bs.modal', function() {
            $('#replaceDocumentFile').val('');
        });
    }

    // Upload documents
    function uploadDocuments() {
        console.log('uploadDocuments called, currentDocumentTaskId:', currentDocumentTaskId);
        
        const fileInput = $('#documentFile')[0];
        const files = fileInput.files;
        
        if (files.length === 0) {
            showTodoAlert('Please select files to upload', 'warning');
            return;
        }

        // Validate TaskId before proceeding - use backup if main is reset
        let taskIdToUse = currentDocumentTaskId;
        if (!taskIdToUse || taskIdToUse <= 0) {
            // Try to get from modal data attribute as backup
            taskIdToUse = $('#documentModal').data('taskId');
            console.log('Using backup task ID from modal data:', taskIdToUse);
        }
        
        if (!taskIdToUse || taskIdToUse <= 0) {
            console.error('Invalid currentDocumentTaskId:', currentDocumentTaskId);
            console.error('Backup task ID:', $('#documentModal').data('taskId'));
            console.error('File input:', fileInput);
            console.error('Files:', files);
            showTodoAlert('Invalid task ID. Please close the modal and try again.', 'danger');
            return;
        }

        // Check if adding these files would exceed the 5 document limit
        const currentDocCount = $('#documentsContainer .d-flex').length;
        if (currentDocCount + files.length > 5) {
            showTodoAlert('Maximum 5 documents allowed per task', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('TaskId', taskIdToUse);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('Files', files[i]);
        }

        // Show loading state
        const uploadBtn = $('#uploadBtn');
        const originalHtml = uploadBtn.html();
        uploadBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Uploading...');

        // Store the task ID in a local variable to prevent it from being reset
        const taskIdForUpload = taskIdToUse;
        console.log('Starting upload for task ID:', taskIdForUpload);
        
        $.ajax({
            url: '/Todo/UploadDocuments',
            type: 'POST',
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log('Upload response:', response);
                if (response.success) {
                    showTodoAlert('Documents uploaded successfully', 'success');
                    // Use the stored task ID instead of currentDocumentTaskId
                    loadDocumentsForTask(taskIdForUpload);
                    loadAllTodos(); // Refresh task list to update document count
                    $('#documentFile').val('');
                    // Do NOT close the modal - let user close it manually
                } else {
                    showTodoAlert(response.message || 'Error uploading documents', 'danger');
                }
            },
            error: function(xhr, status, error) {
                console.error('Upload error:', xhr, status, error);
                showTodoAlert('Error uploading documents: ' + error, 'danger');
            },
            complete: function() {
                uploadBtn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    // Replace document file
    function replaceDocumentFile() {
        const fileInput = $('#replaceDocumentFile')[0];
        const file = fileInput.files[0];
        
        if (!file) {
            showTodoAlert('Please select a file to replace', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('documentId', currentReplaceDocumentId);
        formData.append('newFile', file);

        // Show loading state
        const replaceBtn = $('#replaceDocumentModal .btn-primary');
        const originalHtml = replaceBtn.html();
        replaceBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Replacing...');

        $.ajax({
            url: '/Todo/ReplaceDocument',
            type: 'POST',
            headers: {
                RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val(),
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showTodoAlert('Document replaced successfully', 'success');
                    loadDocumentsForTask(currentDocumentTaskId);
                    loadAllTodos(); // Refresh task list to update document count
                    $('#replaceDocumentModal').modal('hide');
                    $('#replaceDocumentFile').val('');
                } else {
                    showTodoAlert(response.message || 'Error replacing document', 'danger');
                }
            },
            error: function() {
                showTodoAlert('Error replacing document', 'danger');
            },
            complete: function() {
                replaceBtn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Note: escapeHtml function is already defined above in the file

    // Document event handlers are initialized in the main DOM ready function above

})();