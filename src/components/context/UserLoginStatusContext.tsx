import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const UserLoginStatusContext = createContext<{
  loginStatuses: { [key: string]: boolean };
  setLoginStatuses: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
}>({
  loginStatuses: {},
  setLoginStatuses: () => {},
});

const UserLoginSocketContext = (props: { children: React.ReactNode }) => {
  // ALL USERS LOGIN STATE
  const [loginStatuses, setLoginStatuses] = useState({});

  // User Login Status Socket Connection
  useEffect(() => {
    // Listen for login status updates from the server
    let socket;

    socket = io(import.meta.env.VITE_SERVER_URL);

    socket.on("userLoginStatus", ({ userId, status }) => {
      setLoginStatuses((prevStatuses) => ({
        ...prevStatuses,
        [userId]: status,
      }));
    });

    return () => {
      socket.off("userLoginStatus");
    };
  }, []);

  return (
    <UserLoginStatusContext.Provider
      value={{
        loginStatuses,
        setLoginStatuses,
      }}
    >
      {props.children}
    </UserLoginStatusContext.Provider>
  );
};

export default UserLoginSocketContext;
