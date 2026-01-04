import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';

const RoomConfiguration = () => {
    const { roomTypes, roomFeatures, addRoomType, updateRoomType, deleteRoomType, addRoomFeature, updateRoomFeature, deleteRoomFeature } = useData();

    // --- TYPES STATE ---
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [typeForm, setTypeForm] = useState({ name: '', description: '' });

    // --- FEATURES STATE ---
    const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const [featureForm, setFeatureForm] = useState({ name: '', icon: '' });

    // --- TYPE HANDLERS ---
    const openTypeModal = (type = null) => {
        setEditingType(type);
        setTypeForm(type ? { name: type.name, description: type.description || '' } : { name: '', description: '' });
        setIsTypeModalOpen(true);
    };

    const handleSaveType = async (e) => {
        e.preventDefault();
        try {
            if (editingType) {
                await updateRoomType(editingType.id, typeForm);
            } else {
                await addRoomType(typeForm);
            }
            setIsTypeModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    // --- FEATURE HANDLERS ---
    const openFeatureModal = (feature = null) => {
        setEditingFeature(feature);
        setFeatureForm(feature ? { name: feature.name, icon: feature.icon || '' } : { name: '', icon: '' });
        setIsFeatureModalOpen(true);
    };

    const handleSaveFeature = async (e) => {
        e.preventDefault();
        try {
            if (editingFeature) {
                await updateRoomFeature(editingFeature.id, featureForm);
            } else {
                await addRoomFeature(featureForm);
            }
            setIsFeatureModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ROOM TYPES */}
            <div className="bg-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white m-0">Room Types</h3>
                    <Button icon="pi pi-plus" rounded size="small" onClick={() => openTypeModal()} />
                </div>
                <DataTable value={roomTypes} className="text-sm">
                    <Column field="name" header="Name" />
                    <Column field="description" header="Description" />
                    <Column body={(rowData) => (
                        <div className="flex gap-2 justify-end">
                            <Button icon="pi pi-pencil" text rounded size="small" onClick={() => openTypeModal(rowData)} />
                            <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => deleteRoomType(rowData.id)} />
                        </div>
                    )} />
                </DataTable>
            </div>

            {/* ROOM FEATURES */}
            <div className="bg-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white m-0">Features / Amenities</h3>
                    <Button icon="pi pi-plus" rounded size="small" onClick={() => openFeatureModal()} />
                </div>
                <DataTable value={roomFeatures} className="text-sm">
                    <Column body={(rowData) => <span className="text-2xl">{rowData.icon}</span>} header="Icon" style={{ width: '3rem' }} />
                    <Column field="name" header="Name" />
                    <Column body={(rowData) => (
                        <div className="flex gap-2 justify-end">
                            <Button icon="pi pi-pencil" text rounded size="small" onClick={() => openFeatureModal(rowData)} />
                            <Button icon="pi pi-trash" text rounded severity="danger" size="small" onClick={() => deleteRoomFeature(rowData.id)} />
                        </div>
                    )} />
                </DataTable>
            </div>

            {/* TYPE DIALOG */}
            <Dialog header={editingType ? 'Edit Type' : 'Add Type'} visible={isTypeModalOpen} onHide={() => setIsTypeModalOpen(false)} className="w-[400px]">
                <form onSubmit={handleSaveType} className="flex flex-col gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-bold mb-1">Name</label>
                        <InputText value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required className="w-full" placeholder="e.g. VIP Suite" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Description</label>
                        <InputText value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} className="w-full" placeholder="Short description..." />
                    </div>
                    <Button label="Save" type="submit" />
                </form>
            </Dialog>

            {/* FEATURE DIALOG */}
            <Dialog header={editingFeature ? 'Edit Feature' : 'Add Feature'} visible={isFeatureModalOpen} onHide={() => setIsFeatureModalOpen(false)} className="w-[400px]">
                <form onSubmit={handleSaveFeature} className="flex flex-col gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-bold mb-1">Name</label>
                        <InputText value={featureForm.name} onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })} required className="w-full" placeholder="e.g. Pool Table" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Icon (Emoji)</label>
                        <InputText value={featureForm.icon} onChange={(e) => setFeatureForm({ ...featureForm, icon: e.target.value })} className="w-full" placeholder="🎱" />
                    </div>
                    <Button label="Save" type="submit" />
                </form>
            </Dialog>

        </div>
    );
};

export default RoomConfiguration;
