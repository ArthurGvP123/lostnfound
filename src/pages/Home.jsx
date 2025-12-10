import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import styled, { keyframes, css } from "styled-components";
import Navbar from "../components/Navbar";
import ItemCard from "../components/ItemCard";

// --- FIREBASE IMPORTS ---
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

// --- ANIMATIONS ---
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 213, 0, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(255, 213, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 213, 0, 0); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh;
  padding-bottom: 2rem;
  background: var(--light);
  overflow-x: hidden;
`;

const HeroWrapper = styled.div`
  background: var(--dark);
  color: var(--white);
  padding: 3rem 1.5rem 5rem; 
  position: relative;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  text-align: left;
  z-index: 10;

  @media (min-width: 768px) {
    padding: 4rem 2.5rem 6rem;
    border-bottom-left-radius: 50px;
    border-bottom-right-radius: 50px;
  }

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255,213,0,0.15) 0%, rgba(0,0,0,0) 70%);
    pointer-events: none;
    z-index: -1;
    @media (min-width: 768px) { width: 600px; height: 600px; }
  }
`;

const Container = styled.div`
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1.5rem; 
  @media (min-width: 768px) { padding: 0 2.5rem; }
`;

const HeroContent = styled.div`
  max-width: 1100px; margin: 0 auto; padding: 0; 
`;

const HeroTitle = styled.h1`
  font-size: 2rem; font-weight: 800; margin: 0; line-height: 1.2; animation: ${fadeInUp} 0.6s ease-out;
  span { color: var(--primary); }
  @media (min-width: 768px) { font-size: 3.5rem; }
`;

const HeroSubtitle = styled.p`
  color: #aaaaaa; font-size: 0.95rem; margin-top: 1rem; max-width: 500px; line-height: 1.6; animation: ${fadeInUp} 0.6s ease-out 0.1s backwards;
  @media (min-width: 768px) { font-size: 1.1rem; }
`;

// --- SEARCH & FILTER COMPONENTS ---
const SearchRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 2rem;
  animation: ${fadeInUp} 0.6s ease-out 0.2s backwards;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
`;

const SearchBoxWrapper = styled.div`
  position: relative;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%; padding: 1rem 1.2rem; padding-left: 3rem; border-radius: 20px; border: 2px solid transparent; background: rgba(255,255,255,0.1); color: var(--white); font-size: 0.95rem; font-family: inherit; backdrop-filter: blur(5px); transition: all 0.3s ease;
  &::placeholder { color: #888; }
  &:focus { background: var(--white); color: var(--dark); border-color: var(--primary); outline: none; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
  @media (min-width: 768px) { padding: 1.2rem 1.5rem; padding-left: 3.5rem; font-size: 1rem; }
`;

const SearchIcon = styled.svg`
  position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; transition: all 0.3s ease; width: 18px; height: 18px;
  @media (min-width: 768px) { left: 1.2rem; width: 20px; height: 20px; }
  ${SearchInput}:focus + & { color: var(--primary); }
`;

const FilterToggleBtn = styled.button`
  background: ${props => props.active ? 'var(--primary)' : 'rgba(255,255,255,0.1)'};
  color: ${props => props.active ? 'var(--dark)' : 'var(--white)'};
  border: 2px solid transparent;
  padding: 0 1.5rem;
  height: 54px; /* Samakan tinggi dengan input search */
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  white-space: nowrap;
  justify-content: center;

  &:hover {
    background: var(--primary);
    color: var(--dark);
  }
  
  svg { width: 18px; height: 18px; }
`;

// --- FILTER PANEL ---
const FilterPanel = styled.div`
  background: var(--white);
  margin-top: 15px;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  animation: ${slideDown} 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  gap: 15px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
  }
`;

const FilterGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  label { font-size: 0.85rem; font-weight: 600; color: var(--dark); margin-left: 5px; }
`;

const FilterInput = styled.input`
  width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid #ddd; font-family: inherit; font-size: 0.9rem;
  &:focus { outline: none; border-color: var(--primary); }
