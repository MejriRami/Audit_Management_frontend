import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { NotificationItem } from "../../types";
import { useWebSocket } from "../../hooks/useWebsocket";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const token = localStorage.getItem("token") || "";

  // WebSocket connection for real-time notifications
  const { isConnected } = useWebSocket((newNotification) => {
    console.log("New real-time notification:", newNotification);

    // Add new notification to the top of the list
    setNotifications((prev) => [newNotification, ...prev]);

    // Increment unread count
    if (!newNotification.read) {
      setUnreadCount((prev) => prev + 1);
    }

    // Optional: Show browser notification
    if (Notification.permission === "granted") {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: "/notification-icon.png",
      });
    }
  });

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread count

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Request browser notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  async function toggleDropdown() {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      await fetchNotifications();
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    closeDropdown();

    const params = new URLSearchParams();
    params.set("tab", "corrective_actions");

    if (notification.metadata?.car_id) {
      params.set("car_id", String(notification.metadata.car_id));
    } else if (notification.metadata?.audit_id) {
      params.set("audit_id", String(notification.metadata.audit_id));
    } else if (notification.metadata?.audit_number) {
      params.set("search", notification.metadata.audit_number);
    }

    navigate(`/audits?${params.toString()}`);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await markAllAsRead();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "car_submission":
        return (
          <svg
            className="w-5 h-5 text-orange-600 dark:text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0.5 z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-orange-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}

        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>

        {/* WebSocket connection status indicator */}
        {!isConnected && (
          <span
            className="absolute bottom-0 right-0 w-2 h-2 bg-red-500 border border-white rounded-full dark:border-gray-900"
            title="Disconnected"
          />
        )}
        {isConnected && (
          <span
            className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white rounded-full dark:border-gray-900"
            title="Connected"
          />
        )}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium text-white bg-orange-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
            {!isConnected && (
              <button
                onClick={() => window.location.reload()}
                className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <li className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              Loading...
            </li>
          ) : notifications.length === 0 ? (
            <li className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              No notifications yet
            </li>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onItemClick={() => handleNotificationClick(notification)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 transition-colors ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                  }`}
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <div className="flex items-center justify-center w-full h-full bg-orange-100 rounded-full dark:bg-orange-900/20">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </span>

                  <span className="flex-1 block min-w-0">
                    <span className="mb-1.5 block text-theme-sm">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {notification.title}
                      </span>
                    </span>
                    <span className="block mb-1 text-gray-500 text-theme-xs dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span className="capitalize">
                        {notification.type.replace("_", " ")}
                      </span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatTimeAgo(notification.created_at)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
