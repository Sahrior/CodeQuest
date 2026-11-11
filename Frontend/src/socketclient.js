import { io } from "socket.io-client";
import { API_URL } from "./api";

let socket = null;
let connectedToken = null;

export function getSocket() {
  const token = localStorage.getItem("token");

  if (!token) return null;
  if (socket && connectedToken === token) return socket;

  if (socket) socket.disconnect();

  connectedToken = token;
  socket = io(API_URL, { auth: { token } });

  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectedToken = null;
  }
}