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
        <div className="user-management pt-4 px-6 md:px-0">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-[0_10px_25px_rgba(176,0,255,0.4)]">
                        <i className="pi pi-users text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="m-0 text-3xl font-black text-white tracking-tight leading-none">{t('customerManagement')}</h2>
                        <p className="m-0 text-text-muted text-xs font-bold uppercase tracking-[0.2em] mt-2 opacity-60">{t('customerManagementDesc') || 'MANAGE REGISTERED CLIENTS & LOYALTY'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-11 w-11 rounded-xl border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                        tooltip={t('refresh')}
                    />
                    <Button
                        label={t('addCustomer')}
                        icon="pi pi-plus"
                        onClick={() => setIsModalOpen(true)}
                        className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-wider rounded-xl shadow-lg"
                    />
                </div>
            </div>

            {/* ── Desktop Table View ── */}
            <div className="bg-white/5 rounded-3xl border border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl hidden lg:block">
                <DataTable
                    value={displayUsers}
                    paginator
                    rows={10}
                    className="datatable-modern"
                    responsiveLayout="scroll"
                    dataKey="id"
                >
                    <Column field="name" header={t('fullName')} body={(rowData) => (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-[#eb79b2] font-black border-2 border-white/5 shadow-inner">
                                {rowData.name?.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white tracking-tight">{rowData.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono tracking-wider">@{rowData.username}</span>
                            </div>
                        </div>
                    )} sortable className="pl-6" headerClassName="pl-6"></Column>
                    <Column field="email" header={t('email')} sortable body={(row) => <span className="text-gray-400 text-xs font-medium">{row.email}</span>}></Column>
                    <Column field="phone" header={t('phone')} sortable body={(row) => <span className="text-gray-300 text-xs font-bold">{row.phone || '—'}</span>}></Column>
                    <Column field="loyaltyPoints" header={t('points')} sortable body={(row) => (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#ff9800]/10 flex items-center justify-center">
                                <i className="pi pi-star-fill text-[#ff9800] text-[10px]"></i>
                            </div>
                            <span className="font-black text-white text-sm">{row.loyaltyPoints || 0}</span>
                        </div>
                    )}></Column>
                    <Column header={t('status')} body={statusBodyTemplate}></Column>
                    <Column header={t('actions')} body={actionBodyTemplate} className="pr-6" headerClassName="pr-6"></Column>
                </DataTable>
            </div>

            {/* ── Mobile Card View ── */}
            <div className="lg:hidden space-y-4 mb-10">
                {displayUsers.map(user => (
                    <div key={user.id} className={`bg-white/5 rounded-2xl p-6 border border-white/5 shadow-xl transition-all duration-300 ${!user.isActive ? 'opacity-50 grayscale' : ''}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-[#eb79b2] font-black border-2 border-white/5">
                                    {user.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight m-0">{user.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">@{user.username}</span>
                                        <Tag value={user.isActive ? t('active') : t('inactive')} severity={user.isActive ? 'success' : 'danger'} className="text-[9px] font-black uppercase px-2 py-0.5" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#ff9800]/10 px-3 py-1.5 rounded-xl border border-[#ff9800]/20 text-right">
                                <p className="text-lg font-black text-[#ff9800] m-0 leading-none">{user.loyaltyPoints || 0}</p>
                                <p className="text-[8px] text-[#ff9800]/60 font-black uppercase tracking-widest m-0 mt-1">{t('points')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] block mb-1">{t('phone')}</span>
                                <span className="text-xs text-white/80 font-bold block">{user.phone || '—'}</span>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] block mb-1">{t('idNumber') || 'ID NUMBER'}</span>
                                <span className="text-xs text-white/80 font-bold block truncate">#{user.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-2">
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] block mb-1 text-center">{t('email')}</span>
                                <span className="text-xs text-white/80 font-bold truncate block text-center">{user.email}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                icon={user.isActive ? "pi pi-user-minus" : "pi pi-user-plus"}
                                label={user.isActive ? t('deactivate') : t('activate')}
                                onClick={() => {
                                    toggleUserStatus(user.id, 'customer');
                                    toast.current.show({
                                        severity: 'success',
                                        summary: t('statusUpdated'),
                                        detail: t('customerStatusDetail', { status: user.isActive ? t('deactivated') : t('activated') }),
                                        life: 3000
                                    });
                                }}
                                className={`h-11 border-0 text-white font-bold rounded-xl text-xs uppercase tracking-widest ${user.isActive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                            />
                            <Button
                                icon="pi pi-lock-open"
                                label={t('passwordShort') || 'PASSWD'}
                                onClick={() => handleResetPassword(user)}
                                className="h-11 bg-white/5 border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest"
                            />
                        </div>
                    </div>
                ))}
                {displayUsers.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <i className="pi pi-users text-3xl text-gray-600"></i>
                        </div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">{t('noCustomersFoundLabel')}</p>
                    </div>
                )}
            </div>

            {/* ── Add New Customer Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg shadow-[#b000ff]/20">
                            <i className="pi pi-user-plus text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('addNewCustomer')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{t('onboardingClient') || 'ONBOARDING NEW CLIENT'}</p>
                        </div>
                    </div>
                }
                visible={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                className="w-full max-w-[95vw] sm:max-w-[550px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-0"
                modal
                draggable={false}
            >
                <form onSubmit={handleAddUser} className="flex flex-col">
                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-[#b000ff]/10 flex items-center justify-center border border-[#b000ff]/20 text-[#b000ff]">
                                    <i className="pi pi-id-card text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('identityProfile') || 'IDENTITY & PROFILE'}</h4>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('fullName')}</label>
                                    <InputText
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder={t('enterFullName')}
                                        className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#b000ff] focus:ring-4 focus:ring-[#b000ff]/10 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('username')}</label>
                                    <InputText
                                        value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        placeholder={t('enterUsername')}
                                        className="w-full h-14 bg-black/20 border-white/5 px-4 font-mono font-bold text-[#eb79b2] rounded-2xl focus:border-[#b000ff] focus:ring-4 focus:ring-[#b000ff]/10 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-[#eb79b2]/10 flex items-center justify-center border border-[#eb79b2]/20 text-[#eb79b2]">
                                    <i className="pi pi-phone text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('contactInformation') || 'CONTACT INFORMATION'}</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('email')}</label>
                                    <InputText
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder={t('enterEmail')}
                                        className="w-full h-14 bg-black/20 border-white/5 px-4 font-bold text-white rounded-2xl focus:border-[#eb79b2] focus:ring-4 focus:ring-[#eb79b2]/10 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('phone')}</label>
                                    <InputText
                                        value={newUser.phone}
                                        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                        placeholder={t('enterPhone')}
                                        className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#eb79b2] focus:ring-4 focus:ring-[#eb79b2]/10 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-500">
                                    <i className="pi pi-lock text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('security') || 'SECURITY'}</h4>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('password')}</label>
                                <InputText
                                    type="password"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder={t('enterPassword')}
                                    className="w-full h-14 bg-black/20 border-white/5 px-4 font-bold text-white rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-center tracking-[0.3em]"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                        <Button label={t('cancel')} type="button" className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all" onClick={() => setIsModalOpen(false)} />
                        <Button
                            label={t('createCustomer')}
                            type="submit"
                            className="flex-1 h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(176,0,255,0.4)] transition-all hover:scale-[1.02]"
                        />
                    </div>
                </form>
            </Dialog>

            {/* ── Reset Password Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <i className="pi pi-lock-open text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('resetPassword')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{resetPasswordUser?.name}</p>
                        </div>
                    </div>
                }
                visible={!!resetPasswordUser}
                onHide={() => setResetPasswordUser(null)}
                className="w-full max-w-[95vw] sm:max-w-[480px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-0"
                modal
                draggable={false}
            >
                <div className="flex flex-col">
                    <div className="p-8">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center">
                            <div className="w-20 h-20 rounded-[2rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                                <i className="pi pi-key text-3xl text-orange-500"></i>
                            </div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                                {t('newPasswordLabel') || 'ENTER SECURE PASSWORD'}
                            </label>
                            <InputText
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-16 bg-black/40 border-white/10 px-4 text-white text-center text-2xl font-black tracking-[0.4em] rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                autoFocus
                            />
                            <p className="mt-6 m-0 text-xs font-bold text-gray-600 uppercase tracking-wider">{t('resetPasswordWarn') || 'The user will be required to use this new credential to log in.'}</p>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                        <Button label={t('cancel')} type="button" className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all" onClick={() => setResetPasswordUser(null)} />
                        <Button
                            label={t('updatePassword') || 'RESET PASSWORD'}
                            onClick={confirmResetPassword}
                            className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-red-600 border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02]"
                        />
                    </div>
                </div>
            </Dialog>

            <style>{`
                .premium-dialog .p-dialog-header {
                    background: #0f0f15 !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    padding: 1.5rem 2rem !important;
                }
                .user-management .p-datatable.datatable-modern {
                    background: transparent !important;
                }
                .user-management .p-datatable.datatable-modern .p-datatable-thead > tr > th {
                    background: rgba(255, 255, 255, 0.02) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    padding: 1.75rem 1.5rem !important;
                    color: #666 !important;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                }
                .user-management .p-datatable.datatable-modern .p-datatable-tbody > tr {
                    background: transparent !important;
                    color: white !important;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .user-management .p-datatable.datatable-modern .p-datatable-tbody > tr:hover {
                    background: rgba(255, 255, 255, 0.03) !important;
                    transform: scale(0.998);
                }
                .user-management .p-datatable.datatable-modern .p-datatable-tbody > tr > td {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
                    padding: 1.5rem !important;
                }
                .user-management .p-paginator {
                    background: transparent !important;
                    border: none !important;
                    padding: 2rem !important;
                }
                .user-management .p-paginator .p-paginator-pages .p-paginator-page {
                    color: #555 !important;
                    font-weight: 900 !important;
                    border-radius: 12px !important;
                    transition: all 0.2s;
                }
                .user-management .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
                    background: #b000ff !important;
                    color: white !important;
                }
            `}</style>
        </div>
    );
};

export default UserManagement;
