import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Calendar } from 'primereact/calendar';
import { api } from '../../utils/api';

const OrganizationManagement = () => {
    const { organizations, setOrganizations, updateOrganization, updateOrganizationStatus, refreshData } = useData();
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [orgForm, setOrgForm] = useState({
        name: '', code: '', description: '', logoUrl: '', address: '', phone: '', email: '', planId: '',
        planStartedAt: null, planEndsAt: null
    });
    const [plans, setPlans] = useState([]);
    const [planHistory, setPlanHistory] = useState([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedOrgForHistory, setSelectedOrgForHistory] = useState(null);
    const toast = useRef(null);

    React.useEffect(() => {
        api.getPlans().then(setPlans).catch(console.error);
    }, []);

    const fetchPlanHistory = async (orgId) => {
        try {
            const res = await api.get(`/organizations/${orgId}/plan-history`);
            setPlanHistory(res);
        } catch (error) {
            console.error("Failed to fetch plan history", error);
            setPlanHistory([]);
        }
    };

    const openCreate = () => {
        setEditingOrg(null);
        setOrgForm({
            name: '', code: '', description: '', logoUrl: '', address: '', phone: '', email: '',
            planId: plans.length > 0 ? plans[0].id : '',
            planStartedAt: new Date(), planEndsAt: null
        });
        setIsModalOpen(true);
    };

    const openEdit = (org) => {
        setEditingOrg(org);
        setOrgForm({
            name: org.name,
            code: org.code,
            description: org.description || '',
            logoUrl: org.logoUrl || '',
            address: org.address || '',
            phone: org.phone || '',
            email: org.email || '',
            planId: org.plan?.id || org.planId || '',
            planStartedAt: org.planStartedAt ? new Date(org.planStartedAt) : null,
            planEndsAt: org.planEndsAt ? new Date(org.planEndsAt) : null
        });
        fetchPlanHistory(org.id);
        setIsModalOpen(true);
    };

    const openHistory = (org) => {
        setSelectedOrgForHistory(org);
        fetchPlanHistory(org.id);
        setIsHistoryModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingOrg) {
                await updateOrganization(editingOrg.id, orgForm);
                toast.current.show({ severity: 'success', summary: t('success'), detail: t('organizationUpdated') });
            } else {
                const created = await api.createOrganization(orgForm);
                setOrganizations(prev => [created, ...prev]);
                toast.current.show({ severity: 'success', summary: t('success'), detail: t('organizationCreated') });
            }
            setIsModalOpen(false);
            refreshData(); // Refresh to get updated plan relations
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToSaveOrganization') });
        }
    };

    const onFileUpload = async (event) => {
        const file = event.files[0];
        try {
            const res = await api.uploadFile(file);
            setOrgForm(prev => ({ ...prev, logoUrl: res.path }));
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('logoUploaded') });
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToUploadLogo') });
        }
    };

    const handleToggleStatus = async (org) => {
        const newIsActive = !org.isActive;
        try {
            await updateOrganizationStatus(org.id, newIsActive);
            toast.current.show({ severity: 'info', summary: t('statusUpdated'), detail: t('venueStatusMessage', { status: newIsActive ? t('active').toLowerCase() : t('inactive').toLowerCase() }) });
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToUpdateStatus') });
        }
    };

    const planTemplate = (rowData) => {
        const plan = rowData.plan || plans.find(p => p.id === rowData.planId);
        return plan ? <Tag value={plan.name} severity="warning" /> : <span className="text-gray-400">{t('noPlan')}</span>;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.current.show({ severity: 'success', summary: t('copied'), detail: t('idCopied'), life: 2000 });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('copyFailed'), life: 2000 });
        });
    };

    const idBodyTemplate = (rowData) => {
        const fullId = rowData.id.toString();
        const shortId = fullId.length > 8 ? `${fullId.substring(0, 8)}...` : fullId;

        return (
            <div
                className="group flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => copyToClipboard(fullId)}
                title={t('clickToCopyId')}
            >
                <span className="font-mono text-xs">{shortId}</span>
                <i className="pi pi-copy text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        );
    };

    return (
        <div className="p-6">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold m-0">{t('organizationManagement')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('manageEntitiesDesc')}</p>
                </div>
                <Button
                    label={t('newOrganization')}
                    icon="pi pi-plus"
                    onClick={openCreate}
                    className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-bold flex items-center gap-2"
                />
            </div>

            <div className="card shadow-md rounded-xl overflow-hidden bg-[#1a1a24] border border-white/5 hidden lg:block">
                <DataTable value={organizations} responsiveLayout="scroll" className="p-datatable-sm">
                    <Column field="id" header="ID" body={idBodyTemplate} style={{ width: '120px' }}></Column>
                    <Column field="logoUrl" header={t('logo')} body={(row) => row.logoUrl ? <img src={row.logoUrl} alt="logo" className="w-10 h-10 object-cover rounded" /> : null} width="6rem"></Column>
                    <Column field="name" header={t('name')} sortable></Column>
                    <Column field="code" header={t('uniqueCode')} sortable body={(row) => <Tag value={row.code} severity="info" />}></Column>
                    <Column header={t('plan')} body={planTemplate} sortable field="plan.name"></Column>
                    <Column field="status" header={t('planStatus')} body={(row) => row.status ? <Tag value={row.status.toUpperCase()} severity={row.status === 'active' ? 'success' : 'warning'} className="px-2 py-1" /> : '-'} sortable></Column>
                    <Column field="planStartedAt" header={t('planStart')} body={(row) => row.planStartedAt ? new Date(row.planStartedAt).toLocaleDateString() : '-'} sortable></Column>
                    <Column field="planEndsAt" header={t('planEnd')} body={(row) => row.planEndsAt ? new Date(row.planEndsAt).toLocaleDateString() : '-'} sortable></Column>
                    <Column field="isActive" header={t('active')} body={(row) => (
                        <Tag value={row.isActive ? t('yesLabel') : t('noLabel')} severity={row.isActive ? 'success' : 'danger'} className="px-2 py-1" />
                    )} sortable></Column>
                    <Column field="createdAt" header={t('created')} body={(row) => new Date(row.createdAt).toLocaleDateString()}></Column>
                    <Column
                        header={t('actions')}
                        body={(row) => (
                            <div className="flex gap-3">
                                <Button icon="pi pi-clock" onClick={() => openHistory(row)} outlined size="small" className="h-9 w-9" tooltip={t('viewPlanHistory')} />
                                <Button icon="pi pi-pencil" onClick={() => openEdit(row)} outlined size="small" className="h-9 w-9" />
                                <Button
                                    icon={row.isActive ? "pi pi-pause" : "pi pi-play"}
                                    onClick={() => handleToggleStatus(row)}
                                    outlined
                                    severity={row.isActive ? "warning" : "success"}
                                    size="small"
                                    className="h-9 w-9"
                                    tooltip={row.isActive ? t('deactivate') : t('activate')}
                                />
                            </div>
                        )}
                    ></Column>
                </DataTable>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {organizations.map(org => {
                    const plan = org.plan || plans.find(p => p.id === org.planId);
                    return (
                        <div key={org.id} className="bg-[#1a1a24] rounded-2xl p-5 border border-white/5 shadow-lg">
                            <div className="flex items-center gap-4 mb-4">
                                {org.logoUrl ? (
                                    <img src={org.logoUrl} alt="logo" className="w-12 h-12 object-cover rounded-xl border border-white/10" />
                                ) : (
                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                        <i className="pi pi-building text-gray-500"></i>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-white m-0">{org.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Tag value={org.code} severity="info" className="text-[10px] py-1 px-2" />
                                        <Tag value={org.isActive ? t('active') : t('inactive')} severity={org.isActive ? 'success' : 'danger'} className="text-[10px] py-1 px-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t('currentPlan')}</p>
                                    <p className="text-xs text-white font-bold">{plan?.name || t('noPlan')}</p>
                                </div>
                                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t('planStatus')}</p>
                                    <Tag
                                        value={org.status?.toUpperCase() || t('na')}
                                        severity={org.status === 'active' ? 'success' : 'warning'}
                                        className="text-[10px] scale-90 origin-left"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 mb-6">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest m-0">{t('validUntil')}</p>
                                    <p className="text-xs text-secondary font-bold m-0">{org.planEndsAt ? new Date(org.planEndsAt).toLocaleDateString() : t('na')}</p>
                                </div>
                                <Button
                                    icon="pi pi-clock"
                                    onClick={() => openHistory(org)}
                                    label={t('history')}
                                    text
                                    className="text-xs font-bold text-blue-400"
                                />
                            </div>

                            <div className="flex gap-2.5">
                                <Button
                                    icon="pi pi-pencil"
                                    onClick={() => openEdit(org)}
                                    label={t('edit')}
                                    className="flex-1 h-12 bg-white/5 text-white border border-white/10 font-bold rounded-xl text-sm flex items-center justify-center gap-2"
                                />
                                <Button
                                    icon={org.isActive ? "pi pi-pause" : "pi pi-play"}
                                    onClick={() => handleToggleStatus(org)}
                                    label={org.isActive ? t('pause') : t('resume')}
                                    className={`flex-1 h-12 border-none font-bold rounded-xl text-sm flex items-center justify-center gap-2 ${org.isActive ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog
                header={editingOrg ? t('editOrganization') : t('newOrganizationHeader')}
                visible={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                style={{ width: '700px' }}
                modal
            >
                <form onSubmit={handleSave} className="flex flex-col gap-4 mt-2">
                    <div className="field">
                        <label htmlFor="name" className="block text-sm font-bold mb-2">{t('organizationName')}</label>
                        <InputText
                            id="name"
                            value={orgForm.name}
                            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                            className="w-full h-10 px-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="code" className="block text-sm font-bold mb-2">{t('internalCodeUnique')}</label>
                        <InputText
                            id="code"
                            value={orgForm.code}
                            onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                            className="w-full h-10 px-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            required
                            placeholder="e.g. LUX_KARAOKE"
                            disabled={!!editingOrg}
                        />
                    </div>
                    <div className="field">
                        <label className="block text-sm font-bold mb-2">{t('plan')}</label>
                        <select
                            value={orgForm.planId}
                            onChange={(e) => setOrgForm({ ...orgForm, planId: e.target.value })}
                            className="w-full h-10 px-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                        >
                            <option value="">{t('selectPlan')}</option>
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - {p.monthlyFee.toLocaleString()}₮</option>
                            ))}
                        </select>
                    </div>

                    {editingOrg && (
                        <div className="grid grid-cols-3 gap-2 bg-gray-800 p-3 rounded">
                            <div>
                                <label className="text-xs text-gray-400">{t('planStatus')}</label>
                                <div className="text-sm font-bold text-white">{editingOrg.status || '-'}</div>
                            </div>
                            <div className="field m-0">
                                <label className="text-xs text-gray-400 block mb-1">{t('startDate')}</label>
                                <Calendar
                                    value={orgForm.planStartedAt}
                                    onChange={(e) => setOrgForm({ ...orgForm, planStartedAt: e.value })}
                                    showIcon
                                    className="w-full p-inputtext-sm"
                                    dateFormat="yy-mm-dd"
                                />
                            </div>
                            <div className="field m-0">
                                <label className="text-xs text-gray-400 block mb-1">{t('endDate')}</label>
                                <Calendar
                                    value={orgForm.planEndsAt}
                                    onChange={(e) => setOrgForm({ ...orgForm, planEndsAt: e.value })}
                                    showIcon
                                    className="w-full p-inputtext-sm"
                                    dateFormat="yy-mm-dd"
                                />
                            </div>
                        </div>
                    )}

                    <div className="field">
                        <label className="block text-sm font-bold mb-2">{t('logo')}</label>
                        <div className="flex items-center gap-4">
                            {orgForm.logoUrl && <img src={orgForm.logoUrl} alt="logo" className="w-16 h-16 object-cover rounded border border-gray-600" />}
                            <FileUpload mode="basic" name="file" accept="image/*" maxFileSize={1000000} customUpload uploadHandler={onFileUpload} auto chooseLabel={t('uploadLogo')} className="p-button-outlined p-button-secondary" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="field">
                            <label htmlFor="email" className="block text-sm font-bold mb-2">{t('email')}</label>
                            <InputText
                                id="email"
                                value={orgForm.email}
                                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                                className="w-full h-10 px-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="phone" className="block text-sm font-bold mb-2">{t('phone')}</label>
                            <InputText
                                id="phone"
                                value={orgForm.phone}
                                onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                                className="w-full h-10 px-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="address" className="block text-sm font-bold mb-2">{t('address')}</label>
                        <InputTextarea
                            id="address"
                            value={orgForm.address}
                            onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                            className="w-full p-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            rows={2}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="description" className="block text-sm font-bold mb-2">{t('description')}</label>
                        <InputTextarea
                            id="description"
                            value={orgForm.description}
                            onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                            className="w-full p-3 bg-[#f8f9fa] border-0 rounded-lg text-black"
                            rows={3}
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <Button label={t('cancel')} outlined onClick={() => setIsModalOpen(false)} className="h-10 px-6" />
                        <Button label={t('saveChanges')} type="submit" className="h-10 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-bold" />
                    </div>
                </form>
            </Dialog>

            <Dialog
                header={t('planHistoryFor', { name: selectedOrgForHistory?.name })}
                visible={isHistoryModalOpen}
                onHide={() => setIsHistoryModalOpen(false)}
                style={{ width: '800px' }}
                modal
            >
                <div className="bg-gray-900 p-3 rounded border border-gray-700">
                    <DataTable value={planHistory} size="small" emptyMessage={t('noHistoryFound')} stripedRows>
                        <Column field="planName" header={t('plan')} sortable></Column>
                        <Column field="startDate" header={t('startDate')} body={(row) => new Date(row.startDate).toLocaleString()} sortable></Column>
                        <Column field="endDate" header={t('endDate')} body={(row) => row.endDate ? new Date(row.endDate).toLocaleString() : <Tag severity="success" value={t('active')} />} sortable></Column>
                        <Column field="price" header={t('price')} body={(row) => `${Number(row.price).toLocaleString()}₮`} sortable></Column>
                        <Column field="commissionRate" header={t('commissionRateLabel') || 'Comm %'} body={(row) => `${row.commissionRate}%`}></Column>
                        <Column field="status" header={t('status')} body={(row) => <Tag severity={row.status === 'active' ? 'success' : 'info'} value={row.status || t('active')} />}></Column>
                    </DataTable>
                </div>
            </Dialog>
        </div >
    );
};

export default OrganizationManagement;
