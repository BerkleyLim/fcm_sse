import React, { useEffect, useState } from 'react';
import './App.css';

interface Notification {
  id: number;
  message: string;
}

const App: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8080/subscribe');

    eventSource.onmessage = function(event) {
      const newNotification: Notification = {
        id: nextId,
        message: event.data,
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

  const handleCloseNotification = (id: number) => {
    setNotifications(prevNotifications => prevNotifications.filter(n => n.id !== id));
  };

  const handleClick = async () => {
    try {
      await fetch('http://localhost:8080/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error triggering event:', error);
    }
  };

  return (
    <div className="App">
      <h1>알림 메시지</h1>
      <button onClick={handleClick}>알림 보내기</button>
      <div className="notifications">
        {notifications.map(notification => (
          <div key={notification.id} className="notification">
            <p>{notification.message}</p>
            <button onClick={() => handleCloseNotification(notification.id)}>닫기</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
