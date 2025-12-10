import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
// Kita gunakan getDocs agar bisa kontrol Refresh Manual (Lebih stabil daripada onSnapshot untuk kasus ini)
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

// --- ANIMATIONS ---
const fadeInUp = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const popIn = keyframes`0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; }`;
const spin = keyframes`0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }`;

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh; background: var(--light); padding-bottom: 4rem; overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  max-width: 1000px; width: 100%; margin: 0 auto; padding: 2rem 1.5rem;
  @media (min-width: 768px) { padding: 3rem 2rem; }
`;

const HeaderRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
  border-bottom: 2px solid #eee; padding-bottom: 1.5rem;
`;

const Title = styled.h1`
  margin: 0; font-size: 1.8rem; color: var(--dark); font-weight: 800; letter-spacing: -0.5px;
  display: flex; flex-direction: column;
  span { font-size: 0.9rem; color: #888; font-weight: 500; margin-top: 5px; letter-spacing: 0; }
`;

const HeaderActions = styled.div`
  display: flex; gap: 10px; align-items: center;
`;

// Tombol Refresh dengan animasi putar
const RefreshBtn = styled.button`
  background: white; border: 1px solid #ddd; width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--dark); transition: all 0.2s;
  
  &:hover { background: #f5f5f5; border-color: var(--primary); transform: rotate(180deg); }
  
  svg { width: 18px; height: 18px; }
  
  &.spinning svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const AddBtn = styled.button`
  background: var(--primary); color: var(--dark); padding: 10px 20px; border-radius: 30px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.2s;
  box-shadow: 0 4px 12px rgba(255, 213, 0, 0.3);
  &:hover { transform: translateY(-2px); opacity: 0.9; }
`;

const TabsContainer = styled.div`
  display: flex; gap: 10px; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 5px;
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button`
  padding: 8px 18px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-size: 0.9rem;
  background: ${props => props.active ? 'var(--dark)' : 'white'};
  color: ${props => props.active ? 'var(--primary)' : '#666'};
  border: 1px solid ${props => props.active ? 'var(--dark)' : '#eee'};
  &:hover { background: ${props => props.active ? 'var(--dark)' : '#f9f9f9'}; }
`;

// --- LIST STYLE ---
const ListContainer = styled.div`
  display: flex; flex-direction: column; gap: 12px;
`;

const ListItem = styled.div`
  background: white; border-radius: 16px; padding: 1.2rem; border: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 1rem;
  animation: ${fadeInUp} 0.3s ease-out;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); border-color: #ddd; }

  @media (min-width: 768px) {
    flex-direction: row; align-items: center; justify-content: space-between;
  }
`;

const ItemInfo = styled.div`
  display: flex; align-items: flex-start; gap: 15px; flex: 1;
`;

const MiniThumbnail = styled.img`
  width: 64px; height: 64px; border-radius: 10px; object-fit: cover; background: #f0f0f0; border: 1px solid #eee; flex-shrink: 0;
`;

const ItemText = styled.div`
  display: flex; flex-direction: column; gap: 6px;
  
  .top-row { display: flex; align-items: center; gap: 8px; }
  h3 { margin: 0; font-size: 1.05rem; color: var(--dark); font-weight: 700; line-height: 1.3; }
  
  .meta { 
    font-size: 0.85rem; color: #666; display: flex; align-items: center; gap: 10px;
    span { display: flex; align-items: center; gap: 4px; }
  }
`;

const StatusBadge = styled.span`
  font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  background: ${props => props.status === 'resolved' ? '#e8f5e9' : (props.type === 'lost' ? '#ffebee' : '#f3e5f5')};
  color: ${props => props.status === 'resolved' ? '#2e7d32' : (props.type === 'lost' ? '#c62828' : '#7b1fa2')};
  border: 1px solid ${props => props.status === 'resolved' ? '#c8e6c9' : (props.type === 'lost' ? '#ffcdd2' : '#e1bee7')};
`;

const ActionGroup = styled.div`
  display: flex; gap: 8px; align-items: center;
  @media (max-width: 768px) { width: 100%; border-top: 1px solid #f5f5f5; padding-top: 12px; }
`;

const ActionBtn = styled.button`
  padding: 8px 14px; border-radius: 8px; border: 1px solid transparent; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; flex: 1; justify-content: center; transition: all 0.2s; white-space: nowrap;

  &.resolve { background: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; }
  &.resolve:hover { background: #c8e6c9; }

  &.delete { background: white; color: #c62828; border-color: #ffcdd2; }
  &.delete:hover { background: #ffebee; border-color: #ef9a9a; }

  @media (min-width: 768px) { flex: initial; width: auto; }
  svg { width: 14px; height: 14px; }
`;

// --- MODALS ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px);
`;

const ModalBox = styled.div`
  background: white; width: 100%; max-width: 400px; border-radius: 16px; padding: 2rem; text-align: center; animation: ${popIn} 0.3s ease-out; box-shadow: 0 25px 50px rgba(0,0,0,0.3);
