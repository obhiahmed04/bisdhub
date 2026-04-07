import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const RegistrationPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id_number: '',
    full_name: '',
    date_of_birth: '',
    current_class: '',
    section: '',
    email: '',
    phone_number: '',
    is_ex_student: false,
    date_of_leaving: '',
    last_class: ''
  });

  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const sendOTP = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/send-otp`, { email: formData.email });
      toast.success('OTP sent to your email!');
      if (response.data.dev_otp) {
        toast.info(`Dev OTP: ${response.data.dev_otp}`);
      }
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        email: formData.email,
        otp: otp
      });
      toast.success('Email verified!');
      setEmailVerified(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!emailVerified) {
      toast.error('Please verify your email first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, formData);
      toast.success('Registration submitted! Awaiting admin approval.');
      // Navigate to pending page with serial number
      navigate('/pending-registration', { state: { serialNumber: response.data.serial_number } });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.id_number || !formData.full_name || !formData.date_of_birth)) {
      toast.error('Please fill all fields');
      return;
    }
    if (step === 2 && (!formData.current_class || !formData.section)) {
      toast.error('Please fill all fields');
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1592669282789-cf5eac5807e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBoaWdoJTIwc2Nob29sJTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MHx8fHwxNzc1NTczNDk2fDA&ixlib=rb-4.1.0&q=85)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-2xl">
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Join BISD HUB</h1>
            <p className="text-base font-medium text-[#4B4B4B]">Step {step} of 3</p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">ID Number</Label>
                <Input
                  data-testid="register-id-input"
                  value={formData.id_number}
                  onChange={(e) => handleChange('id_number', e.target.value)}
                  className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  placeholder="e.g., BISD12345"
                />
              </div>
              <div>
                <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Full Name</Label>
                <Input
                  data-testid="register-name-input"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  placeholder="Your full name as per BISD records"
                />
              </div>
              <div>
                <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Date of Birth (DD/MM/YYYY)</Label>
                <Input
                  data-testid="register-dob-input"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <Button
                data-testid="register-next-step1"
                onClick={nextStep}
                className="w-full bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-3 rounded-xl"
              >
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Are you a Current or EX Student?</Label>
                <Select value={formData.is_ex_student ? 'ex' : 'current'} onValueChange={(val) => handleChange('is_ex_student', val === 'ex')}>
                  <SelectTrigger data-testid="register-student-status" className="border-2 border-[#111111] rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Student</SelectItem>
                    <SelectItem value="ex">EX Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.is_ex_student ? (
                <>
                  <div>
                    <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Date of Leaving (DD/MM/YYYY)</Label>
                    <Input
                      data-testid="register-leaving-date"
                      value={formData.date_of_leaving}
                      onChange={(e) => handleChange('date_of_leaving', e.target.value)}
                      className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Last Class</Label>
                    <Input
                      data-testid="register-last-class"
                      value={formData.last_class}
                      onChange={(e) => handleChange('last_class', e.target.value)}
                      className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                      placeholder="e.g., Grade 12"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Current Class</Label>
                    <Input
                      data-testid="register-class-input"
                      value={formData.current_class}
                      onChange={(e) => handleChange('current_class', e.target.value)}
                      className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                      placeholder="e.g., Grade 8"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Section</Label>
                    <Select value={formData.section} onValueChange={(val) => handleChange('section', val)}>
                      <SelectTrigger data-testid="register-section-select" className="border-2 border-[#111111] rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B1">B1 (Boys)</SelectItem>
                        <SelectItem value="B2">B2 (Boys)</SelectItem>
                        <SelectItem value="G1">G1 (Girls)</SelectItem>
                        <SelectItem value="G2">G2 (Girls)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="flex gap-2">
                <Button
                  data-testid="register-back-step2"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-3 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  data-testid="register-next-step2"
                  onClick={nextStep}
                  className="flex-1 bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-3 rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    data-testid="register-email-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex-1"
                    placeholder="your.email@example.com"
                    disabled={emailVerified}
                  />
                  {!emailVerified && (
                    <Button
                      data-testid="send-otp-button"
                      onClick={sendOTP}
                      disabled={loading || !formData.email}
                      className="bg-[#A7F3D0] text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 rounded-xl"
                    >
                      Send OTP
                    </Button>
                  )}
                </div>
              </div>

              {!emailVerified && (
                <div>
                  <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Enter OTP</Label>
                  <div className="flex gap-2">
                    <Input
                      data-testid="verify-otp-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] flex-1"
                      placeholder="6-digit OTP"
                    />
                    <Button
                      data-testid="verify-otp-button"
                      onClick={verifyOTP}
                      disabled={loading || !otp}
                      className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-4 rounded-xl"
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              )}

              {emailVerified && (
                <div className="bg-[#A7F3D0] border-2 border-[#111111] rounded-xl p-4">
                  <p className="text-sm font-bold text-[#111111]">✓ Email verified successfully!</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-bold uppercase tracking-wider mb-2 block">Phone Number (Optional)</Label>
                <Input
                  data-testid="register-phone-input"
                  value={formData.phone_number}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  className="bg-white border-2 border-[#111111] rounded-xl px-4 py-3 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]"
                  placeholder="+1234567890"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  data-testid="register-back-step3"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-white text-[#111111] border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-3 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  data-testid="register-submit-button"
                  onClick={handleSubmit}
                  disabled={loading || !emailVerified}
                  className="flex-1 bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold py-3 rounded-xl"
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-[#4B4B4B]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#2563EB] font-bold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
