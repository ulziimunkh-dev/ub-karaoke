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

const UserManagement = () => {
    const { users, addUser, addStaff, toggleStaffStatus, toggleStaffStatus: toggleStaff, currentUser, resetUserPassword, organizations } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'staff', name: '', organizationId: '' });
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const toast = useRef(null);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await addStaff({ ...newUser, isActive: true });
            toast.current.show({ severity: 'success', summary: 'Staff Created', detail: 'New staff member added successfully', life: 3000 });
            setNewUser({ username: '', password: '', role: 'staff', name: '', organizationId: '' });
            setIsModalOpen(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to add staff', life: 3000 });
        }
    };

    const handleResetPassword = (user) => {
        setResetPasswordUser(user);
        setNewPassword('');
    };

    const confirmResetPassword = () => {
        if (!newPassword) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Please enter a new password', life: 3000 });
            return;
        }
        resetUserPassword(resetPasswordUser.id, newPassword);
        toast.current.show({ severity: 'success', summary: 'Password Reset', detail: `Password for ${resetPasswordUser.name} has been reset successfully`, life: 3000 });
        setResetPasswordUser(null);
        setNewPassword('');
    };

    const statusBodyTemplate = (rowData) => {
        return <Tag value={rowData.isActive ? 'Active' : 'Inactive'} severity={rowData.isActive ? 'success' : 'danger'} />;
    };

    const roleBodyTemplate = (rowData) => {
        return (
            <Tag
                value={rowData.role}
                severity={rowData.role === 'manager' ? 'info' : 'warning'}
                style={{ background: rowData.role === 'manager' ? '#E91E63' : '#2196F3' }}
            />
        );
    };

    const actionBodyTemplate = (rowData) => {
        if (rowData.id === currentUser.id || rowData.role === 'manager' || rowData.role === 'sysadmin') return null;

        return (
            <div className="flex gap-2 flex-wrap select-none">
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
                    className="h-8 px-3 text-xs whitespace-nowrap !border-current !text-current hover:!bg-opacity-10"
                />
                <Button
                    label="Reset"
                    onClick={() => handleResetPassword(rowData)}
                    outlined
                    size="small"
                    severity="warning"
                    icon="pi pi-lock-open"
                    className="h-8 px-3 text-xs whitespace-nowrap !border-current !text-current hover:!bg-opacity-10"
                />
            </div>
        );
    };

    const displayUsers = currentUser.role === 'sysadmin'
        ? users
        : users.filter(u => u.organizationId === currentUser.organizationId);

    return (
        <div className="p-6">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold m-0 select-none">User Management</h2>
                <Button
                    label="Add Staff"
                    icon="pi pi-plus"
                    onClick={() => setIsModalOpen(true)}
                    className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none"
                />
            </div>

            <div className="card p-0 shadow-md">
                <DataTable
                    value={displayUsers}
                    paginator
                    rows={10}
                    className="p-datatable-striped select-none"
                    responsiveLayout="scroll"
                    rowClassName={() => 'h-14'}
                    tableStyle={{ fontSize: '0.875rem' }}
                    selectionMode={null}
                    dataKey="id"
                >
                    <Column field="name" header="Name" sortable style={{ width: '20%', paddingLeft: '1rem', paddingRight: '1rem' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none pl-4 pr-4"></Column>
                    <Column field="username" header="Username" sortable style={{ width: '25%', paddingLeft: '1rem', paddingRight: '1rem' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none pl-4 pr-4"></Column>
                    <Column field="role" header="Role" body={roleBodyTemplate} sortable style={{ width: '15%', paddingLeft: '1rem', paddingRight: '1rem' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none pl-4 pr-4"></Column>
                    <Column header="Status" body={statusBodyTemplate} style={{ width: '15%', paddingLeft: '1rem', paddingRight: '1rem' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none pl-4 pr-4"></Column>
                    <Column header="Actions" body={actionBodyTemplate} style={{ width: '25%', paddingLeft: '1rem', paddingRight: '1rem' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none pl-4 pr-4"></Column>
                </DataTable>
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
                            inputClassName="h-10 flex items-center justify-center border-0 bg-white rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            panelClassName="p-dropdown-panel"
                        />
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
                                className="w-full"
                                required
                                inputClassName="h-10 flex items-center justify-center border-0 bg-white rounded-lg focus:ring-2 focus:ring-[#b000ff]"
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
                            className="w-full h-10 p-3 bg-white border-0 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
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
                            className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none"
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default UserManagement;
