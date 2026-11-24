import { useEffect } from 'react';
import { useStore } from '../store';
import { Bell, BellOff, Check, CheckCheck, Brain, Zap } from 'lucide-react';

export default function NotificationPanel() {
  const { notifications, unreadCount, fetchNotifications, markNotificationRead, markAllNotificationsRead } = useStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'memory_created': return <Brain className="w-4 h-4 text-emerald-400" />;
      case 'memory_updated': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'system': return <Bell className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Notifications</h2>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No notifications yet</p>
            <p className="text-gray-600 text-xs mt-1">
              Post a memory to trigger notifications
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markNotificationRead(notif.id)}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                notif.read
                  ? 'bg-gray-800/30 border border-gray-800'
                  : 'bg-gray-800/70 border border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${notif.read ? 'text-gray-500' : 'text-gray-300'}`}>
                  {notif.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-600">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    notif.type === 'memory_created' ? 'bg-emerald-500/10 text-emerald-400' :
                    notif.type === 'system' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {notif.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              {notif.read ? (
                <Check className="w-3.5 h-3.5 text-gray-600 mt-1" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
