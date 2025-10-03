/**
 * Dashboard Task Lists Module
 * Task list population functionality
 */
(function() {
    'use strict';

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Dashboard = window.TodoApp.Dashboard || {};
    window.TodoApp.Dashboard.TaskLists = window.TodoApp.Dashboard.TaskLists || {};

    /**
     * Populate task lists (Recent, Assigned, and Upcoming)
     * @param {Object} data - Dashboard data object
     */
    window.TodoApp.Dashboard.TaskLists.populateTaskLists = function(data) {
        populateRecentTasks(data.RecentTasks || []);
        populateAssignedTasks(data.AssignedTasks || []);
        populateUpcomingTasks(data.UpcomingTasksList || []);
        
        // Update task counts in sidebar headers
        updateTaskCounts(data);
    };

    /**
     * Update task counts in sidebar headers
     * @param {Object} data - Dashboard data object
     */
    function updateTaskCounts(data) {
        const recentCount = (data.RecentTasks || []).length;
        const assignedCount = (data.AssignedTasks || []).length;
        const upcomingCount = (data.UpcomingTasksList || []).length;
        
        
        // Count badges removed from sidebar
        // $('#recentTasksCount').text(recentCount);
        // $('#assignedTasksCount').text(assignedCount);
        // $('#upcomingTasksCount').text(upcomingCount);
    }

    /**
     * Populate recent tasks - Show title and due date side by side
     * @param {Array} tasks - Array of recent tasks
     */
    function populateRecentTasks(tasks) {
        
        const container = document.getElementById('recentTasksList');
        
        if (!container) {
            return;
        }
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-3"><small>No recent tasks</small></div>';
            return;
        }

        const html = tasks.map(task => {
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded task-item" data-task-id="${task.Id}">
                    <div class="fw-medium small">${window.TodoApp.Utils.escapeHtml(task.Title)}</div>
                    <small class="text-muted">${window.TodoApp.Utils.formatDashboardDate(task.DueDate)}</small>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    /**
     * Populate assigned tasks - Show title and who assigned it
     * @param {Array} tasks - Array of assigned tasks
     */
    function populateAssignedTasks(tasks) {
        
        const container = document.getElementById('assignedTasksList');
        
        if (!container) {
            return;
        }
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-3"><small>No tasks assigned to you</small></div>';
            return;
        }

        const html = tasks.map(task => {
            const assignedBy = task.AssignedByUsername ? `By ${window.TodoApp.Utils.escapeHtml(task.AssignedByUsername)}` : 'By Unknown';
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded task-item" data-task-id="${task.Id}">
                    <div class="fw-medium small">${window.TodoApp.Utils.escapeHtml(task.Title)}</div>
                    <div class="text-muted small">${assignedBy}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    /**
     * Populate upcoming tasks - Show title and due date side by side
     * @param {Array} tasks - Array of upcoming tasks
     */
    function populateUpcomingTasks(tasks) {
        
        const container = document.getElementById('upcomingTasksList');
        
        if (!container) {
            return;
        }
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-3"><small>No upcoming tasks</small></div>';
            return;
        }

        const html = tasks.map(task => {
            const creatorInfo = task.CreatedByUsername ? `by ${window.TodoApp.Utils.escapeHtml(task.CreatedByUsername)}` : '';
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded task-item" data-task-id="${task.Id}">
                    <div class="fw-medium small">${window.TodoApp.Utils.escapeHtml(task.Title)}</div>
                    <div class="text-end">
                        <small class="text-muted d-block">${window.TodoApp.Utils.formatDashboardDate(task.DueDate)}</small>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    }

    // Expose individual functions for external use
    window.TodoApp.Dashboard.TaskLists.populateRecentTasks = populateRecentTasks;
    window.TodoApp.Dashboard.TaskLists.populateAssignedTasks = populateAssignedTasks;
    window.TodoApp.Dashboard.TaskLists.populateUpcomingTasks = populateUpcomingTasks;
    window.TodoApp.Dashboard.TaskLists.updateTaskCounts = updateTaskCounts;

})();
