// Dashboard Main Module - Main initialization and coordination of all dashboard modules
(function() {
    'use strict';

    // Start dashboard when page loads
    $(document).ready(function() {
        console.log('Document ready, initializing dashboard...');
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
            
            console.log('Response successful, calling populateStatistics...');
            // Fill in the numbers
            window.TodoApp.Dashboard.Statistics.populateStatistics(data);
            
            console.log('Calling createCharts...');
            // Draw the charts
            window.TodoApp.Dashboard.Charts.createCharts(data);
            
            console.log('Calling populateTaskLists...');
            // Show task lists
            window.TodoApp.Dashboard.TaskLists.populateTaskLists(data);
            
            console.log('Calling showDashboard...');
            // Hide loading, show dashboard
            window.TodoApp.Dashboard.Statistics.showDashboard();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            window.TodoApp.Dashboard.Statistics.showError();
        }
    }

    // Expose refresh function globally if needed
    window.refreshDashboard = function() {
        initializeDashboard();
    };

})();
