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
        <div className="promotions-management">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #b000ff, #eb79b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="pi pi-ticket" style={{ color: 'white', fontSize: '1.1rem' }}></i>
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{t('promotions')}</h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{t('promotionsPageDesc')}</p>
                    </div>
                </div>
                <Button
                    icon="pi pi-plus"
                    label={t('addNew')}
                    onClick={openCreateDialog}
                    style={{ background: 'linear-gradient(135deg, #b000ff, #eb79b2)', border: 'none', fontWeight: 700, height: 40, padding: '0 1.25rem' }}
                />
            </div>

            {/* ── Filters Row ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(30,30,45,0.6)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                    <i className="pi pi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '0.85rem', zIndex: 1 }} />
                    <InputText
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t('searchPromoCodes')}
                        style={{ width: '100%', paddingLeft: 36, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', height: 38, fontSize: '0.85rem' }}
                    />
                </div>
                <Calendar
                    value={dateRange}
                    onChange={e => setDateRange(e.value)}
                    selectionMode="range"
                    placeholder={t('filterByPeriod')}
                    showIcon
                    showButtonBar
                    dateFormat="yy-mm-dd"
                    style={{ flex: '0 0 auto', maxWidth: 250 }}
                    inputStyle={{ height: 38, fontSize: '0.85rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
                />
                <Button
                    icon={showInactive ? 'pi pi-eye' : 'pi pi-eye-slash'}
                    label={showInactive ? t('showingAll') : t('activeOnly')}
                    onClick={() => setShowInactive(!showInactive)}
                    outlined
                    severity={showInactive ? 'help' : 'secondary'}
                    style={{ height: 38, fontSize: '0.8rem', fontWeight: 600 }}
                />
            </div>

            {/* ── Promo Cards Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                {filteredPromos.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#666', background: '#1e1e2d', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <i className="pi pi-ticket" style={{ fontSize: '2.5rem', marginBottom: '0.75rem', display: 'block', opacity: 0.3 }}></i>
                        <p style={{ margin: 0, fontSize: '0.95rem', fontStyle: 'italic' }}>{searchQuery ? t('noMatchingPromos') : t('noActivePromos')}</p>
                        {!searchQuery && (
                            <Button
                                label={t('createFirstPromo')}
                                className="p-button-text"
                                icon="pi pi-plus"
                                style={{ marginTop: '0.75rem', color: '#b000ff', display: 'inline-flex', marginLeft: 'auto', marginRight: 'auto' }}
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
                            style={{
                                background: '#1e1e2d', borderRadius: 14,
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '1.25rem', transition: 'border-color 0.2s',
                                opacity: promo.isActive ? 1 : 0.6,
                            }}
                            className="promo-card"
                        >
                            {/* Top: Code + Status + Actions */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                        <span style={{ fontWeight: 900, color: '#ff9800', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '1.1rem' }}>{promo.code}</span>
                                        <Tag value={status.label} severity={status.severity} style={{ fontSize: '0.65rem' }} />
                                    </div>
                                    <Tag
                                        value={promo.discountType === 'PERCENT' ? `${promo.value}% ${t('off')}` : `-${Number(promo.value).toLocaleString()}₮`}
                                        style={{ background: 'rgba(176,0,255,0.15)', color: '#eb79b2', fontSize: '0.75rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 2 }}>
                                    <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-sm" style={{ color: '#b000ff', width: 32, height: 32 }} onClick={() => openEditDialog(promo)} tooltip={t('edit')} tooltipOptions={{ position: 'top' }} />
                                    <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger p-button-sm" style={{ width: 32, height: 32 }} onClick={() => handleDeletePromo(promo)} tooltip={t('delete')} tooltipOptions={{ position: 'top' }} />
                                </div>
                            </div>

                            {/* Info rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#999' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <i className="pi pi-calendar" style={{ fontSize: '0.7rem', color: '#6c9cf7' }}></i>
                                    <span>{new Date(promo.validFrom).toLocaleDateString()} — {new Date(promo.validTo).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <i className="pi pi-building" style={{ fontSize: '0.7rem', color: '#ff9800' }}></i>
                                    <span>{getVenueLabel(promo)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <i className="pi pi-users" style={{ fontSize: '0.7rem', color: '#4caf50' }}></i>
                                    <span>{usageCount} {t('timesUsed')}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Promo Usage History ── */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="pi pi-history" style={{ color: '#eb79b2' }}></i>
                        {t('promoUsageHistory')}
                    </h3>
                    <Dropdown
                        value={selectedPromoFilter}
                        options={[
                            { label: t('allPromos'), value: null },
                            ...(promos || []).map(p => ({ label: `${p.code}${p.isActive ? '' : ' ⛔'}`, value: p.id }))
                        ]}
                        onChange={e => setSelectedPromoFilter(e.value)}
                        placeholder={t('filterByPromo')}
                        showClear
                        style={{ width: 240, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                </div>

                <div style={{ background: '#1e1e2d', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    {promoBookings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                            <i className="pi pi-inbox" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', opacity: 0.3 }}></i>
                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem' }}>{t('noPromoBookings')}</p>
                        </div>
                    ) : (
                        <DataTable
                            value={promoBookings}
                            paginator
                            rows={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            className="promo-bookings-table"
                            emptyMessage={t('noResults')}
                            sortField="createdAt"
                            sortOrder={-1}
                            stripedRows
                        >
                            <Column
                                field="promoCode"
                                header={t('promoCode')}
                                sortable
                                body={(row) => (
                                    <span style={{ fontWeight: 900, color: '#ff9800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{row.promoCode}</span>
                                )}
                            />
                            <Column
                                field="promoDiscount"
                                header={t('discount')}
                                body={(row) => (
                                    <Tag value={row.promoDiscount} style={{ background: 'rgba(176,0,255,0.15)', color: '#eb79b2' }} />
                                )}
                            />
                            <Column
                                field="customerName"
                                header={t('customer')}
                                sortable
                                body={(row) => (
                                    <span style={{ color: 'white', fontWeight: 500 }}>{row.customerName || row.user?.name || '—'}</span>
                                )}
                            />
                            <Column
                                field="venueName"
                                header={t('venue')}
                                sortable
                                body={(row) => (
                                    <span style={{ color: '#999' }}>{row.venueName}</span>
                                )}
                            />
                            <Column
                                field="totalPrice"
                                header={t('totalPrice')}
                                sortable
                                body={(row) => (
                                    <span style={{ color: 'white', fontWeight: 700 }}>{Number(row.totalPrice || 0).toLocaleString()}₮</span>
                                )}
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
                                    return <Tag value={row.status} severity={statusMap[row.status] || 'info'} />;
                                }}
                            />
                            <Column
                                field="createdAt"
                                header={t('date')}
                                sortable
                                body={(row) => (
                                    <span style={{ color: '#777', fontSize: '0.78rem' }}>
                                        {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            />
                        </DataTable>
                    )}
                </div>
            </div>

            {/* ── Create / Edit Dialog ── */}
            <Dialog
                header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #b000ff, #eb79b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className={`pi ${isEditing ? 'pi-pencil' : 'pi-plus'}`} style={{ color: 'white' }}></i>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white' }}>{isEditing ? t('editPromoCode') : t('addNewPromoCode')}</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{isEditing ? t('editPromoDesc') : t('addPromoDesc')}</p>
                        </div>
                    </div>
                }
                visible={isPromoModalOpen}
                onHide={() => { setIsPromoModalOpen(false); setEditingPromo(null); }}
                style={{ width: '100%', maxWidth: 480 }}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
                        <Button label={t('cancel')} icon="pi pi-times" onClick={() => { setIsPromoModalOpen(false); setEditingPromo(null); }} className="p-button-text" style={{ color: '#999' }} />
                        <Button
                            label={isEditing ? t('saveChanges') : t('createPromotion')}
                            icon={isEditing ? 'pi pi-check' : 'pi pi-plus'}
                            onClick={handleSavePromo}
                            style={{ background: 'linear-gradient(135deg, #b000ff, #eb79b2)', border: 'none', fontWeight: 700, height: 40, padding: '0 1.25rem' }}
                        />
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
                    {/* Promo Code */}
                    <div>
                        <label style={labelStyle}><i className="pi pi-tag" style={{ color: '#b000ff', fontSize: '0.7rem' }}></i> {t('promoCodeLabel')}</label>
                        <InputText
                            value={newPromo.code}
                            onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. WELCOME10"
                            style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.15em' }}
                            disabled={isEditing}
                        />
                        {isEditing && <small style={{ color: '#666', fontStyle: 'italic', fontSize: '0.7rem' }}>{t('codeNotEditable')}</small>}
                    </div>

                    {/* Type + Value */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}><i className="pi pi-percentage" style={{ color: '#eb79b2', fontSize: '0.7rem' }}></i> {t('type')}</label>
                            <Dropdown
                                value={newPromo.discountType}
                                options={[
                                    { label: t('percentage'), value: 'PERCENT' },
                                    { label: t('fixedAmount'), value: 'FIXED' }
                                ]}
                                onChange={e => setNewPromo({ ...newPromo, discountType: e.value })}
                                style={{ ...inputStyle, width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}><i className="pi pi-money-bill" style={{ color: '#4caf50', fontSize: '0.7rem' }}></i> {t('value')}</label>
                            <InputNumber
                                value={newPromo.value}
                                onValueChange={e => setNewPromo({ ...newPromo, value: e.value })}
                                min={0}
                                suffix={newPromo.discountType === 'PERCENT' ? '%' : '₮'}
                                inputStyle={{ ...inputStyle, width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}><i className="pi pi-calendar" style={{ color: '#6c9cf7', fontSize: '0.7rem' }}></i> {t('startDate')}</label>
                            <Calendar value={newPromo.validFrom} onChange={e => setNewPromo({ ...newPromo, validFrom: e.value })} showIcon dateFormat="yy-mm-dd" inputStyle={{ ...inputStyle, width: '100%' }} />
                        </div>
                        <div>
                            <label style={labelStyle}><i className="pi pi-calendar-times" style={{ color: '#ff9800', fontSize: '0.7rem' }}></i> {t('endDate')}</label>
                            <Calendar value={newPromo.validTo} onChange={e => setNewPromo({ ...newPromo, validTo: e.value })} showIcon minDate={newPromo.validFrom} dateFormat="yy-mm-dd" inputStyle={{ ...inputStyle, width: '100%' }} />
                        </div>
                    </div>

                    {/* Venue */}
                    <div>
                        <label style={labelStyle}><i className="pi pi-building" style={{ color: '#ff9800', fontSize: '0.7rem' }}></i> {t('venue')}</label>
                        <Dropdown
                            value={newPromo.venueId}
                            options={venueOptions}
                            optionGroupLabel="label"
                            optionGroupChildren="items"
                            onChange={e => setNewPromo({ ...newPromo, venueId: e.value })}
                            placeholder={t('selectVenue')}
                            filter
                            filterPlaceholder={t('searchVenue') || 'Search...'}
                            style={{ ...inputStyle, width: '100%' }}
                        />
                        <small style={{ color: '#666', fontStyle: 'italic', fontSize: '0.7rem' }}>{t('venuePromoHint')}</small>
                    </div>
                </div>
            </Dialog>

            <style>{`
                .promo-card:hover {
                    border-color: rgba(176,0,255,0.3) !important;
                }
                .promotions-management .p-dialog .p-dialog-header {
                    background: #1e1e2d !important;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                    padding: 1rem 1.25rem !important;
                }
                .promotions-management .p-dialog .p-dialog-content {
                    background: #1e1e2d !important;
                    padding: 0 1.25rem !important;
                }
                .promotions-management .p-dialog .p-dialog-footer {
                    background: #1e1e2d !important;
                    border-top: 1px solid rgba(255,255,255,0.05) !important;
                    padding: 0.75rem 1.25rem !important;
                }
                .promotions-management .p-dropdown {
                    background: rgba(0,0,0,0.2) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                }
                .promotions-management .p-dropdown:hover,
                .promotions-management .p-dropdown.p-focus {
                    border-color: #b000ff !important;
                }
                .promotions-management .p-calendar .p-inputtext {
                    background: rgba(0,0,0,0.2) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    color: white !important;
                }
                .promo-bookings-table .p-datatable-thead > tr > th {
                    background: rgba(0,0,0,0.3) !important;
                    color: #999 !important;
                    border-color: rgba(255,255,255,0.05) !important;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-weight: 800;
                }
                .promo-bookings-table .p-datatable-tbody > tr {
                    background: transparent !important;
                    border-color: rgba(255,255,255,0.03) !important;
                }
                .promo-bookings-table .p-datatable-tbody > tr:hover {
                    background: rgba(176,0,255,0.05) !important;
                }
                .promo-bookings-table .p-datatable-tbody > tr > td {
                    border-color: rgba(255,255,255,0.03) !important;
                    padding: 0.65rem 1rem;
                }
                .promo-bookings-table .p-paginator {
                    background: transparent !important;
                    border: none !important;
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
