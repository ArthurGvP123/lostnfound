import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Tambahkan useLocation
import styled, { keyframes } from "styled-components";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
// Pastikan path ini benar (jika error module not found, cek struktur folder)
import { uploadToCloudinary } from "../utils/uploadImage"; 

// --- ANIMATIONS ---
const fadeInUp = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const popIn = keyframes`0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; }`;

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh; background: var(--light); padding-bottom: 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 800px; width: 95%; margin: 2rem auto;
  animation: ${fadeInUp} 0.5s ease-out;
`;

const FormCard = styled.div`
  background: var(--white); border-radius: 24px; padding: 2rem;
  box-shadow: var(--shadow-lg); overflow: hidden; position: relative;
  @media (max-width: 768px) { padding: 1.5rem; }
`;

const HeaderTitle = styled.h1`
  font-size: 1.8rem; font-weight: 800; color: var(--dark); margin-bottom: 1.5rem; text-align: center;
`;

const ToggleContainer = styled.div`
  display: flex; background: #f0f0f0; border-radius: 16px; padding: 5px; margin-bottom: 2rem; position: relative;
`;

const ToggleBtn = styled.button`
  flex: 1; padding: 12px; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; z-index: 2; transition: color 0.3s;
  color: ${props => props.active ? 'white' : '#888'};
  background: transparent;
`;

const ToggleIndicator = styled.div`
  position: absolute; top: 5px; bottom: 5px; width: calc(50% - 5px); border-radius: 12px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  left: ${props => props.mode === 'lost' ? '5px' : 'calc(50%)'};
  background: ${props => props.mode === 'lost' ? '#ef4444' : 'var(--dark)'};
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
`;

const UploadZone = styled.div`
  border: 2px dashed #ccc; border-radius: 16px; padding: 1rem; cursor: pointer; transition: all 0.2s; background: #fafafa; margin-bottom: 2rem; min-height: 200px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  &:hover { border-color: var(--primary); background: #fffdf0; }
`;

const PreviewGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; width: 100%; margin-bottom: 1rem;
`;

const PreviewItem = styled.div`
  position: relative; height: 100px; border-radius: 12px; overflow: hidden; border: 1px solid #ddd;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const RemoveBtn = styled.button`
  position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;
  &:hover { background: red; }
`;

const AddMoreBtn = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888;
  svg { width: 40px; height: 40px; margin-bottom: 5px; color: #ccc; }
`;

const FormGroup = styled.div` margin-bottom: 1.5rem; `;
const Label = styled.label` display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--dark); font-size: 0.95rem; `;
const Input = styled.input`
  width: 100%; padding: 12px 16px; border: 2px solid var(--border); border-radius: 12px; font-size: 1rem; transition: all 0.2s; font-family: inherit;
  &:focus { outline: none; border-color: var(--dark); background: var(--white); }
`;
const Select = styled.select`
  width: 100%; padding: 12px 16px; border: 2px solid var(--border); border-radius: 12px; font-size: 1rem; transition: all 0.2s; font-family: inherit; background: white; cursor: pointer;
  &:focus { outline: none; border-color: var(--dark); }
`;
const TextArea = styled.textarea`
  width: 100%; padding: 12px 16px; border: 2px solid var(--border); border-radius: 12px; font-size: 1rem; transition: all 0.2s; font-family: inherit; resize: vertical; min-height: 100px;
  &:focus { outline: none; border-color: var(--dark); }
`;
const CheckboxContainer = styled.label`
  display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 1rem; border: 1px solid var(--border); border-radius: 12px; transition: all 0.2s;
  &:hover { background: #f9f9f9; }
  input { width: 20px; height: 20px; accent-color: var(--primary); }
  div { display: flex; flex-direction: column; }
  span.title { font-weight: 600; font-size: 0.95rem; }
  span.desc { font-size: 0.8rem; color: #888; }
`;
const SubmitButton = styled.button`
  width: 100%; padding: 16px; border-radius: 16px; border: none; font-weight: 800; font-size: 1rem; cursor: pointer; margin-top: 1rem; transition: transform 0.1s;
  background: ${props => props.mode === 'lost' ? '#ef4444' : 'var(--dark)'};
  color: white;
  &:hover { opacity: 0.9; transform: translateY(-2px); }
  &:active { transform: scale(0.98); }
  &:disabled { background: #ccc; cursor: not-allowed; transform: none; }
`;

