import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';

const BookingsManagement = () => {
    const { bookings, venues, currentUser, approveBooking, rejectBooking, refreshData } = useData();
    const { t } = useLanguage();
    const toast = useRef(null);

    const [selectedVenue, setSelectedVenue] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    // Filter venues by organization
    const orgVenues = currentUser.role === 'sysadmin'
        ? venues
        : venues.filter(v => v.organizationId === currentUser.organizationId);

    // Filter bookings by organization and venue
    const getFilteredBookings = () => {
        let filtered = bookings;

        // Organization filter for non-sysadmin
        if (currentUser.role !== 'sysadmin') {
            const orgVenueIds = orgVenues.map(v => v.id);
            filtered = filtered.filter(b => orgVenueIds.includes(b.venueId));
        }

        // Venue filter
        if (selectedVenue) {
            filtered = filtered.filter(b => b.venueId === selectedVenue.id);
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(b => b.status?.toUpperCase() === statusFilter?.toUpperCase());
        }

        return filtered.sort((a, b) => new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime));
    };

    const statusOptions = [
        { label: t('allStatuses'), value: null },
        { label: t('pending'), value: 'PENDING' },
        { label: t('reserved'), value: 'RESERVED' },
        { label: t('confirmed'), value: 'CONFIRMED' },
        { label: t('checkedIn'), value: 'CHECKED_IN' },
        { label: t('completed'), value: 'COMPLETED' },
        { label: t('cancelled'), value: 'CANCELLED' },
        { label: t('rejected'), value: 'REJECTED' },
        { label: t('expired'), value: 'EXPIRED' },
    ];

    const getStatusSeverity = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return 'warning';
            case 'RESERVED': return 'info';
            case 'CONFIRMED': return 'success';
            case 'CHECKED_IN': return 'info';
            case 'COMPLETED': return 'secondary';
            case 'CANCELLED': return 'danger';
            case 'EXPIRED': return 'danger';
            default: return null;
        }
    };

    const handleApprove = async (booking) => {
        try {
            await approveBooking(booking.id);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('bookingApproved') });
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: error.message || t('approveFailed') });
        }
    };

    const handleReject = async (booking) => {
        try {
            await rejectBooking(booking.id);
            toast.current.show({ severity: 'warn', summary: t('rejected'), detail: t('bookingRejected') });
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: error.message || t('rejectFailed') });
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString(t('locale') === 'mn' ? 'mn-MN' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const customerTemplate = (rowData) => (
        <div>
            <p className="text-white font-bold m-0 text-sm">{rowData.customerName || t('unknown')}</p>
            <div className="flex flex-col gap-0.5">
                {rowData.customerPhone && (
                    <p className="text-gray-400 text-xs m-0 flex items-center gap-1">
                        <i className="pi pi-phone text-[10px]" />
                        {rowData.customerPhone}
                    </p>
                )}
                {rowData.customerEmail && (
                    <p className="text-gray-500 text-xs m-0 flex items-center gap-1">
                        <i className="pi pi-envelope text-[10px]" />
                        {rowData.customerEmail}
                    </p>
                )}
                {!rowData.customerPhone && !rowData.customerEmail && (
                    <p className="text-gray-600 text-xs m-0 italic">{t('noContact')}</p>
                )}
            </div>
        </div>
    );

    const venueRoomTemplate = (rowData) => {
        const venue = venues.find(v => v.id === rowData.venueId);
        const room = venue?.rooms?.find(r => r.id === rowData.roomId);
        return (
            <div>
                <p className="text-white font-bold m-0 text-xs">{venue?.name || t('unknownVenue')}</p>
                <p className="text-[#b000ff] text-xs m-0">{room?.name || t('unknownRoom')}</p>
            </div>
        );
    };

    const timeTemplate = (rowData) => (
        <div className="text-xs">
            <p className="text-white m-0">{formatDateTime(rowData.startTime)}</p>
            <p className="text-gray-500 m-0">→ {formatDateTime(rowData.endTime)}</p>
        </div>
    );

    const statusTemplate = (rowData) => (
        <Tag value={t(rowData.status?.toLowerCase())} severity={getStatusSeverity(rowData.status)} />
    );

    const priceTemplate = (rowData) => (
        <span className="text-green-400 font-bold text-sm">
            {Number(rowData.totalPrice || 0).toLocaleString()}₮
        </span>
    );

    const actionTemplate = (rowData) => {
        const isPending = rowData.status?.toUpperCase() === 'PENDING' || rowData.status?.toUpperCase() === 'RESERVED';

        return (
            <div className="flex gap-2">
                {isPending && (
                    <>
                        <Button
                            icon="pi pi-check"
                            className="p-button-success p-button-sm p-button-rounded"
                            tooltip={t('approve')}
                            onClick={() => handleApprove(rowData)}
                        />
                        <Button
                            icon="pi pi-times"
                            className="p-button-danger p-button-sm p-button-rounded"
                            tooltip={t('reject')}
                            onClick={() => handleReject(rowData)}
                        />
                    </>
                )}
                <Button
                    icon="pi pi-eye"
                    className="p-button-info p-button-sm p-button-rounded p-button-text"
                    tooltip={t('viewDetails')}
                    onClick={() => {
                        setSelectedBooking(rowData);
                        setShowDetailsModal(true);
                    }}
                />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3 items-center">
                <Dropdown
                    value={selectedVenue}
                    options={[{ name: t('allVenues'), id: null }, ...orgVenues]}
                    onChange={(e) => setSelectedVenue(e.value?.id ? e.value : null)}
                    optionLabel="name"
                    placeholder={t('filterByVenue')}
                    className="w-48"
                />
                <Dropdown
                    value={statusFilter}
                    options={statusOptions}
                    onChange={(e) => setStatusFilter(e.value)}
                    optionValue="value"
                    placeholder={t('filterByStatus')}
                    className="w-40"
                    showClear
                />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder={t('search')}
                    className="w-64"
                />
            </span>
        </div>
    );

    return (
        <div className="bookings-management pt-4 px-6 md:px-0">
            <Toast ref={toast} />

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-[0_10px_25px_rgba(176,0,255,0.4)]">
                        <i className="pi pi-calendar text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="m-0 text-3xl font-black text-white tracking-tight leading-none">{t('bookingsManagement')}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="m-0 text-text-muted text-xs font-bold uppercase tracking-[0.2em] opacity-60">{t('manageBookingsDesc') || 'MONAGE ROOM RESERVATIONS'}</p>
                            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                            <span className="text-[10px] text-[#eb79b2] font-black uppercase tracking-widest">{getFilteredBookings().length} {t('total')}</span>
                        </div>
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
                </div>
            </div>

            {/* ── Filters Row ── */}
            <div className="flex flex-wrap gap-4 items-center mb-8 p-6 bg-white/5 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md">
                <div className="relative flex-1 min-w-[280px]">
                    <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm z-10" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={t('search')}
                        className="w-full h-11 pl-11 bg-black/20 border-white/10 text-white font-medium rounded-xl"
                    />
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <Dropdown
                        value={selectedVenue}
                        options={[{ name: t('allVenues'), id: null }, ...orgVenues]}
                        onChange={(e) => setSelectedVenue(e.value?.id ? e.value : null)}
                        optionLabel="name"
                        placeholder={t('filterByVenue')}
                        className="w-48 h-11 bg-black/20 border-white/10 text-white font-bold rounded-xl"
                    />
                    <Dropdown
                        value={statusFilter}
                        options={statusOptions}
                        onChange={(e) => setStatusFilter(e.value)}
                        optionValue="value"
                        placeholder={t('filterByStatus')}
                        className="w-44 h-11 bg-black/20 border-white/10 text-white font-bold rounded-xl"
                        showClear
                    />
                </div>
            </div>

            {/* ── Modern Table View ── */}
            <div className="bg-white/5 rounded-3xl border border-white/5 shadow-2xl overflow-hidden backdrop-blur-xl">
                <DataTable
                    value={getFilteredBookings()}
                    paginator
                    rows={10}
                    className="datatable-modern"
                    responsiveLayout="scroll"
                    dataKey="id"
                    emptyMessage={
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <i className="pi pi-calendar-times text-3xl text-gray-700"></i>
                            </div>
                            <p className="text-gray-500 font-black uppercase tracking-widest text-sm">{t('noBookingsFound')}</p>
                        </div>
                    }
                    sortField="createdAt"
                    sortOrder={-1}
                >
                    <Column header={t('customer')} body={customerTemplate} sortable sortField="customerName" className="pl-6" headerClassName="pl-6"></Column>
                    <Column header={t('venueRoom')} body={venueRoomTemplate}></Column>
                    <Column header={t('time')} body={timeTemplate} sortable sortField="startTime"></Column>
                    <Column header={t('status')} body={statusTemplate} sortable sortField="status"></Column>
                    <Column header={t('total')} body={priceTemplate} sortable sortField="totalPrice"></Column>
                    <Column header={t('actions')} body={actionTemplate} className="pr-6" headerClassName="pr-6"></Column>
                </DataTable>
            </div>

            {/* ── Booking Details Dialog ── */}
            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg">
                            <i className="pi pi-info-circle text-white text-lg"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-bold text-white tracking-tight">{t('bookingDetails')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">#{selectedBooking?.id?.slice(-8).toUpperCase() || 'REF'}</p>
                        </div>
                    </div>
                }
                visible={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                className="w-full max-w-[95vw] sm:max-w-[550px]"
                modal
            >
                {selectedBooking && (
                    <div className="flex flex-col gap-6 pt-4">
                        {/* Customer Info Section */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl text-left">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-[#b000ff]/15 flex items-center justify-center">
                                    <i className="pi pi-user text-[#b000ff] text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('customerContact')}</h4>
                            </div>
                            <div className="flex flex-col gap-4">
                                <p className="text-xl font-black text-white m-0 tracking-tight">{selectedBooking.customerName || t('unknown')}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('phone')}</span>
                                        {selectedBooking.customerPhone ? (
                                            <a href={`tel:${selectedBooking.customerPhone}`} className="text-sm text-green-400 font-bold no-underline hover:underline">
                                                <i className="pi pi-phone mr-2 text-[10px]"></i>
                                                {selectedBooking.customerPhone}
                                            </a>
                                        ) : <span className="text-xs text-white/30 italic">{t('notProvided')}</span>}
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('email')}</span>
                                        {selectedBooking.customerEmail ? (
                                            <a href={`mailto:${selectedBooking.customerEmail}`} className="text-sm text-blue-400 font-bold no-underline hover:underline truncate block">
                                                <i className="pi pi-envelope mr-2 text-[10px]"></i>
                                                {selectedBooking.customerEmail}
                                            </a>
                                        ) : <span className="text-xs text-white/30 italic">{t('notProvided')}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Booking Schedule & Location */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl text-left">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-[#eb79b2]/15 flex items-center justify-center">
                                    <i className="pi pi-map-marker text-[#eb79b2] text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('scheduleAndRoom') || 'SCHEDULE & ROOM'}</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('venue')}</span>
                                    <span className="text-sm text-white font-bold">{venues.find(v => v.id === selectedBooking.venueId)?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('room')}</span>
                                    <span className="text-sm text-[#eb79b2] font-black">{venues.find(v => v.id === selectedBooking.venueId)?.rooms?.find(r => r.id === selectedBooking.roomId)?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex flex-col gap-1.5 bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('startTime')}</span>
                                    <span className="text-xs text-white/80 font-bold block">{formatDateTime(selectedBooking.startTime)}</span>
                                </div>
                                <div className="flex flex-col gap-1.5 bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('endTime')}</span>
                                    <span className="text-xs text-white/80 font-bold block">{formatDateTime(selectedBooking.endTime)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial & Status */}
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl text-left">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                                    <i className="pi pi-credit-card text-green-400 text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('pricingAndStatus') || 'PRICING & STATUS'}</h4>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('currentStatus')}</span>
                                    <Tag value={t(selectedBooking.status?.toLowerCase())} severity={getStatusSeverity(selectedBooking.status)} className="text-[9px] font-black uppercase tracking-widest px-3 py-1" />
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('totalPrice')}</span>
                                    <span className="text-2xl font-black text-green-400 block leading-none">{Number(selectedBooking.totalPrice || 0).toLocaleString()}₮</span>
                                </div>
                            </div>
                            {selectedBooking.notes && (
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-2">{t('customerNotes') || 'CUSTOMER NOTES'}</span>
                                    <div className="bg-black/30 p-4 rounded-xl text-xs text-white/70 italic leading-relaxed">
                                        "{selectedBooking.notes}"
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions for Pending */}
                        {(selectedBooking.status?.toUpperCase() === 'PENDING' || selectedBooking.status?.toUpperCase() === 'RESERVED') && (
                            <div className="flex gap-3 pt-4">
                                <Button
                                    label={t('reject')}
                                    icon="pi pi-times"
                                    onClick={() => {
                                        handleReject(selectedBooking);
                                        setShowDetailsModal(false);
                                    }}
                                    className="h-12 flex-1 bg-red-500/10 border-red-500/20 text-red-500 font-black uppercase tracking-widest rounded-xl hover:bg-red-500/20"
                                />
                                <Button
                                    label={t('approve')}
                                    icon="pi pi-check"
                                    onClick={() => {
                                        handleApprove(selectedBooking);
                                        setShowDetailsModal(false);
                                    }}
                                    className="h-12 flex-1 bg-gradient-to-r from-green-600 to-green-500 border-none text-white font-black uppercase tracking-widest rounded-xl shadow-[0_8px_20px_rgba(34,197,94,0.3)]"
                                />
                            </div>
                        )}

                        <div className="flex justify-center pt-2">
                            <Button label={t('close')} text onClick={() => setShowDetailsModal(false)} className="h-11 px-8 font-bold text-white/30 hover:text-white" />
                        </div>
                    </div>
                )}
            </Dialog>

            <style>{`
                .bookings-management .p-datatable.datatable-modern .p-datatable-thead > tr > th {
                    background: transparent !important;
                    border-bottom: 2px solid rgba(255,255,255,0.05) !important;
                    padding: 1.25rem 1rem !important;
                    color: #555 !important;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                }
                .bookings-management .p-datatable.datatable-modern .p-datatable-tbody > tr {
                    background: transparent !important;
                    border-bottom: 1px solid rgba(255,255,255,0.03) !important;
                }
                .bookings-management .p-datatable.datatable-modern .p-datatable-tbody > tr:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
                .bookings-management .p-datatable.datatable-modern .p-datatable-tbody > tr > td {
                    padding: 1.25rem 1rem !important;
                }
                .bookings-management .p-paginator {
                    background: transparent !important;
                    border: none !important;
                    padding: 1.5rem !important;
                }
                .bookings-management .p-dropdown-panel {
                    background: #1a1a24 !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                .bookings-management .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
                    color: white !important;
                    font-size: 0.85rem !important;
                }
                .bookings-management .p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
                    background: rgba(176,0,255,0.1) !important;
                }
            `}</style>
        </div>
    );
};

export default BookingsManagement;
