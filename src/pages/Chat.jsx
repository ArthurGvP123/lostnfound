import { useState, useEffect, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment 
} from "firebase/firestore";
import defaultAvatar from "../assets/anonim.jpg"; 
import { uploadToCloudinary } from "../utils/uploadImage";
import emailjs from "@emailjs/browser";

// --- CONFIG EMAILJS ---
const SERVICE_ID = "service_xxxx"; // Ganti dengan ID Anda
const TEMPLATE_ID = "template_xxxx"; // Ganti dengan ID Anda
const PUBLIC_KEY = "user_xxxx"; // Ganti dengan ID Anda

// --- ANIMATIONS ---
const popIn = keyframes`0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; }`;

// --- STYLED COMPONENTS ---
const ChatContainer = styled.div` display: flex; height: calc(100vh - 60px); background: #f0f2f5; overflow: hidden; `;
const Sidebar = styled.div` width: 350px; background: white; border-right: 1px solid #ddd; display: flex; flex-direction: column; @media (max-width: 768px) { width: 100%; display: ${props => props.$active ? 'none' : 'flex'}; } `;
const ChatWindow = styled.div` flex: 1; display: flex; flex-direction: column; background: #efe7dd; position: relative; @media (max-width: 768px) { display: ${props => props.$active ? 'flex' : 'none'}; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; } `;
const SidebarHeader = styled.div` padding: 20px; border-bottom: 1px solid #eee; background: white; h2 { margin: 0; font-size: 1.5rem; color: var(--dark); } `;
const ChatList = styled.div` flex: 1; overflow-y: auto; `;

const ChatItem = styled.div`
  display: flex; align-items: center; gap: 15px; padding: 15px 20px; cursor: pointer; transition: background 0.2s;
  background: ${props => props.$selected ? '#f0f0f0' : 'white'};
  &:hover { background: #f5f5f5; }
  ${props => props.$unread && css`font-weight: bold; background: #fff0f0; border-left: 4px solid #ef4444;`}
`;

const Avatar = styled.img` width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; flex-shrink: 0; `;
const ChatInfo = styled.div` flex: 1; overflow: hidden; div.name { font-weight: 700; color: var(--dark); margin-bottom: 4px; } div.last-msg { font-size: 0.85rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } `;
const UnreadBadge = styled.div` background: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; font-weight: bold; `;
const ChatHeader = styled.div` padding: 10px 20px; background: white; border-bottom: 1px solid #ddd; display: flex; align-items: center; gap: 15px; .back-btn { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; @media (max-width: 768px) { display: block; } } `;
const MessagesArea = styled.div` flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; &::-webkit-scrollbar { width: 6px; } &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; } `;

const MessageBubble = styled.div`
  max-width: 70%; padding: 10px 15px; border-radius: 12px; font-size: 0.95rem; line-height: 1.4; position: relative;
  align-self: ${props => props.$mine ? 'flex-end' : 'flex-start'};
  background: ${props => props.$mine ? 'var(--primary)' : 'white'};
  color: ${props => props.$mine ? 'var(--dark)' : 'black'};
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  img.msg-img { max-width: 100%; border-radius: 8px; margin-bottom: 5px; cursor: pointer; }
  .time { font-size: 0.65rem; text-align: right; margin-top: 4px; opacity: 0.7; }
`;

