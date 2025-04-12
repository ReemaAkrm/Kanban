/********************************************************** Variable Declarations **********************************************************/
const body = document.body;
const sidebar = document.getElementById("sidebar");
const main = document.querySelector("main");
const themeSwitch = document.getElementById("theme-switch");
const logo = document.querySelector(".sidebarlogo img");
const taskModal = document.getElementById("taskModal");
const addTaskButton = document.querySelector(".addTaskButton");
const taskForm = document.getElementById("taskForm");

/* Column Modal Elements */
const addColumnButton = document.getElementById("addColumnButton");
const columnModal = document.getElementById("columnModal");
const columnForm = document.getElementById("columnForm");

/* Edit Column Modal Elements */
const editColumnModal = document.getElementById("editColumnModal");
const editColumnForm = document.getElementById("editColumnForm");
const editColumnNameInput = document.getElementById("editColumnName");
const deleteColumnButton = document.getElementById("deleteColumnButton");

/* New Board Modal Elements */
const createBoardButton = document.getElementById("createBoardButton");
const newBoardModal = document.getElementById("newBoardModal");
const newBoardForm = document.getElementById("newBoardForm");

/* Edit Board Modal Elements */
const editBoardModal = document.getElementById("editBoardModal");
const editBoardForm = document.getElementById("editBoardForm");
const editBoardNameInput = document.getElementById("editBoardName");

let currentEditingColumn = null; // Tracks the column being edited
let activeBoard = null; // Tracks the currently active board in the sidebar


/********************************************************** Sidebar & Layout Functions **********************************************************/
function toggleSidebar() {
    sidebar.classList.toggle("show");
    sidebar.classList.toggle("hidden");
    updateGridLayout();
}

function hideSidebar() {
    sidebar.classList.add("hidden");
    updateGridLayout();
}

function updateGridLayout() {
    document.body.style.gridTemplateColumns = sidebar.classList.contains("hidden") ? "0px 1fr" : "300px 1fr";
}

/********************************************************** Theme Functions **********************************************************/
function enableDarkMode() {
    body.classList.add("dark-mode");
    body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
    logo.src = "assets/logo-light.svg";
}

function disableDarkMode() {
    body.classList.add("light-mode");
    body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
    logo.src = "assets/logo-dark.svg";
}

if (themeSwitch) {
    themeSwitch.addEventListener("change", () => {
        themeSwitch.checked ? enableDarkMode() : disableDarkMode();
    });
    localStorage.getItem("theme") === "dark" ? (enableDarkMode(), themeSwitch.checked = true) : disableDarkMode();
}

/********************************************************** Task Modal Functions **********************************************************/
addTaskButton.addEventListener("click", () => { taskModal.style.display = "flex"; });
window.addEventListener("click", (event) => { if (event.target === main) closeTaskModal(); });

function closeTaskModal() { taskModal.style.display = "none"; }

addTaskButton.addEventListener("click", () => {
    taskModal.style.display = "flex";
});

window.addEventListener("click", (event) => {
    if (event.target === main) closeTaskModal();
});

function closeTaskModal() {
    taskModal.style.display = "none";
}

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const task = {
        id: Date.now().toString(), // إنشاء ID فريد لكل مهمة
        title: document.getElementById("taskTitle").value,
        description: document.getElementById("taskDescription").value,
        dueDate: document.getElementById("taskDueDate").value,
        status: document.getElementById("taskStatus").value
    };

    saveTaskToLocalStorage(task);
    addTaskToColumn(task);
    taskForm.reset();
    closeTaskModal();
});

function saveTaskToLocalStorage(task) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(addTaskToColumn);
}

function addTaskToColumn(task) {
    const columnContainer = document.querySelector(`.column[data-status="${task.status}"] .tasks-container`);
    const taskElement = document.createElement("div");
    taskElement.className = "task";
    taskElement.draggable = true;
    taskElement.setAttribute("data-id", task.id); // تعيين ID المهمة
    taskElement.setAttribute('draggable', 'true');
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);
    columnContainer.addEventListener('dragover', handleDragOver);
    columnContainer.addEventListener('drop', handleDrop);

    taskElement.innerHTML = `
        <h2>${task.title}</h2>
        <p>${task.description}</p>
        <p>Due: ${task.dueDate}</p>
    `;

    taskElement.addEventListener("dragstart", handleDragStart);
    taskElement.addEventListener("dragend", handleDragEnd);

    taskElement.addEventListener("click", () => {
        openDeleteModal(taskElement);
    });

    columnContainer.appendChild(taskElement);
    updateTaskCount(task.status);
}

function updateTaskCount(status) {
    const column = document.querySelector(`.column[data-status="${status}"]`);
    const count = column.querySelector(".tasks-container").children.length;
    column.querySelector(".task-count").textContent = count;
}

function openDeleteModal(taskElement) {
    const deleteModal = document.getElementById("deleteTaskModal");
    deleteModal.taskToDelete = taskElement;
    deleteModal.style.display = "block";
}

