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
import { useLanguage } from '../../contexts/LanguageContext';

const StaffManagement = () => {
    const { t } = useLanguage();
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
            toast.current.show({ severity: 'success', summary: t('staffCreated'), detail: t('staffCreatedDetail'), life: 3000 });
            setNewUser({ username: '', password: '', role: 'staff', name: '', organizationId: '', phone: '', email: '', avatar: '' });
            setIsModalOpen(false);
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: error.response?.data?.message || t('staffCreateFailed'), life: 3000 });
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        try {
            await updateStaff(editingStaff.id, editingStaff);
            toast.current.show({ severity: 'success', summary: t('staffUpdated'), detail: t('staffUpdatedDetail'), life: 3000 });
            setIsEditModalOpen(false);
            setEditingStaff(null);
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: error.response?.data?.message || t('staffUpdateFailed'), life: 3000 });
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
        try {
            await updateStaff(resetPasswordUser.id, { password: newPassword });
            toast.current.show({ severity: 'success', summary: t('passwordResetSuccess'), detail: t('staffUpdatedDetail'), life: 3000 });
            setResetPasswordUser(null);
            setNewPassword('');
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('staffUpdateFailed'), life: 3000 });
        }
    };

    const statusBodyTemplate = (rowData) => {
        return <Tag value={rowData.isActive ? t('active') : t('inactive')} severity={rowData.isActive ? 'success' : 'danger'} className="px-2 py-1" />;
    };

    const roleBodyTemplate = (rowData) => {
        const roleConfig = {
            manager: { label: t('branchManager'), color: '#E91E63' },
            staff: { label: t('staffMember'), color: '#2196F3' },
            sysadmin: { label: t('systemAdmin'), color: '#673AB7' }
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
        return org?.name || (rowData.role === 'sysadmin' ? t('global') : 'N/A');
    };

    const actionBodyTemplate = (rowData) => {
        const isSelf = rowData.id === currentUser.id;
        const canManage = currentUser.role === 'sysadmin' || (currentUser.role === 'manager' && rowData.role === 'staff');

        return (
            <div className="flex gap-3 flex-wrap">
                {canManage && !isSelf && (
                    <Button
                        label={rowData.isActive ? t('deactivate') : t('activate')}
                        onClick={() => {
                            toggleStaffStatus(rowData.id);
                            toast.current.show({
                                severity: 'success',
                                summary: t('statusUpdated'),
                                detail: t('staffStatusDetail', { status: rowData.isActive ? t('deactivated') : t('activated') }),
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
                    label={t('edit')}
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
                    label={t('reset')}
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
        <div className="staff-management pt-4 px-6 md:px-0">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-[0_10px_25px_rgba(176,0,255,0.4)]">
                        <i className="pi pi-users text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="m-0 text-3xl font-black text-white tracking-tight leading-none">{t('staffManagement')}</h2>
                        <p className="m-0 text-text-muted text-xs font-bold uppercase tracking-[0.2em] mt-2 opacity-60">{t('manageUsersRoles')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {currentUser.role === 'sysadmin' && (
                        <Dropdown
                            value={selectedOrganization}
                            options={[
                                { label: t('allOrganizations'), value: null },
                                ...organizations.map(org => ({ label: org.name, value: org.id }))
                            ]}
                            onChange={(e) => setSelectedOrganization(e.value)}
                            placeholder={t('filterByOrganization')}
                            className="w-full sm:w-64 h-11 bg-black/20 border-white/10 text-white font-bold rounded-xl"
                        />
                    )}
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-11 w-11 rounded-xl border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                        tooltip={t('refresh')}
                    />
                    <Button
                        label={t('addStaff')}
                        icon="pi pi-plus"
                        onClick={() => setIsModalOpen(true)}
                        className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-wider rounded-xl shadow-lg"
                    />
                </div>
            </div>

            {/* ── Desktop Table View ── */}
            <div className="bg-white/5 rounded-3xl border border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl hidden lg:block">
                <DataTable
                    value={displayStaffs}
                    paginator
                    rows={10}
                    className="datatable-modern"
                    responsiveLayout="scroll"
                    dataKey="id"
                >
                    <Column field="name" header={t('fullName')} body={(rowData) => (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center text-white font-black overflow-hidden border-2 border-white/20 shadow-lg">
                                {rowData.avatar ? (
                                    <img src={api.getFileUrl(rowData.avatar)} alt={rowData.name} className="w-full h-full object-cover" />
                                ) : (
                                    rowData.name?.charAt(0)
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white tracking-tight">{rowData.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono tracking-wider">@{rowData.username}</span>
                            </div>
                        </div>
                    )} sortable className="pl-6" headerClassName="pl-6"></Column>
                    <Column field="email" header={t('email')} sortable body={(row) => <span className="text-gray-400 text-xs font-medium">{row.email}</span>}></Column>
                    <Column field="phone" header={t('phone')} sortable body={(row) => <span className="text-gray-300 text-xs font-bold">{row.phone || '—'}</span>}></Column>
                    <Column field="role" header={t('role')} body={roleBodyTemplate} sortable></Column>
                    <Column header={t('organization')} body={organizationBodyTemplate} sortable bodyClassName="text-gray-400 font-medium text-xs"></Column>
                    <Column header={t('status')} body={statusBodyTemplate}></Column>
                    <Column header={t('actions')} body={actionBodyTemplate} className="pr-6" headerClassName="pr-6"></Column>
                </DataTable>
            </div>

            {/* ── Mobile Card View ── */}
            <div className="lg:hidden space-y-4 mb-10">
                {displayStaffs.map(staff => {
                    const orgName = organizationBodyTemplate(staff);
                    return (
                        <div key={staff.id} className={`bg-white/5 rounded-2xl p-6 border border-white/5 shadow-xl transition-all duration-300 ${!staff.isActive ? 'opacity-50 grayscale' : ''}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center text-white font-black overflow-hidden border-2 border-white/20">
                                        {staff.avatar ? (
                                            <img src={api.getFileUrl(staff.avatar)} alt={staff.name} className="w-full h-full object-cover" />
                                        ) : (
                                            staff.name?.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white tracking-tight m-0">{staff.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">@{staff.username}</span>
                                            <Tag value={staff.isActive ? t('active') : t('inactive')} severity={staff.isActive ? 'success' : 'danger'} className="text-[9px] font-black uppercase px-2 py-0.5" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-1">
                                    {roleBodyTemplate(staff)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] block mb-1">{t('organization')}</span>
                                    <span className="text-xs text-white/80 font-bold truncate block">{orgName}</span>
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] block mb-1">{t('phone')}</span>
                                    <span className="text-xs text-white/80 font-bold block">{staff.phone || '—'}</span>
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-2">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] block mb-1 text-center">{t('email')}</span>
                                    <span className="text-xs text-white/80 font-bold truncate block text-center">{staff.email}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    icon="pi pi-pencil"
                                    onClick={() => {
                                        setEditingStaff({ ...staff });
                                        setIsEditModalOpen(true);
                                    }}
                                    label={t('edit')}
                                    className="h-11 bg-white/5 border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest"
                                />
                                <Button
                                    icon="pi pi-lock-open"
                                    label={t('reset')}
                                    onClick={() => handleResetPassword(staff)}
                                    className="h-11 bg-white/5 border-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-widest"
                                />
                                {(currentUser.role === 'sysadmin' || (currentUser.role === 'manager' && staff.role === 'staff')) && staff.id !== currentUser.id && (
                                    <Button
                                        icon={staff.isActive ? "pi pi-pause" : "pi pi-play"}
                                        onClick={() => {
                                            toggleStaffStatus(staff.id);
                                            toast.current.show({
                                                severity: 'success',
                                                summary: t('statusUpdated'),
                                                detail: t('staffStatusDetail', { status: staff.isActive ? t('deactivated') : t('activated') }),
                                                life: 3000
                                            });
                                        }}
                                        className={`h-11 border-0 text-white font-bold rounded-xl ${staff.isActive ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
                {displayStaffs.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <i className="pi pi-users text-3xl text-gray-600"></i>
                        </div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">{t('noStaffFoundLabel')}</p>
                    </div>
                )}
            </div>

            {/* ── Add New Staff Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg shadow-[#b000ff]/20">
                            <i className="pi pi-user-plus text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('addNewStaffMember')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{t('systemOnboarding') || 'SYSTEM ONBOARDING'}</p>
                        </div>
                    </div>
                }
                visible={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                className="w-full max-w-[95vw] sm:max-w-[600px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-0"
                modal
                draggable={false}
            >
                <form onSubmit={handleAddUser} className="flex flex-col">
                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center shadow-inner">
                            <div className="flex items-center gap-3 mb-6 text-left">
                                <div className="w-8 h-8 rounded-xl bg-[#b000ff]/10 flex items-center justify-center border border-[#b000ff]/20 text-[#b000ff]">
                                    <i className="pi pi-id-card text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('identityAvatar') || 'IDENTITY & AVATAR'}</h4>
                            </div>
                            <AvatarGalleryPicker
                                currentAvatar={newUser.avatar}
                                onSelect={(url) => setNewUser({ ...newUser, avatar: url })}
                            />
                            <div className="mt-8 text-left">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('fullName')}</label>
                                <InputText
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder={t('enterFullName')}
                                    className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#b000ff] focus:ring-4 focus:ring-[#b000ff]/10 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-[#eb79b2]/10 flex items-center justify-center border border-[#eb79b2]/20 text-[#eb79b2]">
                                    <i className="pi pi-lock text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('accessSecurity') || 'ACCESS & SECURITY'}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('role')}</label>
                                    <Dropdown
                                        value={newUser.role}
                                        options={[
                                            { label: t('staffMember'), value: 'staff' },
                                            { label: t('branchManager'), value: 'manager' },
                                            ...(currentUser.role === 'sysadmin' ? [{ label: t('systemAdmin'), value: 'sysadmin' }] : [])
                                        ]}
                                        onChange={e => setNewUser({ ...newUser, role: e.value })}
                                        className="h-14 bg-black/20 border-white/5 font-black text-white rounded-2xl"
                                        pt={{
                                            root: { className: 'h-14 bg-black/20 border-white/5' },
                                            input: { className: 'text-white font-bold h-full flex items-center' }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                                    <i className="pi pi-phone text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('contactInformation') || 'CONTACT INFORMATION'}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('phone')}</label>
                                    <InputText
                                        value={newUser.phone}
                                        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                        placeholder={t('enterPhone')}
                                        className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('email')}</label>
                                    <InputText
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder={t('enterEmail')}
                                        className="w-full h-14 bg-black/20 border-white/5 px-4 font-bold text-white rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {currentUser.role === 'sysadmin' && newUser.role !== 'sysadmin' && (
                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                                        <i className="pi pi-building text-xs"></i>
                                    </div>
                                    <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('organizationLink') || 'ORGANIZATION LINK'}</h4>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('organization')}</label>
                                    <Dropdown
                                        value={newUser.organizationId}
                                        options={organizations.map(org => ({ label: org.name, value: org.id }))}
                                        onChange={e => setNewUser({ ...newUser, organizationId: e.value })}
                                        placeholder={t('selectOrganization')}
                                        className="h-14 bg-black/20 border-white/5 font-black text-white rounded-2xl"
                                        required
                                        pt={{
                                            root: { className: 'h-14 bg-black/20 border-white/5' },
                                            input: { className: 'text-white font-bold h-full flex items-center' }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                        <Button label={t('cancel')} type="button" className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all" onClick={() => setIsModalOpen(false)} />
                        <Button
                            label={t('createStaff')}
                            type="submit"
                            className="flex-1 h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(176,0,255,0.4)] transition-all hover:scale-[1.02]"
                        />
                    </div>
                </form>
            </Dialog>

            {/* ── Edit Staff Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg shadow-[#b000ff]/20">
                            <i className="pi pi-pencil text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{t('editStaffMember')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{editingStaff?.name}</p>
                        </div>
                    </div>
                }
                visible={isEditModalOpen}
                onHide={() => setIsEditModalOpen(false)}
                className="w-full max-w-[95vw] sm:max-w-[600px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-0"
                modal
                draggable={false}
            >
                {editingStaff && (
                    <form onSubmit={handleEditUser} className="flex flex-col">
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center shadow-inner">
                                <div className="flex items-center gap-3 mb-6 text-left">
                                    <div className="w-8 h-8 rounded-xl bg-[#b000ff]/10 flex items-center justify-center border border-[#b000ff]/20 text-[#b000ff]">
                                        <i className="pi pi-image text-xs"></i>
                                    </div>
                                    <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('profileAvatar') || 'PROFILE AVATAR'}</h4>
                                </div>
                                <AvatarGalleryPicker
                                    currentAvatar={editingStaff.avatar}
                                    onSelect={(url) => setEditingStaff({ ...editingStaff, avatar: url })}
                                />
                            </div>

                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#eb79b2]/10 flex items-center justify-center border border-[#eb79b2]/20 text-[#eb79b2]">
                                        <i className="pi pi-user text-xs"></i>
                                    </div>
                                    <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('personalDetails') || 'PERSONAL DETAILS'}</h4>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('fullName')}</label>
                                        <InputText
                                            value={editingStaff.name}
                                            onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                            className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#b000ff] focus:ring-4 focus:ring-[#b000ff]/10 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('phone')}</label>
                                            <InputText
                                                value={editingStaff.phone}
                                                onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                                                className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#eb79b2] focus:ring-4 focus:ring-[#eb79b2]/10 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('email')}</label>
                                            <InputText
                                                value={editingStaff.email}
                                                onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })}
                                                className="w-full h-14 bg-black/20 border-white/5 px-4 font-bold text-white rounded-2xl focus:border-[#eb79b2] focus:ring-4 focus:ring-[#eb79b2]/10 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                                        <i className="pi pi-briefcase text-xs"></i>
                                    </div>
                                    <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('roleAssignment') || 'ROLE ASSIGNMENT'}</h4>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('role')}</label>
                                    <Dropdown
                                        value={editingStaff.role}
                                        options={[
                                            { label: t('staffMember'), value: 'staff' },
                                            { label: t('branchManager'), value: 'manager' },
                                            ...(currentUser.role === 'sysadmin' ? [{ label: t('systemAdmin'), value: 'sysadmin' }] : [])
                                        ]}
                                        onChange={e => setEditingStaff({ ...editingStaff, role: e.value })}
                                        className="h-14 bg-black/20 border-white/5 font-black text-white rounded-2xl"
                                        disabled={currentUser.role !== 'sysadmin'}
                                        pt={{
                                            root: { className: 'h-14 bg-black/20 border-white/5' },
                                            input: { className: 'text-white font-bold h-full flex items-center' }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                            <Button label={t('cancel')} type="button" className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all" onClick={() => setIsEditModalOpen(false)} />
                            <Button
                                label={t('saveChanges')}
                                type="submit"
                                className="flex-1 h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(176,0,255,0.4)] transition-all hover:scale-[1.02]"
                            />
                        </div>
                    </form>
                )}
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
                            <p className="mt-6 m-0 text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">
                                {t('resetPasswordHint') || 'USER WILL NEED TO LOGIN WITH THIS NEW PASSWORD'}
                            </p>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                        <Button label={t('cancel')} type="button" className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all" onClick={() => setResetPasswordUser(null)} />
                        <Button
                            label={t('confirmReset') || 'CONFIRM RESET'}
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
                .staff-management .p-datatable.datatable-modern {
                    background: transparent !important;
                }
                .staff-management .p-datatable.datatable-modern .p-datatable-thead > tr > th {
                    background: rgba(255, 255, 255, 0.02) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
                    padding: 1.75rem 1.5rem !important;
                    color: #666 !important;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                }
                .staff-management .p-datatable.datatable-modern .p-datatable-tbody > tr {
                    background: transparent !important;
                    color: white !important;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .staff-management .p-datatable.datatable-modern .p-datatable-tbody > tr:hover {
                    background: rgba(255, 255, 255, 0.03) !important;
                    transform: scale(0.998);
                }
                .staff-management .p-datatable.datatable-modern .p-datatable-tbody > tr > td {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
                    padding: 1.5rem !important;
                }
                .staff-management .p-paginator {
                    background: transparent !important;
                    border: none !important;
                    padding: 2rem !important;
                }
                .staff-management .p-paginator .p-paginator-pages .p-paginator-page {
                    color: #555 !important;
                    font-weight: 900 !important;
                    border-radius: 12px !important;
                    transition: all 0.2s;
                }
                .staff-management .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
                    background: #b000ff !important;
                    color: white !important;
                }
                .staff-management .p-dropdown-panel {
                    background: #1a1a24 !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 1rem !important;
                    overflow: hidden;
                }
                .staff-management .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
                    color: white !important;
                    font-size: 0.85rem !important;
                    font-weight: 600 !important;
                    padding: 1rem 1.5rem !important;
                    transition: all 0.2s;
                }
                .staff-management .p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
                    background: rgba(176, 0, 255, 0.1) !important;
                    color: #b000ff !important;
                }
                .staff-management .p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
                    background: #b000ff !important;
                    color: white !important;
                }
            `}</style>
        </div>
    );
};

export default StaffManagement;
