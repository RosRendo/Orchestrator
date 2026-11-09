const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:3005');

export interface Project {
  id: string;
  name: string;
  slug?: string;
  path: string;
  folderPath?: string;
  description?: string;
  status?: string; // ACTIVE, EXPERIMENT, PAUSED, ARCHIVED, IDEA
  isPrimary?: boolean;
  progress?: number;
  image?: string;
  mobileImage?: string;
  currentMilestone?: string;
  overview?: string;
  stack?: string;      // JSON string: string[]
  techStack?: string;  // JSON string
  architecture?: string;
  databaseDesign?: string;
  flowExplainer?: string;
  repoUrl?: string;
  liveUrl?: string;
  tags?: string;       // JSON string: string[]
  deployTargets?: string; // JSON string: Record<string,string>
  agentConfig?: string;   // JSON string: Record<string,string>
  runScript?: string;
  port?: number;
  health?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: string; // TODO, DONE
  bucket: string; // NOW, NEXT, LATER
  priority: string; // HIGH, MEDIUM, LOW
  dueDate?: string;
  order: number;
  project?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Blocker {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  resolved: boolean;
  project?: { id: string; name: string };
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  convertedToProjectId?: string;
  tags?: string;
  project?: { id: string; name: string };
  createdAt: string;
}

export interface PlaybookEntry {
  id: string;
  projectId?: string;
  type: string; // DECISION, PATTERN, LESSON, ANTI_PATTERN
  title: string;
  content: string;
  tags?: string;
  scope: string;
  project?: { id: string; name: string };
  createdAt: string;
}

export interface TodaySummary {
  focusProject?: Project & {
    tasks: Task[];
    blockers: Blocker[];
  };
  nowTasks: Task[];
  nextTasks: Task[];
  laterTasks: Task[];
  blockers: Blocker[];
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    completedTasks: number;
    ideasCount: number;
  };
}

export interface SystemDirResponse {
  currentPath: string;
  parentPath: string | null;
  drives: string[];
  folders: Array<{ name: string; path: string }>;
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

export interface GitFile {
  path: string;
  status: 'untracked' | 'modified' | 'added' | 'deleted' | 'renamed';
  rawCode: string;
}

export interface GitStatus {
  isRepository: boolean;
  files: GitFile[];
}

export interface Session {
  id: string;
  projectId: string;
  agentType: 'hermes' | 'opencode';
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errJson = await response.json();
      errorMsg = errJson.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

// Project API
export const api = {
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  createProject: (name: string, path: string) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, path }),
    }),
  deleteProject: (id: string) =>
    request<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  updateProject: (id: string, data: {
    description?: string;
    stack?: string[];
    tags?: string[];
    deployTargets?: Record<string, string>;
    agentConfig?: Record<string, string>;
  }) => request<Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getProjectHealth: (id: string) =>
    request<{ pathExists: boolean; gitBranch: string; hasPackageJson: boolean; hasPrisma: boolean; hasDockerCompose: boolean }>(`/projects/${id}/health`),
  getSystemDirs: (path?: string) =>
    request<SystemDirResponse>(`/projects/system-dirs${path ? `?path=${encodeURIComponent(path)}` : ''}`),

  // Files API
  getFileTree: (projectId: string) => request<FileNode[]>(`/projects/${projectId}/files`),
  readFile: (projectId: string, path: string) =>
    request<{ content: string }>(`/projects/${projectId}/files/read?path=${encodeURIComponent(path)}`),
  writeFile: (projectId: string, path: string, content: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/files/write`, {
      method: 'POST',
      body: JSON.stringify({ path, content }),
    }),
  createFile: (projectId: string, path: string, isDirectory: boolean) =>
    request<{ success: boolean }>(`/projects/${projectId}/files/create`, {
      method: 'POST',
      body: JSON.stringify({ path, isDirectory }),
    }),
  deleteFile: (projectId: string, path: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    }),
  renameFile: (projectId: string, oldPath: string, newPath: string) =>
    request<{ success: boolean }>(`/projects/${projectId}/files/rename`, {
      method: 'POST',
      body: JSON.stringify({ oldPath, newPath }),
    }),

  // Git API
  getGitStatus: (projectId: string) => request<GitStatus>(`/projects/${projectId}/git/status`),
  getGitDiff: (projectId: string, path: string) =>
    request<{ diff: string }>(`/projects/${projectId}/git/diff?path=${encodeURIComponent(path)}`),
  gitCommit: (projectId: string, message: string) =>
    request<{ success: boolean; output: string }>(`/projects/${projectId}/git/commit`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Session API
  getSessions: (projectId: string) => request<Session[]>(`/sessions?projectId=${projectId}`),
  createSession: (projectId: string, agentType: string, name: string) =>
    request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ projectId, agentType, name }),
    }),
  getMessages: (sessionId: string) => request<Message[]>(`/sessions/${sessionId}/messages`),
  deleteSession: (sessionId: string) =>
    request<{ success: boolean }>(`/sessions/${sessionId}`, { method: 'DELETE' }),

  // ─── RendoOs & AI-Command-Agent Hub APIs ────────────────────────────────────
  getTodaySummary: () => request<TodaySummary>('/projects/today/summary'),
  getTasks: (projectId?: string) =>
    request<Task[]>(`/projects/tasks/all${projectId ? `?projectId=${projectId}` : ''}`),
  createTask: (data: { projectId: string; title: string; bucket?: string; priority?: string; description?: string }) =>
    request<Task>('/projects/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    request<Task>(`/projects/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/projects/tasks/${id}`, { method: 'DELETE' }),

  getIdeas: () => request<Idea[]>('/projects/ideas/all'),
  createIdea: (data: { title: string; description?: string; tags?: string; projectId?: string }) =>
    request<Idea>('/projects/ideas', { method: 'POST', body: JSON.stringify(data) }),
  deleteIdea: (id: string) =>
    request<{ success: boolean }>(`/projects/ideas/${id}`, { method: 'DELETE' }),
  convertIdea: (id: string) =>
    request<Project>(`/projects/ideas/${id}/convert`, { method: 'POST' }),

  getBlockers: () => request<Blocker[]>('/projects/blockers/all'),
  createBlocker: (data: { projectId: string; title: string; description?: string }) =>
    request<Blocker>('/projects/blockers', { method: 'POST', body: JSON.stringify(data) }),
  resolveBlocker: (id: string) =>
    request<Blocker>(`/projects/blockers/${id}/resolve`, { method: 'PATCH' }),

  getPlaybook: (type?: string) =>
    request<PlaybookEntry[]>(`/projects/playbook/all${type ? `?type=${type}` : ''}`),
  createPlaybookEntry: (data: { projectId?: string; type: string; title: string; content: string; tags?: string; scope?: string }) =>
    request<PlaybookEntry>('/projects/playbook', { method: 'POST', body: JSON.stringify(data) }),

  getProjectGaps: (projectId: string) =>
    request<{
      projectId: string;
      projectName: string;
      score: string;
      findings: Array<{
        category: string;
        title: string;
        description: string;
        severity: string;
        autoFixCode?: string;
      }>;
      scannedAt: string;
    }>(`/projects/${projectId}/gaps`),
};
