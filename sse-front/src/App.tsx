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
  const [boardName, setBoardName] = useState('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  useEffect(() => {
    // 게시판 목록 조회
    const fetchBoards = async () => {
      try {
        const response = await fetch('http://localhost:8080/boards');
        const data = await response.json();
        setBoards(data);
      } catch (error) {
        console.error('Error fetching boards:', error);
      }
    };

    fetchBoards();
  }, [notifications]);

  const handleCloseNotification = (id: number) => {
    setNotifications(prevNotifications => prevNotifications.filter(n => n.id !== id));
  };

  const handleCreateBoard = async () => {
    try {
      await fetch('http://localhost:8080/create-board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardName),
      });
      setBoardName('');
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  return (
    <div className="App">
      <h1>알림 메시지</h1>
      <input
        type="text"
        value={boardName}
        onChange={(e) => setBoardName(e.target.value)}
        placeholder="게시판 이름"
      />
      <button onClick={handleCreateBoard}>게시판 생성</button>
      <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
        <FiBell size={24} />
        {notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}
      </div>
      {showNotifications && (
        <div className="notification-list">
          {notifications.map(notification => (
            <div key={notification.id} className="notification-item">
              <p>{notification.message}</p>
              <button onClick={() => handleCloseNotification(notification.id)}>닫기</button>
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
      <div className="boards">
        <h2>게시판 목록</h2>
        <ul>
          {boards.map(board => (
            <li key={board.id}>{board.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
