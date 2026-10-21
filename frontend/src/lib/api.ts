const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:3005');

export interface Project {
  id: string;
  name: string;
  path: string;
  description?: string;
  stack?: string;      // JSON string: string[]
  tags?: string;       // JSON string: string[]
  deployTargets?: string; // JSON string: Record<string,string>
  agentConfig?: string;   // JSON string: Record<string,string>
  createdAt: string;
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
};
