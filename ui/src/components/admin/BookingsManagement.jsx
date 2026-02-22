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
        <div className="space-y-6">
            <Toast ref={toast} />

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white m-0">{t('bookingsManagement')}</h2>
                    <p className="text-gray-400 mt-1 text-sm">
                        {t('manageBookingsDesc')}
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="bg-[#1a1a24] px-4 py-2 rounded-xl border border-white/5">
                        <span className="text-xs text-gray-500 uppercase font-bold">{t('totalBookings')}: </span>
                        <span className="text-white font-bold">{getFilteredBookings().length}</span>
                    </div>
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-10 w-10"
                        tooltip={t('refresh')}
                        tooltipOptions={{ position: 'bottom' }}
                    />
                </div>
            </div>

            <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden">
                <DataTable
                    value={getFilteredBookings()}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    header={header}
                    globalFilter={globalFilter}
                    emptyMessage={t('noBookingsFound')}
                    className="p-datatable-dark"
                    stripedRows
                    sortField="createdAt"
                    sortOrder={-1}
                >
                    <Column header={t('customer')} body={customerTemplate} sortable sortField="customerName" />
                    <Column header={t('venueRoom')} body={venueRoomTemplate} />
                    <Column header={t('time')} body={timeTemplate} sortable sortField="startTime" />
                    <Column header={t('status')} body={statusTemplate} sortable sortField="status" />
                    <Column header={t('total')} body={priceTemplate} sortable sortField="totalPrice" />
                    <Column header={t('actions')} body={actionTemplate} style={{ width: '150px' }} />
                </DataTable>
            </div>

            {/* Booking Details Modal */}
            <Dialog
                header={t('bookingDetails')}
                visible={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                className="w-full max-w-lg"
                modal
            >
                {selectedBooking && (
                    <div className="space-y-4">
                        {/* Customer Contact Section */}
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <p className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center gap-2">
                                <i className="pi pi-user" /> {t('customerContact')}
                            </p>
                            <div className="space-y-2">
                                <p className="text-white font-bold text-lg m-0">{selectedBooking.customerName || t('unknown')}</p>
                                {selectedBooking.customerPhone && (
                                    <p className="text-gray-300 text-sm m-0 flex items-center gap-2">
                                        <i className="pi pi-phone text-green-400" />
                                        <a href={`tel:${selectedBooking.customerPhone}`} className="text-green-400 hover:underline no-underline">
                                            {selectedBooking.customerPhone}
                                        </a>
                                    </p>
                                )}
                                {selectedBooking.customerEmail && (
                                    <p className="text-gray-300 text-sm m-0 flex items-center gap-2">
                                        <i className="pi pi-envelope text-blue-400" />
                                        <a href={`mailto:${selectedBooking.customerEmail}`} className="text-blue-400 hover:underline no-underline">
                                            {selectedBooking.customerEmail}
                                        </a>
                                    </p>
                                )}
                                {!selectedBooking.customerPhone && !selectedBooking.customerEmail && (
                                    <p className="text-gray-500 text-sm italic m-0">{t('noContactInfo')}</p>
                                )}
                            </div>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('startTime')}</p>
                                <p className="text-white">{formatDateTime(selectedBooking.startTime)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('endTime')}</p>
                                <p className="text-white">{formatDateTime(selectedBooking.endTime)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('status')}</p>
                                <Tag value={t(selectedBooking.status?.toLowerCase())} severity={getStatusSeverity(selectedBooking.status)} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('totalPrice')}</p>
                                <p className="text-green-400 font-bold text-xl">{Number(selectedBooking.totalPrice || 0).toLocaleString()}₮</p>
                            </div>
                            {selectedBooking.source && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('source')}</p>
                                    <Tag value={selectedBooking.source} severity="info" />
                                </div>
                            )}
                            {selectedBooking.notes && (
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">{t('notes')}</p>
                                    <p className="text-gray-300 text-sm">{selectedBooking.notes}</p>
                                </div>
                            )}
                        </div>

                        {(selectedBooking.status?.toUpperCase() === 'PENDING' || selectedBooking.status?.toUpperCase() === 'RESERVED') && (
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <Button
                                    label={t('approve')}
                                    icon="pi pi-check"
                                    className="p-button-success flex-1"
                                    onClick={() => {
                                        handleApprove(selectedBooking);
                                        setShowDetailsModal(false);
                                    }}
                                />
                                <Button
                                    label={t('reject')}
                                    icon="pi pi-times"
                                    className="p-button-danger flex-1"
                                    onClick={() => {
                                        handleReject(selectedBooking);
                                        setShowDetailsModal(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default BookingsManagement;
