// context/SocketProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Tạo kết nối socket đúng cách
    const s = io("http://localhost:3001", {
      transports: ["websocket"],
      reconnection: true,
    });

    setSocket(s);

    // Debug
    s.on("connect", () => console.log("🔌 Socket connected:", s.id));
    s.on("disconnect", () => console.log("❌ Socket disconnected"));
    
    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
