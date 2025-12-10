import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

// --- ANIMATIONS & STYLED COMPONENTS (TETAP SAMA SEPERTI SEBELUMNYA) ---
const fadeInUp = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const popIn = keyframes`0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; }`;

const Card = styled.div`
  background: var(--white); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-sm); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); cursor: pointer; position: relative; border: 1px solid var(--border); animation: ${fadeInUp} 0.5s ease-out backwards; height: 100%; display: flex; flex-direction: column;
  &:hover { transform: translateY(-8px); box-shadow: var(--shadow-lg); border-color: transparent; }
`;
const CarouselWindow = styled.div` height: 220px; position: relative; overflow: hidden; background: #f0f0f0; @media (max-width: 768px) { height: 240px; } `;
const SliderTrack = styled.div` display: flex; height: 100%; width: 100%; transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); transform: translateX(${props => props.translateX}%); `;
const SlideImage = styled.img` width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; flex-shrink: 0; flex-grow: 0; min-height: 100%; `;
const NavBtn = styled.button` position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.5); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 5; opacity: 0; transition: all 0.2s; backdrop-filter: blur(2px); &:hover { background: rgba(255,255,255,0.9); color: black; transform: translateY(-50%) scale(1.1); } ${Card}:hover & { opacity: 1; } &.prev { left: 10px; } &.next { right: 10px; } `;
const ImageCounter = styled.div` position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; backdrop-filter: blur(4px); z-index: 5; `;
const Overlay = styled.div` position: absolute; top: 15px; left: 15px; display: flex; gap: 8px; z-index: 4; `;
const Badge = styled.span` padding: 6px 12px; border-radius: 30px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; backdrop-filter: blur(4px); box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05); background: rgba(255, 255, 255, 0.95); color: ${props => props.type === 'lost' ? '#D32F2F' : '#141414'}; `;
const CardBody = styled.div` padding: 1.2rem; display: flex; flex-direction: column; flex: 1; `;
const Title = styled.h3` margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--dark); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; `;
const InfoRow = styled.div` display: flex; align-items: center; gap: 6px; color: #666; font-size: 0.9rem; margin-bottom: 0.5rem; svg { flex-shrink: 0; } `;
const RewardTag = styled.div` margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; background: #FFF8E1; color: #F57F17; font-weight: 700; font-size: 0.8rem; padding: 6px 10px; border-radius: 8px; width: fit-content; border: 1px solid #FFE082; svg { width: 14px; height: 14px; } `;
const Footer = styled.div` margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; `;
const ChatHint = styled.div` font-size: 0.85rem; font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 5px; opacity: 0; transform: translateX(-10px); transition: all 0.3s ease; ${Card}:hover & { opacity: 1; transform: translateX(0); } `;

const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px); `;
const ModalContent = styled.div` background: var(--white); width: 90%; max-height: 85vh; border-radius: 20px; display: flex; flex-direction: column; position: relative; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); animation: ${popIn} 0.3s ease-out; @media (min-width: 768px) { width: 100%; max-width: 900px; height: auto; max-height: 90vh; flex-direction: row; } `;
const ModalImageArea = styled.div` background: #000; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; width: 100%; height: 250px; flex-shrink: 0; @media (min-width: 768px) { flex: 1; height: auto; min-height: 400px; } img { width: 100%; height: 100%; object-fit: cover; display: block; } `;
const ModalDetails = styled.div` flex: 1; padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; @media (min-width: 768px) { padding: 2rem; } `;
const CloseButton = styled.button` position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.85); border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: all 0.2s; &:hover { background: var(--white); transform: rotate(90deg); } `;
const ContactButton = styled.button` margin-left: auto; background: #25D366; color: white; border: none; padding: 10px 20px; border-radius: 30px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.2s; &:hover { background: #1ebc57; transform: translateY(-2px); } `;

// --- ALERT MODAL (Self Contact) ---
const AlertBox = styled.div` background: white; width: 100%; max-width: 350px; border-radius: 20px; padding: 2rem; text-align: center; animation: ${popIn} 0.3s ease-out; box-shadow: 0 25px 50px rgba(0,0,0,0.3); position: relative; `;
const AlertIcon = styled.div` width: 60px; height: 60px; border-radius: 50%; background: #e3f2fd; color: #1565c0; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; svg { width: 30px; height: 30px; } `;
const AlertTitle = styled.h3` margin: 0 0 10px 0; font-size: 1.3rem; color: var(--dark); `;
const AlertText = styled.p` color: #666; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.5; `;
const AlertBtn = styled.button` background: var(--primary); color: var(--dark); border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; transition: opacity 0.2s; &:hover { opacity: 0.9; } `;