const InputArea = styled.form` padding: 15px; background: white; display: flex; gap: 10px; align-items: center; `;
const Input = styled.input` flex: 1; padding: 12px; border-radius: 20px; border: 1px solid #ddd; font-family: inherit; &:focus { outline: none; border-color: var(--primary); } `;
const SendBtn = styled.button` background: var(--primary); color: var(--dark); border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.1s; &:active { transform: scale(0.9); } svg { width: 20px; height: 20px; margin-left: 2px; } `;
const AttachBtn = styled.div` color: #666; cursor: pointer; padding: 5px; &:hover { color: var(--primary); } svg { width: 24px; height: 24px; } `;
const EmptyChat = styled.div` flex: 1; display: flex; align-items: center; justify-content: center; color: #aaa; flex-direction: column; svg { width: 80px; height: 80px; margin-bottom: 20px; opacity: 0.3; } `;
const ImageModal = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; img { max-width: 90%; max-height: 90%; border-radius: 8px; } `;

const Chat = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  const dummyBottom = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Fetch Daftar Chat & Unread
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = query(
      collection(db, "chats"), 
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherUserId = data.participants?.find(uid => uid !== currentUser.uid);
        const otherUserInfo = data.userInfo?.[otherUserId] || { displayName: "Pengguna", photoURL: defaultAvatar };
        
        return {
          id: doc.id,
          ...data,
          otherUser: otherUserInfo,
          otherUserId: otherUserId,
          unreadCount: data.unreadCounts?.[currentUser.uid] || 0
        };
      });
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. Fetch Pesan
  useEffect(() => {
    if (!activeChat?.id) return;

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => dummyBottom.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // --- PERBAIKAN LOGIKA CLICK CHAT (Handling Unread Instant) ---
  const handleSelectChat = async (chat) => {
    setActiveChat(chat);

    // Jika ada pesan belum dibaca, langsung nol-kan di UI (Optimistic Update)
    if (chat.unreadCount > 0) {
        // 1. Update state lokal dulu agar UI responsif (Badge hilang seketika)
        const updatedChats = chats.map(c => {
            if (c.id === chat.id) {
                return { ...c, unreadCount: 0 };
            }
            return c;
        });
        setChats(updatedChats);

        // 2. Update Database di background
        try {
            const chatRef = doc(db, "chats", chat.id);
            await updateDoc(chatRef, {
                [`unreadCounts.${currentUser.uid}`]: 0
            });
        } catch (error) {
            console.error("Gagal update unread status:", error);
        }
    }
  };

  // 3. Send Message
  const sendMessage = async (content, type = 'text') => {
    if (!activeChat) return;
    const otherUserId = activeChat.otherUserId;
    const textPreview = type === 'image' ? '📷 Mengirim Foto' : content;

    try {
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: content, type: type, senderId: currentUser.uid, createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: textPreview,
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCounts.${otherUserId}`]: increment(1) // Tambah counter lawan
      });

      // Kirim Email
      const targetEmail = activeChat.otherUser.email;
      if (targetEmail) {
          const templateParams = {
              to_email: targetEmail,
              to_name: activeChat.otherUser.displayName,
              from_name: currentUser.displayName || "Seseorang",
              message: textPreview
          };
          emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .catch(err => console.error("Email error:", err));
      }
    } catch (error) {
      console.error("Error sending:", error);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage, 'text');
    setNewMessage("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
        const url = await uploadToCloudinary(file);
        await sendMessage(url, 'image');
    } catch (error) { alert("Gagal upload gambar."); } 
    finally { setUploading(false); }
  };

  const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "";
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Navbar />
      <ChatContainer>
        {/* SIDEBAR */}
        <Sidebar $active={!!activeChat}>
          <SidebarHeader><h2>Pesan</h2></SidebarHeader>
          <ChatList>
            {chats.map(chat => (
              <ChatItem 
                key={chat.id} 
                $selected={activeChat?.id === chat.id} 
                $unread={chat.unreadCount > 0} 
                onClick={() => handleSelectChat(chat)} // GUNAKAN FUNGSI BARU INI
              >
                <Avatar src={chat.otherUser.photoURL || defaultAvatar} onError={(e) => { e.target.src = defaultAvatar; }} />
                <ChatInfo>
                  <div className="name">{chat.otherUser.displayName}</div>
                  <div className="last-msg" style={{fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal'}}>{chat.lastMessage || "Mulai percakapan..."}</div>
                </ChatInfo>
                {chat.unreadCount > 0 && <UnreadBadge>{chat.unreadCount}</UnreadBadge>}
              </ChatItem>
            ))}
            {chats.length === 0 && <p style={{padding:'20px', color:'#999', textAlign:'center'}}>Belum ada percakapan.</p>}
          </ChatList>
        </Sidebar>

        {/* CHAT WINDOW */}
        <ChatWindow $active={!!activeChat}>
          {activeChat ? (
            <>
              <ChatHeader>
                <button className="back-btn" onClick={() => setActiveChat(null)}>←</button>
                <Avatar src={activeChat.otherUser.photoURL || defaultAvatar} onError={(e) => { e.target.src = defaultAvatar; }} />
                <div style={{fontWeight:'700', color:'var(--dark)'}}>{activeChat.otherUser.displayName}</div>
              </ChatHeader>
              <MessagesArea>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} $mine={msg.senderId === currentUser.uid}>
                    {msg.type === 'image' ? <img src={msg.text} alt="sent" className="msg-img" onClick={() => setPreviewImage(msg.text)} /> : msg.text}
                    <div className="time">{formatTime(msg.createdAt)}</div>
                  </MessageBubble>
                ))}
                <div ref={dummyBottom}></div>
              </MessagesArea>
              <InputArea onSubmit={handleTextSubmit}>
                <AttachBtn onClick={() => fileInputRef.current.click()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </AttachBtn>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{display:'none'}} accept="image/*" />
                <Input type="text" placeholder={uploading ? "Mengupload gambar..." : "Ketik pesan..."} value={newMessage} disabled={uploading} onChange={(e) => setNewMessage(e.target.value)} />
                <SendBtn type="submit" disabled={uploading}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></SendBtn>
              </InputArea>
            </>
          ) : <EmptyChat><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><h3>Pilih percakapan</h3></EmptyChat>}
        </ChatWindow>
        
        {previewImage && <ImageModal onClick={() => setPreviewImage(null)}><img src={previewImage} alt="Full" /></ImageModal>}
      </ChatContainer>
    </>
  );
};

export default Chat;