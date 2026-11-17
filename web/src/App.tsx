import { useEffect, useState, useRef } from "react";
import type { DragEvent } from "react";
import "./App.css";

const API_URL = "http://localhost:3000";

type User = {
  id: number;
  name: string;
  email: string;
};

type Project = {
  id: number;
  name: string;
  description: string;
  status: string;
};

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: number;
  createdAt: string;
  updatedAt: string;
};

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "TODO", title: "To do" },
  { status: "IN_PROGRESS", title: "In progress" },
  { status: "DONE", title: "Done" },
];

type LoginResponse = {
  accessToken: string;
  user: User;
};

type AuthMode = "login" | "register";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data: unknown = await response.json();

  if (!response.ok) {
    const error = data as { message?: string | string[] };
    const message = Array.isArray(error.message)
      ? error.message.join(", ")
      : error.message;

    throw new Error(message ?? `HTTP ${response.status}`);
  }

  return data as T;
}

function App() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [taskBusy, setTaskBusy] = useState(false);


const selectedProjectRef = useRef(selectedProjectId);

useEffect(() => {
  selectedProjectRef.current = selectedProjectId;
}, [selectedProjectId]);


  function startEditing(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setError("");
  }

async function deleteTask(task: Task) {
  if (!token || taskBusy) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete "${task.title}"?`,
  );

  if (!confirmed) return;

  const projectId = task.projectId;

  setTaskBusy(true);
  setError('');

  try {
    await apiRequest<{ message: string }>(
      `/projects/${projectId}/tasks/${task.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (selectedProjectRef.current === projectId) {
      setTasks((previous) =>
        previous.filter((item) => item.id !== task.id),
      );
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Failed to delete task',
    );
  } finally {
    setTaskBusy(false);
  }
}


  async function saveTask(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !editingTask || taskBusy) return;

    const projectId = editingTask.projectId;
    const taskId = editingTask.id;

    setTaskBusy(true);
    setError("");

    try {
      const updated = await apiRequest<Task>(
        `/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
          }),
        },
      );

      if (selectedProjectRef.current === projectId) {
        setTasks((previous) =>
          previous.map((task) => (task.id === taskId ? updated : task)),
        );
      }

      setEditingTask(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setTaskBusy(false);
    }
  }

  async function moveTask(taskId: number, newStatus: TaskStatus) {
    if (!token || selectedProjectId === null || taskBusy) return;

    const projectId = selectedProjectId;
    const originalTask = tasks.find((task) => task.id === taskId);

    if (!originalTask || originalTask.status === newStatus) return;

    setTaskBusy(true);
    setError("");

    // Optimistic update: move the card immediately.
    setTasks((previous) =>
      previous.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );

    try {
      const updated = await apiRequest<Task>(
        `/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (selectedProjectRef.current === projectId) {
        setTasks((previous) =>
          previous.map((task) => (task.id === taskId ? updated : task)),
        );
      }
    } catch (err) {
      if (selectedProjectRef.current === projectId) {
        // Roll back if the API request fails.
        setTasks((previous) =>
          previous.map((task) => (task.id === taskId ? originalTask : task)),
        );

        setError(err instanceof Error ? err.message : "Failed to move task");
      }
    } finally {
      setTaskBusy(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, status: TaskStatus) {
    event.preventDefault();

    const taskId = Number(event.dataTransfer.getData("text/plain"));

    setDraggedTaskId(null);
    setDragOverStatus(null);

    if (!Number.isSafeInteger(taskId) || taskId <= 0) return;

    void moveTask(taskId, status);
  }

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    async function loadProjects() {
      try {
        const data = await apiRequest<Project[]>("/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setProjects(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Failed to load projects",
          );
        }
      }
    }

    void loadProjects();

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!token || selectedProjectId === null) {
      return;
    }

    const controller = new AbortController();

    async function loadTasks() {
      setTasksLoading(true);
      setTasks([]);
      setError("");

      try {
        const data = await apiRequest<Task[]>(
          `/projects/${selectedProjectId}/tasks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!controller.signal.aborted) {
          setTasks(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load tasks");
        }
      } finally {
        if (!controller.signal.aborted) {
          setTasksLoading(false);
        }
      }
    }

    void loadTasks();

    return () => controller.abort();
  }, [token, selectedProjectId]);

  async function handleAuth(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      }

      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setProjects([]);
      setUser(result.user);
      setToken(result.accessToken);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function createProject(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const project = await apiRequest<Project>("/projects", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      });

      setProjects((previous) => [project, ...previous]);
      setProjectName("");
      setProjectDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  async function createTask(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || selectedProjectId === null) return;

    const projectId = selectedProjectId;

    setTaskSubmitting(true);
    setError("");

    try {
      const task = await apiRequest<Task>(`/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
        }),
      });

      