document.getElementById("confirmDelete").addEventListener("click", () => {
    const deleteModal = document.getElementById("deleteTaskModal");
    const taskElement = deleteModal.taskToDelete;

    if (taskElement) {
        const taskId = taskElement.getAttribute("data-id");
        const status = taskElement.closest(".column").getAttribute("data-status");

        deleteTaskFromStorage(taskId);

        taskElement.remove();
        updateTaskCount(status);

        showSuccessMessage();
    }

    closeDeleteModal();
});

function deleteTaskFromStorage(taskId) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const updatedTasks = tasks.filter(task => task.id !== taskId);

    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
}

function closeDeleteModal() {
    document.getElementById("deleteTaskModal").style.display = "none";
}

function showSuccessMessage() {
    const successModal = document.getElementById("deleteSuccessModal");
    successModal.style.display = "block";

    document.getElementById("closeSuccessModal").addEventListener("click", () => {
        successModal.style.display = "none";
    });
}
/********************************************************** Drag and Drop Functions **********************************************************/
let draggedTask = null;

function handleDragStart(e) {
    draggedTask = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", this.id);
    this.style.opacity = "0.4";
}

function handleDragEnd(e) {
    this.style.opacity = "1";
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
    e.preventDefault();

    if (draggedTask && e.currentTarget !== draggedTask.parentNode) {
        e.currentTarget.querySelector('.tasks-container').appendChild(draggedTask);

        draggedTask.style.opacity = "1";

        updateTaskCountForAll();
    }
}

function updateTaskCountForAll() {
    document.querySelectorAll(".column").forEach(col => {
        const status = col.getAttribute("data-status");
        const count = col.querySelector(".tasks-container").children.length;
        col.querySelector(".task-count").textContent = count;
    });
}

document.querySelectorAll('.task').forEach(task => {
    task.setAttribute('draggable', 'true');
    task.addEventListener('dragstart', handleDragStart);
    task.addEventListener('dragend', handleDragEnd);
});

document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
});

/********************************************************** Column Modal Functions **********************************************************/
addColumnButton.addEventListener("click", () => { columnModal.style.display = "flex"; });

function closeColumnModal() {
    columnModal.style.display = "none";
    columnForm.reset();
}

columnForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const columnName = document.getElementById("columnName").value.trim();
    if (columnName) {
        addColumnToBoard(columnName);
        closeColumnModal();
    }
});

function addColumnToBoard(columnName) {
    const columnId = columnName.toLowerCase().replace(/\s+/g, "-");

    const newColumn = document.createElement("div");
    newColumn.className = "column";
    newColumn.setAttribute("data-status", columnId);

    const header = document.createElement("h2");
    header.className = "column-header";
    header.innerHTML = `${columnName} (<span class="task-count">0</span>)`;

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-container";
    tasksContainer.addEventListener("dragover", handleDragOver);
    tasksContainer.addEventListener("drop", handleDrop);

    newColumn.appendChild(header);
    newColumn.appendChild(tasksContainer);
    newColumn.addEventListener("dblclick", () => openEditColumnModal(newColumn));

    const board = document.querySelector(".board");
    const newColumnBtn = document.querySelector(".new-column");
    board.insertBefore(newColumn, newColumnBtn);

    // saveColumnToLocalStorage(columnName);

    const select = document.getElementById("taskStatus");
    const newOption = document.createElement("option");
    newOption.value = columnId;
    newOption.textContent = columnName;

    select.appendChild(newOption);
}

// function saveColumnToLocalStorage(columnName) {
//     let columns = JSON.parse(localStorage.getItem("columns")) || [];
//     if (!columns.includes(columnName)) {
//         columns.push(columnName);
//         localStorage.setItem("columns", JSON.stringify(columns));
//     }
// }

// function loadColumnsFromLocalStorage() {
//     let columns = JSON.parse(localStorage.getItem("columns")) || [];
//     columns.forEach(addColumnToBoard);
// }


// document.addEventListener("DOMContentLoaded", loadColumnsFromLocalStorage);

/********************************************************** Edit Column Modal Functions **********************************************************/

function openEditColumnModal(column) {
    currentEditingColumn = column;
    const header = column.querySelector(".column-header");
    const currentName = header.innerText.replace(/\s*\(.*/, "");
    editColumnNameInput.value = currentName;
    editColumnModal.style.display = "flex";
}

function closeEditColumnModal() {
    editColumnModal.style.display = "none";
    editColumnForm.reset();
    currentEditingColumn = null;
}

editColumnForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const newName = editColumnNameInput.value.trim();
    if (newName && currentEditingColumn) {
        const header = currentEditingColumn.querySelector(".column-header");
        const taskCount = header.querySelector(".task-count").innerText;
        header.innerHTML = `${newName} (<span class="task-count">${taskCount}</span>)`;
        currentEditingColumn.setAttribute("data-status", newName.toLowerCase().replace(/\s+/g, "-"));

        // Update the column name in localStorage
        updateColumnInLocalStorage(header.innerText.replace(/\s*\(.*/, ""), newName);

        // Update the select option
        updateSelectOption(header.innerText.replace(/\s*\(.*/, ""), newName);
    }
    closeEditColumnModal();
});

function updateColumnInLocalStorage(oldName, newName) {
    let columns = JSON.parse(localStorage.getItem("columns")) || [];
    const index = columns.indexOf(oldName);
    if (index !== -1) {
        columns[index] = newName;
        localStorage.setItem("columns", JSON.stringify(columns));
    }
}

function updateSelectOption(oldName, newName) {
    const select = document.getElementById("taskStatus");
    const options = select.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].textContent === oldName) {
            options[i].textContent = newName;
            options[i].value = newName.toLowerCase().replace(/\s+/g, "-");
            break;
        }
    }
}

