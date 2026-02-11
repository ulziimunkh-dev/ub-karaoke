import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import AvatarGalleryPicker from '../common/AvatarGalleryPicker';
import { api } from '../../utils/api';

const StaffManagement = () => {
    const { staffs, addStaff, updateStaff, toggleStaffStatus, currentUser, organizations, refreshData } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'staff', name: '', organizationId: '', phone: '', email: '', avatar: '' });
    const [editingStaff, setEditingStaff] = useState(null);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const toast = useRef(null);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await addStaff({ ...newUser, isActive: true });
            toast.current.show({ severity: 'success', summary: 'Staff Created', detail: 'New staff member added successfully', life: 3000 });
            setNewUser({ username: '', password: '', role: 'staff', name: '', organizationId: '', phone: '', email: '', avatar: '' });
            setIsModalOpen(false);
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to add staff', life: 3000 });
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            await updateStaff(editingStaff.id, editingStaff);
            toast.current.show({ severity: 'success', summary: 'Staff Updated', detail: 'Staff member updated successfully', life: 3000 });
            setIsEditModalOpen(false);
            setEditingStaff(null);
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to update staff', life: 3000 });
        }
    };

    const handleResetPassword = (user) => {
        setResetPasswordUser(user);
        setNewPassword('');
    };

    const confirmResetPassword = async () => {
        if (!newPassword) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Please enter a new password', life: 3000 });
            return;
        }
        try {
            await updateStaff(resetPasswordUser.id, { password: newPassword });
            toast.current.show({ severity: 'success', summary: 'Password Reset', detail: `Password for ${resetPasswordUser.name} has been reset successfully`, life: 3000 });
            setResetPasswordUser(null);
            setNewPassword('');
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to reset password', life: 3000 });
        }
    };

    const statusBodyTemplate = (rowData) => {
        return <Tag value={rowData.isActive ? 'Active' : 'Inactive'} severity={rowData.isActive ? 'success' : 'danger'} className="px-2 py-1" />;
    };

    const roleBodyTemplate = (rowData) => {
        const roleConfig = {
            manager: { label: 'Branch Manager', color: '#E91E63' },
            staff: { label: 'Staff Member', color: '#2196F3' },
            sysadmin: { label: 'System Admin', color: '#673AB7' }
        };
        const config = roleConfig[rowData.role] || { label: rowData.role, color: '#9E9E9E' };

        return (
            <Tag
                value={config.label}
                style={{ background: config.color, color: 'white' }}
            />
        );
    };

    const organizationBodyTemplate = (rowData) => {
        const org = rowData.orgInfo || rowData.organization;
        return org?.name || (rowData.role === 'sysadmin' ? 'Global' : 'N/A');
    };

    const actionBodyTemplate = (rowData) => {
        const isSelf = rowData.id === currentUser.id;
        const canManage = currentUser.role === 'sysadmin' || (currentUser.role === 'manager' && rowData.role === 'staff');

        return (
            <div className="flex gap-3 flex-wrap">
                {canManage && !isSelf && (
                    <Button
                        label={rowData.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => {
                            toggleStaffStatus(rowData.id);
                            toast.current.show({
                                severity: 'success',
                                summary: 'Status Updated',
                                detail: `Staff member ${rowData.isActive ? 'deactivated' : 'activated'} successfully`,
                                life: 3000
                            });
                        }}
                        outlined
                        size="small"
                        severity={rowData.isActive ? 'danger' : 'success'}
                        className="h-9 px-4 text-xs font-bold"
                    />
                )}
                <Button
                    icon="pi pi-pencil"
                    label="Edit"
                    onClick={() => {
                        setEditingStaff({ ...rowData });
                        setIsEditModalOpen(true);
                    }}
                    outlined
                    size="small"
                    severity="info"
                    className="h-9 px-4 text-xs font-bold"
                />
                <Button
                    icon="pi pi-lock-open"
                    label="Reset"
                    onClick={() => handleResetPassword(rowData)}
                    outlined
                    size="small"
                    severity="warning"
                    className="h-9 px-4 text-xs font-bold"
                />
            </div>
        );
    };

    const displayStaffs = staffs.filter(u => {
        const belongsToOrg = currentUser.role === 'sysadmin' || u.organizationId === currentUser.organizationId;
        const matchesFilter = selectedOrganization === null || selectedOrganization.value === null ? true : u.organizationId === selectedOrganization;
        return belongsToOrg && matchesFilter;
    });

    if (displayStaffs.length > 0) {
        console.log('[StaffManagement] First staff organization trace:', {
            staff: displayStaffs[0].username,
            org_id: displayStaffs[0].organizationId,
            org_obj: displayStaffs[0].orgInfo || displayStaffs[0].organization,
            service_transformed: displayStaffs[0].SERVICE_TRANSFORMED
        });
    }

    return (
        <div className="p-6">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold m-0 select-none">Staff Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage users and roles across your organization</p>
                </div>
                <div className="flex gap-3">
                    {currentUser.role === 'sysadmin' && (
                        <Dropdown
                            value={selectedOrganization}
                            options={[
                                { label: 'All Organizations', value: null },
                                ...organizations.map(org => ({ label: org.name, value: org.id }))
                            ]}
                            onChange={(e) => setSelectedOrganization(e.value)}
                            placeholder="Filter by Organization"
                            className="w-64 h-10 flex items-center bg-white border border-gray-200 rounded-lg"
                        />
                    )}
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-10 w-10"
                        tooltip="Refresh"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                        label="Add Staff"
                        icon="pi pi-plus"
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none border-0"
                    />
                </div>
            </div>

            <div className="card p-0 shadow-md hidden lg:block">
                <DataTable
                    value={displayStaffs}
                    paginator
                    rows={10}
                    className="p-datatable-striped select-none"
                    responsiveLayout="scroll"
                    rowClassName={() => 'h-14'}
                    tableStyle={{ fontSize: '0.875rem' }}
                    selectionMode={null}
                    dataKey="id"
                >
                    <Column field="name" header="Name" body={(rowData) => (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white/20">
                                {rowData.avatar ? (
                                    <img src={api.getFileUrl(rowData.avatar)} alt={rowData.name} className="w-full h-full object-cover" />
                                ) : (
                                    rowData.name?.charAt(0)
                                )}
                            </div>
                            <span>{rowData.name}</span>
                        </div>
                    )} sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="username" header="Username" sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="email" header="Email" sortable style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="role" header="Role" body={roleBodyTemplate} sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column header="Organization" body={organizationBodyTemplate} sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column header="Status" body={statusBodyTemplate} style={{ width: '10%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column header="Actions" body={actionBodyTemplate} style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                </DataTable>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {displayStaffs.map(staff => {
                    const orgName = organizationBodyTemplate(staff);
                    return (
                        <div key={staff.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1">{staff.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-mono">@{staff.username}</span>
                                        <Tag value={staff.isActive ? 'Active' : 'Inactive'} severity={staff.isActive ? 'success' : 'danger'} className="text-[10px] px-2 py-1 origin-left" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    {roleBodyTemplate(staff)}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Organization</span>
                                    <span className="text-xs text-gray-700 font-bold">{orgName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email</span>
                                    <span className="text-xs text-gray-700 font-medium truncate max-w-[150px]">{staff.email}</span>
                                </div>
                            </div>

                            <div className="flex gap-2.5">
                                <Button
                                    icon="pi pi-pencil"
                                    onClick={() => {
                                        setEditingStaff({ ...staff });
                                        setIsEditModalOpen(true);
                                    }}
                                    label="Edit"
                                    outlined
                                    size="small"
                                    severity="info"
                                    className="flex-1 h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                                />
                                <Button
                                    icon="pi pi-lock-open"
                                    label="Reset"
                                    onClick={() => handleResetPassword(staff)}
                                    outlined
                                    size="small"
                                    severity="warning"
                                    className="flex-1 h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                                />
                                {(currentUser.role === 'sysadmin' || (currentUser.role === 'manager' && staff.role === 'staff')) && staff.id !== currentUser.id && (
                                    <Button
                                        icon={staff.isActive ? "pi pi-pause" : "pi pi-play"}
                                        onClick={() => {
                                            toggleStaffStatus(staff.id);
                                            toast.current.show({
                                                severity: 'success',
                                                summary: 'Status Updated',
                                                detail: `Staff member ${staff.isActive ? 'deactivated' : 'activated'} successfully`,
                                                life: 3000
                                            });
                                        }}
                                        outlined
                                        size="small"
                                        severity={staff.isActive ? 'danger' : 'success'}
                                        className="w-14 h-12 border border-gray-200 rounded-xl flex items-center justify-center p-0"
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
                {displayStaffs.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <i className="pi pi-users text-4xl text-gray-300 mb-3"></i>
                        <p className="text-gray-500 font-medium">No staff found</p>
                    </div>
                )}
            </div>

            <Dialog
                header="Add New Staff Member"
                visible={isModalOpen}
                modal
                onHide={() => setIsModalOpen(false)}
                style={{ width: '90vw', maxWidth: '500px' }}
                contentStyle={{ padding: '2rem' }}
                headerClassName="select-none"
            >
                <form onSubmit={handleAddUser} className="flex flex-col gap-6">
                    <div className="flex justify-center mb-4">
                        <AvatarGalleryPicker
                            currentAvatar={newUser.avatar}
                            onSelect={(url) => setNewUser({ ...newUser, avatar: url })}
                        />
                    </div>
                    <div className="field grid grid-cols-1">
                        <label htmlFor="name" className="mb-3 font-semibold text-sm text-gray-700 select-none">Full Name</label>
                        <InputText
                            id="name"
                            value={newUser.name}
                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                            placeholder="Enter full name"
                            className="w-full h-10 p-3 bg-white border-0 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="field grid grid-cols-1">
                        <label htmlFor="username" className="mb-3 font-semibold text-sm text-gray-700 select-none">Username</label>
                        <InputText
                            id="username"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            placeholder="Enter username"
                            className="w-full h-10 p-3 bg-white border-0 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="field grid grid-cols-1">
                        <label htmlFor="password" className="mb-3 font-semibold text-sm text-gray-700 select-none">Password</label>
                        <InputText
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            className="w-full h-10 p-3 bg-white border-0 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="field grid grid-cols-1">
                        <label htmlFor="role" className="mb-3 font-semibold text-sm text-gray-700 select-none">Role</label>
                        <Dropdown
                            id="role"
                            value={newUser.role}
                            options={[
                                { label: 'Staff Member', value: 'staff' },
                                { label: 'Branch Manager', value: 'manager' },
                                ...(currentUser.role === 'sysadmin' ? [{ label: 'System Admin', value: 'sysadmin' }] : [])
                            ]}
                            onChange={e => setNewUser({ ...newUser, role: e.value })}
                            placeholder="Select Role"
                            className="w-full"
                            pt={{
                                input: { className: 'h-10 flex items-center justify-center border-0 bg-white rounded-lg focus:ring-2 focus:ring-[#b000ff]' }
                            }}
                            panelClassName="p-dropdown-panel"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="field">
                            <label htmlFor="phone" className="mb-2 block font-semibold text-sm text-gray-700 select-none">Phone Number</label>
                            <InputText
                                id="phone"
                                value={newUser.phone}
                                onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                placeholder="Enter phone"
                                className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="email" className="mb-2 block font-semibold text-sm text-gray-700 select-none">Email</label>
                            <InputText
                                id="email"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="Enter email"
                                className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                                required
                            />
                        </div>
                    </div>
                    {currentUser.role === 'sysadmin' && newUser.role !== 'sysadmin' && (
                        <div className="field grid grid-cols-1">
                            <label htmlFor="organization" className="mb-3 font-semibold text-sm text-gray-700 select-none">Organization</label>
                            <Dropdown
                                id="organization"
                                value={newUser.organizationId}
                                options={organizations.map(org => ({ label: org.name, value: org.id }))}
                                onChange={e => setNewUser({ ...newUser, organizationId: e.value })}
                                placeholder="Select Organization"
                                className="w-full border border-gray-200 h-10 flex items-center"
                                required
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-10">
                        <Button
                            label="Cancel"
                            severity="secondary"
                            outlined
                            onClick={() => setIsModalOpen(false)}
                            className="h-10 px-6 select-none"
                        />
                        <Button
                            label="Create Staff"
                            type="submit"
                            className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none"
                        />
                    </div>
                </form>
            </Dialog>

            <Dialog
                header="Edit Staff Member"
                visible={isEditModalOpen}
                modal
                onHide={() => setIsEditModalOpen(false)}
                style={{ width: '90vw', maxWidth: '500px' }}
                contentStyle={{ padding: '2rem' }}
                headerClassName="select-none"
            >
                {editingStaff && (
                    <form onSubmit={handleEditUser} className="flex flex-col gap-6">
                        <div className="flex justify-center mb-4">
                            <AvatarGalleryPicker
                                currentAvatar={editingStaff.avatar}
                                onSelect={(url) => setEditingStaff({ ...editingStaff, avatar: url })}
                            />
                        </div>
                        <div className="field grid grid-cols-1">
                            <label htmlFor="edit_name" className="mb-2 font-semibold text-sm text-gray-700">Full Name</label>
                            <InputText
                                id="edit_name"
                                value={editingStaff.name}
                                onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                className="w-full h-10 p-3 border border-gray-200 rounded-lg"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="field">
                                <label htmlFor="edit_phone" className="mb-2 block font-semibold text-sm text-gray-700">Phone</label>
                                <InputText
                                    id="edit_phone"
                                    value={editingStaff.phone}
                                    onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                                    className="w-full h-10 p-3 border border-gray-200 rounded-lg"
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="edit_email" className="mb-2 block font-semibold text-sm text-gray-700">Email</label>
                                <InputText
                                    id="edit_email"
                                    value={editingStaff.email}
                                    onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                                    className="w-full h-10 p-3 border border-gray-200 rounded-lg"
                                    required
                                />
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="edit_role" className="mb-2 block font-semibold text-sm text-gray-700">Role</label>
                            <Dropdown
                                id="edit_role"
                                value={editingStaff.role}
                                options={[
                                    { label: 'Staff Member', value: 'staff' },
                                    { label: 'Branch Manager', value: 'manager' },
                                    ...(currentUser.role === 'sysadmin' ? [{ label: 'System Admin', value: 'sysadmin' }] : [])
                                ]}
                                onChange={e => setEditingStaff({ ...editingStaff, role: e.value })}
                                className="w-full border border-gray-200 h-10 flex items-center"
                                disabled={currentUser.role !== 'sysadmin'}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button label="Cancel" severity="secondary" outlined onClick={() => setIsEditModalOpen(false)} />
                            <Button label="Save Changes" type="submit" className="bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white border-0" />
                        </div>
                    </form>
                )}
            </Dialog>

            <Dialog
                header={`Reset Password for ${resetPasswordUser?.name}`}
                visible={!!resetPasswordUser}
                modal
                onHide={() => setResetPasswordUser(null)}
                style={{ width: '90vw', maxWidth: '450px' }}
                contentStyle={{ padding: '2rem' }}
                headerClassName="select-none"
            >
                <div className="flex flex-col gap-6">
                    <div className="field grid grid-cols-1">
                        <label htmlFor="newPassword" className="mb-3 font-semibold text-sm text-gray-700 select-none">New Password</label>
                        <InputText
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-10">
                        <Button
                            label="Cancel"
                            severity="secondary"
                            outlined
                            onClick={() => setResetPasswordUser(null)}
                            className="h-10 px-6 select-none"
                        />
                        <Button
                            label="Reset Password"
                            onClick={confirmResetPassword}
                            className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none border-0"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default StaffManagement;
