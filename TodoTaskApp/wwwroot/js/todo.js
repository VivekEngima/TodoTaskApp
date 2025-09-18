// This file handles all Todo-related AJAX operations and UI interactions

(function () {
  // Scoped variables
  let currentTodoFilter = { status: null, priority: null, searchTerm: null };
  let editingTodoTaskId = 0;
  let todoTasks = [];
  let currentDocumentTaskId = 0;
  let currentReplaceDocumentId = 0;
  let currentReplaceDocumentName = "";

  // Initialize when DOM is ready
  $(document).ready(function () {
    initializeTodoPage();
    loadAllTodos();
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

    // Document upload form
    $("#documentUploadForm")
      .off("submit")
      .on("submit", function (e) {
        e.preventDefault();
        uploadDocument();
      });

    // Document modal hidden
    $("#documentModal")
      .off("hidden.bs.modal")
      .on("hidden.bs.modal", function () {
        resetDocumentForm();
      });

    // Replace document form submission
    $("#confirmReplaceBtn")
      .off("click")
      .on("click", function (e) {
        e.preventDefault();
        replaceDocument();
      });

    // Replace document modal hidden
    $("#replaceDocumentModal")
      .off("hidden.bs.modal")
      .on("hidden.bs.modal", function () {
        resetReplaceDocumentForm();
      });

    // Inside setupTodoEventHandlers()
    $("#addTaskBtn")
      .off("click")
      .on("click", function () {
        resetTodoTaskForm();
        $("#taskModalLabel").html(
          '<i class="fas fa-plus-circle"></i> Add New Task'
        );
        $("#saveTaskBtn").html('<i class="fas fa-save"></i> Save Task');
        // Show modal
        new bootstrap.Modal(document.getElementById("taskModal")).show();
      });

    // Export button
    $("#exportBtn")
      .off("click")
      .on("click", function () {
        showTodoAlert("Exporting tasks...", "info");
        window.location.href = "/Todo/ExportTasks";
      });

    // Import button
    $("#importBtn")
      .off("click")
      .on("click", function () {
        $("#importFileInput").click();
      });

    // File input change
    $("#importFileInput")
      .off("change")
      .on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
          showTodoAlert("Please select a CSV file", "warning");
          return;
        }

        importTasks(file);
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
      .on(
        "keyup",
        debounce(function () {
          let val = $(this).val();
          if (typeof val !== "string") val = "";
          currentTodoFilter.searchTerm = val.trim() || null;
          displayFilteredTasks();
        }, 300)
      );
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

        // Toggle this button
        $(".status-btn").removeClass("active");
        currentTodoFilter.status = wasActive ? null : statusValue;
        if (!wasActive) $(this).addClass("active");

        // Re-display tasks with both filters applied
        displayFilteredTasks();
      });

    // Priority filter
    $(".priority-btn")
      .off("click")
      .on("click", function () {
        const priorityValue = $(this).data("priority");
        const wasActive = $(this).hasClass("active");

        // Toggle this button
        $(".priority-btn").removeClass("active");
        currentTodoFilter.priority = wasActive ? null : priorityValue;
        if (!wasActive) $(this).addClass("active");

        // Re-display tasks with both filters applied
        displayFilteredTasks();
      });
    // General filters
    $(".filter-btn")
      .off("click")
      .on("click", function () {
        const type = $(this).data("filter");
        $(".filter-btn").removeClass("active");
        $(this).addClass("active");
        applyGeneralFilter(type);
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

  function quickAddTodoTask(title) {
    const task = {
      Id: 0,
      Title: title,
      Description: "",
      Priority: "Normal",
      Status: "Pending",
      DueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    };
    createTodoTask(task, (success) => {
      if (success) {
        $("#quickAddInput").val("");
        loadAllTodos();
      }
    });
  }

  // Load tasks from server
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

  // Display tasks using filters
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

  // Import tasks function
  function importTasks(file) {
    const formData = new FormData();
    formData.append("file", file);

    const originalText = $("#importBtn").html();
    $("#importBtn")
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin"></i> Importing...');

    $.ajax({
      url: "/Todo/ImportTasks",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      success: function (response) {
        if (response.success) {
          showTodoAlert(response.message, "success");
          loadAllTodos(); // Refresh task list

          // Show errors if any
          if (response.errors && response.errors.length > 0) {
            let errorMsg = "Import completed with errors:\n";
            response.errors.forEach((err) => (errorMsg += "• " + err + "\n"));
            setTimeout(() => alert(errorMsg), 1000);
          }
        } else {
          showTodoAlert(response.message || "Import failed", "danger");
        }
      },
      error: function (xhr, status, error) {
        console.error("Import error:", error);
        showTodoAlert("Error importing file. Please try again.", "danger");
      },
      complete: function () {
        $("#importBtn").prop("disabled", false).html(originalText);
        $("#importFileInput").val(""); // Clear file input
      },
    });
  }

  // Render table
  function renderTaskTable(tasks) {
    const tbody = $("#tasksBody").empty();
    tbody.append(createQuickAddRow());

    if (!tasks.length) {
      tbody.append(`
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <br>No tasks found.
                    </td>
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
        <tr class="bg-light">
            <td colspan="5">
                <input type="text" class="form-control" id="quickAddInput" placeholder="Add new task..." maxlength="100">
            </td>
            <td class="text-center align-middle">
                <button class="btn btn-primary" id="quickAddBtn" title="Add Task">
                    <i class="fas fa-plus"></i>
                </button>
            </td>
        </tr>
    `;
  }

  // Single task row HTML - UPDATED with Documents column
  function createTodoTaskRow(t) {
    const isCompleted = t.Status === "Completed";
    const txtClass = isCompleted
      ? "text-decoration-line-through text-muted"
      : "";

    // Document count display
    const docCount = t.DocumentCount || 0;
    const docIcon =
      docCount > 0
        ? `<span class="badge bg-info document-badge" onclick="openDocumentModal(${
            t.Id
          })" style="cursor: pointer;" 
                     data-bs-toggle="tooltip" title="View ${docCount} document${
            docCount !== 1 ? "s" : ""
          }">
                 <i class="fas fa-file"></i> ${docCount}
               </span>`
        : `<span class="text-muted document-badge" onclick="openDocumentModal(${t.Id})" style="cursor: pointer;" 
                     data-bs-toggle="tooltip" title="Add documents">
                 <i class="fas fa-file-plus"></i> 0
               </span>`;

    return `
            <tr>
                <td>
                    <div class="form-check">
                        <input class="form-check-input task-checkbox" type="checkbox" 
                               data-task-id="${t.Id}" ${
      isCompleted ? "checked" : ""
    }>
                        <label class="form-check-label ${txtClass}">
                            <strong>${escapeHtml(t.Title)}</strong>
                            ${
                              t.Description
                                ? `<br><small class="text-muted">${escapeHtml(
                                    t.Description
                                  )}</small>`
                                : ""
                            }
                        </label>
                    </div>
                </td>
                <td><span class="badge ${getBadgeClass(
                  t.Priority,
                  "priority"
                )}">${t.Priority}</span></td>
                <td><span class="badge ${getBadgeClass(t.Status, "status")}">${
      t.Status
    }</span></td>
                <td>${formatTodoDate(t.DueDate)}</td>
                <td class="text-center">${docIcon}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editTodoTask(${
                          t.Id
                        })" 
                                data-bs-toggle="tooltip" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteTodoTask(${
                          t.Id
                        })" 
                                data-bs-toggle="tooltip" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  }

  // Apply Upcoming/Today/Calendar filters
  function applyGeneralFilter(type) {
    // Reset other filters
    currentTodoFilter = { status: null, priority: null, searchTerm: null };
    $(".status-btn, .priority-btn").removeClass("active");
    $("#searchInput").val("");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = [];

    if (type === "upcoming") {
      filtered = todoTasks.filter((t) => new Date(t.DueDate) > today);
    } else if (type === "today") {
      filtered = todoTasks.filter((t) => {
        const d = new Date(t.DueDate);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    } else if (type === "calendar") {
      // Prompt for start date
      const defaultDate = today.toISOString().slice(0, 10);
      const startInput = prompt("Enter start date (YYYY-MM-DD):", defaultDate);
      if (!startInput) {
        showTodoAlert("Start date is required", "warning");
        return;
      }
      const startDate = new Date(startInput);
      startDate.setHours(0, 0, 0, 0);
      if (isNaN(startDate)) {
        showTodoAlert("Invalid start date", "warning");
        return;
      }

      // Prompt for end date
      const endInput = prompt("Enter end date (YYYY-MM-DD):", defaultDate);
      if (!endInput) {
        showTodoAlert("End date is required", "warning");
        return;
      }
      const endDate = new Date(endInput);
      endDate.setHours(0, 0, 0, 0);
      if (isNaN(endDate)) {
        showTodoAlert("Invalid end date", "warning");
        return;
      }

      // Validate order
      if (startDate > endDate) {
        showTodoAlert("Start date must be on or before End date", "warning");
        return;
      }

      // Filter between the two dates inclusive
      filtered = todoTasks.filter((t) => {
        const d = new Date(t.DueDate);
        d.setHours(0, 0, 0, 0);
        return d >= startDate && d <= endDate;
      });
    }

    showTodoAlert(
      `${type.charAt(0).toUpperCase() + type.slice(1)} filter applied`,
      "info"
    );
    renderTaskTable(filtered);
  }

  function clearGeneralFilters() {
    $(".filter-btn").removeClass("active");
  }

  // Quick add new task
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

    const task = {
      Id: 0,
      Title: title,
      Description: "",
      Priority: "Normal",
      Status: "Pending",
      DueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    };
    createTodoTask(task, (success) => {
      if (success) {
        input.val("");
        loadAllTodos();
      }
    });
  };

  // Edit task
  window.editTodoTask = function (id) {
    editingTodoTaskId = id;
    const t = todoTasks.find((x) => x.Id === id);
    if (t) {
      populateTodoTaskForm(t);
      $("#taskModalLabel").html('<i class="fas fa-edit"></i> Edit Task');
      $("#saveTaskBtn").html('<i class="fas fa-save"></i> Update Task');
      $("#taskModal").modal("show");
    }
  };

  // Save (create/update) task
  function saveTodoTask() {
    const form = $("#taskForm");
    const model = {
      Id: parseInt($("#taskId").val()) || 0,
      Title: $("#taskTitle").val().trim(),
      Description: $("#taskDescription").val().trim(),
      Priority: $("#taskPriority").val(),
      Status: $("#taskStatus").val(),
      DueDate: $("#taskDueDate").val(),
    };
    if (!validateTodoTaskForm(model)) return;

    const url = model.Id > 0 ? "/Todo/UpdateTask" : "/Todo/CreateTask";
    const btn = $("#saveTaskBtn"),
      txt = btn.html();
    btn
      .prop("disabled", true)
      .html('<i class="fas fa-spinner fa-spin"></i> Saving...');
    $.ajax({
      url,
      type: "POST",
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      contentType: "application/json",
      data: JSON.stringify(model),
    })
      .done((res) => {
        if (res.success) {
          $("#taskModal").modal("hide");
          loadAllTodos();
          showTodoAlert(res.message, "success");
        } else showTodoTaskFormErrors(res.errors || [res.message]);
      })
      .fail(() => showTodoAlert("Error saving", "danger"))
      .always(() => btn.prop("disabled", false).html(txt));
  }

  // Delete task
  window.deleteTodoTask = function (id) {
    if (!confirm("Delete this task?")) return;
    $.ajax({
      url: "/Todo/DeleteTask",
      type: "POST",
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
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
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      data: { id, status },
    })
      .done((res) => {
        if (res.success) loadAllTodos();
        else showTodoAlert("Error updating status", "danger");
      })
      .fail(() => showTodoAlert("Error updating status", "danger"));
  };

  // DOCUMENT MANAGEMENT FUNCTIONS - PROPERLY SCOPED

  // Open document modal
  window.openDocumentModal = function (taskId) {
    currentDocumentTaskId = taskId;
    $("#docTaskId").val(taskId);

    const task = todoTasks.find((t) => t.Id === taskId);
    const taskTitle = task ? task.Title : "Task";
    $("#documentModalLabel").text(`Documents - ${taskTitle}`);

    loadDocuments(taskId);
    new bootstrap.Modal(document.getElementById("documentModal")).show();
  };

  // Load documents for a task
  function loadDocuments(taskId) {
    $("#documentsContainer").html(
      '<div class="text-center"><div class="spinner-border spinner-border-sm"></div> Loading...</div>'
    );

    $.ajax({
      url: "/Todo/GetTaskDocuments",
      type: "GET",
      data: { taskId: taskId },
    })
      .done(function (response) {
        if (response.success) {
          displayDocuments(response.data);
        } else {
          $("#documentsContainer").html(
            '<div class="alert alert-danger">Error loading documents</div>'
          );
        }
      })
      .fail(function () {
        $("#documentsContainer").html(
          '<div class="alert alert-danger">Error loading documents</div>'
        );
      });
  }

  // Display documents list - UPDATED with Replace button
  function displayDocuments(documents) {
    const container = $("#documentsContainer");

    if (!documents || documents.length === 0) {
      container.html(
        '<div class="text-muted text-center py-3"><i class="fas fa-file-o fa-2x mb-2"></i><br>No documents uploaded yet</div>'
      );
      return;
    }

    let html = '<div class="list-group">';
    documents.forEach((doc) => {
      html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h6 class="mb-1"><i class="fas fa-file"></i> ${escapeHtml(
                          doc.DocumentName
                        )}</h6>
                        <small class="text-muted">
                            ${doc.FileSizeFormatted} • ${new Date(
        doc.UploadDate
      ).toLocaleDateString()}
                        </small>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <a href="/Todo/DownloadDocument?id=${
                          doc.Id
                        }" class="btn btn-outline-primary" 
                           data-bs-toggle="tooltip" title="Download">
                            <i class="fas fa-download"></i>
                        </a>
                        <button class="btn btn-outline-warning" onclick="openReplaceDocumentModal(${
                          doc.Id
                        }, '${escapeHtml(doc.DocumentName)}')" 
                                data-bs-toggle="tooltip" title="Replace/Change Document">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteDocument(${
                          doc.Id
                        })" 
                                data-bs-toggle="tooltip" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
    });
    html += "</div>";

    container.html(html);

    // Update documents count badge
    $("#documentsCount").text(
      `${documents.length} document${documents.length !== 1 ? "s" : ""}`
    );
  }

  // Upload documents (multiple files support)
  function uploadDocument() {
    const form = $("#documentUploadForm")[0];
    const fileInput = $("#documentFile")[0];

    if (!fileInput.files.length) {
      showTodoAlert("Please select at least one file", "warning");
      return;
    }

    const files = Array.from(fileInput.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const maxFiles = 5;

    // Validate file sizes
    for (let file of files) {
      if (file.size > maxSize) {
        showTodoAlert(`File "${file.name}" exceeds 5MB limit`, "warning");
        return;
      }
    }

    // Check total files limit
    if (files.length > maxFiles) {
      showTodoAlert(
        `Maximum ${maxFiles} files can be uploaded at once`,
        "warning"
      );
      return;
    }

    const uploadBtn = $("#uploadBtn");
    const originalText = uploadBtn.html();
    uploadBtn
      .prop("disabled", true)
      .html(
        '<span class="spinner-border spinner-border-sm"></span> Uploading...'
      );

    // Upload files one by one
    uploadFilesSequentially(files, 0, uploadBtn, originalText);
  }

  // Upload files sequentially to avoid overwhelming the server
  function uploadFilesSequentially(files, index, uploadBtn, originalText) {
    if (index >= files.length) {
      // All files uploaded
      uploadBtn.prop("disabled", false).html(originalText);
      resetDocumentForm();
      loadDocuments(currentDocumentTaskId);
      loadAllTodos(); // Refresh to update document counts
      showTodoAlert(`Successfully uploaded ${files.length} file(s)`, "success");
      return;
    }

    const file = files[index];
    const formData = new FormData();
    formData.append("TaskId", currentDocumentTaskId);
    formData.append("File", file);

    // Update progress
    uploadBtn.html(
      `<span class="spinner-border spinner-border-sm"></span> Uploading ${
        index + 1
      }/${files.length}...`
    );

    $.ajax({
      url: "/Todo/UploadDocument",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
    })
      .done(function (response) {
        if (response.success) {
          // Continue with next file
          uploadFilesSequentially(files, index + 1, uploadBtn, originalText);
        } else {
          showTodoAlert(
            `Error uploading "${file.name}": ${response.message}`,
            "danger"
          );
          uploadBtn.prop("disabled", false).html(originalText);
        }
      })
      .fail(function () {
        showTodoAlert(`Error uploading "${file.name}"`, "danger");
        uploadBtn.prop("disabled", false).html(originalText);
      });
  }

  // Delete document
  window.deleteDocument = function (documentId) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    $.ajax({
      url: "/Todo/DeleteDocument",
      type: "POST",
      data: {
        id: documentId,
        taskId: currentDocumentTaskId,
      },
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
    })
      .done(function (response) {
        if (response.success) {
          showTodoAlert(response.message, "success");
          displayDocuments(response.data);
          loadAllTodos(); // Refresh to update document counts
        } else {
          showTodoAlert(response.message, "danger");
        }
      })
      .fail(function () {
        showTodoAlert("Error deleting document", "danger");
      });
  };

  // Reset document form
  function resetDocumentForm() {
    $("#documentFile").val("");
    $("#docTaskId").val(0);
    currentDocumentTaskId = 0;
  }

  // DOCUMENT REPLACEMENT FUNCTIONS - PROPERLY SCOPED

  // Open replace document modal
  window.openReplaceDocumentModal = function (documentId, documentName) {
    currentReplaceDocumentId = documentId;
    currentReplaceDocumentName = documentName;

    $("#replaceDocumentId").val(documentId);
    $("#currentDocumentName").text(documentName);

    new bootstrap.Modal(document.getElementById("replaceDocumentModal")).show();
  };

  // Replace document function
  function replaceDocument() {
    const form = $("#replaceDocumentForm")[0];
    const fileInput = $("#replaceDocumentFile")[0];

    if (!fileInput.files.length) {
      showTodoAlert("Please select a file to replace with", "warning");
      return;
    }

    const file = fileInput.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      showTodoAlert("File size cannot exceed 5MB", "warning");
      return;
    }

    // Confirm replacement
    if (
      !confirm(
        `Are you sure you want to replace "${currentReplaceDocumentName}" with "${file.name}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.append("documentId", currentReplaceDocumentId);
    formData.append("newFile", file);

    const replaceBtn = $("#confirmReplaceBtn");
    const originalText = replaceBtn.html();
    replaceBtn
      .prop("disabled", true)
      .html(
        '<span class="spinner-border spinner-border-sm"></span> Replacing...'
      );

    $.ajax({
      url: "/Todo/ReplaceDocument",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
    })
      .done(function (response) {
        if (response.success) {
          showTodoAlert(response.message, "success");

          // Close replace modal
          $("#replaceDocumentModal").modal("hide");

          // Update documents list
          displayDocuments(response.data);

          // Refresh main task list to update any counts if needed
          loadAllTodos();
        } else {
          showTodoAlert(response.message, "danger");
        }
      })
      .fail(function () {
        showTodoAlert("Error replacing document", "danger");
      })
      .always(function () {
        replaceBtn.prop("disabled", false).html(originalText);
      });
  }

  // Reset replace document form
  function resetReplaceDocumentForm() {
    $("#replaceDocumentFile").val("");
    $("#replaceDocumentId").val(0);
    $("#currentDocumentName").text("");
    currentReplaceDocumentId = 0;
    currentReplaceDocumentName = "";
  }

  // Populate form for edit
  function populateTodoTaskForm(t) {
    $("#taskId").val(t.Id);
    $("#taskTitle").val(t.Title);
    $("#taskDescription").val(t.Description);
    $("#taskPriority").val(t.Priority);
    $("#taskStatus").val(t.Status);
    $("#taskDueDate").val(t.DueDate.split("T")[0]);
  }

  // Reset form
  function resetTodoTaskForm() {
    $("#taskForm")[0].reset();
    $("#taskId").val(0);
    $(".is-invalid").removeClass("is-invalid");
    $(".invalid-feedback").hide();
    $("#taskAlert").addClass("d-none");
    initializeTodoPage();
  }

  // Create/update via AJAX
  function createTodoTask(task, cb) {
    $.ajax({
      url: "/Todo/CreateTask",
      type: "POST",
      headers: {
        RequestVerificationToken: $(
          'input[name="__RequestVerificationToken"]'
        ).val(),
      },
      contentType: "application/json",
      data: JSON.stringify(task),
    })
      .done((res) => cb(res.success))
      .fail(() => cb(false));
  }

  // Helpers: formatting, badges, validation, alerts, tooltips

  function getBadgeClass(val, type) {
    if (type === "priority") {
      return val === "High"
        ? "bg-danger"
        : val === "Low"
        ? "bg-info"
        : "bg-secondary";
    } else {
      return val === "Completed"
        ? "bg-success"
        : val === "Hold"
        ? "bg-warning text-dark"
        : "bg-primary";
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
    const e = document.createElement("div");
    e.textContent = t;
    return e.innerHTML;
  }

  function validateTodoTaskForm(m) {
    let ok = true;
    // Clear previous validation states
    $(".is-invalid").removeClass("is-invalid");
    $(".invalid-feedback").hide();
    // TITLE VALIDATION
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
      // Find invalid characters (anything not a letter, digit, or space)
      const invalidChars = title.match(/[^a-zA-Z0-9 ]/g);
      if (invalidChars) {
        // Remove duplicates
        const unique = [...new Set(invalidChars)].join(", ");
        $("#taskTitle").addClass("is-invalid");
        $("#titleError")
          .text(
            `Invalid character${invalidChars.length > 1 ? "s" : ""}: ${unique}`
          )
          .show();
        ok = false;
      }
    }
    // DESCRIPTION VALIDATION
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
    // DUE DATE VALIDATION
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

  // Expose refresh
  window.refreshTodos = () => {
    clearGeneralFilters();
    displayFilteredTasks();
  };
})();
