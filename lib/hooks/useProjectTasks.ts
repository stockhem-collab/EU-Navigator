"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectTask } from "@/lib/types";
import { notifyDataChanged } from "@/lib/hooks/useActivityLog";

// Ad-hoc, per-project to-dos — "what's actually left to do on this, right
// now". Keyed by ProjectBankEntry.id, same localStorage-overlay convention
// as every other hook here.
const STORAGE_KEY = "eu-navigator-project-tasks";

type TasksState = Record<string, ProjectTask[]>;

function read(): TasksState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(state: TasksState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — tasks stay in-memory for this session only.
  }
  notifyDataChanged();
}

export function useProjectTasks() {
  const [state, setState] = useState<TasksState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  const tasksFor = useCallback((projectId: string): ProjectTask[] => state[projectId] ?? [], [state]);

  const addTask = useCallback((projectId: string, text: string, dueDate?: string) => {
    if (!text.trim()) return;
    const task: ProjectTask = {
      id: `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      done: false,
      dueDate,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => {
      const next = { ...prev, [projectId]: [...(prev[projectId] ?? []), task] };
      write(next);
      return next;
    });
  }, []);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        [projectId]: (prev[projectId] ?? []).map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
      };
      write(next);
      return next;
    });
  }, []);

  const removeTask = useCallback((projectId: string, taskId: string) => {
    setState((prev) => {
      const next = { ...prev, [projectId]: (prev[projectId] ?? []).filter((t) => t.id !== taskId) };
      write(next);
      return next;
    });
  }, []);

  // Edits an existing task's text/due date in place — distinct from
  // toggleTask (done state) and addTask (a new task entirely). Ignores an
  // edit that would leave the task with no text, same guard as addTask.
  const editTask = useCallback((projectId: string, taskId: string, text: string, dueDate?: string) => {
    if (!text.trim()) return;
    setState((prev) => {
      const next = {
        ...prev,
        [projectId]: (prev[projectId] ?? []).map((t) => (t.id === taskId ? { ...t, text: text.trim(), dueDate } : t)),
      };
      write(next);
      return next;
    });
  }, []);

  return { hydrated, tasks: state, tasksFor, addTask, toggleTask, editTask, removeTask };
}
