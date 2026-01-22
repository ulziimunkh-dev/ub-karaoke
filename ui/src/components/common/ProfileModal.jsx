import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';
import { api } from '../../utils/api';

import AvatarGalleryPicker, { GALLERY_AVATARS } from './AvatarGalleryPicker';

const ProfileModal = ({ visible, onHide, currentUser, onUpdate }) => {
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
            label: 'View Photo',
            icon: 'pi pi-eye',
            className: 'mb-1',
            command: () => {
                if (formData.avatar) setViewPhotoVisible(true);
            },
            disabled: !formData.avatar
        },
        {
            label: 'Change Avatar',
            icon: 'pi pi-image',
            command: () => setGalleryVisible(true)
        }
    ], [formData.avatar]);

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
            toast.current.show({ severity: 'success', summary: 'Profile Updated', detail: 'Your profile has been updated successfully.' });
            setTimeout(() => onHide(), 1000);
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="My Profile"
            visible={visible}
            onHide={onHide}
            className="w-full max-w-[450px]"
            dismissableMask={false}
        >
            <Toast ref={toast} />
            <style>{`
                .avatar-menu.p-menu {
                    padding: 0.5rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: #1a1a24;
                }
                .avatar-menu .p-menuitem {
                    margin-bottom: 0.75rem;
                }
                .avatar-menu .p-menuitem:last-child {
                    margin-bottom: 0;
                }
                .avatar-menu .p-menuitem-link {
                    padding: 0.85rem 1.25rem !important;
                    border-radius: 10px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .avatar-menu .p-menuitem-link:hover {
                    background: rgba(176, 0, 255, 0.15) !important;
                    transform: translateX(4px);
                }
                .avatar-menu .p-menuitem-link .p-menuitem-text {
                    color: #fff !important;
                    font-weight: 600;
                }
                .avatar-menu .p-menuitem-link .p-menuitem-icon {
                    color: #b000ff !important;
                }
                .profile-input.p-inputtext {
                    padding: 0.85rem 1rem !important;
                    background: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    transition: all 0.2s;
                    border-radius: 8px;
                }
                .profile-input.p-inputtext:focus {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border-color: #b000ff !important;
                    box-shadow: 0 0 0 2px rgba(176, 0, 255, 0.2) !important;
                }
                .profile-input.p-inputtext:read-only {
                    opacity: 0.6;
                    cursor: not-allowed;
                    background: rgba(0, 0, 0, 0.2) !important;
                }
                .avatar-option {
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 3px solid transparent;
                }
                .avatar-option:hover {
                    transform: scale(1.05);
                    border-color: rgba(176, 0, 255, 0.3);
                }
                .avatar-option.selected {
                    border-color: #b000ff;
                    box-shadow: 0 0 20px rgba(176, 0, 255, 0.4);
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-2">
                <div className="flex justify-center">
                    <div className="relative group cursor-pointer" onClick={(e) => menu.current.toggle(e)}>
                        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100 group-hover:ring-[#b000ff] transition-all">
                            {formData.avatar ? (
                                <img src={api.getFileUrl(formData.avatar)} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center text-white text-3xl font-bold">
                                    {(formData.name?.[0] || formData.username?.[0] || 'U').toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-gray-200 group-hover:scale-110 transition-transform">
                            <i className="pi pi-images text-[#b000ff] text-sm md:text-base"></i>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-gray-500">Full Name</label>
                        <InputText
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full profile-input"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-gray-500">Username (Read-only)</label>
                        <InputText
                            value={formData.username}
                            readOnly
                            className="w-full profile-input"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-500">Phone</label>
                            <InputText
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full profile-input"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-500">Email</label>
                            <InputText
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full profile-input"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 mt-2">
                        <label className="text-sm font-bold text-gray-500">Change Password</label>
                        <Password
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            toggleMask
                            feedback={false}
                            placeholder="Leave empty to keep current"
                            className="w-full"
                            pt={{
                                input: { className: 'w-full profile-input' }
                            }}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                    <Button label="Cancel" type="button" text onClick={onHide} className="text-gray-500 hover:text-gray-700 font-bold" />
                    <Button
                        label="Save Changes"
                        type="submit"
                        loading={loading}
                        className="bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none px-6 py-2 shadow-lg shadow-[#b000ff]/20 font-bold"
                    />
                </div>
            </form>

            <Dialog
                header="Choose Your Avatar"
                visible={galleryVisible}
                onHide={() => setGalleryVisible(false)}
                className="w-full max-w-[500px]"
                dismissableMask
            >
                <div className="grid grid-cols-3 gap-4 pt-2">
                    {GALLERY_AVATARS.map(avatar => (
                        <div
                            key={avatar.id}
                            className={`avatar-option rounded-2xl overflow-hidden ${formData.avatar === avatar.path ? 'selected' : ''}`}
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
                header="Profile Photo"
                visible={viewPhotoVisible}
                onHide={() => setViewPhotoVisible(false)}
                className="w-auto max-w-[90vw]"
                contentClassName="p-0 overflow-hidden flex items-center justify-center bg-black/90"
                dismissableMask
                baseZIndex={3000}
            >
                {formData.avatar && (
                    <img
                        src={api.getFileUrl(formData.avatar)}
                        alt="Full View"
                        className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                    />
                )}
            </Dialog>
        </Dialog >
    );
};

export default ProfileModal;
