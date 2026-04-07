import { useEffect, useRef } from "react";
import api from "../api/axios";

const PRIORITY_LABELS = {
    0: "🔴 P0 — Do Now",
    1: "🟠 P1 — Do Today",
    2: "🔵 P2 — This Week",
    3: "🟡 P3 — Weekend",
  };
  
  /**
   * Strips incorrect 'Z' suffix from MSSQL dates.
   * Sequelize labels IST time as UTC — remove Z to parse as local (IST) time.
   */
  const parseTaskDate = (rawDate) => {
    if (!rawDate) return new Date(NaN);
    const cleaned = typeof rawDate === "string" ? rawDate.replace("Z", "") : rawDate;
    return new Date(cleaned);
  };
  
  /**
   * useNotification
   * - Accepts `todos` for initial render check (instant feedback on load)
   * - Also self-fetches tasks from API every 60s independently
   * - Keeps running as long as user is logged in (interval never resets on re-render)
   * - Updates bell icon by dispatching a custom event with overdue task ids
   */
  export const useNotification = (todos, onOverdueUpdate) => {
    const notifiedIds  = useRef(new Set());
    const intervalRef  = useRef(null);
  
    // Request browser push permission once on mount
    useEffect(() => {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }, []);
  
    // ── Run once on mount with existing todos (instant check) ──
    useEffect(() => {
      if (!todos || todos.length === 0) return;
      checkAndNotify(todos, notifiedIds, onOverdueUpdate);
    }, [todos]); // eslint-disable-line
  
    // ── Persistent interval — self-fetches every 60s, tied to session ──
    useEffect(() => {
      // Clear any existing interval first
      if (intervalRef.current) clearInterval(intervalRef.current);
  
      intervalRef.current = setInterval(async () => {
        try {
          const { data } = await api.get("/tasks", { params: { done: false } });
          checkAndNotify(data, notifiedIds, onOverdueUpdate);
        } catch (err) {
          console.warn("useNotification: failed to fetch tasks", err);
        }
      }, 60 * 1000); // every 60 seconds
  
      // Cleanup only on unmount (user logged out / page closed)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, []); // ← empty deps = starts once on login, never resets
  };
  
  // ── Shared check logic ──
  function checkAndNotify(tasks, notifiedIds, onOverdueUpdate) {
    const now          = new Date();
    const overdueList  = [];
  
    tasks.forEach((todo) => {
      if (todo.done || todo.is_draft) return;
  
      const createdAt = parseTaskDate(todo.created_at);
      const diffHrs   = (now - createdAt) / (1000 * 60 * 60);
  
      if (diffHrs >= 1) {
        overdueList.push(todo);
  
        // Only push browser notification once per session per task
        if (!notifiedIds.current.has(todo.id)) {
          const priorityLabel = PRIORITY_LABELS[todo.priority] ?? `P${todo.priority}`;
  
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("⏰ Task Reminder", {
              body: `"${todo.title}" is pending for over 1 hour! ${priorityLabel}`,
              icon: "/favicon.ico",
            });
          }
  
          notifiedIds.current.add(todo.id);
        }
      }
    });
  
    // ✅ Update bell icon badge in Dashboard via callback
    if (typeof onOverdueUpdate === "function") {
      onOverdueUpdate(overdueList);
    }
  }