`;

const FilterSelect = styled.select`
  width: 100%; padding: 10px 14px; border-radius: 12px; border: 1px solid #ddd; font-family: inherit; font-size: 0.9rem; background: white;
  &:focus { outline: none; border-color: var(--primary); }
`;

const ResetBtn = styled.button`
  padding: 10px 20px; border-radius: 12px; border: 1px solid #ddd; background: transparent; color: #666; font-weight: 600; cursor: pointer; height: 42px;
  &:hover { background: #f0f0f0; color: var(--dark); }
`;

// --- CONTENT COMPONENTS ---
const TabsWrapper = styled.div`
  display: flex; justify-content: center; margin-top: -2rem; margin-bottom: 2rem; position: relative; z-index: 10; animation: ${fadeInUp} 0.6s ease-out 0.3s backwards;
`;

const TabsBox = styled.div`
  background: var(--white); padding: 5px; border-radius: 50px; display: flex; box-shadow: var(--shadow-md); max-width: 90%;
`;

const TabBtn = styled.button`
  padding: 0.7rem 1.5rem; border-radius: 40px; border: none; background: ${props => props.active ? 'var(--dark)' : 'transparent'}; color: ${props => props.active ? 'var(--primary)' : 'var(--gray)'}; font-weight: 600; font-family: inherit; font-size: 0.9rem; cursor: pointer; transition: all 0.3s ease; box-shadow: ${props => props.active ? '0 4px 10px rgba(0,0,0,0.2)' : 'none'}; white-space: nowrap;
  @media (min-width: 768px) { padding: 0.8rem 2.5rem; font-size: 1rem; }
`;

const Grid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; padding-bottom: 100px;
  @media (min-width: 768px) { gap: 24px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
`;

const FabBtn = styled.button`
  position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: var(--dark); color: var(--primary); border: none; font-size: 2rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.3); transition: all 0.3s ease; z-index: 99; animation: ${pulse} 2s infinite;
  &:hover { transform: scale(1.1) rotate(90deg); background: var(--primary); color: var(--dark); animation: none; }
  @media (min-width: 768px) { width: 64px; height: 64px; bottom: 30px; right: 30px; }
`;

const EmptyState = styled.div`
  text-align: center; padding: 80px 20px; color: var(--gray); display: flex; flex-direction: column; align-items: center; justify-content: center; animation: ${fadeInUp} 0.5s ease-out;
  svg { width: 80px; height: 80px; margin-bottom: 1.5rem; color: #e0e0e0; stroke-width: 1.5; }
  h3 { margin-bottom: 0.5rem; color: var(--dark); font-size: 1.3rem; font-weight: 700; }
  p { font-size: 1rem; color: #888; max-width: 400px; margin: 0 auto; line-height: 1.5; }
`;

const LoadingState = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px 0; color: #888;
  .spinner {
    width: 40px; height: 40px; border: 4px solid #e0e0e0; border-top: 4px solid var(--primary); border-radius: 50%; animation: ${spin} 1s linear infinite; margin-bottom: 20px;
  }
`;

const Home = () => {
  const navigate = useNavigate(); 
  const categories = ["Elektronik", "Dokumen", "Hewan Peliharaan", "Kunci", "Aksesoris", "Tas/Dompet", "Kendaraan", "Lainnya"];
  
  // STATE
  const [activeTab, setActiveTab] = useState("lost");
  const [searchTerm, setSearchTerm] = useState("");
  
  // -- NEW FILTER STATES --
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    date: "",
    location: ""
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  useEffect(() => {
    const postsRef = collection(db, "posts");
    const q = query(postsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Perubahan Filter Input
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reset semua filter
  const resetFilters = () => {
    setFilters({ category: "", date: "", location: "" });
    setSearchTerm("");
  };

  // --- SUPER FILTER LOGIC (DIPERBARUI) ---
  const filteredItems = posts.filter(item => {
    // 1. Cek STATUS (Wajib: Harus 'open')
    // Jika status bukan 'open', langsung return false (jangan tampilkan)
    if (item.status !== 'open') return false;

    // 2. Filter Tab (Wajib: Lost / Found)
    const matchesTab = item.type === activeTab;
    
    // 3. Filter Search Global (Judul)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.title?.toLowerCase().includes(searchLower);

    // 4. Filter Spesifik (AND Logic)
    const matchesCategory = filters.category ? item.category === filters.category : true;
    const matchesDate = filters.date ? item.date === filters.date : true; // Match string YYYY-MM-DD
    const matchesLocation = filters.location ? item.location.toLowerCase().includes(filters.location.toLowerCase()) : true;

    // Gabungkan semua kondisi
    return matchesTab && matchesSearch && matchesCategory && matchesDate && matchesLocation;
  });

  return (
    <PageContainer>
      <Navbar />

      <HeroWrapper>
        <HeroContent>
          <HeroTitle>
            Kehilangan <span>Sesuatu?</span><br/>
            Kami Bantu Temukan.
          </HeroTitle>
          <HeroSubtitle>
            Platform komunitas terbesar untuk melaporkan kehilangan dan penemuan barang di sekitarmu.
          </HeroSubtitle>
          
          {/* BARIS PENCARIAN & TOGGLE FILTER */}
          <SearchRow>
            <SearchBoxWrapper>
              <SearchInput 
                type="text" 
                placeholder="Cari nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <SearchIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></SearchIcon>
            </SearchBoxWrapper>

            <FilterToggleBtn 
              active={showFilters} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filter
            </FilterToggleBtn>
          </SearchRow>

          {/* PANEL FILTER (Slide Down) */}
          {showFilters && (
            <FilterPanel>
              <FilterGroup>
                <label>Kategori</label>
                <FilterSelect name="category" value={filters.category} onChange={handleFilterChange}>
                  <option value="">Semua Kategori</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </FilterSelect>
              </FilterGroup>

              <FilterGroup>
                <label>Lokasi (Kota/Area)</label>
                <FilterInput 
                  type="text" 
                  name="location" 
                  placeholder="Contoh: Tebet" 
                  value={filters.location} 
                  onChange={handleFilterChange} 
                />
              </FilterGroup>

              <FilterGroup>
                <label>Tanggal Kejadian</label>
                <FilterInput 
                  type="date" 
                  name="date" 
                  value={filters.date} 
                  onChange={handleFilterChange} 
                />
              </FilterGroup>

              <ResetBtn onClick={resetFilters} title="Reset Filter">
                Reset
              </ResetBtn>
            </FilterPanel>
          )}

        </HeroContent>
      </HeroWrapper>

      <Container>
        <TabsWrapper>
          <TabsBox>
            <TabBtn active={activeTab === 'lost'} onClick={() => setActiveTab('lost')}>
                Barang Hilang
            </TabBtn>
            <TabBtn active={activeTab === 'found'} onClick={() => setActiveTab('found')}>
                Ditemukan
            </TabBtn>
          </TabsBox>
        </TabsWrapper>

        {loading ? (
          <LoadingState>
            <div className="spinner"></div>
            <p>Memuat data terbaru...</p>
          </LoadingState>
        ) : filteredItems.length > 0 ? (
           <Grid>
             {filteredItems.map((item, index) => (
               <ItemCard key={item.id} item={item} index={index} />
             ))}
           </Grid>
        ) : (
          <EmptyState>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3>Belum ada postingan ditemukan</h3>
            <p>Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
            {/* Tombol Clear Filter jika hasil kosong */}
            {(filters.category || filters.date || filters.location || searchTerm) && (
               <button 
                 onClick={resetFilters}
                 style={{marginTop:'15px', color:'var(--primary)', fontWeight:'bold', border:'none', background:'transparent', cursor:'pointer'}}
               >
                 Hapus semua filter
               </button>
            )}
          </EmptyState>
        )}
      </Container>

      <FabBtn onClick={() => navigate("/add-post")} title="Buat Postingan">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </FabBtn>
    </PageContainer>
  );
};

export default Home;