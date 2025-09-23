// Todo Filters Module - Filtering and search functionality
(function() {
    'use strict';

    // Module variables
    let currentTodoFilter = { 
        status: null, 
        priority: null, 
        searchTerm: null, 
        dateFilter: null,
        dateRange: { startDate: null, endDate: null, includeCompleted: false }
    };

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Filters = window.TodoApp.Filters || {};

    // Initialize filters module
    window.TodoApp.Filters.initialize = function() {
        setupFilterEventHandlers();
    };

    // Setup filter event handlers
    function setupFilterEventHandlers() {
        // Search box - filter as user types
        $("#searchInput")
            .off("keyup")
            .on("keyup", window.TodoApp.Utils.debounce(function() {
                let val = $(this).val();
                if (typeof val !== "string") val = "";
                currentTodoFilter.searchTerm = val.trim() || null;
                displayFilteredTasks();
            }, 300));

        // Status filter buttons (Pending, Hold, Completed)
        $(".status-btn")
            .off("click")
            .on("click", function() {
                const statusValue = $(this).data("status");
                const wasActive = $(this).hasClass("active");

                $(".status-btn").removeClass("active");
                currentTodoFilter.status = wasActive ? null : statusValue;
                // Clear date range when status filter is applied
                currentTodoFilter.dateRange = { startDate: null, endDate: null, includeCompleted: false };
                if (!wasActive) $(this).addClass("active");

                displayFilteredTasks();
            });

        // Priority filter buttons (High, Normal, Low)
        $(".priority-btn")
            .off("click")
            .on("click", function() {
                const priorityValue = $(this).data("priority");
                const wasActive = $(this).hasClass("active");

                $(".priority-btn").removeClass("active");
                currentTodoFilter.priority = wasActive ? null : priorityValue;
                // Clear date range when priority filter is applied
                currentTodoFilter.dateRange = { startDate: null, endDate: null, includeCompleted: false };
                if (!wasActive) $(this).addClass("active");

                displayFilteredTasks();
            });

        // Date filter buttons (upcoming, today, calendar)
        $(".filter-btn")
            .off("click")
            .on("click", function() {
                const filterValue = $(this).data("filter");
                const wasActive = $(this).hasClass("active");

                if (filterValue === 'calendar') {
                    // Show date range picker
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
    }

    // Display filtered tasks
    function displayFilteredTasks(tasks = null) {
        const allTasks = tasks || (window.TodoApp.Core ? window.TodoApp.Core.getTasks() : []);
        let list = allTasks.slice();

        // Text search
        if (currentTodoFilter.searchTerm) {
            const term = currentTodoFilter.searchTerm.toLowerCase();
            list = list.filter(
                (t) =>
                    (t.Title || "").toLowerCase().includes(term) ||
                    (t.Description || "").toLowerCase().includes(term)
            );
        }
        
        // Status filter
        if (currentTodoFilter.status) {
            list = list.filter((t) => t.Status === currentTodoFilter.status);
        }
        
        // Priority filter
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

    // Render task table
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

    // Create quick add row
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

    // Create single task row HTML
    function createTodoTaskRow(task) {
        const isCompleted = task.Status === "Completed";
        const txtClass = isCompleted ? "text-decoration-line-through text-muted" : "";

        // Document count display - make it clickable
        const docCount = task.DocumentCount || 0;
        const docIcon = docCount > 0
            ? `<span class="badge bg-info" style="cursor: pointer;" onclick="openDocumentModal(${task.Id})" title="Click to manage documents"><i class="fas fa-file"></i> ${docCount}</span>`
            : `<span class="text-muted" style="cursor: pointer;" onclick="openDocumentModal(${task.Id})" title="Click to manage documents"><i class="fas fa-file"></i> 0</span>`;

        // Assignment badge - show "Shared" if task is shared with others
        let assignmentBadge = "";
        if (task.IsSharedTask) {
            assignmentBadge = `<span class="badge bg-warning text-dark ms-1">Shared</span>`;
        }

        // Owner indicator - show if current user is assigned to someone else's task
        let ownerIndicator = "";
        if (task.IsAssigned) {
            ownerIndicator = `<br><small class="text-muted"> 
                Assign by ${window.TodoApp.Utils.escapeHtml(task.CreatedByUsername)}</small>`;
        }

        return `
            <tr class="task-row" data-task-id="${task.Id}">
                <td class="text-center align-middle">
                    <div class="form-check d-flex justify-content-center">
                        <input class="form-check-input task-checkbox" type="checkbox" 
                               data-task-id="${task.Id}" ${isCompleted ? 'checked' : ''}>
                    </div>
                </td>
                <td class="align-middle">
                    ${assignmentBadge}
                    <strong class="${txtClass}">${window.TodoApp.Utils.escapeHtml(task.Title)}</strong>
                    ${ownerIndicator}
                    ${task.Description ? `<br><small class="text-muted ${txtClass}">${window.TodoApp.Utils.escapeHtml(task.Description)}</small>` : ""}
                </td>
                <td class="text-center align-middle">
                    <span class="badge ${window.TodoApp.Utils.getBadgeClass(task.Priority, 'priority')}">${task.Priority}</span>
                </td>
                <td class="text-center align-middle">
                    <span class="badge ${window.TodoApp.Utils.getBadgeClass(task.Status, 'status')}">${task.Status}</span>
                </td>
                <td class="text-center align-middle">
                    <small>${window.TodoApp.Utils.formatDate(task.DueDate)}</small>
                </td>
                <td class="text-center align-middle">
                    ${docIcon}
                </td>
                <td class="text-center align-middle">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="editTodoTask(${task.Id})" 
                                title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteTodoTask(${task.Id})" 
                                title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

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

    // Clear all filters
    window.TodoApp.Filters.clearFilters = function() {
        currentTodoFilter = { 
            status: null, 
            priority: null, 
            searchTerm: null, 
            dateFilter: null,
            dateRange: { startDate: null, endDate: null, includeCompleted: false }
        };
        $(".status-btn, .priority-btn, .filter-btn").removeClass("active");
        $("#searchInput").val("");
    };

    // Update task count display
    function updateTodoTaskCount(count) {
        $("#taskCount").text(`${count} task${count !== 1 ? "s" : ""}`);
    }

    // Expose functions for external use
    window.TodoApp.Filters.displayFilteredTasks = displayFilteredTasks;
    window.TodoApp.Filters.renderTaskTable = renderTaskTable;
    window.TodoApp.Filters.createTodoTaskRow = createTodoTaskRow;

})();
