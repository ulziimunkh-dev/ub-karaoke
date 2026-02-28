import React, { useState, useRef, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useLanguage } from '../../contexts/LanguageContext';

const EMPTY_PROMO = {
    code: '',
    discountType: 'PERCENT',
    value: 10,
    venueId: '',
    validFrom: new Date(),
    validTo: new Date(new Date().setMonth(new Date().getMonth() + 1))
};

const PromotionsManagement = () => {
    const { promos, addPromotion, deletePromotion, updatePromotion, venues, organizations, bookings } = useData();
    const { t } = useLanguage();
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [newPromo, setNewPromo] = useState({ ...EMPTY_PROMO });
    const [selectedPromoFilter, setSelectedPromoFilter] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [dateRange, setDateRange] = useState(null);
    const toast = useRef(null);

    // Build venue options grouped by organization
    const venueOptions = useMemo(() => {
        const orgMap = {};
        (venues || []).forEach(v => {
            const orgId = v.organizationId || v.organization?.id || 'unknown';
            if (!orgMap[orgId]) {
                const org = (organizations || []).find(o => o.id === orgId);
                orgMap[orgId] = {
                    label: org?.name || v.organization?.name || 'Unknown Org',
                    items: []
                };
            }
            orgMap[orgId].items.push({ label: v.name, value: v.id });
        });

        return Object.entries(orgMap).map(([orgId, group]) => ({
            label: group.label,
            items: [
                { label: `🏢 ${t('allVenues')} (${group.label})`, value: `org:${orgId}` },
                ...group.items
            ]
        }));
    }, [venues, organizations, t]);

    // Get bookings that used promo codes
    const promoBookings = useMemo(() => {
        if (!bookings || !promos) return [];
        return bookings
            .filter(b => b.appliedPromotionId)
            .map(b => {
                const promo = promos.find(p => p.id === b.appliedPromotionId);
                const venue = venues.find(v => v.id === b.venueId);
                return {
                    ...b,
                    promoCode: promo?.code || b.appliedPromotionId?.substring(0, 8) + '...',
                    promoDiscount: promo ? (promo.discountType === 'PERCENT' ? `${promo.value}%` : `${Number(promo.value).toLocaleString()}₮`) : '—',
                    venueName: venue?.name || '—',
                };
            })
            .filter(b => !selectedPromoFilter || b.appliedPromotionId === selectedPromoFilter);
    }, [bookings, promos, venues, selectedPromoFilter]);

    // Filter promos by search, active/inactive status, and date period
    const filteredPromos = useMemo(() => {
        let list = promos || [];
        if (!showInactive) {
            list = list.filter(p => p.isActive);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p =>
                p.code?.toLowerCase().includes(q) ||
                getVenueLabel(p).toLowerCase().includes(q)
            );
        }
        if (dateRange && dateRange[0]) {
            const start = new Date(dateRange[0]);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange[1] || dateRange[0]);
            end.setHours(23, 59, 59, 999);
            list = list.filter(p => {
                const from = new Date(p.validFrom);
                const to = new Date(p.validTo);
                return to >= start && from <= end;
            });
        }
        return list;
    }, [promos, searchQuery, showInactive, dateRange, venues, organizations]);

    const resolveOrganizationId = (venueIdOrKey) => {
        if (venueIdOrKey?.startsWith('org:')) {
            return venueIdOrKey.replace('org:', '');
        }
        const selectedVenue = venues.find(v => v.id === venueIdOrKey);
        return selectedVenue?.organizationId || selectedVenue?.organization?.id;
    };

    const openCreateDialog = () => {
        setEditingPromo(null);
        setNewPromo({ ...EMPTY_PROMO });
        setIsPromoModalOpen(true);
    };

    const openEditDialog = (promo) => {
        setEditingPromo(promo);
        setNewPromo({
            code: promo.code || '',
            discountType: promo.discountType || 'PERCENT',
            value: promo.value || 0,
            venueId: promo.venueId || (promo.organizationId ? `org:${promo.organizationId}` : ''),
            validFrom: promo.validFrom ? new Date(promo.validFrom) : new Date(),
            validTo: promo.validTo ? new Date(promo.validTo) : new Date()
        });
        setIsPromoModalOpen(true);
    };

    const handleSavePromo = async () => {
        try {
            if (!newPromo.code || !newPromo.value || !newPromo.venueId) {
                toast.current.show({ severity: 'warn', summary: t('validationError'), detail: t('fillAllFields') });
                return;
            }

            const organizationId = resolveOrganizationId(newPromo.venueId);
            const realVenueId = newPromo.venueId?.startsWith('org:') ? null : newPromo.venueId;
            const payload = { ...newPromo, venueId: realVenueId, organizationId };

            if (editingPromo) {
                await updatePromotion(editingPromo.id, payload);
                toast.current.show({ severity: 'success', summary: t('promoUpdated'), detail: t('promoCodeUpdated', { code: newPromo.code }) });
            } else {
                await addPromotion(payload);
                toast.current.show({ severity: 'success', summary: t('promoAdded'), detail: t('promoCodeCreated', { code: newPromo.code }) });
            }

            setIsPromoModalOpen(false);
            setEditingPromo(null);
            setNewPromo({ ...EMPTY_PROMO });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: editingPromo ? t('promoUpdateFailed') : t('promoAddFailed') });
        }
    };

    const handleDeletePromo = (promo) => {
        confirmDialog({
            message: `${t('deleteConfirmation') || 'Are you sure you want to delete'} "${promo.code}"?`,
            header: t('confirmDelete'),
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await deletePromotion(promo.id);
                    toast.current.show({ severity: 'success', summary: t('promoDeleted'), detail: t('promoRemoved') });
                } catch (error) {
                    const msg = error?.response?.data?.message || t('promoDeleteFailed');
                    toast.current.show({ severity: 'error', summary: t('error'), detail: msg, life: 5000 });
                }
            }
        });
    };

    function getVenueLabel(promo) {
        if (promo.venueId) {
            const v = venues.find(v => v.id === promo.venueId);
            return v?.name || '—';
        }
        if (promo.organizationId) {
            const org = (organizations || []).find(o => o.id === promo.organizationId);
            return `${t('allVenues')} (${org?.name || '—'})`;
        }
        return '—';
    }

    const isEditing = !!editingPromo;
    const promoUsageCount = (promoId) => (bookings || []).filter(b => b.appliedPromotionId === promoId).length;

    function getPromoStatus(promo) {
        if (!promo.isActive) return { label: t('inactive') || 'Inactive', severity: 'secondary' };
        const now = new Date();
        if (new Date(promo.validTo) < now) return { label: t('expired'), severity: 'danger' };
        if (new Date(promo.validFrom) > now) return { label: t('upcoming'), severity: 'warning' };
        return { label: t('active'), severity: 'success' };
    }

    return (
        <div className="promotions-management pt-2">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* ── Page Header ── */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-[0_8px_20px_rgba(176,0,255,0.3)]">
                        <i className="pi pi-ticket text-white text-xl"></i>
                    </div>
                    <div>
                        <h2 className="m-0 text-2xl font-black text-white tracking-tight">{t('promotions')}</h2>
                        <p className="m-0 text-text-muted text-xs font-medium mt-1">{t('promotionsPageDesc')}</p>
                    </div>
                </div>
                <Button
                    icon="pi pi-plus"
                    label={t('addNew')}
                    onClick={openCreateDialog}
                    className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-wider rounded-xl shadow-lg"
                />
            </div>

            {/* ── Filters Row ── */}
            <div className="flex flex-wrap gap-4 items-center mb-8 p-6 bg-white/5 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md">
                <div className="relative flex-1 min-w-[280px]">
                    <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm z-10" />
                    <InputText
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t('searchPromoCodes')}
                        className="w-full h-11 pl-11 bg-black/20 border-white/10 text-white font-medium rounded-xl"
                    />
                </div>
                <div className="flex-0 min-w-[220px]">
                    <Calendar
                        value={dateRange}
                        onChange={e => setDateRange(e.value)}
                        selectionMode="range"
                        placeholder={t('filterByPeriod')}
                        showIcon
                        showButtonBar
                        dateFormat="yy-mm-dd"
                        className="w-full h-11"
                        inputClassName="bg-black/20 border-white/10 text-white rounded-xl px-4"
                    />
                </div>
                <Button
                    icon={showInactive ? 'pi pi-eye' : 'pi pi-eye-slash'}
                    label={showInactive ? t('showingAll') : t('activeOnly')}
                    onClick={() => setShowInactive(!showInactive)}
                    outlined
                    severity={showInactive ? 'help' : 'secondary'}
                    className="h-11 rounded-xl font-bold px-6 border-white/10"
                />
            </div>

            {/* ── Promo Cards Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {filteredPromos.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-60">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <i className="pi pi-ticket text-3xl text-gray-400"></i>
                        </div>
                        <p className="text-gray-400 font-bold tracking-wide italic">{searchQuery ? t('noMatchingPromos') : t('noActivePromos')}</p>
                        {!searchQuery && (
                            <Button
                                label={t('createFirstPromo')}
                                icon="pi pi-plus"
                                text
                                className="mt-4 font-black uppercase text-[#eb79b2] hover:bg-white/5"
                                onClick={openCreateDialog}
                            />
                        )}
                    </div>
                )}
                {filteredPromos.map((promo) => {
                    const usageCount = promoUsageCount(promo.id);
                    const status = getPromoStatus(promo);

                    return (
                        <div
                            key={promo.id}
                            className={`group relative bg-white/5 rounded-2xl border border-white/5 p-6 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/10 hover:shadow-2xl hover:-translate-y-1 ${!promo.isActive ? 'opacity-50 grayscale' : 'shadow-xl'}`}
                        >
                            {/* Actions overlay */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Button
                                    icon="pi pi-pencil"
                                    rounded
                                    text
                                    className="w-8 h-8 bg-black/40 text-blue-400 hover:bg-black/60"
                                    onClick={() => openEditDialog(promo)}
                                />
                                <Button
                                    icon="pi pi-trash"
                                    rounded
                                    text
                                    className="w-8 h-8 bg-black/40 text-red-400 hover:bg-black/60"
                                    onClick={() => handleDeletePromo(promo)}
                                />
                            </div>

                            <div className="flex flex-col gap-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-white tracking-widest uppercase">{promo.code}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${status.severity === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : status.severity === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            <Tag
                                                value={promo.discountType === 'PERCENT' ? `${promo.value}% ${t('off')}` : `-${Number(promo.value).toLocaleString()}₮`}
                                                className="bg-gradient-to-r from-[#b000ff]/20 to-[#eb79b2]/20 border border-[#eb79b2]/20 text-[#eb79b2] font-black uppercase text-[9px] px-2 py-0.5 tracking-wider"
                                            />
                                            <Tag
                                                value={status.label.toUpperCase()}
                                                severity={status.severity}
                                                className="text-[8px] font-black uppercase tracking-widest"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <i className="pi pi-calendar text-blue-400 text-[10px]"></i>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('validPeriod') || 'VALID PERIOD'}</span>
                                            <span className="text-xs text-white/80 font-bold">
                                                {new Date(promo.validFrom).toLocaleDateString()} – {new Date(promo.validTo).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <i className="pi pi-building text-orange-400 text-[10px]"></i>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('availability') || 'AVAILABILITY'}</span>
                                            <span className="text-xs text-white/80 font-bold truncate max-w-[180px]">{getVenueLabel(promo)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <i className="pi pi-users text-green-400 text-[10px]"></i>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('totalUsage') || 'TOTAL USAGE'}</span>
                                            <span className="text-xs text-white/80 font-black">{usageCount} {t('timesUsed')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Promo Usage History ── */}
            <div className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#eb79b2]/10 border border-[#eb79b2]/20 flex items-center justify-center">
                            <i className="pi pi-history text-[#eb79b2] text-xl"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-black text-white uppercase tracking-wider">{t('promoUsageHistory')}</h3>
                            <p className="m-0 text-gray-500 text-xs font-bold mt-1 uppercase tracking-widest">{t('trackingDetail') || 'TRACKING ALL SUCCESSFUL APPLICATIONS'}</p>
                        </div>
                    </div>
                    <Dropdown
                        value={selectedPromoFilter}
                        options={[
                            { label: t('allPromos'), value: null },
                            ...(promos || []).map(p => ({ label: `${p.code}${p.isActive ? '' : ' ⛔'}`, value: p.id }))
                        ]}
                        onChange={e => setSelectedPromoFilter(e.value)}
                        placeholder={t('filterByPromo')}
                        showClear
                        className="w-full md:w-64 h-11 bg-black/20 border-white/10 text-white font-bold rounded-xl"
                    />
                </div>

                <div className="relative z-10">
                    {promoBookings.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center opacity-40">
                            <i className="pi pi-inbox text-5xl mb-4"></i>
                            <p className="font-bold tracking-widest uppercase text-sm italic">{t('noPromoBookings')}</p>
                        </div>
                    ) : (
                        <DataTable
                            value={promoBookings}
                            paginator
                            rows={10}
                            className="datatable-modern"
                            emptyMessage={t('noResults')}
                            sortField="createdAt"
                            sortOrder={-1}
                        >
                            <Column
                                field="promoCode"
                                header={t('promoCode')}
                                sortable
                                className="font-black text-[#ff9800] tracking-wider uppercase"
                            />
                            <Column
                                field="promoDiscount"
                                header={t('discount')}
                                body={(row) => (
                                    <Tag
                                        value={row.promoDiscount}
                                        className="bg-[#b000ff]/10 border border-[#b000ff]/20 text-[#eb79b2] font-black px-3 py-1"
                                    />
                                )}
                            />
                            <Column
                                field="customerName"
                                header={t('customer')}
                                sortable
                                className="font-bold text-white/90"
                                body={(row) => row.customerName || row.user?.name || '—'}
                            />
                            <Column
                                field="venueName"
                                header={t('venue')}
                                sortable
                                className="text-gray-400 font-medium"
                            />
                            <Column
                                field="totalPrice"
                                header={t('totalPrice')}
                                sortable
                                body={(row) => <span className="font-black text-green-400 tabular-nums">{Number(row.totalPrice || 0).toLocaleString()}₮</span>}
                            />
                            <Column
                                field="status"
                                header={t('status')}
                                sortable
                                body={(row) => {
                                    const statusMap = {
                                        'CONFIRMED': 'success',
                                        'RESERVED': 'info',
                                        'CANCELLED': 'danger',
                                        'COMPLETED': 'success',
                                        'PENDING': 'warning',
                                        'CHECKED_IN': 'info',
                                    };
                                    return <Tag value={row.status.toUpperCase()} severity={statusMap[row.status] || 'info'} className="text-[10px] font-black px-2" />;
                                }}
                            />
                            <Column
                                field="createdAt"
                                header={t('date')}
                                sortable
                                className="text-gray-500 font-mono text-xs"
                                body={(row) => `${new Date(row.createdAt).toLocaleDateString()} ${new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            />
                        </DataTable>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg">
                            <i className={`pi ${isEditing ? 'pi-pencil' : 'pi-plus'} text-white text-lg`}></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-bold text-white tracking-tight">{isEditing ? t('editPromoCode') : t('addNewPromoCode')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{isEditing ? t('editPromoDesc') : t('addPromoDesc')}</p>
                        </div>
                    </div>
                }
                visible={isPromoModalOpen}
                onHide={() => { setIsPromoModalOpen(false); setEditingPromo(null); }}
                className="w-full max-w-[95vw] sm:max-w-[550px]"
                modal
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSavePromo(); }} className="flex flex-col gap-6 pt-4">

                    {/* -- Section 1: Activation Code -- */}
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-[#b000ff]/15 flex items-center justify-center">
                                <i className="pi pi-tag text-[#b000ff] text-xs"></i>
                            </div>
                            <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('promoIdentity') || 'PROMO IDENTITY'}</h4>
                        </div>
                        <div className="flex flex-col gap-1.5 text-left">
                            <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('rewardCode') || 'REWARD CODE'}</label>
                            <InputText
                                value={newPromo.code}
                                onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                placeholder="e.g. SUMMER24"
                                className={`h-12 bg-black/20 border-white/10 px-4 font-black tracking-[0.3em] uppercase text-lg text-secondary text-center rounded-xl ${isEditing ? 'opacity-50' : ''}`}
                                disabled={isEditing}
                            />
                            {isEditing && <p className="m-0 text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center mt-2 italic">{t('codeNotEditable')}</p>}
                        </div>
                    </div>

                    {/* -- Section 2: Discount Policy -- */}
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-xl text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-[#eb79b2]/15 flex items-center justify-center">
                                <i className="pi pi-percentage text-[#eb79b2] text-xs"></i>
                            </div>
                            <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('discountPolicy') || 'DISCOUNT POLICY'}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('type')}</label>
                                <Dropdown
                                    value={newPromo.discountType}
                                    options={[
                                        { label: t('percentage'), value: 'PERCENT' },
                                        { label: t('fixedAmount'), value: 'FIXED' }
                                    ]}
                                    onChange={e => setNewPromo({ ...newPromo, discountType: e.value })}
                                    className="h-11 bg-black/20 border-white/10 font-bold rounded-xl"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('value')}</label>
                                <InputNumber
                                    value={newPromo.value}
                                    onValueChange={e => setNewPromo({ ...newPromo, value: e.value })}
                                    min={0}
                                    suffix={newPromo.discountType === 'PERCENT' ? '%' : '₮'}
                                    inputClassName="h-11 bg-black/20 border-white/10 text-white font-black px-4 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* -- Section 3: Time & Scope -- */}
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-xl text-left">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-[#b000ff]/15 flex items-center justify-center">
                                <i className="pi pi-calendar text-[#b000ff] text-xs"></i>
                            </div>
                            <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('timeScope') || 'TIME & SCOPE'}</h4>
                        </div>
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('startDate')}</label>
                                    <Calendar
                                        value={newPromo.validFrom}
                                        onChange={e => setNewPromo({ ...newPromo, validFrom: e.value })}
                                        showIcon
                                        dateFormat="yy-mm-dd"
                                        className="h-11"
                                        inputClassName="bg-black/20 border-white/10 text-white font-bold px-4 rounded-xl"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('endDate')}</label>
                                    <Calendar
                                        value={newPromo.validTo}
                                        onChange={e => setNewPromo({ ...newPromo, validTo: e.value })}
                                        showIcon
                                        minDate={newPromo.validFrom}
                                        dateFormat="yy-mm-dd"
                                        className="h-11"
                                        inputClassName="bg-black/20 border-white/10 text-white font-bold px-4 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('venue')}</label>
                                <Dropdown
                                    value={newPromo.venueId}
                                    options={venueOptions}
                                    optionGroupLabel="label"
                                    optionGroupChildren="items"
                                    onChange={e => setNewPromo({ ...newPromo, venueId: e.value })}
                                    placeholder={t('selectVenue')}
                                    filter
                                    className="h-11 bg-black/20 border-white/10 font-bold rounded-xl"
                                />
                                <p className="m-0 text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1 italic">{t('venuePromoHint')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button label={t('cancel')} text onClick={() => { setIsPromoModalOpen(false); setEditingPromo(null); }} className="h-11 px-6 font-bold text-white/50 hover:text-white" />
                        <Button
                            label={isEditing ? t('saveChanges') : t('createPromotion')}
                            type="submit"
                            className="h-11 px-10 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-xl shadow-[0_8px_20px_rgba(176,0,255,0.3)]"
                        />
                    </div>
                </form>
            </Dialog>

            <style>{`
                .promotions-management .p-datatable.datatable-modern .p-datatable-thead > tr > th {
                    background: transparent !important;
                    border-bottom: 2px solid rgba(255,255,255,0.05) !important;
                    padding: 1.25rem 1rem !important;
                    color: #555 !important;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                }
                .promotions-management .p-datatable.datatable-modern .p-datatable-tbody > tr {
                    background: transparent !important;
                    border-bottom: 1px solid rgba(255,255,255,0.03) !important;
                }
                .promotions-management .p-datatable.datatable-modern .p-datatable-tbody > tr:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
                .promotions-management .p-datatable.datatable-modern .p-datatable-tbody > tr > td {
                    padding: 1.25rem 1rem !important;
                }
                .promotions-management .p-paginator {
                    background: transparent !important;
                    border: none !important;
                    padding: 1.5rem !important;
                }
                .promotions-management .p-calendar .p-button {
                    background: transparent !important;
                    border: none !important;
                    color: #888 !important;
                }
                .promotions-management .p-dropdown-panel {
                    background: #1a1a24 !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                .promotions-management .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
                    color: white !important;
                }
                .promotions-management .p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
                    background: rgba(176,0,255,0.1) !important;
                }
            `}</style>
        </div>
    );
};

const labelStyle = {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    fontSize: '0.7rem', fontWeight: 700, color: '#999',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '0.35rem'
};

const inputStyle = {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'white',
    height: 40,
    width: '100%'
};

export default PromotionsManagement;