const ToastContainer = styled.div`
  position: fixed; bottom: 30px; right: 30px; z-index: 3000; display: flex; align-items: center; gap: 12px; background: var(--dark); color: var(--white); padding: 16px 24px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.25);
  svg { color: #4CAF50; }
`;

// --- NEW: BACK BUTTON FLOATING ---
const BackFab = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  color: var(--dark);
  border: 1px solid #ddd;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  z-index: 99;

  &:hover {
    transform: scale(1.1);
    background: #f8f8f8;
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  }
`;

const AddPost = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Untuk mendeteksi history
  const fileInputRef = useRef(null);

  // Form State
  const [postType, setPostType] = useState('lost');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "", category: "", date: "", location: "", description: "", reward: false
  });

  // Image State
  const [selectedFiles, setSelectedFiles] = useState([]); 
  const [previews, setPreviews] = useState([]);
  
  const [toastMsg, setToastMsg] = useState(null);
  const categories = ["Elektronik", "Dokumen", "Hewan Peliharaan", "Kunci", "Aksesoris", "Tas/Dompet", "Kendaraan", "Lainnya"];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (selectedFiles.length + filesArray.length > 5) {
        alert("Maksimal 5 foto per postingan!");
        return;
      }
      setSelectedFiles(prev => [...prev, ...filesArray]);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.date || !formData.location || !formData.description) {
      return alert("Mohon lengkapi data wajib!");
    }
    if (selectedFiles.length === 0) {
      return alert("Wajib upload minimal 1 foto!");
    }

    try {
      setLoading(true);

      const uploadPromises = selectedFiles.map(file => uploadToCloudinary(file));
      const imageUrls = await Promise.all(uploadPromises);

      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      let finalName = "Pengguna";
      let finalPhoto = "";

      if (userSnap.exists()) {
        const data = userSnap.data();
        finalName = data.name || currentUser.displayName || "Pengguna";
        finalPhoto = data.photoURL || currentUser.photoURL || "";
      } else {
        finalName = currentUser.displayName || "Pengguna";
        finalPhoto = currentUser.photoURL || "";
      }

      await addDoc(collection(db, "posts"), {
        ...formData,
        type: postType,
        imageUrls: imageUrls, 
        mainImage: imageUrls[0],
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: finalName, 
        userPhoto: finalPhoto,
        status: "open",
        createdAt: serverTimestamp(),
        searchKeywords: [
            formData.title.toLowerCase(), 
            formData.location.toLowerCase(), 
            formData.category.toLowerCase()
        ]
      });

      setToastMsg("Postingan berhasil diterbitkan!");
      
      // Redirect kembali ke halaman sebelumnya (atau Home jika tidak ada history)
      setTimeout(() => {
        if (location.key !== "default") {
            navigate(-1);
        } else {
            navigate("/");
        }
      }, 2000);

    } catch (error) {
      console.error("Error: ", error);
      alert("Gagal memposting: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Navbar />
      
      {toastMsg && (
        <ToastContainer>
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
           {toastMsg}
        </ToastContainer>
      )}

      <ContentWrapper>
        <HeaderTitle>Buat Postingan Baru</HeaderTitle>
        <FormCard>
          <ToggleContainer>
            <ToggleIndicator mode={postType} />
            <ToggleBtn active={postType === 'lost'} onClick={() => setPostType('lost')}>Barang Hilang</ToggleBtn>
            <ToggleBtn active={postType === 'found'} onClick={() => setPostType('found')}>Barang Ditemukan</ToggleBtn>
          </ToggleContainer>

          <form onSubmit={handleSubmit}>
            <Label>Foto Barang (Maks. 5)</Label>
            <UploadZone onClick={() => selectedFiles.length < 5 && fileInputRef.current.click()}>
              {previews.length > 0 ? (
                <div style={{width:'100%'}} onClick={(e) => e.stopPropagation()}>
                    <PreviewGrid>
                        {previews.map((src, index) => (
                            <PreviewItem key={index}>
                                <img src={src} alt="Preview" />
                                <RemoveBtn onClick={() => removeImage(index)}>✕</RemoveBtn>
                            </PreviewItem>
                        ))}
                    </PreviewGrid>
                    {selectedFiles.length < 5 && (
                        <button type="button" onClick={() => fileInputRef.current.click()} style={{background:'var(--dark)', color:'white', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontSize:'0.9rem'}}>
                            + Tambah Foto Lain
                        </button>
                    )}
                </div>
              ) : (
                <AddMoreBtn>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <p>Klik untuk upload foto</p>
                </AddMoreBtn>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileChange} 
                accept="image/*" 
                multiple 
                style={{display:'none'}} 
              />
            </UploadZone>

            <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
               <FormGroup>
                 <Label>Nama Barang</Label>
                 <Input name="title" placeholder="Contoh: Dompet Kulit Coklat" value={formData.title} onChange={handleChange} required />
               </FormGroup>
               <FormGroup>
                 <Label>Kategori</Label>
                 <Select name="category" value={formData.category} onChange={handleChange} required>
                   <option value="">Pilih Kategori</option>
                   {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                 </Select>
               </FormGroup>
            </div>

            <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
               <FormGroup>
                 <Label>{postType === 'lost' ? 'Waktu Hilang' : 'Waktu Ditemukan'}</Label>
                 <Input type="date" name="date" value={formData.date} onChange={handleChange} required />
               </FormGroup>
               <FormGroup>
                 <Label>{postType === 'lost' ? 'Lokasi Hilang (Perkiraan)' : 'Lokasi Ditemukan'}</Label>
                 <Input name="location" placeholder="Contoh: Stasiun Tebet" value={formData.location} onChange={handleChange} required />
               </FormGroup>
            </div>

            <FormGroup>
               <Label>Deskripsi Detail</Label>
               <TextArea name="description" placeholder="Jelaskan ciri-ciri khusus, isi barang, atau kronologi singkat..." value={formData.description} onChange={handleChange} required />
            </FormGroup>

            {postType === 'lost' && (
              <FormGroup>
                <CheckboxContainer>
                   <input type="checkbox" name="reward" checked={formData.reward} onChange={handleChange} />
                   <div>
                     <span className="title">Tawarkan Imbalan?</span>
                     <span className="desc">Centang jika Anda ingin memberikan hadiah bagi penemu.</span>
                   </div>
                </CheckboxContainer>
              </FormGroup>
            )}

            <SubmitButton type="submit" disabled={loading} mode={postType}>
              {loading ? "Menerbitkan..." : (postType === 'lost' ? "Terbitkan Info Kehilangan" : "Terbitkan Info Penemuan")}
            </SubmitButton>

          </form>
        </FormCard>
      </ContentWrapper>

      {/* --- BACK BUTTON (SMART NAVIGATION) --- */}
      <BackFab onClick={() => {
          if (window.history.length > 1) {
             navigate(-1); // Kembali ke halaman sebelumnya (Home atau ManagePost)
          } else {
             navigate("/"); // Fallback ke Home jika tidak ada history
          }
      }} title="Kembali">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'24px', height:'24px'}}>
            <path d="M19 12H5"></path>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </BackFab>

    </PageContainer>
  );
};

export default AddPost;