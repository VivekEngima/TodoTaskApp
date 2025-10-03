/**
 * Todo Main Module
 * Main initialization and coordination of all todo modules
 */
(function () {
  "use strict";

  // Initialize when DOM is ready
  $(document).ready(function () {
    // Setup anti-forgery token
    window.TodoApp.Utils.setupAntiForgeryToken();

    // Initialize all modules
    if (window.TodoApp.Forms) {
      window.TodoApp.Forms.initialize();
    }

    if (window.TodoApp.Assignments) {
      window.TodoApp.Assignments.initialize();
    }

    if (window.TodoApp.Documents) {
      window.TodoApp.Documents.initialize();
    }

    if (window.TodoApp.Comments) {
      window.TodoApp.Comments.initialize();
    }

    if (window.TodoApp.Filters) {
      window.TodoApp.Filters.initialize();
    }

    if (window.TodoApp.Core) {
      window.TodoApp.Core.initialize();
    }
  });
})();
