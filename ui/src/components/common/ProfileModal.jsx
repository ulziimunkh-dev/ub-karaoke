import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';
import { api } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';

import AvatarGalleryPicker, { GALLERY_AVATARS } from './AvatarGalleryPicker';

const ProfileModal = ({ visible, onHide, currentUser, onUpdate }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        username: '',
        avatar: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [viewPhotoVisible, setViewPhotoVisible] = useState(false);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const toast = useRef(null);
    const menu = useRef(null);

    const items = React.useMemo(() => [
        {
            label: t('viewPhoto') || 'View Photo',
            icon: 'pi pi-eye',
            className: 'mb-1',
            command: () => {
                if (formData.avatar) setViewPhotoVisible(true);
            },
            disabled: !formData.avatar
        },
        {
            label: t('changeAvatar') || 'Change Avatar',
            icon: 'pi pi-image',
            command: () => setGalleryVisible(true)
        }
    ], [formData.avatar, t]);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || currentUser.firstName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                username: currentUser.username || '',
                avatar: currentUser.avatar || '',
                password: '' // Always empty initially
            });
        }
    }, [currentUser, visible]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                avatar: formData.avatar
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            await onUpdate(currentUser.id, payload);
            toast.current.show({ severity: 'success', summary: t('success') || 'Success', detail: t('profileUpdated') || 'Your profile has been updated successfully.' });
            setTimeout(() => onHide(), 1000);
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: t('error') || 'Error', detail: error.response?.data?.message || t('failUpdateProfile') || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header={
                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg shadow-[#b000ff]/20">
                        <i className="pi pi-user text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('myProfile') || 'MY PROFILE'}</h3>
                        <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{t('personalSettings') || 'PERSONAL SETTINGS'}</p>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            className="w-full max-w-[95vw] md:max-w-[500px] premium-dialog"
            contentClassName="bg-[#0f0f15] p-0"
            modal
            draggable={false}
            dismissableMask={false}
        >
            <Toast ref={toast} />
            <style>{`
                .premium-dialog .p-dialog-header {
                    background: #0f0f15 !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    padding: 1.5rem 2rem !important;
                }
                .avatar-menu.p-menu {
                    padding: 0.5rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: #1a1a24;
                }
                .profile-input.p-inputtext {
                    height: 3.5rem !important;
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    color: white !important;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    border-radius: 1rem !important;
                    font-weight: 600 !important;
                }
                .profile-input.p-inputtext:focus {
                    background: rgba(255, 255, 255, 0.06) !important;
                    border-color: #b000ff !important;
                    box-shadow: 0 0 0 4px rgba(176, 0, 255, 0.1) !important;
                    transform: translateY(-1px);
                }
                .profile-input.p-inputtext:read-only {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: rgba(0, 0, 0, 0.2) !important;
                    border-color: transparent !important;
                }
                .avatar-option {
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    border: 4px solid transparent;
                }
                .avatar-option:hover {
                    transform: scale(1.08) translateY(-4px);
                    border-color: rgba(176, 0, 255, 0.3);
                }
                .avatar-option.selected {
                    border-color: #b000ff;
                    box-shadow: 0 10px 30px rgba(176, 0, 255, 0.4);
                }
            `}</style>

            <Menu
                model={items}
                popup
                ref={menu}
                id="avatar_menu"
                className="avatar-menu shadow-2xl"
                key={formData.avatar || 'empty'}
            />

            <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative group cursor-pointer" onClick={(e) => menu.current.toggle(e)}>
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden ring-8 ring-[#b000ff]/10 group-hover:ring-[#b000ff]/20 transition-all duration-500 shadow-2xl relative">
                                {formData.avatar ? (
                                    <img src={api.getFileUrl(formData.avatar)} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center text-white text-4xl font-black">
                                        {(formData.name?.[0] || formData.username?.[0] || 'U').toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <i className="pi pi-camera text-white text-2xl"></i>
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-[#b000ff] to-[#eb79b2] rounded-2xl p-3 shadow-xl border-4 border-[#0f0f15] group-hover:scale-110 transition-transform duration-300">
                                <i className="pi pi-images text-white text-sm"></i>
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="m-0 text-white font-black text-lg uppercase tracking-tight">{formData.name || t('user')}</h4>
                            <p className="m-0 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">@{formData.username}</p>
                        </div>
                    </div>

                    {/* Information Grid */}
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('fullName') || 'FULL NAME'}</label>
                            <InputText
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full profile-input px-4"
                                placeholder={t('fullNamePlaceholder') || 'Enter your name'}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('phone') || 'PHONE'}</label>
                                <InputText
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full profile-input px-4"
                                    placeholder="+976 ..."
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('email') || 'EMAIL'}</label>
                                <InputText
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full profile-input px-4"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('changePassword') || 'SECURITY (LEAVE EMPTY TO KEEP CURRENT)'}</label>
                            <Password
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                toggleMask
                                feedback={false}
                                className="w-full"
                                pt={{
                                    input: { className: 'w-full profile-input px-4' }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                    <Button
                        label={t('cancel') || 'CANCEL'}
                        type="button"
                        className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all"
                        onClick={onHide}
                    />
                    <Button
                        label={loading ? (t('saving') || 'SAVING...') : (t('saveChanges') || 'SAVE CHANGES')}
                        type="submit"
                        loading={loading}
                        className="flex-1 h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(176,0,255,0.4)] transition-all hover:scale-[1.02]"
                    />
                </div>
            </form>

            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <i className="pi pi-image text-[#b000ff]"></i>
                        </div>
                        <h3 className="m-0 text-lg font-bold text-white tracking-tight uppercase">{t('chooseAvatar') || 'CHOOSE AVATAR'}</h3>
                    </div>
                }
                visible={galleryVisible}
                onHide={() => setGalleryVisible(false)}
                className="w-full max-w-[95vw] md:max-w-[600px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-8"
                modal
                draggable={false}
                dismissableMask
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {GALLERY_AVATARS.map(avatar => (
                        <div
                            key={avatar.id}
                            className={`avatar-option rounded-[2rem] overflow-hidden aspect-square ${formData.avatar === avatar.path ? 'selected' : ''}`}
                            onClick={() => {
                                setFormData(prev => ({ ...prev, avatar: avatar.path }));
                                setGalleryVisible(false);
                            }}
                        >
                            <img src={api.getFileUrl(avatar.path)} alt={avatar.label} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </Dialog>

            <Dialog
                visible={viewPhotoVisible}
                onHide={() => setViewPhotoVisible(false)}
                className="w-auto max-w-[90vw]"
                contentClassName="p-0 overflow-hidden flex items-center justify-center bg-transparent"
                dismissableMask
                showHeader={false}
                baseZIndex={3000}
            >
                {formData.avatar && (
                    <div className="relative group">
                        <img
                            src={api.getFileUrl(formData.avatar)}
                            alt="Full View"
                            className="max-w-full max-h-[85vh] object-contain shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-3xl"
                        />
                        <button
                            onClick={() => setViewPhotoVisible(false)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black transition-colors"
                        >
                            <i className="pi pi-times"></i>
                        </button>
                    </div>
                )}
            </Dialog>
        </Dialog >
    );
};

export default ProfileModal;
