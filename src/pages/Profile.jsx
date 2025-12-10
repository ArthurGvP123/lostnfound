import { useState, useEffect, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { uploadToCloudinary } from "../utils/uploadImage";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage"; 
import defaultAvatar from "../assets/anonim.jpg"; 

// --- ANIMATIONS ---
const fadeInUp = keyframes`from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }`;
const popIn = keyframes`0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; }`;
const slideInRight = keyframes`from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; }`;

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh; background: var(--light); padding-bottom: 4rem; overflow-x: hidden;
`;

const HeaderSection = styled.div`
  background: var(--dark);
  padding: 4rem 1.5rem 8rem; /* Header lebih tinggi */
  border-bottom-left-radius: 50px;
  border-bottom-right-radius: 50px;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute; top: -50%; left: 50%; transform: translateX(-50%);
    width: 800px; height: 800px;
    background: radial-gradient(circle, rgba(255,213,0,0.08) 0%, rgba(0,0,0,0) 70%);
    pointer-events: none;
  }
  
  h1 { color: white; margin: 0; font-size: 2rem; font-weight: 800; letter-spacing: -0.5px; }
  p { color: #aaa; margin-top: 10px; font-size: 1rem; }
`;

// --- CARD YANG LEBIH BESAR & BERSIH ---
const ProfileCard = styled.div`
  background: var(--white);
  max-width: 800px; /* Lebih lebar */
  width: 90%;
  margin: -6rem auto 0; /* Overlap header lebih banyak */
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
  padding: 3rem 2rem;
  
  display: flex;
  flex-direction: column;
  align-items: center;
  
  position: relative;
  animation: ${fadeInUp} 0.6s ease-out;

  @media (min-width: 768px) {
    padding: 4rem;
  }
`;

// --- AVATAR SECTION ---
const AvatarWrapper = styled.div`
  position: relative;
  margin-bottom: 2rem;
`;

const Avatar = styled.img`
  width: 160px; height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 6px solid var(--white);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  background: #eee;
`;

const EditPhotoBtn = styled.button`
  position: absolute; bottom: 5px; right: 5px;
  width: 45px; height: 45px;
  border-radius: 50%;
  background: var(--primary);
  border: 4px solid var(--white);
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--dark);
  transition: transform 0.2s;

  &:hover { transform: scale(1.1); }
  svg { width: 20px; height: 20px; }
`;

// --- FORM SECTION ---
const FormContainer = styled.div`
  width: 100%;
  max-width: 500px; /* Agar input tidak terlalu panjang */
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InfoGroup = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  text-align: left;
  
  label {
    font-size: 0.9rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px;
  }
`;

const DisplayValue = styled.div`
  font-size: 1.2rem; font-weight: 600; color: var(--dark);
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  display: flex; align-items: center; gap: 10px;
  
  svg { color: var(--primary); width: 20px; height: 20px; }
