/**
 * Dashboard Charts Module
 * Chart creation and management functionality
 */
(function() {
    'use strict';

    // Module variables
    let monthlyChart = null;
    let priorityChart = null;
    let statusChart = null;

    // Expose to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Dashboard = window.TodoApp.Dashboard || {};
    window.TodoApp.Dashboard.Charts = window.TodoApp.Dashboard.Charts || {};

    /**
     * Create all charts
     * @param {Object} data - Dashboard data object
     */
    window.TodoApp.Dashboard.Charts.createCharts = function(data) {
        createMonthlyChart(data.MonthlyTaskCreation);
        createPriorityChart(data);
        createStatusPieChart(data);
    };

    /**
     * Create monthly task creation line chart (15 days before and after today)
     * @param {Array} monthlyData - Monthly task creation data
     */
    function createMonthlyChart(monthlyData) {
        const ctx = document.getElementById('monthlyChart').getContext('2d');

        // Destroy existing chart if exists
        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.DateLabel),
                datasets: [{
                    label: 'Task Activity',
                    data: monthlyData.map(d => d.TasksCreated),
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0d6efd',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, 
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return context[0].label;
                            },
                            label: function (context) {
                                return `Task Activity: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 1,
                            color: '#6c757d',
                            font: { size: 10 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6c757d',
                            font: { size: 10 },
                            maxRotation: 45
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Create priority distribution donut chart
     * @param {Object} data - Dashboard data object
     */
    function createPriorityChart(data) {
        const ctx = document.getElementById('priorityChart').getContext('2d');

        // Destroy existing chart if exists
        if (priorityChart) {
            priorityChart.destroy();
        }

        priorityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['High', 'Normal', 'Low'],
                datasets: [{
                    data: [data.HighPriorityTasks, data.NormalPriorityTasks, data.LowPriorityTasks],
                    backgroundColor: ['#dc3545', '#6c757d', '#0dcaf0'],
                    borderWidth: 0,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, 
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#0d6efd',
                        borderWidth: 1,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                const percentage = data.TotalTasks > 0 ?
                                    Math.round((context.parsed / data.TotalTasks) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create status distribution pie chart
     * @param {Object} data - Dashboard data object
     */
    function createStatusPieChart(data) {
        const ctx = document.getElementById('statusChart').getContext('2d');

        // Destroy existing chart if exists
        if (statusChart) {
            statusChart.destroy();
        }

        statusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Pending', 'Hold', 'Completed'],
                datasets: [{
                    data: [data.PendingTasks, data.OnHoldTasks, data.CompletedTasks],
                    backgroundColor: [
                        'rgba(13, 110, 253, 0.7)',  // Blue for Pending
                        'rgba(255, 193, 7, 0.7)',   // Yellow for Hold
                        'rgba(25, 135, 84, 0.7)'    // Green for Completed
                    ],
                    borderColor: [
                        '#0d6efd',
                        '#ffc107',
                        '#198754'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 12
                        },
                        padding: 12,
                        caretPadding: 8,
                        callbacks: {
                            title: function (context) {
                                return context[0].label; // Show status name
                            },
                            label: function (context) {
                                const value = context.parsed;
                                const total = data.TotalTasks;
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `Tasks: ${value} (${percentage}%)`;
                            },
                            labelColor: function (context) {
                                return {
                                    borderColor: context.dataset.borderColor[context.dataIndex],
                                    backgroundColor: context.dataset.backgroundColor[context.dataIndex]
                                };
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                }
            }
        });
    }

    /**
     * Destroy all charts
     */
    window.TodoApp.Dashboard.Charts.destroyCharts = function() {
        if (monthlyChart) {
            monthlyChart.destroy();
            monthlyChart = null;
        }
        if (priorityChart) {
            priorityChart.destroy();
            priorityChart = null;
        }
        if (statusChart) {
            statusChart.destroy();
            statusChart = null;
        }
    };

    // Expose individual chart creation functions
    window.TodoApp.Dashboard.Charts.createMonthlyChart = createMonthlyChart;
    window.TodoApp.Dashboard.Charts.createPriorityChart = createPriorityChart;
    window.TodoApp.Dashboard.Charts.createStatusPieChart = createStatusPieChart;

})();
