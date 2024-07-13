import React, { useEffect, useState } from 'react';
import './App.css';
import { FiBell } from 'react-icons/fi';

interface Notification {
  id: number;
  message: string;
  read: boolean;
}

const App: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);
  const [newNotification, setNewNotification] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8080/subscribe');

    eventSource.onmessage = function(event) {
      const newNotification: Notification = {
        id: nextId,
        message: event.data,
        read: false
      };
      setNotifications(prevNotifications => [...prevNotifications, newNotification]);
      setNextId(prevId => prevId + 1);

      // 일정 시간이 지나면 알림 자동 닫기
      setTimeout(() => {
        setNotifications(prevNotifications => prevNotifications.filter(n => n.id !== newNotification.id));
      }, 5000); // 5초 후 자동 닫기
    };

    eventSource.onerror = function(err) {
      console.error("EventSource failed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [nextId]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    // 모든 알림을 읽음으로 표시
    setNotifications(prevNotifications => prevNotifications.map(n => ({ ...n, read: true })));
  };

  const handleCreateNotification = () => {
    if (newNotification.trim()) {
      const notification = {
        id: nextId,
        message: newNotification,
        read: false
      };
      setNotifications([...notifications, notification]);
      setNextId(nextId + 1);
      setNewNotification('');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="App">
      <h1>알림 메시지</h1>
      <input
        type="text"
        value={newNotification}
        onChange={(e) => setNewNotification(e.target.value)}
        placeholder="새 알림 입력"
      />
      <button onClick={handleCreateNotification}>알림 추가</button>
      <div className="notification-icon" onClick={handleBellClick}>
        <FiBell size={24} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </div>
      {showNotifications && (
        <div className="notification-list">
          <h2>알림 목록</h2>
          {notifications.map(notification => (
            <div key={notification.id} className="notification-item">
              <p>{notification.message}</p>
            </div>
          ))}
        </div>
      )}
      <div className="floating-notifications">
        {notifications.map(notification => (
          <div key={notification.id} className="floating-notification">
            <p>{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
