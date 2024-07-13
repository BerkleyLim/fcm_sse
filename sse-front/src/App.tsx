import React, { useEffect, useState } from 'react';
import './App.css';
import { FiBell } from 'react-icons/fi';

interface Notification {
  id: number;
  message: string;
}

interface Board {
  id: number;
  name: string;
}

const App: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextId, setNextId] = useState(1);
  const [newBoardName, setNewBoardName] = useState('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [logEntries, setLogEntries] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8080/subscribe');

    eventSource.onmessage = function(event) {
      const newNotification: Notification = {
        id: nextId,
        message: event.data
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

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);

    if (!showNotifications) {
      try {
        const response = await fetch('http://localhost:8080/logs');
        const data = await response.json();
        setLogEntries(data.map((log: any, index: number) => ({
          id: index + 1,
          message: log.message
        })));
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    }
  };

  const handleCreateBoard = async () => {
    if (newBoardName.trim()) {
      try {
        await fetch('http://localhost:8080/create-board', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newBoardName),
        });
        setBoards([...boards, { id: boards.length + 1, name: newBoardName }]);
        setNewBoardName('');
      } catch (error) {
        console.error('Error creating board:', error);
      }
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="App">
      <h1>알림 메시지</h1>
      <input
        type="text"
        value={newBoardName}
        onChange={(e) => setNewBoardName(e.target.value)}
        placeholder="게시판 이름"
      />
      <button onClick={handleCreateBoard}>게시판 생성</button>
      <div className="notification-icon" onClick={handleBellClick}>
        <FiBell size={24} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </div>
      {showNotifications && (
        <div className="notification-list">
          <h2>로그 목록</h2>
          {logEntries.map(entry => (
            <div key={entry.id} className="notification-item">
              <p>{entry.message}</p>
            </div>
          ))}
        </div>
      )}
      <div className="boards">
        <h2>게시판 목록</h2>
        {boards.map(board => (
          <div key={board.id} className="board-item">
            <p>{board.name}</p>
          </div>
        ))}
      </div>
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