const ItemCard = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [showSelfAlert, setShowSelfAlert] = useState(false);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const images = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl || "https://via.placeholder.com/400x300?text=No+Image"];
  const hasMultiple = images.length > 1;

  const formatDate = (dateInput) => {
    if (!dateInput) return "";
    const date = dateInput.seconds ? new Date(dateInput.seconds * 1000) : new Date(dateInput);
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const nextImage = (e) => { if(e) e.stopPropagation(); setImgIndex((prev) => (prev + 1) % images.length); };
  const prevImage = (e) => { if(e) e.stopPropagation(); setImgIndex((prev) => (prev - 1 + images.length) % images.length); };
  const handleCloseModal = (e) => { e.stopPropagation(); setIsOpen(false); };

  // --- LOGIC HUBUNGI ---
  const handleContact = async (e) => {
    e.stopPropagation();

    if (!currentUser) {
      alert("Silakan login untuk menghubungi pemilik.");
      navigate("/login");
      return;
    }

    if (currentUser.uid === item.userId) {
      setShowSelfAlert(true);
      return;
    }

    try {
      // 1. Cek apakah chat sudah ada
      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("participants", "array-contains", currentUser.uid));
      const querySnapshot = await getDocs(q);
      let existingChatId = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(item.userId)) existingChatId = doc.id;
      });

      if (existingChatId) {
        navigate("/chat");
      } else {
        // 2. Buat Chat Baru dengan Unread Counts Initial
        const otherUserRef = doc(db, "users", item.userId);
        const otherUserSnap = await getDoc(otherUserRef);
        const otherUserData = otherUserSnap.exists() ? otherUserSnap.data() : { 
            name: item.userName, 
            photoURL: item.userPhoto,
            email: item.userEmail // Penting untuk notifikasi email
        };

        const myRef = doc(db, "users", currentUser.uid);
        const mySnap = await getDoc(myRef);
        const myData = mySnap.exists() ? mySnap.data() : { name: currentUser.displayName, photoURL: currentUser.photoURL, email: currentUser.email };

        await addDoc(collection(db, "chats"), {
          participants: [currentUser.uid, item.userId],
          userInfo: {
            [currentUser.uid]: { displayName: myData.name || "User", photoURL: myData.photoURL || "", email: myData.email },
            [item.userId]: { displayName: otherUserData.name || "User", photoURL: otherUserData.photoURL || "", email: item.userEmail }
          },
          lastMessage: "",
          lastMessageTimestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          // --- NEW: Counter Unread ---
          unreadCounts: {
            [currentUser.uid]: 0,
            [item.userId]: 0
          }
        });

        navigate("/chat");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Gagal memulai percakapan.");
    }
  };

  return (
    <>
      <Card style={{ animationDelay: `${index * 0.1}s` }} onClick={() => setIsOpen(true)}>
        <CarouselWindow>
          <SliderTrack translateX={-(imgIndex * 100)}>{images.map((img, i) => <SlideImage key={i} src={img} alt={`${item.title} - ${i+1}`} />)}</SliderTrack>
          <Overlay><Badge type={item.type}>{item.type === 'lost' ? 'HILANG' : 'DITEMUKAN'}</Badge></Overlay>
          {hasMultiple && <><NavBtn className="prev" onClick={prevImage}>‹</NavBtn><NavBtn className="next" onClick={nextImage}>›</NavBtn><ImageCounter>{imgIndex + 1}/{images.length}</ImageCounter></>}
        </CarouselWindow>

        <CardBody>
          <Title>{item.title}</Title>
          <InfoRow><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>{item.location}</InfoRow>
          <InfoRow style={{fontSize:'0.85rem'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>{formatDate(item.createdAt)}</InfoRow>
          {item.reward && <RewardTag><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>Ada Imbalan</RewardTag>}
          <Footer><span style={{fontSize:'0.8rem', color:'#888'}}>Lihat Detail</span><ChatHint>Hubungi <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></ChatHint></Footer>
        </CardBody>
      </Card>

      {isOpen && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}>✕</CloseButton>
            <ModalImageArea>
               <img src={images[imgIndex]} alt={item.title} />
               {hasMultiple && <><NavBtn className="prev" onClick={prevImage} style={{opacity:1}}>‹</NavBtn><NavBtn className="next" onClick={nextImage} style={{opacity:1}}>›</NavBtn><ImageCounter style={{bottom:'20px', right:'20px', fontSize:'0.9rem'}}>{imgIndex + 1} / {images.length}</ImageCounter></>}
            </ModalImageArea>
            <ModalDetails>
              <h2 style={{fontSize:'1.8rem', margin:'0 0 10px 0', color:'var(--dark)'}}>{item.title}</h2>
              <div style={{display:'grid', gap:'10px', marginBottom:'20px'}}>
                 <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#555'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>{item.location}</div>
                 <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#555'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>{formatDate(item.createdAt)}</div>
                 {item.reward && <div style={{color:'#F57F17', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>Tersedia Imbalan</div>}
              </div>
              <p style={{background:'var(--light)', padding:'1rem', borderRadius:'10px', lineHeight:'1.6', marginBottom:'2rem', color:'#666'}}>{item.description}</p>
              <div style={{marginTop:'auto', borderTop:'1px solid #eee', paddingTop:'15px', display:'flex', alignItems:'center', gap:'12px'}}>
                 <img src={item.userPhoto || "https://via.placeholder.com/50?text=User"} style={{width:'48px', height:'48px', borderRadius:'50%', objectFit:'cover'}} alt="User" />
                 <div><div style={{fontWeight:'700', color:'var(--dark)'}}>{item.userName}</div><div style={{fontSize:'0.8rem', color:'#888'}}>Pelapor</div></div>
                 <ContactButton onClick={handleContact}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>Hubungi</ContactButton>
              </div>
            </ModalDetails>
          </ModalContent>
        </ModalOverlay>
      )}
      {showSelfAlert && <ModalOverlay onClick={() => setShowSelfAlert(false)}><AlertBox onClick={(e) => e.stopPropagation()}><AlertIcon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></AlertIcon><AlertTitle>Postingan Anda Sendiri</AlertTitle><AlertText>Anda tidak dapat mengirim pesan ke diri sendiri.</AlertText><AlertBtn onClick={() => setShowSelfAlert(false)}>Mengerti</AlertBtn></AlertBox></ModalOverlay>}
    </>
  );
};

export default ItemCard;