deleteColumnButton.addEventListener("click", () => {
    if (currentEditingColumn) {
        // Remove from localStorage
        removeColumnFromLocalStorage(currentEditingColumn.querySelector(".column-header").innerText.replace(/\s*\(.*/, ""));

        // Remove from select options
        removeSelectOption(currentEditingColumn.querySelector(".column-header").innerText.replace(/\s*\(.*/, ""));

        currentEditingColumn.remove();
        closeEditColumnModal();
    }

});

function removeColumnFromLocalStorage(columnName) {
    let columns = JSON.parse(localStorage.getItem("columns")) || [];
    columns = columns.filter(col => col !== columnName);
    localStorage.setItem("columns", JSON.stringify(columns));
}

function removeSelectOption(columnName) {
    const select = document.getElementById("taskStatus");
    const options = select.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].textContent === columnName) {
            select.remove(i);
            break;
        }
    }
}

document.getElementById("closeEditColumnModal").addEventListener("click", () => {
    editColumnModal.style.display = "none";
});

/********************************************************** New Board Modal Functions **********************************************************/
createBoardButton.addEventListener("click", () => {
    newBoardModal.style.display = "flex";
});

function closeNewBoardModal() {
    newBoardModal.style.display = "none";
    newBoardForm.reset();
}

newBoardForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const boardName = document.getElementById("boardName").value.trim();
    if (boardName) {
        addBoardToSidebar(boardName);
        closeNewBoardModal();
    }
});

function addBoardToSidebar(boardName) {
    const sidebarList = document.querySelector(".sidebarlist");
    const sideItemDiv = document.createElement("div");
    sideItemDiv.className = "sideItems";

    const button = document.createElement("button");
    button.classList.add("board-item");
    const img = document.createElement("img");
    img.src = "assets/icon-board.svg";
    img.alt = "board icon";

    button.appendChild(img);
    button.appendChild(document.createTextNode(boardName));
    sideItemDiv.appendChild(button);

    // Insert new board before the "Create New Board" button
    const createNewBoardContainer = createBoardButton.parentElement;
    sidebarList.insertBefore(sideItemDiv, createNewBoardContainer);

    // Attach click event to mark board as active
    button.addEventListener("click", () => {
        setActiveBoard(button);
    });
}
/********************************************************** Board Options Dropdown Functions **********************************************************/
const boardOptionsToggle = document.getElementById("boardOptionsToggle");
const boardOptionsMenu = document.getElementById("boardOptionsMenu");
const editBoardOption = document.getElementById("editBoardOption");
const deleteBoardOption = document.getElementById("deleteBoardOption");

// Toggle dropdown when clicking the ellipsis image
boardOptionsToggle.addEventListener("click", () => {
    boardOptionsMenu.style.display = boardOptionsMenu.style.display === "flex" ? "none" : "flex";
});

document.addEventListener("click", (e) => {
    if (!boardOptionsMenu.contains(e.target) && e.target !== boardOptionsToggle) {
        boardOptionsMenu.style.display = "none";
    }
});

/********************************************************** Active Board Selection **********************************************************/
document.querySelectorAll(".board-item").forEach((button) => {
    button.addEventListener("click", () => {
        setActiveBoard(button);
    });
});

function setActiveBoard(button) {
    // Remove active class from all board items
    document.querySelectorAll(".board-item").forEach((btn) => {
        btn.classList.remove("active");
    });
    // Set active board
    button.classList.add("active");
    activeBoard = button;
}

/********************************************************** Edit Board Modal Functions **********************************************************/
editBoardOption.addEventListener("click", () => {
    if (activeBoard) {
        // Pre-fill modal with current board name (excluding icon)
        let currentName = activeBoard.childNodes[1].textContent.trim();
        editBoardNameInput.value = currentName;
        editBoardModal.style.display = "flex";
        boardOptionsMenu.style.display = "none";
    } else {
        alert("Please select a board to edit.");
    }
});

editBoardForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newName = editBoardNameInput.value.trim();
    if (newName && activeBoard) {
        activeBoard.childNodes[1].textContent = newName;
    }
    closeEditBoardModal();
});

function closeEditBoardModal() {
    editBoardModal.style.display = "none";
    editBoardForm.reset();
}

/********************************************************** Delete Board Option **********************************************************/
deleteBoardOption.addEventListener("click", () => {
    if (activeBoard) {
        if (confirm("Are you sure you want to delete this board?")) {
            activeBoard.parentElement.remove();
            activeBoard = null;
        }
    } else {
        alert("Please select a board to delete.");
    }
    boardOptionsMenu.style.display = "none";
});
