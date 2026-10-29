import React, { useState } from 'react';
import {
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Lock,
  X,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { sendOtp, verifyOtp, currentUser, users } = useAuth();
  const { addAuditLog } = useTransactions();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser.phone || '+91 98765 43210');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [otpMeta, setOtpMeta] = useState<{
    devCode?: string;
    providerStatus?: {
      configured: boolean;
      providerName: string;
      instructions: string;
    };
  } | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await sendOtp(phoneNumber);
      setOtpMeta({
        devCode: res.devCode,
        providerStatus: res.providerStatus,
      });

      if (res.devCode) {
        setOtpCode(res.devCode); // Pre-fill for convenience while keeping genuine verification endpoint
      }

      setStep('otp');
      setSuccessMsg(`Verification code generated for ${phoneNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const verifiedUser = await verifyOtp(phoneNumber, otpCode);
      addAuditLog({
        userId: verifiedUser.id,
        userName: verifiedUser.name,
        userRole: verifiedUser.role,
        action: 'USER_LOGIN',
        resource: 'Authentication',
        details: `Successful phone OTP login for ${verifiedUser.name} (${verifiedUser.phone})`,
        result: 'success',
      });

      setSuccessMsg(`Welcome, ${verifiedUser.name}!`);
      setTimeout(() => {
        onClose();
        setStep('phone');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
      addAuditLog({
        userId: 'anonymous',
        userName: 'Unknown',
        userRole: 'staff',
        action: 'LOGIN_FAILED',
        resource: 'Authentication',
        details: `Failed OTP attempt for phone ${phoneNumber}`,
        result: 'failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-neutral-900 font-serif-title">
              Phone Number OTP Login
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-neutral-600 leading-relaxed">
                Log in to Blouse Gallery & Ladies Fashion using your registered mobile phone number.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Mobile Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-mono font-bold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-neutral-500">
                  <span>Fast select registered accounts:</span>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setPhoneNumber(u.phone)}
                      className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold"
                    >
                      {u.role === 'owner' ? '👑 Owner' : '👤 Staff'} ({u.phone})
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider Info Banner */}
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-neutral-600 space-y-1">
                <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Backend OTP Verification</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Sends a real 6-digit one-time passcode with 5-minute expiry and rate-limiting brute-force protection.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 flex items-center gap-1.5"
                >
                  <span>{isLoading ? 'Sending...' : 'Send Verification OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Code sent to: <strong>{phoneNumber}</strong></span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-rose-600 font-bold hover:underline"
                >
                  Change Phone
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Enter 6-Digit Verification Code *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-xl font-mono font-bold tracking-widest text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Developer / Staging Notice for genuine OTP */}
              {otpMeta?.devCode && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-blue-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Verified Development Token</span>
                  </div>
                  <div className="font-mono text-sm font-bold bg-white px-2 py-1 rounded border border-blue-200 inline-block text-blue-950">
                    OTP: {otpMeta.devCode}
                  </div>
                  <p className="text-[10px] text-blue-700/90 leading-tight">
                    {otpMeta.providerStatus?.instructions}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-neutral-500 hover:text-neutral-800 text-[11px] underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length < 6}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLoading ? 'Verifying...' : 'Verify & Log In'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
