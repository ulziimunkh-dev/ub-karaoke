import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { api } from '../../utils/api';

const OrganizationManagement = () => {
    const { organizations, setOrganizations, updateOrganization, updateOrganizationStatus, refreshData } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [orgForm, setOrgForm] = useState({ name: '', code: '', description: '', logoUrl: '' });
    const toast = useRef(null);

    const openCreate = () => {
        setEditingOrg(null);
        setOrgForm({ name: '', code: '', description: '', logoUrl: '' });
        setIsModalOpen(true);
    };

    const openEdit = (org) => {
        setEditingOrg(org);
        setOrgForm({
            name: org.name,
            code: org.code,
            description: org.description || '',
            logoUrl: org.logoUrl || ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingOrg) {
                await updateOrganization(editingOrg.id, orgForm);
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Organization updated' });
            } else {
                const created = await api.createOrganization(orgForm);
                setOrganizations(prev => [created, ...prev]);
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Organization created' });
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to save organization' });
        }
    };

    const handleToggleStatus = async (org) => {
        const newIsActive = !org.isActive;
        try {
            await updateOrganizationStatus(org.id, newIsActive);
            toast.current.show({ severity: 'info', summary: 'Status Updated', detail: `Organization marked as ${newIsActive ? 'active' : 'inactive'}` });
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update status' });
        }
    };

    return (
        <div className="p-6">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold m-0">Organization Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage business entities and their configurations</p>
                </div>
                <Button
                    label="Create Organization"
                    icon="pi pi-plus"
                    onClick={openCreate}
                    className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-bold"
                />
            </div>

            <div className="card shadow-md rounded-xl overflow-hidden bg-[#1a1a24] border border-white/5">
                <DataTable value={organizations} responsiveLayout="scroll" className="p-datatable-sm">
                    <Column field="id" header="ID" style={{ width: '80px' }}></Column>
                    <Column field="name" header="Name" sortable></Column>
                    <Column field="code" header="Unique Code" sortable body={(row) => <Tag value={row.code} severity="info" />}></Column>
                    <Column field="isActive" header="Status" body={(row) => (
                        <Tag value={row.isActive ? 'Active' : 'Inactive'} severity={row.isActive ? 'success' : 'danger'} />
                    )} sortable></Column>
                    <Column field="description" header="Description" style={{ maxWidth: '300px' }} body={(row) => <span className="truncate block">{row.description}</span>}></Column>
                    <Column field="createdAt" header="Created" body={(row) => new Date(row.createdAt).toLocaleDateString()}></Column>
                    <Column
                        header="Actions"
                        body={(row) => (
                            <div className="flex gap-2">
                                <Button icon="pi pi-pencil" onClick={() => openEdit(row)} outlined size="small" className="h-8 w-8 !p-0" />
                                <Button
                                    icon={row.isActive ? "pi pi-pause" : "pi pi-play"}
                                    onClick={() => handleToggleStatus(row)}
                                    outlined
                                    severity={row.isActive ? "warning" : "success"}
                                    size="small"
                                    className="h-8 w-8 !p-0"
                                    tooltip={row.status === 'inactive' ? 'Activate' : 'Deactivate'}
                                />
                            </div>
                        )}
                    ></Column>
                </DataTable>
            </div>

            <Dialog
                header={editingOrg ? "Edit Organization" : "Create New Organization"}
                visible={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                style={{ width: '500px' }}
                modal
            >
                <form onSubmit={handleSave} className="flex flex-col gap-4 mt-2">
                    <div className="field">
                        <label htmlFor="name" className="block text-sm font-bold mb-2">Organization Name</label>
                        <InputText
                            id="name"
                            value={orgForm.name}
                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                            className="w-full h-10 px-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="code" className="block text-sm font-bold mb-2">Internal Code (Unique)</label>
                        <InputText
                            id="code"
                            value={orgForm.code}
                            onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                            className="w-full h-10 px-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            required
                            placeholder="e.g. LUX_KARAOKE"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="description" className="block text-sm font-bold mb-2">Description</label>
                        <InputTextarea
                            id="description"
                            value={orgForm.description}
                            onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                            className="w-full p-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            rows={3}
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button label="Cancel" outlined onClick={() => setIsModalOpen(false)} className="h-10 px-6" />
                        <Button label="Save Changes" type="submit" className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-bold" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
};

export default OrganizationManagement;
