// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  // Jika tidak ada user yang login, paksa pindah ke halaman /login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Jika ada user, izinkan masuk (render halaman aslinya)
  return children;
};

export default PrivateRoute;