`;

const InputField = styled.input`
  width: 100%; padding: 14px 16px;
  border: 2px solid #eee; border-radius: 12px;
  font-size: 1.1rem; font-family: inherit; color: var(--dark);
  transition: all 0.2s;
  
  &:focus { outline: none; border-color: var(--primary); background: #fffcf0; }
  &:disabled { background: #f9f9f9; color: #aaa; }
`;

// --- ACTION BUTTONS ---
const ActionRow = styled.div`
  margin-top: 3rem;
  display: flex; gap: 15px; width: 100%; justify-content: center;
`;

const Button = styled.button`
  padding: 14px 30px; border-radius: 50px; border: none; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s; min-width: 140px;
  
  &.primary { background: var(--dark); color: var(--primary); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
  &.primary:hover { transform: translateY(-2px); opacity: 0.9; }

  &.secondary { background: #f3f3f3; color: var(--dark); }
  &.secondary:hover { background: #e0e0e0; }

  &.save { background: var(--primary); color: var(--dark); }
  &.save:hover { opacity: 0.9; }
`;

// --- POPUP & MODALS ---
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); padding: 20px;
`;
const CropContainer = styled.div`
  background: var(--white); width: 100%; max-width: 500px; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; height: 70vh; max-height: 600px; animation: ${popIn} 0.3s ease-out;
`;
const CropperWrapper = styled.div` position: relative; flex: 1; background: #111; `;
const CropControls = styled.div` padding: 1.5rem; display: flex; justify-content: space-between; gap: 10px; background: var(--white); border-top: 1px solid var(--border); `;
const ConfirmBox = styled.div`
  background: var(--white); width: 100%; max-width: 350px; border-radius: 24px; padding: 2rem; text-align: center; animation: ${popIn} 0.3s ease-out; box-shadow: 0 25px 50px rgba(0,0,0,0.3);
`;
const DangerIconWrapper = styled.div`
  width: 70px; height: 70px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: #ef4444; svg { width: 35px; height: 35px; }
`;
const ConfirmTitle = styled.h3` margin: 0 0 10px 0; color: var(--dark); font-size: 1.4rem; font-weight: 800; `;
const ConfirmText = styled.p` color: #666; margin-bottom: 2rem; line-height: 1.5; font-size: 0.95rem; `;

const ToastContainer = styled.div`
  position: fixed; bottom: 30px; right: 30px; z-index: 3000; display: flex; align-items: center; gap: 12px; background: var(--dark); color: var(--white); padding: 16px 24px; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.25); animation: ${slideInRight} 0.4s;
  svg { color: #4CAF50; width: 24px; height: 24px; }
`;

const HiddenInput = styled.input` display: none; `;

// --- MENU OPSI FOTO (Hapus/Ganti) ---
const PhotoMenu = styled.div`
  position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%);
  background: white; padding: 10px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  display: flex; gap: 10px; z-index: 10; animation: ${popIn} 0.2s;
  
  button {
    border: none; background: transparent; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 5px 10px; border-radius: 6px;
    &:hover { background: #f0f0f0; }
    &.del { color: #ef4444; }
    &.del:hover { background: #fee2e2; }
  }
`;


// --- COMPONENT LOGIC ---
const Profile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  
  // State Edit Data
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  
  // State UI
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State Cropping
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch Data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser?.uid) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setEditForm({ 
            name: data.name || currentUser.displayName || "", 
            phone: data.phone || "" 
          });
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // --- HANDLERS EDIT TEXT ---
  const handleEditToggle = () => {
    if (isEditing) {
      // Jika batal edit, kembalikan ke data asli
      setEditForm({ 
        name: userData?.name || currentUser.displayName || "", 
        phone: userData?.phone || "" 
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) return alert("Nama tidak boleh kosong");
    
    setLoading(true);
    try {
      // 1. Update Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        name: editForm.name,
        phone: editForm.phone
      });

      // 2. Update Auth Profile (DisplayName)
      await updateProfile(auth.currentUser, { displayName: editForm.name });

      // 3. Update State Lokal
      setUserData(prev => ({ ...prev, name: editForm.name, phone: editForm.phone }));
      
      setIsEditing(false);
      showToast("Profil berhasil diperbarui!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan profil.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS FOTO ---
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
        setShowPhotoMenu(false);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    try {
      setLoading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const photoURL = await uploadToCloudinary(croppedImageBlob);

      await updateProfile(auth.currentUser, { photoURL });
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { photoURL });

      setUserData(prev => ({ ...prev, photoURL }));
      setShowCropper(false);
      showToast("Foto profil diperbarui!");
    } catch (e) {
      console.error(e);
      alert("Gagal memproses gambar.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setLoading(true);
      await updateProfile(auth.currentUser, { photoURL: "" });
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { photoURL: "" });
      
      setUserData(prev => ({ ...prev, photoURL: "" }));
      setShowDeleteConfirm(false);
      showToast("Foto profil dihapus.");
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus foto.");
    } finally {
      setLoading(false);
    }
  };

  const displayImage = userData?.photoURL || currentUser?.photoURL || defaultAvatar;
  const hasCustomPhoto = displayImage !== defaultAvatar;

  return (
    <PageContainer>
      <Navbar />
      
      {/* HEADER BACKGROUND */}
      <HeaderSection>
        <h1>Profil Saya</h1>
        <p>Kelola informasi akun Anda di sini</p>
      </HeaderSection>

      {/* TOAST NOTIFIKASI */}
      {toastMsg && (
        <ToastContainer>
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
           {toastMsg}
        </ToastContainer>
      )}

      <ProfileCard>
        {/* AVATAR */}
        <AvatarWrapper>
          <Avatar src={displayImage} alt="Profile" onError={(e) => { e.target.src = defaultAvatar; }} />
          
          <EditPhotoBtn onClick={() => hasCustomPhoto ? setShowPhotoMenu(!showPhotoMenu) : fileInputRef.current.click()}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </EditPhotoBtn>

          {showPhotoMenu && (
            <PhotoMenu>
               <button onClick={() => fileInputRef.current.click()}>Ganti Foto</button>
               <button className="del" onClick={() => { setShowPhotoMenu(false); setShowDeleteConfirm(true); }}>Hapus</button>
            </PhotoMenu>
          )}

          <HiddenInput type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" />
        </AvatarWrapper>

        {/* FORM INFO */}
        <FormContainer>
          <InfoGroup>
             <label>Nama Lengkap</label>
             {isEditing ? (
                <InputField 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
             ) : (
                <DisplayValue>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  {userData?.name || "Nama Belum Diatur"}
                </DisplayValue>
             )}
          </InfoGroup>

          <InfoGroup>
             <label>Email (Tidak dapat diubah)</label>
             <DisplayValue style={{color: '#888', borderBottom: isEditing ? '2px solid #eee' : '1px solid #eee'}}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
               {currentUser?.email}
             </DisplayValue>
          </InfoGroup>

          <InfoGroup>
             <label>Nomor Telepon (WhatsApp)</label>
             {isEditing ? (
                <InputField 
                  type="tel" 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  placeholder="Contoh: 0812..."
                />
             ) : (
                <DisplayValue>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  {userData?.phone || "-"}
                </DisplayValue>
             )}
          </InfoGroup>
        </FormContainer>

        {/* ACTION BUTTONS */}
        <ActionRow>
          {isEditing ? (
            <>
               <Button className="secondary" onClick={handleEditToggle} disabled={loading}>Batal</Button>
               <Button className="save" onClick={handleSaveProfile} disabled={loading}>
                 {loading ? "Menyimpan..." : "Simpan Perubahan"}
               </Button>
            </>
          ) : (
             <Button className="primary" onClick={handleEditToggle}>Edit Profil</Button>
          )}
        </ActionRow>

      </ProfileCard>

      {/* MODAL CROPPER */}
      {showCropper && (
        <ModalOverlay>
          <CropContainer>
            <CropperWrapper>
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </CropperWrapper>
            <CropControls>
              <Button className="secondary" onClick={() => setShowCropper(false)}>Batal</Button>
              <Button className="save" onClick={handleSaveCrop}>{loading ? "..." : "Simpan Foto"}</Button>
            </CropControls>
          </CropContainer>
        </ModalOverlay>
      )}

      {/* MODAL CONFIRM DELETE PHOTO */}
      {showDeleteConfirm && (
        <ModalOverlay>
          <ConfirmBox>
            <DangerIconWrapper>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </DangerIconWrapper>
            <ConfirmTitle>Hapus Foto?</ConfirmTitle>
            <ConfirmText>Foto profil akan dikembalikan ke default.</ConfirmText>
            <ActionRow style={{marginTop:0}}>
               <Button className="secondary" onClick={() => setShowDeleteConfirm(false)}>Batal</Button>
               <Button className="primary" style={{background:'#ef4444', color:'white'}} onClick={handleDeletePhoto}>{loading ? "..." : "Hapus"}</Button>
            </ActionRow>
          </ConfirmBox>
        </ModalOverlay>
      )}

    </PageContainer>
  );
};

export default Profile;