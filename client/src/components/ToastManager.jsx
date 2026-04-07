import { useEffect, useState } from "react";

const PRIORITY_COLORS = {
  0: "bg-red-600",
  1: "bg-orange-500",
  2: "bg-blue-600",
  3: "bg-yellow-500",
};

const Toast = ({ message, priority, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000); // auto close after 6s
    return () => clearTimeout(timer);
  }, [onClose]);

  const colorClass = PRIORITY_COLORS[priority] ?? "bg-gray-700";

  return (
    <div
      className={`flex items-start gap-3 ${colorClass} text-white px-4 py-3 rounded-xl shadow-lg max-w-sm w-full animate-slide-in`}
    >
      <span className="text-2xl">⏰</span>
      <div className="flex-1 text-sm leading-snug">{message}</div>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
};

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const { message, todoId, priority } = e.detail;
      setToasts((prev) => [...prev, { id: todoId, message, priority }]);
    };

    window.addEventListener("todo-notification", handler);
    return () => window.removeEventListener("todo-notification", handler);
  }, []);

  const remove = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          priority={t.priority}
          onClose={() => remove(t.id)}
        />
      ))}
    </div>
  );
};

export default ToastManager;