`;

const ModalIcon = styled.div`
  width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
  background: ${props => props.danger ? '#fee2e2' : (props.success ? '#e8f5e9' : '#e3f2fd')};
  color: ${props => props.danger ? '#d32f2f' : (props.success ? '#2e7d32' : '#1565c0')};
  svg { width: 30px; height: 30px; }
`;

const ModalTitle = styled.h2` margin: 0 0 8px 0; font-size: 1.4rem; color: var(--dark); `;
const ModalText = styled.p` color: #666; margin-bottom: 20px; line-height: 1.5; font-size: 0.95rem; `;

const ChoiceBtn = styled.button`
  display: flex; align-items: center; width: 100%; padding: 12px 16px; margin-bottom: 10px; border-radius: 10px; border: 1px solid #eee; background: white; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left; gap: 12px; color: var(--dark);
  &:hover { border-color: var(--primary); background: #fffdf0; transform: translateY(-2px); }
  svg { color: var(--primary); width: 20px; height: 20px; }
`;

const BankInfo = styled.div`
  background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: left; border: 1px solid #eee;
  div { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; align-items: center; }
  span.label { color: #888; font-size: 0.85rem; }
  span.value { font-weight: 700; font-family: monospace; font-size: 1rem; color: var(--dark); cursor: pointer; display: flex; align-items: center; gap: 5px; }
  span.value:hover { color: var(--primary-hover); text-decoration: underline; }
  svg { width: 14px; height: 14px; color: #ccc; }
`;

const TimerBtn = styled.button`
  width: 100%; padding: 14px; border-radius: 12px; border: none; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s;
  background: ${props => props.disabled ? '#e0e0e0' : 'var(--dark)'};
  color: ${props => props.disabled ? '#999' : 'var(--primary)'};
  &:hover { opacity: ${props => props.disabled ? 1 : 0.9}; }
`;

const ButtonGroup = styled.div` display: flex; gap: 10px; margin-top: 20px; `;
const ActionModalBtn = styled.button`
  flex: 1; padding: 12px; border-radius: 10px; border: none; font-weight: 600; cursor: pointer; font-size: 0.95rem;
  &.cancel { background: #f3f3f3; color: var(--dark); }
  &.danger { background: #ef4444; color: white; }
  &.danger:hover { background: #d32f2f; }
`;

const EmptyState = styled.div` text-align: center; padding: 60px 20px; color: #aaa; svg { width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.3; } `;

