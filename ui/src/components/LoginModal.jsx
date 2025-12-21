import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';

const LoginModal = ({ onClose }) => {
    const { login, registerCustomer } = useData();
    const { t } = useLanguage();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        identifier: '', // Replaces 'username' for login
        password: '',
        name: '',
        email: '',
        phone: ''
    });
    const [error, setError] = useState('');

    // State for Signup toggle
    const [signupMethod, setSignupMethod] = useState('email'); // 'email' or 'phone'

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const user = login(formData.identifier, formData.password);
            if (user) {
                if (user.role !== 'customer') {
                    setError(t('adminLoginError'));
                } else {
                    onClose();
                }
            } else {
                setError(t('invalidCredentials'));
            }
        } else {
            // Register
            const isEmail = signupMethod === 'email';
            const value = isEmail ? formData.email : formData.phone;

            if (!formData.password || !value) {
                setError(t('allFieldsRequired'));
                return;
            }

            registerCustomer({
                password: formData.password,
                [isEmail ? 'email' : 'phone']: value
            });
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div style={{ background: '#222', padding: '30px', borderRadius: '10px', width: '350px', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3>{isLogin ? t('customerLogin') : t('signUp')}</h3>
                    <button className="btn btn-text" onClick={onClose}>X</button>
                </div>

                {error && <p style={{ color: 'red', fontSize: '0.9rem', marginBottom: '10px' }}>{error}</p>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {!isLogin && (
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button
                                type="button"
                                onClick={() => setSignupMethod('email')}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                                    background: signupMethod === 'email' ? 'var(--color-primary)' : '#333', color: 'white'
                                }}
                            >
                                {t('email')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignupMethod('phone')}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                                    background: signupMethod === 'phone' ? 'var(--color-primary)' : '#333', color: 'white'
                                }}
                            >
                                {t('phone')}
                            </button>
                        </div>
                    )}

                    {!isLogin ? (
                        // Signup Fields
                        <div className="form-group">
                            {signupMethod === 'email' ? (
                                <>
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder=" "
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                    <label htmlFor="login-email">{t('email')}</label>
                                </>
                            ) : (
                                <>
                                    <input
                                        id="login-phone"
                                        type="tel"
                                        placeholder=" "
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                    <label htmlFor="login-phone">{t('phone')}</label>
                                </>
                            )}
                        </div>
                    ) : (
                        // Login Fields
                        <div className="form-group">
                            <input
                                id="login-id"
                                type="text"
                                placeholder=" "
                                value={formData.identifier}
                                onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                                required
                            />
                            <label htmlFor="login-id">{t('loginPlaceholder')}</label>
                        </div>
                    )}

                    <div className="form-group">
                        <input
                            id="login-password"
                            type="password"
                            placeholder=" "
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                        <label htmlFor="login-password">{t('passwordPlaceholder')}</label>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                        {isLogin ? t('login') : t('signUp')}
                    </button>
                </form>

                <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem', color: '#aaa' }}>
                    {isLogin ? t('noAccount') : t('hasAccount')}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: '#ff0066', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        {isLogin ? t('signUp') : t('login')}
                    </button>
                </p>
            </div>
        </div>,
        document.body
    );
};

export default LoginModal;
