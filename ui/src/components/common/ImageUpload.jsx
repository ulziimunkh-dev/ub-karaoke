import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { api } from '../../utils/api';

const ImageUpload = ({ onUpload, currentImage, label = "Upload Image", className = "" }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage);
    const fileInputRef = useRef(null);
    const toast = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        try {
            setUploading(true);
            const data = await api.uploadFile(file);
            // Assuming data.path is valid from API response (checked FilesController: it returns { path: ... })
            // Ensure path is accessible. Since it's stored in public/uploads, client should access via /uploads/filename.
            // API returns `/uploads/filename`.

            // We might need to ensure the client prepends base URL if it's not relative.
            // But usually browsers handle /uploads relative to origin.

            onUpload(data.path);
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Image uploaded successfully' });
        } catch (error) {
            console.error('Upload failed:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to upload image' });
            setPreview(currentImage); // Revert
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <Toast ref={toast} />
            <label className="text-sm font-bold text-gray-500">{label}</label>
            <div className="flex items-start gap-4">
                <div
                    className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#b000ff] transition-colors relative"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" onError={(e) => {
                            // If preview fails (e.g. relative path on different port), try prepending API URL if needed or handle fallback
                            e.target.src = 'https://via.placeholder.com/150?text=Error';
                        }} />
                    ) : (
                        <i className="pi pi-image text-2xl text-gray-400"></i>
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <i className="pi pi-spin pi-spinner text-white"></i>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                    />
                    <Button
                        label={uploading ? "Uploading..." : "Choose Image"}
                        icon="pi pi-upload"
                        outlined
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    />
                    <p className="text-xs text-gray-400 m-0">
                        Max size: 5MB<br />
                        Format: JPG, PNG
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ImageUpload;
