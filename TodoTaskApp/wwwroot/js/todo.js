// Complete todo.js with Fixed UI and Assignment Display Logic
(function () {
    // Scoped variables
    let currentTodoFilter = { status: null, priority: null, searchTerm: null };
    let editingTodoTaskId = 0;
    let todoTasks = [];
    let allUsers = []; // Store users for assignment
    let currentDocumentTaskId = 0;
    let currentReplaceDocumentId = 0;
    let currentReplaceDocumentName = "";

    // Initialize when DOM is ready
    $(document).ready(function () {
        console.log('TodoApp: Initializing...');
        initializeTodoPage();
        loadAllTodos();
        loadUsersForAssignment(); // Load users for assignment dropdown
        setupTodoEventHandlers();
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
        console.log('TodoApp: Loading users for assignment...');
        $("#assignmentLoading").removeClass("d-none");
        $("#userAssignmentList").html('<div class="text-center py-2 text-muted"><i class="bi bi-hourglass-split"></i> Loading users...</div>');

        $.ajax({
            url: "/Todo/GetUsersForAssignment",
            type: "GET",
            cache: false,
        })
            .done((response) => {
                console.log('TodoApp: GetUsersForAssignment response:', response);
                allUsers = response.success ? response.data || [] : [];
                console.log('TodoApp: Loaded users:', allUsers);
                populateUserAssignmentList();
            })
            .fail((xhr, status, error) => {
                console.error('TodoApp: Error loading users for assignment:', error);
                showTodoAlert("Error loading users for assignment", "warning");
                allUsers = [];
                $("#userAssignmentList").html('<div class="text-center py-2 text-danger"><i class="bi bi-exclamation-triangle"></i> Error loading users</div>');
            })
            .always(() => {
                $("#assignmentLoading").addClass("d-none");
            });
    }

    // Populate user assignment list
    function populateUserAssignmentList(selectedUserIds = []) {
        console.log('TodoApp: Populating user assignment list with users:', allUsers, 'selected:', selectedUserIds);
        const container = $("#userAssignmentList");
        container.empty();

        if (!allUsers.length) {
            container.html('<div class="text-center py-2 text-muted"><i class="bi bi-person-x"></i> No other users available for assignment.</div>');
            return;
        }

        allUsers.forEach(user => {
            const isSelected = selectedUserIds.includes(user.Id);

            const itemHtml = `
                <div class="user-assignment-item d-flex align-items-center p-2">
                    <input type="checkbox" class="assignment-checkbox form-check-input me-2" 
                           value="${user.Id}" 
                           data-username="${escapeHtml(user.Username)}"
                           ${isSelected ? 'checked' : ''} />
                    <label class="form-check-label mb-0">${escapeHtml(user.Username)}</label>
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
                <div class="list-group-item current-assignment-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi bi-person me-2 text-primary"></i>
                            <span>${escapeHtml(assignment.AssignedUserName)}</span>
                        </div>
                        <small class="text-muted">
                            Assigned by ${escapeHtml(assignment.AssignedByUserName)}
                            <br>
                            <small>${new Date(assignment.AssignedDate).toLocaleDateString()}</small>
                        </small>
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
                currentTodoFilter = { status: null, priority: null, searchTerm: null };
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
                $("#taskModalLabel").html('<i class="bi bi-plus-circle me-2"></i>Add New Task');
                $("#saveTaskBtn").html('<i class="bi bi-check-circle me-1"></i>Save Task');

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

        // Quick add
        $(document)
            .off("click", "#quickAddBtn")
            .on("click", "#quickAddBtn", function () {
                const title = $("#quickAddInput").val().trim();
                if (!title) {
                    showTodoAlert("Enter a title", "warning");
                    return;
                }
                quickAddTodoTask(title);
            });

        // Status filter
        $(".status-btn")
            .off("click")
            .on("click", function () {
                const statusValue = $(this).data("status");
                const wasActive = $(this).hasClass("active");

                $(".status-btn").removeClass("active");
                currentTodoFilter.status = wasActive ? null : statusValue;
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
                if (!wasActive) $(this).addClass("active");

                displayFilteredTasks();
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
            $("#taskModalLabel").html('<i class="bi bi-pencil me-2"></i>Edit Task');
            $("#saveTaskBtn").html('<i class="bi bi-arrow-up-circle me-1"></i>Update Task');

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
        btn.prop("disabled", true).html('<i class="bi bi-hourglass-split me-1"></i>Saving...');

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

        renderTaskTable(list);
    }

    // Render task table with FIXED assignment display logic
    function renderTaskTable(tasks) {
        const tbody = $("#tasksBody").empty();
        tbody.append(createQuickAddRow());

        if (!tasks.length) {
            tbody.append(`
                <tr class="text-center">
                    <td colspan="7" class="py-4 text-muted">No tasks found.</td>
                </tr>
            `);
        } else {
            tasks.forEach((t) => tbody.append(createTodoTaskRow(t)));
        }
        updateTodoTaskCount(tasks.length);
    }

    // Quick add row HTML
    function createQuickAddRow() {
        return `
            <tr class="table-light">
                <td colspan="2">
                    <div class="input-group">
                        <input type="text" id="quickAddInput" class="form-control" 
                               placeholder="Quick add task (press Enter or click +)" 
                               maxlength="100" 
                               onkeypress="if(event.key==='Enter') quickAddTodoTask();" />
                        <button class="btn btn-outline-primary" type="button" id="quickAddBtn">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `;
    }

    // FIXED: Single task row HTML with correct assignment display logic
    function createTodoTaskRow(t) {
        const isCompleted = t.Status === "Completed";
        const txtClass = isCompleted ? "text-decoration-line-through text-muted" : "";

        // Document count display
        const docCount = t.DocumentCount || 0;
        const docIcon = docCount > 0
            ? `<button class="btn btn-link btn-sm p-0 text-primary" onclick="openDocumentModal(${t.Id})" title="View Documents">
                 <i class="bi bi-paperclip"></i> ${docCount}
               </button>`
            : `<span class="text-muted"><i class="bi bi-paperclip"></i> 0</span>`;

        // FIXED ASSIGNMENT LOGIC:
        // - IsSharedTask = true when task has assignments to other users
        // - IsAssigned = true when current user is assigned to someone else's task (not owner)

        // Assignment badge - show "Shared" if task is shared with others
        let assignmentBadge = "";
        if (t.IsSharedTask) {
            assignmentBadge = `<span class="badge bg-info text-white badge-sm me-1" title="Shared with other users"><i class="bi bi-people-fill"></i> Shared</span>`;
        }

        // Owner indicator - show if current user is assigned to someone else's task
        let ownerIndicator = "";
        if (t.IsAssigned) {
            ownerIndicator = `<br><small class="text-muted">Created by ${escapeHtml(t.CreatedByUsername)}</small>`;
        }

        return `
            <tr class="task-row">
                <td class="${txtClass}">
                    <div class="form-check">
                        <input class="form-check-input task-checkbox" type="checkbox" 
                               data-task-id="${t.Id}" ${isCompleted ? "checked" : ""} />
                    </div>
                </td>
                <td class="${txtClass}">
                    ${assignmentBadge}<strong>${escapeHtml(t.Title)}</strong>
                    ${ownerIndicator}
                    ${t.Description ? `<br><small class="text-muted">${escapeHtml(t.Description)}</small>` : ""}
                </td>
                <td>
                    <span class="badge ${getBadgeClass(t.Priority, "priority")}">${t.Priority}</span>
                </td>
                <td>
                    <span class="badge ${getBadgeClass(t.Status, "status")}">${t.Status}</span>
                </td>
                <td class="${txtClass}">${formatTodoDate(t.DueDate)}</td>
                <td>${docIcon}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="editTodoTask(${t.Id})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteTodoTask(${t.Id})" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Quick add new task
    function quickAddTodoTask(title) {
        const task = {
            Id: 0,
            Title: title,
            Description: "",
            Priority: "Normal",
            Status: "Pending",
            DueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            AssignedUserIds: [] // No assignments for quick add
        };

        createTodoTask(task, (success) => {
            if (success) {
                $("#quickAddInput").val("");
                loadAllTodos();
            }
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
        if (!confirm("Delete this task?")) return;
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
            .fail(() => showTodoAlert("Error deleting", "danger"));
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
        let html = "Please fix errors:<br>";
        errs.forEach((e) => (html += "• " + e + "<br>"));
        $("#taskAlert")
            .removeClass("d-none alert-info")
            .addClass("alert-danger")
            .html(html);
    }

    function showTodoAlert(msg, type) {
        const id = "alert-" + Date.now();
        const el = $(`
            <div id="${id}" class="alert alert-${type} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
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

    // Quick add new task (exposed globally)
    window.quickAddTodoTask = function () {
        const input = $("#quickAddInput");
        const title = (input.val() || "").trim();
        if (!title) {
            showTodoAlert("Enter a title", "warning");
            input.focus();
            return;
        }
        if (title.length > 100) {
            showTodoAlert("Max 100 chars", "warning");
            return;
        }
        if (!/^[a-zA-Z0-9\s]*$/.test(title)) {
            showTodoAlert("No special chars", "warning");
            return;
        }

        quickAddTodoTask(title);
    };

    // Expose refresh
    window.refreshTodos = () => {
        loadAllTodos();
    };

})();