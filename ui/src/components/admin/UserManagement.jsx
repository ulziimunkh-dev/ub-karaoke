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
import { useLanguage } from '../../contexts/LanguageContext';

const UserManagement = () => {
    const { t } = useLanguage();
    // [REF] Using 'users' for Customers, 'addUser' for creating customers, 'toggleUserStatus' for customers
    const { users, addUser, toggleUserStatus, currentUser, resetUserPassword, refreshData } = useData();
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
            toast.current.show({ severity: 'success', summary: t('customerCreated'), detail: t('customerCreatedDetail'), life: 3000 });
            setNewUser({ username: '', password: '', role: 'customer', name: '', email: '', phone: '' });
            setIsModalOpen(false);
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: error.response?.data?.message || t('customerCreateFailed'), life: 3000 });
        }
    };

    const handleResetPassword = (user) => {
        setResetPasswordUser(user);
        setNewPassword('');
    };

    const confirmResetPassword = async () => {
        if (!newPassword) {
            toast.current.show({ severity: 'warn', summary: t('warning'), detail: t('enterNewPassword'), life: 3000 });
            return;
        }
        await resetUserPassword(resetPasswordUser.id, newPassword);
        toast.current.show({ severity: 'success', summary: t('passwordResetSuccess'), detail: t('staffUpdatedDetail'), life: 3000 });
        setResetPasswordUser(null);
        setNewPassword('');
        refreshData?.();
    };

    const statusBodyTemplate = (rowData) => {
        return <Tag value={rowData.isActive ? t('active') : t('inactive')} severity={rowData.isActive ? 'success' : 'danger'} />;
    };

    const actionBodyTemplate = (rowData) => {
        // [REF] Customers don't have roles like manager/sysadmin usually, but safe check
        if (rowData.role === 'sysadmin') return null;

        return (
            <div className="flex gap-3 flex-wrap">
                <Button
                    label={rowData.isActive ? t('deactivate') : t('activate')}
                    onClick={() => {
                        toggleUserStatus(rowData.id, 'customer');
                        toast.current.show({
                            severity: 'success',
                            summary: t('statusUpdated'),
                            detail: t('customerStatusDetail', { status: rowData.isActive ? t('deactivated') : t('activated') }),
                            life: 3000
                        });
                    }}
                    outlined
                    size="small"
                    severity={rowData.isActive ? 'danger' : 'success'}
                    className="h-9 px-4 text-xs font-bold"
                />
                <Button
                    label={t('resetPassword')}
                    onClick={() => handleResetPassword(rowData)}
                    outlined
                    size="small"
                    severity="warning"
                    icon="pi pi-lock-open"
                    className="h-9 px-4 text-xs font-bold"
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
                    <h2 className="text-2xl font-bold m-0 select-none">{t('customerManagement')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('customerManagementDesc')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-10 w-10"
                        tooltip={t('refresh')}
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                        label={t('addCustomer')}
                        icon="pi pi-plus"
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none border-0"
                    />
                </div>
            </div>

            <div className="card p-0 shadow-md hidden lg:block">
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
                    <Column field="name" header={t('fullName')} sortable style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="username" header={t('username')} sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="email" header={t('email')} sortable style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="phone" header={t('phone')} sortable style={{ width: '15%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column field="loyaltyPoints" header={t('points')} sortable style={{ width: '10%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column header={t('status')} body={statusBodyTemplate} style={{ width: '10%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                    <Column header={t('actions')} body={actionBodyTemplate} style={{ width: '20%' }} headerClassName="bg-gray-50 font-bold text-gray-700 select-none px-4"></Column>
                </DataTable>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {displayUsers.map(user => (
                    <div key={user.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">{user.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 font-mono">@{user.username}</span>
                                    <Tag value={user.isActive ? t('active') : t('inactive')} severity={user.isActive ? 'success' : 'danger'} className="text-[10px] px-2 py-1 origin-left" />
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-[#b000ff] m-0">{user.loyaltyPoints || 0}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest m-0">{t('points')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t('email')}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t('phone')}</p>
                                <p className="text-sm text-gray-700 font-bold">{user.phone}</p>
                            </div>
                        </div>

                        <div className="flex gap-2.5">
                            <Button
                                label={user.isActive ? t('deactivate') : t('activate')}
                                icon={`pi ${user.isActive ? 'pi-user-minus' : 'pi-user-plus'}`}
                                onClick={() => {
                                    toggleUserStatus(user.id, 'customer');
                                    toast.current.show({
                                        severity: 'success',
                                        summary: t('statusUpdated'),
                                        detail: t('customerStatusDetail', { status: user.isActive ? t('deactivated') : t('activated') }),
                                        life: 3000
                                    });
                                }}
                                outlined
                                size="small"
                                severity={user.isActive ? 'danger' : 'success'}
                                className="flex-1 h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                            />
                            <Button
                                label={t('password')}
                                icon="pi pi-lock-open"
                                onClick={() => handleResetPassword(user)}
                                outlined
                                size="small"
                                severity="warning"
                                className="flex-1 h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                            />
                        </div>
                    </div>
                ))}
                {displayUsers.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <i className="pi pi-users text-4xl text-gray-300 mb-3"></i>
                        <p className="text-gray-500 font-medium">{t('noCustomersFoundLabel')}</p>
                    </div>
                )}
            </div>

            <Dialog
                header={t('addNewCustomer')}
                visible={isModalOpen}
                modal
                onHide={() => setIsModalOpen(false)}
                style={{ width: '90vw', maxWidth: '500px' }}
                contentStyle={{ padding: '2rem' }}
                headerClassName="select-none"
            >
                <form onSubmit={handleAddUser} className="flex flex-col gap-6">
                    <div className="field grid grid-cols-1">
                        <label htmlFor="name" className="mb-3 font-semibold text-sm text-gray-700 select-none">{t('fullName')}</label>
                        <InputText
                            id="name"
                            value={newUser.name}
                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                            placeholder={t('enterFullName')}
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="field grid grid-cols-1">
                        <label htmlFor="username" className="mb-3 font-semibold text-sm text-gray-700 select-none">{t('username')}</label>
                        <InputText
                            id="username"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            placeholder={t('enterUsername')}
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="field">
                            <label htmlFor="email" className="mb-2 block font-semibold text-sm text-gray-700 select-none">{t('email')}</label>
                            <InputText
                                id="email"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder={t('enterEmail')}
                                className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                                required
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="phone" className="mb-2 block font-semibold text-sm text-gray-700 select-none">{t('phone')}</label>
                            <InputText
                                id="phone"
                                value={newUser.phone}
                                onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                placeholder={t('enterPhone')}
                                className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                                required
                            />
                        </div>
                    </div>
                    <div className="field grid grid-cols-1">
                        <label htmlFor="password" className="mb-3 font-semibold text-sm text-gray-700 select-none">{t('password')}</label>
                        <InputText
                            id="password"
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder={t('enterPassword')}
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-10">
                        <Button
                            label={t('cancel')}
                            severity="secondary"
                            outlined
                            onClick={() => setIsModalOpen(false)}
                            className="h-10 px-6 select-none"
                        />
                        <Button
                            label={t('createCustomer')}
                            type="submit"
                            className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 select-none border-0"
                        />
                    </div>
                </form>
            </Dialog>

            <Dialog
                header={t('resetPasswordFor', { name: resetPasswordUser?.name })}
                visible={!!resetPasswordUser}
                modal
                onHide={() => setResetPasswordUser(null)}
                style={{ width: '90vw', maxWidth: '450px' }}
                contentStyle={{ padding: '2rem' }}
                headerClassName="select-none"
            >
                <div className="flex flex-col gap-6">
                    <div className="field grid grid-cols-1">
                        <label htmlFor="newPassword" className="mb-3 font-semibold text-sm text-gray-700 select-none">{t('newPasswordLabel')}</label>
                        <InputText
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder={t('enterNewPassword')}
                            className="w-full h-10 p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b000ff]"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-10">
                        <Button
                            label={t('cancel')}
                            severity="secondary"
                            outlined
                            onClick={() => setResetPasswordUser(null)}
                            className="h-10 px-6 select-none"
                        />
                        <Button
                            label={t('resetPassword')}
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