// --- COMPONENT LOGIC ---
const ManagePosts = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("lost"); 
  const [posts, setPosts] = useState([]);
  
  // Loading States
  const [loadingData, setLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal States
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // --- SAFE FETCH FUNCTION (Client Side Sort) ---
  const fetchPosts = useCallback(async () => {
    // 1. Safety Check: Jika belum login, stop
    if (!currentUser) return;
    
    setIsRefreshing(true); 
    try {
      // 2. Query HANYA 'where' (Tanpa orderBy untuk mencegah crash index)
      const q = query(
        collection(db, "posts"), 
        where("userId", "==", currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 3. Sorting di JavaScript (Aman)
      data.sort((a, b) => {
         const dateA = a.createdAt?.seconds || 0;
         const dateB = b.createdAt?.seconds || 0;
         return dateB - dateA; // Descending (Terbaru diatas)
      });

      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingData(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [currentUser]);

  // Load Awal
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Filter Data
  const filteredPosts = posts.filter(post => {
    // Gunakan optional chaining (?.) untuk keamanan data
    if (activeTab === 'resolved') return post?.status === 'resolved';
    return post?.type === activeTab && post?.status !== 'resolved';
  });

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return "-";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // --- ACTIONS ---
  const onDeleteClick = (id) => { setSelectedPostId(id); setShowDeleteModal(true); };
  const onResolveClick = (id) => { setSelectedPostId(id); setShowResolveModal(true); };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "posts", selectedPostId));
      setShowDeleteModal(false);
      // PENTING: Refresh data setelah hapus
      fetchPosts(); 
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus.");
    }
  };

  const confirmResolve = async (finderType) => {
    try {
      await updateDoc(doc(db, "posts", selectedPostId), {
        status: 'resolved',
        foundBy: finderType,
        resolvedAt: new Date()
      });
      setShowResolveModal(false);
      setShowDonationModal(true);
      setCountdown(5);
      // PENTING: Refresh data setelah update
      fetchPosts(); 
    } catch (error) {
      console.error(error);
      alert("Gagal update status.");
    }
  };

  useEffect(() => {
    let timer;
    if (showDonationModal && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showDonationModal, countdown]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Nomor disalin!");
  };

  return (
    <PageContainer>
      <Navbar />
      
      <ContentWrapper>
        <HeaderRow>
          <Title>
            Kelola Postingan
            <span>Pantau status barang hilang & ditemukan.</span>
          </Title>
          
          <HeaderActions>
            {/* Tombol Refresh Manual */}
            <RefreshBtn onClick={fetchPosts} className={isRefreshing ? 'spinning' : ''} title="Refresh Data">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            </RefreshBtn>
            
            <AddBtn onClick={() => navigate("/add-post")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Buat Baru
            </AddBtn>
          </HeaderActions>
        </HeaderRow>

        <TabsContainer>
          <Tab active={activeTab === 'lost'} onClick={() => setActiveTab('lost')}>
             Barang Hilang ({posts.filter(p => p?.type === 'lost' && p?.status !== 'resolved').length})
          </Tab>
          <Tab active={activeTab === 'found'} onClick={() => setActiveTab('found')}>
             Ditemukan ({posts.filter(p => p?.type === 'found' && p?.status !== 'resolved').length})
          </Tab>
          <Tab active={activeTab === 'resolved'} onClick={() => setActiveTab('resolved')}>
             Selesai ({posts.filter(p => p?.status === 'resolved').length})
          </Tab>
        </TabsContainer>

        {loadingData ? <p style={{textAlign:'center', color:'#888', marginTop:'50px'}}>Memuat data...</p> : (
          filteredPosts.length > 0 ? (
            <ListContainer>
              {filteredPosts.map(post => (
                <ListItem key={post.id}>
                  <ItemInfo>
                    <MiniThumbnail 
                        src={post.mainImage || (post.imageUrls && post.imageUrls[0]) || "https://via.placeholder.com/60"} 
                        alt="Thumbnail" 
                    />
                    <ItemText>
                      <div className="top-row">
                        <StatusBadge type={post.type} status={post.status}>
                          {post.status === 'resolved' ? 'SELESAI' : (post.type === 'lost' ? 'HILANG' : 'DITEMUKAN')}
                        </StatusBadge>
                      </div>
                      <h3>{post.title || "Tanpa Judul"}</h3>
                      <div className="meta">
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {formatDate(post.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{post.location || "Lokasi tidak ada"}</span>
                      </div>
                    </ItemText>
                  </ItemInfo>

                  <ActionGroup>
                    {post.status !== 'resolved' && (
                      <ActionBtn className="resolve" onClick={() => onResolveClick(post.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Selesai
                      </ActionBtn>
                    )}
                    <ActionBtn className="delete" onClick={() => onDeleteClick(post.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      Hapus
                    </ActionBtn>
                  </ActionGroup>
                </ListItem>
              ))}
            </ListContainer>
          ) : (
            <EmptyState>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
              <p>Tidak ada postingan di kategori ini.</p>
            </EmptyState>
          )
        )}
      </ContentWrapper>

      {/* --- MODAL 1: DELETE CONFIRMATION --- */}
      {showDeleteModal && (
        <ModalOverlay>
          <ModalBox>
            <ModalIcon danger>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </ModalIcon>
            <ModalTitle>Hapus Postingan?</ModalTitle>
            <ModalText>Data yang dihapus tidak dapat dikembalikan lagi. Lanjutkan?</ModalText>
            <ButtonGroup>
               <ActionModalBtn className="cancel" onClick={() => setShowDeleteModal(false)}>Batal</ActionModalBtn>
               <ActionModalBtn className="danger" onClick={confirmDelete}>Ya, Hapus</ActionModalBtn>
            </ButtonGroup>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* --- MODAL 2: RESOLVE (PENEMU) --- */}
      {showResolveModal && (
        <ModalOverlay>
          <ModalBox>
            <ModalIcon>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </ModalIcon>
            <ModalTitle>Barang Sudah Kembali?</ModalTitle>
            <ModalText>Alhamdulillah! Siapa yang menemukan barang ini?</ModalText>
            
            <ChoiceBtn onClick={() => confirmResolve('internal')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Pengguna Lost N Found
            </ChoiceBtn>
            <ChoiceBtn onClick={() => confirmResolve('external')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              Pihak Luar / Ditemukan Sendiri
            </ChoiceBtn>
            
            <button onClick={() => setShowResolveModal(false)} style={{marginTop:'15px', background:'transparent', border:'none', color:'#888', cursor:'pointer', fontWeight:'600'}}>Batal</button>
          </ModalBox>
        </ModalOverlay>
      )}

      {/* --- MODAL 3: DONASI (5 DETIK) --- */}
      {showDonationModal && (
        <ModalOverlay>
          <ModalBox>
            <ModalIcon success>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </ModalIcon>
            <ModalTitle>Terima Kasih!</ModalTitle>
            <ModalText>Senang bisa membantu. Jika bermanfaat, Anda bisa berdonasi seikhlasnya.</ModalText>

            <BankInfo>
              <div onClick={() => copyToClipboard('4621123828')}>
                <span className="label">BCA</span>
                <span className="value">4621123828 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span>
              </div>
              <div onClick={() => copyToClipboard('081298460793')}>
                <span className="label">ShopeePay</span>
                <span className="value">081298460793 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span>
              </div>
            </BankInfo>

            <TimerBtn disabled={countdown > 0} onClick={() => setShowDonationModal(false)}>
              {countdown > 0 ? `Tutup dalam (${countdown}s)` : "Tutup Pesan"}
            </TimerBtn>
          </ModalBox>
        </ModalOverlay>
      )}

    </PageContainer>
  );
};

export default ManagePosts;