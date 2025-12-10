// src/pages/Register.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

// --- ANIMATION ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- STYLED COMPONENTS (Mirip Login, tapi kita definisikan ulang agar independen) ---
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: var(--white);
`;

const VisualSide = styled.div`
  flex: 1;
  background-color: var(--dark);
  background-image: repeating-linear-gradient(
    45deg,
    #1a1a1a,
    #1a1a1a 20px,
    #141414 20px,
    #141414 40px
  );
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
  color: var(--primary);

  &::before {
    content: '';
    position: absolute;
    bottom: -100px;
    left: -100px;
    width: 300px;
    height: 300px;
    background: var(--primary);
    border-radius: 50%;
    opacity: 0.1;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const VisualContent = styled.div`
  z-index: 2;
  text-align: center;
  animation: ${fadeIn} 0.8s ease-out;

  h1 {
    font-size: 3.5rem;
    margin: 0;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: -2px;
  }
  
  span { color: var(--white); }

  p {
    color: #cccccc;
    font-size: 1.1rem;
    margin-top: 1rem;
    max-width: 400px;
    line-height: 1.6;
  }
`;

const FormSide = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: var(--white);
`;

const FormWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  
  h2 {
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    font-weight: 800;
    color: var(--dark);
  }
  
  p {
    color: var(--gray);
    margin: 0;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--dark);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-family: inherit;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: #fcfcfc;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--dark);
    background: var(--white);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: var(--primary);
  color: var(--dark);
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  font-family: inherit;

  &:hover {
    background-color: var(--primary-hover);
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Footer = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--gray);

  a {
    color: var(--dark);
    font-weight: 700;
    text-decoration: none;
    border-bottom: 2px solid var(--primary);
  }
`;

const ErrorMsg = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  border: 1px solid #fecaca;
`;

// --- COMPONENT LOGIC ---
const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await register(formData.email, formData.password, formData.name, formData.phone);
      navigate("/"); 
    } catch (err) {
      setError("Gagal mendaftar: " + err.message);
    }
    setLoading(false);
  };

  return (
    <Container>
      {/* KIRI: VISUAL (Ditukar polanya atau sama juga boleh) */}
      <VisualSide>
        <VisualContent>
          <h1>Bergabung <br/><span>Sekarang</span></h1>
          <p>Komunitas saling bantu terbesar untuk menemukan barang hilang.</p>
        </VisualContent>
      </VisualSide>

      {/* KANAN: FORM */}
      <FormSide>
        <FormWrapper>
          <Header>
            <h2>Buat Akun Baru</h2>
            <p>Lengkapi data diri Anda untuk memulai.</p>
          </Header>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          
          <form onSubmit={handleSubmit}>
            <InputGroup>
              <label>Nama Lengkap</label>
              <Input 
                type="text" 
                name="name" 
                required 
                placeholder="Nama Anda"
                onChange={handleChange} 
              />
            </InputGroup>

            <InputGroup>
              <label>Nomor WhatsApp</label>
              <Input 
                type="tel" 
                name="phone" 
                required 
                placeholder="0812..."
                onChange={handleChange} 
              />
            </InputGroup>

            <InputGroup>
              <label>Email</label>
              <Input 
                type="email" 
                name="email" 
                required 
                placeholder="nama@email.com"
                onChange={handleChange} 
              />
            </InputGroup>

            <InputGroup>
              <label>Password</label>
              <Input 
                type="password" 
                name="password" 
                required 
                placeholder="Minimal 6 karakter"
                minLength="6"
                onChange={handleChange} 
              />
            </InputGroup>

            <Button disabled={loading} type="submit">
              {loading ? "Memproses..." : "Daftar Akun"}
            </Button>
          </form>

          <Footer>
            Sudah punya akun? <Link to="/login">Masuk disini</Link>
          </Footer>
        </FormWrapper>
      </FormSide>
    </Container>
  );
};

export default Register;