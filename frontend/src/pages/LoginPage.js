import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const LoginPage = ({ onLogin }) => {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        id_number: idNumber,
        password: password
      });

      toast.success('Login successful!');
      onLogin(response.data.token, response.data.user);
      
      if (response.data.user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1592669282789-cf5eac5807e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBoaWdoJTIwc2Nob29sJTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MHx8fHwxNzc1NTczNDk2fDA&ixlib=rb-4.1.0&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-md">
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>BISD HUB</h1>
            <p className="text-base font-medium text-[#4B4B4B]">Welcome back! Login to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="id-number" className="text-sm font-bold uppercase tracking-wider mb-2 block">ID Number</Label>
              <Input
                id="id-number"
                data-testid="login-id-input"
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-[#A7F3D0] focus:border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                placeholder="Enter your ID number"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider mb-2 block">Password</Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-[#A7F3D0] focus:border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                placeholder="Enter your password"
                required
              />
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] text-[#FDFBF7] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-75 font-bold py-3 rounded-xl"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm font-medium text-[#4B4B4B]">
              New to BISD HUB?{' '}
              <Link to="/register" className="text-[#2563EB] font-bold hover:underline" data-testid="register-link">
                Register here
              </Link>
            </p>
            <p className="text-sm font-medium text-[#4B4B4B]">
              <Link to="/pending-registration" className="text-[#2563EB] font-bold hover:underline" data-testid="check-status-link">
                Check registration status
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
