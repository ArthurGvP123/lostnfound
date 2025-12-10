// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

// --- ANIMATION ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- STYLED COMPONENTS ---
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: var(--white);
`;

const VisualSide = styled.div`
  flex: 1;
  background-color: var(--dark);
  /* Pola garis halus */
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

  /* Lingkaran Dekorasi */
  &::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: var(--primary);
    border-radius: 50%;
    opacity: 0.1;
  }

  @media (max-width: 768px) {
    display: none; /* Sembunyikan di HP */
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
  margin-bottom: 2.5rem;
  
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
  margin-bottom: 1.25rem;
  
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

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: var(--gray);
  font-size: 0.85rem;

  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--border);
  }
  &::before { margin-right: .5em; }
  &::after { margin-left: .5em; }
`;

const GoogleBtn = styled.button`
  width: 100%;
  padding: 0.8rem;
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: 12px;
  color: var(--dark);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s;
  font-family: inherit;

  &:hover {
    background: #f9f9f9;
    border-color: #ccc;
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
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Email atau password salah.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Gagal login dengan Google.");
    }
    setLoading(false);
  };

  return (
    <Container>
      {/* KIRI: VISUAL */}
      <VisualSide>
        <VisualContent>
          <h1>Lost <span>N</span> Found</h1>
          <p>Temukan kembali barang berharga Anda atau jadilah pahlawan bagi orang lain.</p>
        </VisualContent>
      </VisualSide>

      {/* KANAN: FORM */}
      <FormSide>
        <FormWrapper>
          <Header>
            <h2>Selamat Datang</h2>
            <p>Masuk untuk mulai mencari atau melaporkan.</p>
          </Header>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          
          <form onSubmit={handleLogin}>
            <InputGroup>
              <label>Email Address</label>
              <Input 
                type="email" 
                required 
                placeholder="contoh@email.com"
                onChange={(e) => setEmail(e.target.value)} 
              />
            </InputGroup>

            <InputGroup>
              <label>Password</label>
              <Input 
                type="password" 
                required 
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)} 
              />
            </InputGroup>

            <Button disabled={loading} type="submit">
              {loading ? "Memuat..." : "Masuk Sekarang"}
            </Button>
          </form>

          <Divider>atau masuk dengan</Divider>

          <GoogleBtn onClick={handleGoogleLogin} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Google
          </GoogleBtn>

          <Footer>
            Belum punya akun? <Link to="/register">Daftar disini</Link>
          </Footer>
        </FormWrapper>
      </FormSide>
    </Container>
  );
};

export default Login;