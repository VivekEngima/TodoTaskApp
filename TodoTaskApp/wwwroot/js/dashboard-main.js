// Dashboard Main Module - Main initialization and coordination of all dashboard modules
(function() {
    'use strict';

    // Start dashboard when page loads
    $(document).ready(function() {
        initializeDashboard();
        window.TodoApp.Utils.setupAntiForgeryToken();
    });

    // Dashboard initialization
    async function initializeDashboard() {
        try {
            // Show loading spinner
            window.TodoApp.Dashboard.Statistics.showLoading();
            // Get data from server
            const data = await window.TodoApp.Dashboard.Statistics.loadDashboardStatistics();
            
            // Fill in the numbers
            window.TodoApp.Dashboard.Statistics.populateStatistics(data);
            
            // Draw the charts
            window.TodoApp.Dashboard.Charts.createCharts(data);
            
            // Show task lists
            window.TodoApp.Dashboard.TaskLists.populateTaskLists(data);
            
            // Hide loading, show dashboard
            window.TodoApp.Dashboard.Statistics.showDashboard();
        } catch (error) {
            window.TodoApp.Dashboard.Statistics.showError();
        }
    }

    // Expose refresh function globally if needed
    window.refreshDashboard = function() {
        initializeDashboard();
    };

})();
