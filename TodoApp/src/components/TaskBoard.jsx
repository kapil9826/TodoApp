import React, { useState, useEffect } from 'react';
import '../App.css';

const TaskBoard = () => {
  const boardColumns = [
    { id: 'backlog', title: 'Backlog', color: '#718096' },
    { id: 'todo', title: 'To-Do', color: '#4299e1' },
    { id: 'inprogress', title: 'In Progress', color: '#ed8936' },
    { id: 'done', title: 'Done', color: '#48bb78' }
  ];

  const [allTasks, setAllTasks] = useState(() => {
    const savedTasks = window.localStorage.getItem('taskItems');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentDraggedTask, setCurrentDraggedTask] = useState(null);

  useEffect(() => {
    window.localStorage.setItem('taskItems', JSON.stringify(allTasks));
  }, [allTasks]);

  const handleAddTask = (title, description) => {
    if (!title) return;
    
    const newTaskItem = {
      id: Date.now().toString(),
      title,
      description,
      status: 'backlog',
      created: new Date().toISOString()
    };
    
    setAllTasks([...allTasks, newTaskItem]);
    setShowTaskForm(false);
  };

  const moveTaskToColumn = (taskId, newStatus) => {
    setAllTasks(allTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const removeTask = (taskId) => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      setAllTasks(allTasks.filter(task => task.id !== taskId));
    }
  };

  const startDragging = (e, task) => {
    setCurrentDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
  };

  const handleDropTask = (e, status) => {
    e.preventDefault();
    if (currentDraggedTask && currentDraggedTask.status !== status) {
      moveTaskToColumn(currentDraggedTask.id, status);
    }
    setCurrentDraggedTask(null);
  };

  return (
    <div className="task-board-app">
      <header className="main-header">
        <div className="header-content">
          <h1>My Task Board</h1>
        </div>
        <button 
          className="add-task-button"
          onClick={() => setShowTaskForm(true)}
        >
          <span>+</span> New Task
        </button>
      </header>

      <div className="board-container">
        {boardColumns.map(col => (
          <div 
            key={col.id}
            className="board-column"
            style={{ borderTop: `4px solid ${col.color}` }}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDropTask(e, col.id)}
          >
            <div className="column-header">
              <h2>{col.title}</h2>
              <span className="task-count">
                {allTasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="tasks-in-column">
              {allTasks
                .filter(task => task.status === col.id)
                .map(task => (
                  <TaskItem 
                    key={task.id}
                    task={task}
                    startDragging={startDragging}
                    removeTask={removeTask}
                  />
                ))}
              
              {allTasks.filter(t => t.status === col.id).length === 0 && (
                <div className="empty-column-state">
                  <p>No tasks here yet</p>
                  {col.id === 'backlog' && (
                    <button onClick={() => setShowTaskForm(true)}>
                      + Create first task
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showTaskForm && (
        <TaskFormModal 
          closeModal={() => setShowTaskForm(false)}
          addNewTask={handleAddTask}
        />
      )}
    </div>
  );
};


const TaskItem = ({ task, startDragging, removeTask }) => {
  const [showFullDesc, setShowFullDesc] = useState(false);
  
  const toggleDesc = () => {
    setShowFullDesc(!showFullDesc);
  };
  

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };
  
  return (
    <div 
      className="task-card-item"
      draggable
      onDragStart={(e) => startDragging(e, task)}
    >
      <div className="task-top-section">
        <h3>{task.title}</h3>
        <button 
          className="delete-task-btn"
          onClick={() => removeTask(task.id)}
          title="Delete task"
        >
          ×
        </button>
      </div>
      
      {task.description && (
        <div className="task-description-container">
          {showFullDesc ? (
            <p>{task.description}</p>
          ) : (
            <p>{task.description.slice(0, 80)}{task.description.length > 80 && '...'}</p>
          )}
          
          {task.description.length > 80 && (
            <button 
              className="toggle-desc-btn"
              onClick={toggleDesc}
            >
              {showFullDesc ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
      
      <div className="task-footer-info">
        <span className="task-date">
          Added: {formatDate(task.created)}
        </span>
        <div className="drag-indicator" title="Drag to move">
          ⠿
        </div>
      </div>
    </div>
  );
};


const TaskFormModal = ({ closeModal, addNewTask }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleSubmitForm = (e) => {
    e.preventDefault();
    
    if (!taskTitle.trim()) {
      setErrorMsg('Task title is required');
      return;
    }
    
    addNewTask(taskTitle, taskDesc);
    setTaskTitle('');
    setTaskDesc('');
    setErrorMsg('');
  };
  
  return (
    <div className="modal-overlay">
      <div className="task-form-modal">
        <div className="modal-header-section">
          <h2>Create New Task</h2>
          <button className="close-modal-btn" onClick={closeModal}>×</button>
        </div>
        
        <form onSubmit={handleSubmitForm}>
          <div className="form-field">
            <label htmlFor="taskTitle">Task Title *</label>
            <input
              id="taskTitle"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title..."
            />
            {errorMsg && <p className="error-msg">{errorMsg}</p>}
          </div>
          
          <div className="form-field">
            <label htmlFor="taskDesc">Description (optional)</label>
            <textarea
              id="taskDesc"
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Add details about this task..."
              rows="4"
            />
          </div>
          
          <div className="form-buttons">
            <button type="button" className="cancel-btn" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="submit-task-btn">
              Add to Board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskBoard;