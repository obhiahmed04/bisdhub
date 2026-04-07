import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Clock, CheckCircle } from '@phosphor-icons/react';

const PendingRegistrationPage = ({ serialNumber }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white border-2 border-[#111111] rounded-xl shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#FFC107] border-4 border-[#111111] rounded-full mb-4">
              <Clock size={48} weight="bold" className="text-[#111111]" />
            </div>
            <h1 className="text-4xl font-black mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Registration Pending
            </h1>
            <p className="text-lg text-[#4B4B4B] mb-2">
              Your application has been submitted successfully!
            </p>
            {serialNumber && (
              <p className="text-2xl font-black text-[#2563EB]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Application #{serialNumber}
              </p>
            )}
          </div>

          <div className="bg-[#E6F4EA] border-2 border-[#111111] rounded-xl p-6 mb-6 text-left">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <CheckCircle size={24} weight="fill" className="text-[#2563EB]" />
              What's Next?
            </h2>
            <div className="space-y-3 text-base">
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">1.</span>
                <span>Our admin team will review your application to verify your BISD credentials</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">2.</span>
                <span>You'll receive an email notification once your application is reviewed</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">3.</span>
                <span>If approved, you'll receive your temporary password via email</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#2563EB]">4.</span>
                <span>Use your ID number and temporary password to log in to BISD HUB</span>
              </p>
            </div>
          </div>

          <div className="bg-[#FFF4E5] border-2 border-[#111111] rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-[#4B4B4B]">
              💡 <span className="font-bold">Tip:</span> Application review typically takes 24-48 hours. 
              If you have questions, you can contact our support team.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#2563EB] text-white border-2 border-[#111111] shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-bold px-8 py-3 rounded-xl"
            >
              Back to Login
            </Button>
          </div>

          <div className="mt-6 text-sm text-[#4B4B4B]">
            <p>Keep your application number for reference: <span className="font-bold text-[#111111]">#{serialNumber}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingRegistrationPage;
