import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';

const UserManagement = () => {
    // [REF] Using 'users' for Customers, 'addUser' for creating customers, 'toggleUserStatus' for customers
    const { users, addUser, toggleUserStatus, currentUser, resetUserPassword } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    // [REF] Removed 'role' (default to customer) and 'organizationId' (customers are global/not org-scoped in this context)
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'customer', name: '', email: '', phone: '' });
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const toast = useRef(null);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            // [REF] Use addUser for customers
            await addUser({ ...newUser });
            toast.current.show({ severity: 'success', summary: 'Customer Created', detail: 'New customer added successfully', life: 3000 });
            setNewUser({ username: '', password: '', role: 'customer', name: '', email: '', phone: '' });
            setIsModalOpen(false);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Failed to add customer', life: 3000 });
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

    const actionBodyTemplate = (rowData) => {
        // [REF] Customers don't have roles like manager/sysadmin usually, but safe check
        if (rowData.role === 'sysadmin') return null;

        return (
            <div className="flex gap-2 flex-wrap select-none">
                <Button
                    label={rowData.isActive ? 'Deactivate' : 'Activate'}
                    onClick={() => {
                        // [REF] Use toggleUserStatus with 'customer' role context
                        toggleUserStatus(rowData.id, 'customer');
                        toast.current.show({
                            severity: 'success',
                            summary: 'Status Updated',
                            detail: `Customer ${rowData.isActive ? 'deactivated' : 'activated'} successfully`,
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

    // [REF] Filter users to only show customers (role 'customer') if needed, or all non-staff?
    // Usually 'users' state contains customers. 'staff' state contains staff.
    // Assuming 'users' contains only Customers (based on UsersController).
    const displayUsers = users;

    return (
        <div className="p-6">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold m-0 select-none">Customer Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage registered customers and their accounts</p>
                </div>
                <Button
                    label="Add Customer"
                    icon="pi pi-plus"
                    onClick={() => setIsModalOpen(true)}
                    className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none border-0"
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
                    <Column field="name" header="Name" sortable style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="username" header="Username" sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="email" header="Email" sortable style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="phone" header="Phone" sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="loyaltyPoints" header="Points" sortable style={{ width: '10%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column header="Status" body={statusBodyTemplate} style={{ width: '10%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column header="Actions" body={actionBodyTemplate} style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                </DataTable>
            </div>

            <Dialog
                header="Add New Customer"
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
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
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
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="field">
                            <label htmlFor="phone" className="mb-2 block font-semibold text-sm text-gray-700 select-none">Phone</label>
                            <InputText
                                id="phone"
                                value={newUser.phone}
                                onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                placeholder="Enter phone"
                                className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                                required
                            />
                        </div>
                    </div>
                    <div className="field grid grid-cols-1">
                        <label htmlFor="password" className="mb-3 font-semibold text-sm text-gray-700 select-none">Password</label>
                        <InputText
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-10">
                        <Button
                            label="Cancel"
                            severity="secondary"
                            outlined
                            onClick={() => setIsModalOpen(false)}
                            className="h-10 px-6 select-none"
                        />
                        <Button
                            label="Create Customer"
                            type="submit"
                            className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none border-0"
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

export default UserManagement;
