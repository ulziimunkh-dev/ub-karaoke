import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import PolicyDialog from './public/PolicyDialog';

const LoginModal = ({ onClose }) => {
    const { login, registerCustomer, loginWithOtp, requestLoginOtp, verifyAccount, forgotPassword, resetPassword, resendVerification } = useData();
    const { t } = useLanguage();

    // Modes: 'login', 'signup', 'forgot_password'
    const [mode, setMode] = useState('login');
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'

    // Auth Data
    const [formData, setFormData] = useState({
        identifier: '', // Login ID or Email/Phone for signup
        password: '',
        name: '',
        code: '', // OTP or Verification Code
        resetToken: '',
        newPassword: ''
    });

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);
    const [showPolicy, setShowPolicy] = useState(false);
    const [step, setStep] = useState(1); // For flows with multiple steps

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            if (mode === 'login') {
                if (loginMethod === 'password') {
                    const user = await login(formData.identifier, formData.password);
                    if (user) {
                        handleUserRouting(user);
                    } else {
                        // If logic failed but no error thrown (returns null)
                        setError(t('invalidCredentials'));
                    }
                } else {
                    // Custoemr OTP Login
                    if (step === 1) {
                        await requestLoginOtp(formData.identifier);
                        setStep(2);
                        setMessage(`OTP sent to ${formData.identifier}. Please check your ${formData.identifier.includes('@') ? 'email inbox' : 'phone'}.`);
                    } else {
                        const user = await loginWithOtp(formData.identifier, formData.code);
                        if (user) handleUserRouting(user);
                    }
                }
            } else if (mode === 'signup') {
                if (step === 1) {
                    await registerCustomer({
                        email: formData.identifier.includes('@') ? formData.identifier : undefined,
                        phone: !formData.identifier.includes('@') ? formData.identifier : undefined,
                        password: formData.password
                    });
                    // Auto-login after signup
                    const user = await login(formData.identifier, formData.password);
                    if (user) {
                        alert(`Account created! A verification code has been sent to ${formData.identifier}. You can verify your account from your profile.`);
                        handleUserRouting(user);
                    }
                } else {
                    await verifyAccount(formData.code);
                    alert('Verified! Please login.');
                    setMode('login');
                    setStep(1);
                }
            } else if (mode === 'forgot_password') {
                if (step === 1) {
                    await forgotPassword(formData.identifier);
                    setStep(2);
                    setMessage('A password reset link has been sent. Please check your email.');
                } else {
                    await resetPassword(formData.resetToken, formData.newPassword);
                    alert('Password reset successful. Please login.');
                    setMode('login');
                    setStep(1);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        }
    };

    const handleUserRouting = (user) => {
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]" onClick={onClose}></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-[#161622]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-[scaleIn_0.3s_ease-out]">

                {/* Ambient Glows */}
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[#b000ff]/20 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#eb79b2]/20 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="relative p-8 z-10">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                            {mode === 'login' && <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Welcome Back</span>}
                            {mode === 'signup' && <span className="bg-gradient-to-r from-[#b000ff] to-[#eb79b2] bg-clip-text text-transparent">Create Account</span>}
                            {mode === 'forgot_password' && <span className="text-white">Reset Password</span>}
                        </h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-pulse">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {message && (
                        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-sm">
                            <span>✅</span> {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        {/* LOGIN FIELDS */}
                        {mode === 'login' && (
                            <>
                                {/* Toggle Password vs OTP */}
                                {step === 1 && (
                                    <div className="flex bg-[#0f0f16] p-1 rounded-xl border border-white/5 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('password')}
                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${loginMethod === 'password'
                                                ? 'bg-[#2a2a35] text-white shadow-lg'
                                                : 'text-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            Password
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setLoginMethod('otp')}
                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${loginMethod === 'otp'
                                                ? 'bg-[#2a2a35] text-white shadow-lg'
                                                : 'text-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            SMS / OTP
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <input
                                        placeholder="Email or Phone Number"
                                        value={formData.identifier}
                                        onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                                        className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                        required
                                        disabled={step === 2 && loginMethod === 'otp'}
                                    />

                                    {loginMethod === 'password' && (
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                            required
                                        />
                                    )}

                                    {loginMethod === 'otp' && step === 2 && (
                                        <input
                                            placeholder="Enter 6-digit Code"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none text-center tracking-widest text-lg font-mono"
                                            required
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* SIGNUP FIELDS */}
                        {mode === 'signup' && (
                            <div className="space-y-4">
                                {step === 1 ? (
                                    <>
                                        <input
                                            placeholder="Email or Phone Number"
                                            value={formData.identifier}
                                            onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="Create Strong Password"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                            required
                                        />
                                        <div className="flex items-start gap-2 mt-2 px-1">
                                            <input
                                                type="checkbox"
                                                id="policy-check"
                                                checked={acceptedPolicy}
                                                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                                                className="mt-1 accent-[#b000ff]"
                                                required
                                            />
                                            <label htmlFor="policy-check" className="text-xs text-gray-400 leading-tight">
                                                {t('iAgreeTo')}{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPolicy(true)}
                                                    className="inline p-0 bg-transparent border-none text-[#eb79b2] hover:underline font-bold cursor-pointer"
                                                >
                                                    {t('termsOfService')}
                                                </button>{' '}
                                                {t('and')}{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPolicy(true)}
                                                    className="inline p-0 bg-transparent border-none text-[#eb79b2] hover:underline font-bold cursor-pointer"
                                                >
                                                    {t('privacyPolicy')}
                                                </button>
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            placeholder="Enter 6-digit Verification Code"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none text-center tracking-widest font-mono text-lg"
                                            maxLength={6}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    setError('');
                                                    await resendVerification(formData.identifier);
                                                    setMessage(`A new verification code has been sent to ${formData.identifier}.`);
                                                } catch (err) {
                                                    setError(err.response?.data?.message || 'Failed to resend code');
                                                }
                                            }}
                                            className="w-full text-sm text-[#eb79b2] hover:text-white hover:underline transition-colors bg-transparent border-none cursor-pointer py-1"
                                        >
                                            Didn't receive a code? Resend
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* FORGOT PASSWORD FIELDS */}
                        {mode === 'forgot_password' && (
                            <div className="space-y-4">
                                {step === 1 ? (
                                    <input
                                        placeholder="Enter your email"
                                        value={formData.identifier}
                                        onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                                        className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                        required
                                    />
                                ) : (
                                    <>
                                        <input
                                            placeholder="Reset Token"
                                            value={formData.resetToken}
                                            onChange={e => setFormData({ ...formData, resetToken: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none font-mono"
                                            required
                                        />
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={formData.newPassword}
                                            onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                            className="w-full h-12 px-4 bg-[#0a0a12] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff] transition-all outline-none"
                                            required
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={mode === 'signup' && step === 1 && !acceptedPolicy}
                            className={`w-full h-12 mt-2 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(176,0,255,0.4)] hover:shadow-[0_0_30px_rgba(176,0,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center uppercase tracking-wide text-sm ${mode === 'signup' && step === 1 && !acceptedPolicy ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                        >
                            {mode === 'login' && (loginMethod === 'otp' && step === 1 ? 'Send One-Time Code' : 'Sign In')}
                            {mode === 'signup' && (step === 1 ? 'Create Account' : 'Verify & Complete')}
                            {mode === 'forgot_password' && (step === 1 ? 'Send Reset Link' : 'Update Password')}
                        </button>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-8 text-center flex flex-col gap-3">
                        {mode === 'login' && (
                            <>
                                <button
                                    onClick={() => setMode('forgot_password')}
                                    className="text-gray-400 hover:text-white text-sm transition-colors"
                                >
                                    Forgot Password?
                                </button>
                                <div className="text-gray-500 text-sm">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => { setMode('signup'); setStep(1); }}
                                        className="text-[#eb79b2] font-bold hover:text-[#b000ff] transition-colors ml-1"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </>
                        )}
                        {mode !== 'login' && (
                            <button
                                onClick={() => { setMode('login'); setStep(1); }}
                                className="text-gray-400 hover:text-white text-sm font-bold transition-colors flex items-center justify-center gap-1"
                            >
                                ← Back to Login
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <PolicyDialog visible={showPolicy} onHide={() => setShowPolicy(false)} />
        </div>,
        document.body
    );
};

export default LoginModal;
