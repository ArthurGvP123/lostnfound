import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AddPost from "./pages/AddPost";
import ManagePosts from "./pages/ManagePosts";
import Chat from "./pages/Chat"; // Import Baru
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/add-post" element={<PrivateRoute><AddPost /></PrivateRoute>} />
          <Route path="/manage-posts" element={<PrivateRoute><ManagePosts /></PrivateRoute>} />
          
          {/* ROUTE BARU */}
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;