if (selectedProjectRef.current === projectId) {
  setTasks((previous) => [task, ...previous]);
}

      setTaskTitle("");
      setTaskDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setTaskSubmitting(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setProjects([]);
    setSelectedProjectId(null);
    setTasks([]);
    setTaskTitle("");
    setTaskDescription("");
    setPassword("");
    setError("");
  }

  if (!token || !user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Klyro</h1>
          <p>Clarity. Collaboration. Intelligence.</p>

          <h2>{mode === "login" ? "Welcome back" : "Create an account"}</h2>

          <form onSubmit={(event) => void handleAuth(event)}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={mode === "register" ? 12 : undefined}
                required
              />
            </label>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Log in"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Klyro</h1>
          <p>Welcome, {user.name}</p>
        </div>
        <button type="button" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="dashboard-content">
        <h2>My Projects ({projects.length})</h2>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <form
          className="project-form"
          onSubmit={(event) => void createProject(event)}
        >
          <h3>Create a project</h3>

          <input
            placeholder="Project name"
            aria-label="Project name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            minLength={3}
            maxLength={100}
            required
          />

          <textarea
            placeholder="Project description"
            aria-label="Project description"
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            maxLength={1000}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create project"}
          </button>
        </form>

        <div className="project-grid">
          {projects.map((project) => (
            <button
              type="button"
              className={`project-card project-select ${
                selectedProjectId === project.id ? "selected" : ""
              }`}
              key={project.id}
              
onClick={() => {
  if (selectedProjectId !== project.id) {
    setEditingTask(null);
    setSelectedProjectId(project.id);
  }
}}

            >
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <span className="status">{project.status}</span>
            </button>
          ))}
        </div>

        {selectedProjectId !== null && (
          <section className="kanban-section">
            <div className="kanban-heading">
              <div>
                <h2>Task Board</h2>
                <p>Manage tasks for your selected project.</p>
              </div>
              <span className="task-count">{tasks.length} tasks</span>
            </div>

            <form
              className="task-form"
              onSubmit={(event) => void createTask(event)}
            >
              <h3>Create a task</h3>

              <input
                placeholder="Task title"
                aria-label="Task title"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                minLength={3}
                maxLength={150}
                required
              />

              <textarea
                placeholder="Task description (optional)"
                aria-label="Task description"
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                maxLength={2000}
              />

              <button type="submit" disabled={taskSubmitting || tasksLoading}>
                {taskSubmitting ? "Creating..." : "+ Add Task"}
              </button>
            </form>

            {tasksLoading ? (
              <p>Loading tasks...</p>
            ) : (
              <div className="kanban-board">
                {COLUMNS.map((column) => {
                  const columnTasks = tasks.filter(
                    (task) => task.status === column.status,
                  );

                  return (
                    <div
                      className={`kanban-column ${
                        dragOverStatus === column.status ? "drag-over" : ""
                      }`}
                      key={column.status}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragOverStatus(column.status);
                      }}
                      onDragLeave={(event) => {
                        if (
                          !event.currentTarget.contains(
                            event.relatedTarget as Node,
                          )
                        ) {
                          setDragOverStatus(null);
                        }
                      }}
                      onDrop={(event) => handleDrop(event, column.status)}
                    >
                      <div className="column-header">
                        <h3>{column.title}</h3>
                        <span>{columnTasks.length}</span>
                      </div>

                      <div className="column-tasks">
                        {columnTasks.map((task) => (
                          <article
                            className={`task-card ${
                              draggedTaskId === task.id ? "dragging" : ""
                            }`}
                            key={task.id}
                            draggable={!taskBusy}
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                "text/plain",
                                String(task.id),
                              );
                              event.dataTransfer.effectAllowed = "move";
                              setDraggedTaskId(task.id);
                            }}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverStatus(null);
                            }}
                          >
                            <div className="task-card-header">
                              <h4>{task.title}</h4>

                              <div className="task-actions">
                                <button
                                  type="button"
                                  onClick={() => startEditing(task)}
                                  disabled={taskBusy}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() => void deleteTask(task)}
                                  disabled={taskBusy}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {task.description && <p>{task.description}</p>}

                            <small>Task #{task.id}</small>
                          </article>
                        ))}

                        {columnTasks.length === 0 && (
                          <p className="empty-column">No tasks</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

{editingTask && (
  <div className="modal-backdrop">
    <form
      className="edit-modal"
      onSubmit={(event) => void saveTask(event)}
    >
      <h2>Edit Task</h2>

      <label>
        Title
        <input
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          minLength={3}
          maxLength={150}
          required
        />
      </label>

      <label>
        Description
        <textarea
          value={editDescription}
          onChange={(event) => setEditDescription(event.target.value)}
          maxLength={2000}
        />
      </label>

      <div className="modal-actions">
        <button
          type="button"
          onClick={() => setEditingTask(null)}
          disabled={taskBusy}
        >
          Cancel
        </button>

        <button type="submit" disabled={taskBusy}>
          {taskBusy ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  </div>
)}


        {projects.length === 0 && (
          <p>No projects yet. Create your first one above.</p>
        )}
      </section>
    </main>
  );
}

export default App;
