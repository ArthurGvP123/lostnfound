import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import styled, { keyframes, css } from "styled-components";
import defaultAvatar from "../assets/anonim.jpg"; 

// --- ANIMATIONS ---
const popIn = keyframes`
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

// --- STYLED COMPONENTS NAVBAR ---
const NavContainer = styled.nav`
  background: var(--dark-glass);
  backdrop-filter: blur(12px);
  padding: 0.8rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s ease;
  width: 100%;
`;

const NavContent = styled.div`
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (min-width: 768px) {
    padding: 0 2.5rem;
  }
`;

const Brand = styled(Link)`
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--primary);
  text-decoration: none;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 5px;
  span { color: var(--white); }

  @media (min-width: 768px) {
    font-size: 1.5rem;
    gap: 8px;
  }
`;

const UserMenuWrapper = styled.div`
  position: relative;
`;

const MenuTrigger = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border-radius: 30px;
  transition: background 0.2s;

  &:hover { background: rgba(255,255,255,0.1); }
`;

const ProfileImg = styled.img`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 2px solid var(--primary);
  object-fit: cover;
  background-color: #eee;

  @media (min-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const TriggerIcon = styled.div`
  color: var(--white);
  transition: transform 0.3s;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  display: none;
  
  @media (min-width: 768px) {
    display: block;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 55px;
  right: 0;
  background: var(--white);
  width: 220px;
  max-width: 90vw;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  
  opacity: ${props => props.isOpen ? 1 : 0};
  transform: ${props => props.isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  pointer-events: ${props => props.isOpen ? 'all' : 'none'};
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 15px;
    width: 12px;
    height: 12px;
    background: var(--white);
    transform: rotate(45deg);
  }
`;

const MenuItem = styled(Link)`
  text-decoration: none;
  color: var(--dark);
  padding: 12px 15px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s;

  &:hover {
    background: var(--light);
    color: var(--primary-hover);
  }

  svg { width: 18px; height: 18px; color: #888; }
  &:hover svg { color: var(--primary-hover); }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: var(--border);
  margin: 5px 0;
`;

const LogoutButton = styled.button`
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  padding: 12px 15px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ef4444; 
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: #fef2f2;
  }
  
  svg { width: 18px; height: 18px; }
`;

const UserInfo = styled.div`
  padding: 10px 15px;
  margin-bottom: 5px;
  border-bottom: 1px solid var(--border);
  
  .name { 
    font-weight: 800; 
    font-size: 1rem; 
    color: var(--dark); 
    margin-bottom: 2px;
  }
  .email { 
    font-size: 0.8rem; 
    color: #888; 
    overflow: hidden; 
    text-overflow: ellipsis; 
  }
`;

// --- NOTIFICATION STYLES ---
const ChatIconBtn = styled(Link)`
  color: var(--white);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  margin-right: 15px;
  transition: transform 0.2s;
  
  &:hover { transform: scale(1.1); color: var(--primary); }
  svg { width: 24px; height: 24px; }
`;

const NotificationBadge = styled.div`
  position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.65rem; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 2px solid var(--dark);
`;

// --- MODAL LOGOUT STYLES (NEW) ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  z-index: 2000; /* Lebih tinggi dari Navbar */
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  backdrop-filter: blur(5px);
`;

const ModalBox = styled.div`
  background: white;
  width: 100%;
  max-width: 380px;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  animation: ${popIn} 0.3s ease-out;
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
`;

const ModalIcon = styled.div`
  width: 70px; height: 70px;
  border-radius: 50%;
  background: #fee2e2;
  color: #ef4444;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1.5rem;
  svg { width: 35px; height: 35px; }
`;

const ModalTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.4rem;
  color: var(--dark);
`;

const ModalText = styled.p`
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ModalBtn = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
  transition: opacity 0.2s;

  &.cancel { background: #f3f3f3; color: var(--dark); }
  &.danger { background: #ef4444; color: white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }
  
  &:hover { opacity: 0.9; }
`;


const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Pengguna");
  const [photoURL, setPhotoURL] = useState(defaultAvatar);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // STATE MODAL
  const menuRef = useRef(null);

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        if (currentUser.displayName) setDisplayName(currentUser.displayName);
        if (currentUser.photoURL) setPhotoURL(currentUser.photoURL);
        try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.name) setDisplayName(data.name);
                if (data.photoURL && data.photoURL.trim() !== "") setPhotoURL(data.photoURL);
            }
        } catch (err) { console.error(err); setPhotoURL(defaultAvatar); }
      }
    };
    fetchUserData();
  }, [currentUser, isOpen]);

  // Listener Unread Chat
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        total += data.unreadCounts?.[currentUser.uid] || 0;
      });
      setUnreadCount(total);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Click Outside Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  
  // 1. Klik tombol di dropdown -> Buka Modal
  const onLogoutClick = () => {
    setIsOpen(false); // Tutup dropdown
    setShowLogoutModal(true); // Buka modal
  };

  // 2. Konfirmasi di Modal -> Eksekusi Logout
  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <>
      <NavContainer>
        <NavContent>
          <Brand to="/">LOST<span>N</span>FOUND</Brand>
          
          {currentUser && (
            <div style={{display:'flex', alignItems:'center'}}>
              
              {/* CHAT ICON */}
              <ChatIconBtn to="/chat" title="Pesan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                {unreadCount > 0 && <NotificationBadge>{unreadCount > 9 ? '9+' : unreadCount}</NotificationBadge>}
              </ChatIconBtn>

              <UserMenuWrapper ref={menuRef}>
                <MenuTrigger onClick={() => setIsOpen(!isOpen)}>
                  <ProfileImg src={photoURL} alt="Profile" onError={(e) => { e.target.src = defaultAvatar; }} />
                  <TriggerIcon isOpen={isOpen}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></TriggerIcon>
                </MenuTrigger>
                
                <DropdownMenu isOpen={isOpen}>
                  <UserInfo><div className="name">{displayName}</div><div className="email">{currentUser.email}</div></UserInfo>
                  <MenuItem to="/" onClick={() => setIsOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>Beranda</MenuItem>
                  <MenuItem to="/manage-posts" onClick={() => setIsOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Kelola Post</MenuItem>
                  <MenuItem to="/chat" onClick={() => setIsOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>Chat {unreadCount > 0 && <span style={{background:'#ef4444', color:'white', padding:'0 5px', borderRadius:'50%', fontSize:'0.7rem', marginLeft:'auto'}}>{unreadCount}</span>}</MenuItem>
                  <MenuItem to="/profile" onClick={() => setIsOpen(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>Profil Saya</MenuItem>
                  <MenuDivider />
                  {/* Tombol Logout hanya memicu modal */}
                  <LogoutButton onClick={onLogoutClick}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Keluar
                  </LogoutButton>
                </DropdownMenu>
              </UserMenuWrapper>
            </div>
          )}
        </NavContent>
      </NavContainer>

      {/* --- MODAL CONFIRMATION LOGOUT --- */}
      {showLogoutModal && (
        <ModalOverlay>
          <ModalBox>
            <ModalIcon>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </ModalIcon>
            <ModalTitle>Keluar Akun?</ModalTitle>
            <ModalText>
              Anda akan keluar dari sesi ini. Apakah Anda yakin ingin melanjutkan?
            </ModalText>
            <ButtonGroup>
               <ModalBtn className="cancel" onClick={() => setShowLogoutModal(false)}>
                 Batal
               </ModalBtn>
               <ModalBtn className="danger" onClick={confirmLogout}>
                 Ya, Keluar
               </ModalBtn>
            </ButtonGroup>
          </ModalBox>
        </ModalOverlay>
      )}
    </>
  );
};

export default Navbar;