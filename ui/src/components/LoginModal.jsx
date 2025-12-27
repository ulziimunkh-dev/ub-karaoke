import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';

const LoginModal = ({ onClose }) => {
    const { login, registerCustomer, loginWithOtp, requestLoginOtp, verifyAccount, forgotPassword, resetPassword } = useData();
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
    const [step, setStep] = useState(1); // For flows with multiple steps

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            if (mode === 'login') {
                if (loginMethod === 'password') {
                    const user = await login(formData.identifier, formData.password);
                    if (user) handleUserRouting(user);
                    else setError(t('invalidCredentials'));
                } else {
                    // OTP Login
                    if (step === 1) {
                        await requestLoginOtp(formData.identifier);
                        setStep(2);
                        setMessage(`OTP sent to ${formData.identifier}. check backend console.`);
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
                    setStep(2);
                    setMessage('Account created. Please enter verification code from backend console.');
                } else {
                    await verifyAccount(formData.code);
                    // Login automatically or ask to login?
                    // Let's ask to login for simplicity or auto-login if backend returned token (it doesn't for verify)
                    alert('Verified! Please login.');
                    setMode('login');
                    setStep(1);
                }
            } else if (mode === 'forgot_password') {
                if (step === 1) {
                    await forgotPassword(formData.identifier);
                    setStep(2);
                    setMessage('Reset token sent. Check backend console.');
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
        if (user.role === 'sysadmin' || user.role === 'manager' || user.role === 'staff' || user.role === 'customer') {
            onClose();
        } else {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div style={{ background: '#222', padding: '30px', borderRadius: '10px', width: '400px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3>
                        {mode === 'login' && 'Login'}
                        {mode === 'signup' && 'Sign Up'}
                        {mode === 'forgot_password' && 'Reset Password'}
                    </h3>
                    <button className="btn btn-text" onClick={onClose}>X</button>
                </div>

                {error && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '10px' }}>{error}</p>}
                {message && <p style={{ color: '#4CAF50', fontSize: '0.9rem', marginBottom: '10px' }}>{message}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    {/* LOGIN FIELDS */}
                    {mode === 'login' && (
                        <>
                            {step === 1 && (
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <button type="button" onClick={() => setLoginMethod('password')}
                                        style={{ flex: 1, padding: '5px', background: loginMethod === 'password' ? '#E91E63' : '#333', border: 'none', color: 'white' }}>
                                        Password
                                    </button>
                                    <button type="button" onClick={() => setLoginMethod('otp')}
                                        style={{ flex: 1, padding: '5px', background: loginMethod === 'otp' ? '#E91E63' : '#333', border: 'none', color: 'white' }}>
                                        OTP
                                    </button>
                                </div>
                            )}

                            <input
                                placeholder="Email or Phone"
                                value={formData.identifier}
                                onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                                required
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                disabled={step === 2 && loginMethod === 'otp'}
                            />

                            {loginMethod === 'password' && (
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                />
                            )}

                            {loginMethod === 'otp' && step === 2 && (
                                <input
                                    placeholder="Enter OTP Code"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                />
                            )}
                        </>
                    )}

                    {/* SIGNUP FIELDS */}
                    {mode === 'signup' && (
                        <>
                            {step === 1 ? (
                                <>
                                    <input
                                        placeholder="Email or Phone"
                                        value={formData.identifier}
                                        onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                                        required
                                        style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Create Password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                    />
                                </>
                            ) : (
                                <input
                                    placeholder="Verification Code"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                />
                            )}
                        </>
                    )}

                    {/* FORGOT PASSWORD FIELDS */}
                    {mode === 'forgot_password' && (
                        <>
                            {step === 1 ? (
                                <input
                                    placeholder="Enter your email"
                                    value={formData.identifier}
                                    onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                                    required
                                    style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                />
                            ) : (
                                <>
                                    <input
                                        placeholder="Reset Token"
                                        value={formData.resetToken}
                                        onChange={e => setFormData({ ...formData, resetToken: e.target.value })}
                                        required
                                        style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                    />
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={formData.newPassword}
                                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                        required
                                        style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                    />
                                </>
                            )}
                        </>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                        {mode === 'login' && (loginMethod === 'otp' && step === 1 ? 'Send OTP' : 'Login')}
                        {mode === 'signup' && (step === 1 ? 'Sign Up' : 'Verify & Complete')}
                        {mode === 'forgot_password' && (step === 1 ? 'Send Reset Link' : 'Reset Password')}
                    </button>
                </form>

                {/* Footer Links */}
                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {mode === 'login' && (
                        <>
                            <button onClick={() => setMode('forgot_password')} className='btn-text' style={{ color: '#aaa', textDecoration: 'underline' }}>
                                Forgot Password?
                            </button>
                            <span>
                                Don't have an account?{' '}
                                <button onClick={() => { setMode('signup'); setStep(1); }} className='btn-text' style={{ color: '#E91E63' }}>Sign Up</button>
                            </span>
                        </>
                    )}
                    {mode !== 'login' && (
                        <button onClick={() => { setMode('login'); setStep(1); }} className='btn-text' style={{ color: '#E91E63' }}>
                            Back to Login
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LoginModal;
