// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi Register Manual
  const register = async (email, password, name, phone) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;
    
    // Simpan data tambahan ke Firestore
    // Pastikan Rules Firestore sudah: allow write: if request.auth != null;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name,
      email,
      phone,
      photoURL: "",
      authProvider: "local",
      createdAt: new Date()
    });
    return res;
  };

  // Fungsi Login Manual
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Fungsi Login Google (DIPERBARUI)
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      // Cek apakah user sudah ada di database
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);

      if (!userDocSnapshot.exists()) {
        // Jika user baru pertama kali login Google, simpan datanya
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          phone: "", // Google tidak memberikan no HP
          photoURL: user.photoURL,
          authProvider: "google",
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error("Error di loginWithGoogle:", error);
      // Lempar error agar bisa ditangkap di halaman Login.jsx
      throw error; 
    }
  };

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};