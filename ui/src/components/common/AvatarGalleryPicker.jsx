import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { api } from '../../utils/api';

export const GALLERY_AVATARS = [
    { id: 'singer', path: '/avatars/singer.png', label: 'Pop Star' },
    { id: 'dj', path: '/avatars/dj.png', label: 'DJ Master' },
    { id: 'guitarist', path: '/avatars/guitarist.png', label: 'Rockstar' },
    { id: 'fan', path: '/avatars/fan.png', label: 'Vocal Fan' },
    { id: 'bear', path: '/avatars/bear.png', label: 'Bear Mascot' },
    { id: 'rapper', path: '/avatars/rapper.png', label: 'Pro Rapper' }
];

const AvatarGalleryPicker = ({ onSelect, currentAvatar, label = "Avatar" }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-500">{label}</label>
            <div className="flex items-center gap-4">
                <div
                    className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#b000ff] transition-all relative group"
                    onClick={() => setVisible(true)}
                >
                    {currentAvatar ? (
                        <img src={api.getFileUrl(currentAvatar)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <i className="pi pi-user text-2xl text-gray-400"></i>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <i className="pi pi-images text-white text-xl"></i>
                    </div>
                </div>
                <Button
                    label="Choose from Gallery"
                    icon="pi pi-images"
                    outlined
                    size="small"
                    onClick={() => setVisible(true)}
                    className="h-10 px-4"
                />
            </div>

            <Dialog
                header="Choose Your Avatar"
                visible={visible}
                onHide={() => setVisible(false)}
                className="w-full max-w-[500px]"
                dismissableMask
            >
                <div className="grid grid-cols-3 gap-4 pt-2">
                    {GALLERY_AVATARS.map(avatar => (
                        <div
                            key={avatar.id}
                            className={`avatar-option rounded-2xl overflow-hidden cursor-pointer transition-all border-4 ${currentAvatar === avatar.path ? 'border-[#b000ff] shadow-lg shadow-[#b000ff]/30' : 'border-transparent hover:border-white/20'}`}
                            onClick={() => {
                                onSelect(avatar.path);
                                setVisible(false);
                            }}
                        >
                            <img src={api.getFileUrl(avatar.path)} alt={avatar.label} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <style>{`
                    .avatar-option:hover {
                        transform: scale(1.05);
                    }
                `}</style>
            </Dialog>
        </div>
    );
};

export default AvatarGalleryPicker;
