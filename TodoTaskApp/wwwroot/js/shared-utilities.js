/**
 * Shared Utilities Module
 * Common functions used across multiple modules
 */
(function() {
    'use strict';

    // Expose utilities to global scope
    window.TodoApp = window.TodoApp || {};
    window.TodoApp.Utils = window.TodoApp.Utils || {};

    /**
     * HTML escaping utility
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    window.TodoApp.Utils.escapeHtml = function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * Format date for display
     * @param {string} dateString - Date string to format
     * @returns {string} Formatted date
     */
    window.TodoApp.Utils.formatDate = function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    /**
     * Format date for dashboard display
     * @param {string} dateString - Date string to format
     * @returns {string} Formatted date
     */
    window.TodoApp.Utils.formatDashboardDate = function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    /**
     * Get badge class for priority
     * @param {string} priority - Priority level
     * @returns {string} CSS class
     */
    window.TodoApp.Utils.getPriorityBadgeClass = function(priority) {
        switch (priority) {
            case 'High': return 'bg-danger';
            case 'Normal': return 'bg-secondary';
            case 'Low': return 'bg-info';
            default: return 'bg-secondary';
        }
    };

    /**
     * Get badge class for status
     * @param {string} status - Status value
     * @returns {string} CSS class
     */
    window.TodoApp.Utils.getStatusBadgeClass = function(status) {
        switch (status) {
            case 'Pending': return 'bg-primary';
            case 'Hold': return 'bg-warning text-dark';
            case 'Completed': return 'bg-success';
            default: return 'bg-secondary';
        }
    };

    /**
     * Get badge class for any value type
     * @param {string} val - Value to get badge for
     * @param {string} type - Type of badge (priority/status)
     * @returns {string} CSS class
     */
    window.TodoApp.Utils.getBadgeClass = function(val, type) {
        if (type === "priority") {
            return val === "High" ? "bg-danger" : val === "Low" ? "bg-info" : "bg-secondary";
        } else {
            return val === "Completed" ? "bg-success" : val === "Hold" ? "bg-warning text-dark" : "bg-primary";
        }
    };

    /**
     * Debounce function to limit function calls
     * @param {Function} fn - Function to debounce
     * @param {number} ms - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    window.TodoApp.Utils.debounce = function(fn, ms) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    };

    /**
     * Show alert message
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, danger, warning, info)
     */
    window.TodoApp.Utils.showAlert = function(message, type) {
        const id = "alert-" + Date.now();
        const el = $(`
            <div class="alert alert-${type} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999;" id="${id}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);
        $("body").append(el);
        setTimeout(() => el.alert("close"), 5000);
    };

    /**
     * Setup anti-forgery token for AJAX requests
     */
    window.TodoApp.Utils.setupAntiForgeryToken = function() {
        const token = $('input[name="__RequestVerificationToken"]').val();
        if (token) {
            $.ajaxSetup({
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("RequestVerificationToken", token);
                }
            });
        }
    };

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    window.TodoApp.Utils.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    /**
     * Show loading spinner
     * @param {boolean} show - Whether to show or hide loading
     * @param {string} elementId - ID of loading element (optional)
     */
    window.TodoApp.Utils.showLoading = function(show, elementId = 'loadingSpinner') {
        if (show) {
            $(`#${elementId}`).removeClass("d-none");
        } else {
            $(`#${elementId}`).addClass("d-none");
        }
    };

})();
