import React, { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

export const SocketProvider = (props) => {
  const socket = useMemo(() => {
    const defaultUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000"
        : window.location.origin;
    const url = process.env.REACT_APP_SOCKET_URL || defaultUrl;
    return io(url);
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};