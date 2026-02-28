import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { MultiSelect } from 'primereact/multiselect';
import { getOpeningHoursMap } from '../../utils/time';
import RoomConfiguration from './RoomConfiguration';
import RoomPricing from './RoomPricing';
import ImageUpload from '../common/ImageUpload';

// Import local stock images for the gallery
import imgMinimal from '../../assets/defaults/karaoke_minimal.png';
import imgStandard from '../../assets/defaults/karaoke_standard.png';
import imgVIP from '../../assets/defaults/karaoke_vip.png';
import imgParty from '../../assets/defaults/karaoke_party.png';

const ImagePicker = ({ selectedImage, onSelect, label, images }) => {
    return (
        <div className="mb-5">
            <label className="block mb-2 text-sm text-text-muted font-medium">{label}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {images.map(img => (
                    <div
                        key={img.id}
                        onClick={() => onSelect(img.url)}
                        className={`cursor-pointer rounded-lg overflow-hidden relative transition-all duration-200 border-2 ${selectedImage === img.url ? 'border-[#b000ff] shadow-[0_0_15px_rgba(176,0,255,0.3)]' : 'border-transparent hover:border-white/20'}`}
                    >
                        <img src={img.url} alt={img.label} className="w-full h-16 sm:h-[60px] object-cover" />
                        {selectedImage === img.url && (
                            <div className="absolute inset-0 bg-[#b000ff]/20 flex justify-center items-center">
                                <span className="text-white text-xl">✓</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const VenueManagement = () => {
    const { venues, activeVenueId, updateVenue, updateVenueStatus, addVenue, deleteVenue, addRoom, updateRoom, deleteRoom, updateRoomStatus, updateRoomSortOrders, currentUser, organizations, roomTypes, roomFeatures, refreshData } = useData();
    const { t } = useLanguage();
    const toast = useRef(null);

    const STOCK_IMAGES = [
        { id: 'standard', url: imgStandard, label: t('standardRoom') },
        { id: 'vip', url: imgVIP, label: t('vipLounge') },
        { id: 'party', url: imgParty, label: t('partyHall') },
        { id: 'minimal', url: imgMinimal, label: t('minimalSmall') }
    ];

    // Venue Modal State
    const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null); // If null, adding new. If set, editing.
    const [venueForm, setVenueForm] = useState({
        name: '',
        district: 'Sukhbaatar',
        openHours: '10:00 - 04:00',
        useCustomHours: false,
        dailyHours: {
            Monday: '10:00 - 04:00',
            Tuesday: '10:00 - 04:00',
            Wednesday: '10:00 - 04:00',
            Thursday: '10:00 - 04:00',
            Friday: '10:00 - 04:00',
            Saturday: '10:00 - 04:00',
            Sunday: '10:00 - 04:00'
        },
        address: '',
        description: '',
        phone: '',
        priceRange: '$$',
        featuredImage: imgStandard,
        bookingWindowStart: '',
        bookingWindowEnd: '',
        advanceBookingDays: 3,
        minBookingHours: 1,
        maxBookingHours: 6,
        gmapLocation: '',
        organizationId: currentUser.role === 'manager' ? currentUser.organizationId : ''
    });

    // Room Modal State
    const [selectedVenueId, setSelectedVenueId] = useState(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    // Room Form State
    const [editingRoom, setEditingRoom] = useState(null); // If null, adding new.
    const [roomForm, setRoomForm] = useState({
        name: '',
        roomTypeId: null, // Use ID now
        capacity: 6,
        hourlyRate: 40000,
        bufferMinutes: 15,
        images: [imgStandard],
        roomFeatureIds: [],
        isBookingEnabled: true
    });

    const selectedVenue = venues?.find(v => v.id === activeVenueId);

    // Pricing Modal State
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [selectedPricingRoom, setSelectedPricingRoom] = useState(null);

    // --- DATATABLE HELPERS (Defined early to avoid ReferenceErrors) ---

    const roomRateBody = (rowData) => {
        return (rowData.hourlyRate || rowData.pricePerHour || 0).toLocaleString() + '₮';
    };

    const roomBookingStatusBody = (rowData) => {
        const isEnabled = rowData.isBookingEnabled !== false;
        return (
            <div className="flex items-center gap-2">
                <Tag
                    value={isEnabled ? t('bookingOn') : t('bookingOff')}
                    severity={isEnabled ? 'success' : 'warning'}
                    className="text-[9px] px-1.5"
                />
            </div>
        );
    };

    const roomBufferBody = (rowData) => {
        return (
            <span className="flex items-center gap-1 text-sm">
                <i className="pi pi-clock opacity-40" style={{ fontSize: '0.7rem' }}></i>
                {rowData.bufferMinutes || 15} min
            </span>
        );
    };

    const roomOperationalStatusBody = (rowData) => {
        const status = (rowData.status || 'AVAILABLE').toUpperCase();
        const severityMap = { 'AVAILABLE': 'success', 'OCCUPIED': 'danger', 'CLEANING': 'warning', 'RESERVED': 'info' };
        return <Tag value={status} severity={severityMap[status] || 'info'} className="text-[9px] px-1.5 font-black" />;
    };

    const roomStatusBody = (rowData) => {
        const isActive = rowData.isActive !== false;
        return (
            <div className="flex items-center gap-2">
                <Button
                    icon={isActive ? "pi pi-check-circle" : "pi pi-times-circle"}
                    severity={isActive ? "success" : "danger"}
                    rounded
                    text
                    size="small"
                    onClick={() => updateRoomStatus(selectedVenue.id, rowData.id, !isActive)}
                    tooltip={isActive ? t('deactivateRoom') : t('activateRoom')}
                />
                <span className={`text-xs ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {isActive ? t('active') : t('inactive')}
                </span>
            </div>
        );
    };

    const roomActionsBody = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-dollar"
                    outlined
                    size="small"
                    severity="help"
                    className="h-9 w-9"
                    onClick={() => {
                        setSelectedPricingRoom(rowData);
                        setIsPricingModalOpen(true);
                    }}
                    tooltip={t('advancedPricing') || 'Pricing'}
                />
                <Button
                    icon="pi pi-pencil"
                    outlined
                    size="small"
                    className="h-9 w-9"
                    onClick={() => handleEditRoom(rowData)}
                    tooltip={t('editRoom')}
                />
                <Button
                    icon="pi pi-trash"
                    outlined
                    severity="danger"
                    size="small"
                    className="h-9 w-9"
                    onClick={() => handleDeleteRoom(rowData.id)}
                    tooltip={t('deleteRoom')}
                />
            </div>
        );
    };




    // --- VENUE HANDLERS ---
    const openAddVenue = () => {
        setEditingVenue(null);
        setVenueForm({
            name: '',
            district: 'Sukhbaatar',
            openHours: '10:00 - 04:00',
            useCustomHours: false,
            dailyHours: {
                Monday: '10:00 - 04:00',
                Tuesday: '10:00 - 04:00',
                Wednesday: '10:00 - 04:00',
                Thursday: '10:00 - 04:00',
                Friday: '10:00 - 04:00',
                Saturday: '10:00 - 04:00',
                Sunday: '10:00 - 04:00'
            },
            address: '',
            description: '',
            phone: '',
            priceRange: '$$',
            featuredImage: imgStandard,
            bookingWindowStart: '',
            bookingWindowEnd: '',
            advanceBookingDays: 3,
            minBookingHours: 1,
            maxBookingHours: 6,
            gmapLocation: ''
        });
        setIsVenueModalOpen(true);
    };

    const openEditVenue = (venue) => {
        setEditingVenue(venue);
        // Normalize operating hours
        const rawHours = venue.openingHours || {};
        const dailyHours = {
            Monday: rawHours.Monday || '10:00-04:00',
            Tuesday: rawHours.Tuesday || '10:00-04:00',
            Wednesday: rawHours.Wednesday || '10:00-04:00',
            Thursday: rawHours.Thursday || '10:00-04:00',
            Friday: rawHours.Friday || '10:00-04:00',
            Saturday: rawHours.Saturday || '10:00-04:00',
            Sunday: rawHours.Sunday || '10:00-04:00'
        };

        const hasCustom = !rawHours.Daily && Object.keys(rawHours).length > 0;
        const mainHours = rawHours.Daily || rawHours.Monday || '10:00-04:00';

        setVenueForm({
            name: venue.name,
            district: venue.district,
            openHours: mainHours.replace('-', ' - '),
            useCustomHours: hasCustom,
            dailyHours: dailyHours,
            address: venue.address || '',
            description: venue.description || '',
            phone: venue.phone || '',
            priceRange: venue.priceRange || '$$',
            featuredImage: venue.featuredImage || venue.image || imgStandard,
            bookingWindowStart: venue.bookingWindowStart || '',
            bookingWindowEnd: venue.bookingWindowEnd || '',
            advanceBookingDays: venue.advanceBookingDays || 3,
            minBookingHours: venue.minBookingHours || 1.0,
            maxBookingHours: venue.maxBookingHours || 6.0,
            gmapLocation: venue.gmapLocation || '',
            organizationId: venue.organizationId || ''
        });
        setIsVenueModalOpen(true);
    };

    const handleSaveVenue = async (e) => {
        e.preventDefault();

        // Transform venueForm to match API DTO
        let openingHoursObj = {};
        if (venueForm.useCustomHours) {
            openingHoursObj = {
                Monday: venueForm.dailyHours.Monday.replace(/\s/g, ''),
                Tuesday: venueForm.dailyHours.Tuesday.replace(/\s/g, ''),
                Wednesday: venueForm.dailyHours.Wednesday.replace(/\s/g, ''),
                Thursday: venueForm.dailyHours.Thursday.replace(/\s/g, ''),
                Friday: venueForm.dailyHours.Friday.replace(/\s/g, ''),
                Saturday: venueForm.dailyHours.Saturday.replace(/\s/g, ''),
                Sunday: venueForm.dailyHours.Sunday.replace(/\s/g, '')
            };
        } else {
            const hours = venueForm.openHours.replace(/\s/g, '');
            openingHoursObj = { Daily: hours };
        }

        const venueData = {
            name: venueForm.name,
            district: venueForm.district,
            description: venueForm.description || t('venueDescriptionPlaceholder'),
            phone: venueForm.phone || t('venuePhonePlaceholder'),
            priceRange: venueForm.priceRange,
            openingHours: openingHoursObj,
            address: venueForm.address,
            organizationId: venueForm.organizationId || currentUser.organizationId,
            amenities: ["WiFi", "AC", "Premium sound"],
            images: [venueForm.featuredImage],
            featuredImage: venueForm.featuredImage,
            bookingWindowStart: venueForm.bookingWindowStart || undefined,
            bookingWindowEnd: venueForm.bookingWindowEnd || undefined,
            advanceBookingDays: venueForm.advanceBookingDays || 3,
            minBookingHours: Number(venueForm.minBookingHours) || 1.0,
            maxBookingHours: Number(venueForm.maxBookingHours) || 6.0,
            gmapLocation: venueForm.gmapLocation || undefined
        };

        if (editingVenue) {
            await updateVenue(editingVenue.id, venueData);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('venueUpdatedSuccess') });
        } else {
            await addVenue(venueData);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('venueAddedSuccess') });
        }
        setIsVenueModalOpen(false);
        refreshData?.();
    };

    const handleDeleteVenue = (venueId) => {
        confirmDialog({
            message: t('areYouSure'),
            header: t('deleteConfirmation'),
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                await deleteVenue(venueId);
                toast.current.show({ severity: 'success', summary: t('deleted'), detail: t('venueRemovedSuccess') });
                refreshData?.();
            }
        });
    };

    const handleToggleStatus = async (venue) => {
        const newIsActive = !venue.isActive;
        await updateVenueStatus(venue.id, newIsActive);
        toast.current.show({
            severity: 'info',
            summary: t('statusUpdated'),
            detail: newIsActive ? t('venueStatusActive') : t('venueStatusInactive')
        });
    };

    // --- ROOM HANDLERS ---
    const handleManageRooms = (venue) => {
        setSelectedVenueId(venue.id);
        setEditingRoom(null);
        setRoomForm({
            name: '',
            roomTypeId: null,
            capacity: 6,
            hourlyRate: 40000,
            bufferMinutes: 15,
            images: [imgStandard],
            roomFeatureIds: [],
            isBookingEnabled: true
        });
        setIsRoomModalOpen(true);
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name,
            roomTypeId: room.roomTypeId || (roomTypes.find(t => t.name === room.type)?.id),
            capacity: room.capacity,
            hourlyRate: room.hourlyRate || room.pricePerHour,
            bufferMinutes: room.bufferMinutes ?? 15,
            images: (room.images && room.images.length > 0) ? room.images : [imgStandard],
            roomFeatureIds: room.roomFeatures?.map(f => f.id) || [],
            isBookingEnabled: room.isBookingEnabled !== false
        });
        setIsRoomModalOpen(true);
    };

    const handleSaveRoom = async (e) => {
        e.preventDefault();
        if (!selectedVenue) return;

        const payload = {
            ...roomForm,
            hourlyRate: Number(roomForm.hourlyRate),
            capacity: Number(roomForm.capacity),
            bufferMinutes: Number(roomForm.bufferMinutes) || 15
        };

        if (editingRoom) {
            await updateRoom(selectedVenue.id, editingRoom.id, payload);
            setEditingRoom(null);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('roomUpdated') });
        } else {
            await addRoom(selectedVenue.id, payload);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('roomAdded') });
        }
        setIsRoomModalOpen(false);
        refreshData?.();
        setRoomForm({
            name: '',
            roomTypeId: null,
            capacity: 6,
            hourlyRate: 40000,
            bufferMinutes: 15,
            images: [imgStandard],
            roomFeatureIds: [],
            isBookingEnabled: true
        });
    };

    const handleDeleteRoom = (roomId) => {
        confirmDialog({
            message: t('areYouSure'),
            header: t('deleteConfirmation'),
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                await deleteRoom(selectedVenue.id, roomId);
                toast.current.show({ severity: 'success', summary: t('deleted'), detail: t('venueRemovedSuccess') });
                refreshData?.();
            }
        });
    };

    const handleRowReorder = async (e) => {
        const newOrder = e.value.map((room, index) => ({
            roomId: room.id,
            sortOrder: index + 1
        }));
        try {
            await updateRoomSortOrders(selectedVenue.id, newOrder);
            toast.current.show({ severity: 'success', summary: t('sorted'), detail: t('roomOrderUpdated') });
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToUpdateOrder') });
        }
    };

    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold m-0">{t('venueManagement')}</h2>
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="h-11 w-11"
                        tooltip="Refresh"
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    {['sysadmin', 'admin'].includes(currentUser.role) && (
                        <Button
                            label={t('roomSettings')}
                            icon="pi pi-cog"
                            outlined
                            onClick={() => setIsConfigModalOpen(true)}
                            className="h-11"
                        />
                    )}
                    <Button
                        onClick={openAddVenue}
                        className="h-11 px-6 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(176,0,255,0.7)] transition-all duration-300 flex items-center gap-2"
                    >
                        {t('addBranch')}
                    </Button>
                </div>
            </div>

            {!selectedVenue ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <i className="pi pi-building text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('noBranchSelected')}</h3>
                    <p className="text-gray-400 max-w-sm mb-6">{t('selectBranchContext')}</p>
                    {['sysadmin', 'admin'].includes(currentUser.role) && (
                        <Button
                            label={t('addBranch')}
                            icon="pi pi-plus"
                            onClick={openAddVenue}
                            className="bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none font-bold px-6 h-11"
                        />
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="bg-[#1a1a24] p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden" style={{ borderLeft: `6px solid ${selectedVenue.isActive === false ? '#ef4444' : '#22c55e'}` }}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-3xl font-black text-white m-0 tracking-tight">{selectedVenue.name}</h3>
                                    <Tag
                                        value={selectedVenue.isActive === false ? t('inactive') : t('active')}
                                        severity={selectedVenue.isActive === false ? 'danger' : 'success'}
                                        className="px-3"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-400">
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <i className="pi pi-map-marker text-[#eb79b2]"></i>
                                        {selectedVenue.district}
                                    </span>
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <i className="pi pi-clock text-[#eb79b2]"></i>
                                        {(() => {
                                            const hMap = getOpeningHoursMap(selectedVenue.operatingHours || selectedVenue.openingHours || selectedVenue.openHours);
                                            return hMap['Daily'] || hMap['Monday'] || Object.values(hMap)[0] || '10:00 - 04:00';
                                        })()}
                                    </span>
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        <i className="pi pi-phone text-[#eb79b2]"></i>
                                        {selectedVenue.phone}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    icon="pi pi-pencil"
                                    label={t('editDetails')}
                                    onClick={() => openEditVenue(selectedVenue)}
                                    className="p-button-outlined border-white/10 text-white font-bold h-10 px-4"
                                />
                                <Button
                                    icon={selectedVenue.isActive === false ? "pi pi-play" : "pi pi-pause"}
                                    label={selectedVenue.isActive === false ? t('activate') : t('deactivate')}
                                    severity={selectedVenue.isActive === false ? "success" : "warning"}
                                    outlined
                                    className="h-10 px-4"
                                    onClick={() => handleToggleStatus(selectedVenue)}
                                />
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    outlined
                                    onClick={() => handleDeleteVenue(selectedVenue.id)}
                                    className="h-10 w-10 p-0 flex items-center justify-center"
                                    tooltip={t('delete')}
                                />
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#b000ff]/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    </div>

                    <div className="bg-[#1a1a24] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#b000ff] to-[#eb79b2] flex items-center justify-center">
                                    <i className="pi pi-th-large text-white text-xs"></i>
                                </div>
                                <h4 className="m-0 font-bold uppercase tracking-widest text-xs text-gray-400">{t('branchRoomsInventory')}</h4>
                            </div>
                            <Button
                                label={t('addRoom')}
                                icon="pi pi-plus"
                                onClick={() => {
                                    setEditingRoom(null);
                                    setRoomForm({
                                        name: '',
                                        roomTypeId: null,
                                        capacity: 6,
                                        hourlyRate: 40000,
                                        bufferMinutes: 15,
                                        images: [imgStandard],
                                        roomFeatureIds: [],
                                        isBookingEnabled: true
                                    });
                                    setIsRoomModalOpen(true);
                                }}
                                className="bg-white/10 border-none hover:bg-white/20 text-white font-black text-xs px-4 h-9 uppercase tracking-wider rounded-lg transition-all"
                            />
                        </div>

                        <DataTable
                            value={selectedVenue.rooms}
                            className="rooms-datatable"
                            reorderableRows
                            onRowReorder={handleRowReorder}
                            dataKey="id"
                            emptyMessage={t('noRoomsFound')}
                        >
                            <Column rowReorder style={{ width: '3rem' }} />
                            <Column field="name" header={t('room')} className="font-bold text-white"></Column>
                            <Column header={t('type')} body={(rowData) => (
                                <Tag value={rowData.roomType?.name || rowData.type} severity="info" className="text-[10px] uppercase font-black px-2" />
                            )}></Column>
                            <Column field="capacity" header={t('capacity')} body={(rowData) => (
                                <span className="flex items-center gap-2 text-sm"><i className="pi pi-users opacity-40"></i> {rowData.capacity}</span>
                            )}></Column>
                            <Column header={t('ratePerHour')} body={roomRateBody}></Column>
                            <Column header={t('bufferTime') || 'Buffer'} body={roomBufferBody}></Column>
                            <Column header={t('roomStatus') || 'Op. Status'} body={roomOperationalStatusBody}></Column>
                            <Column header={t('status')} body={roomStatusBody}></Column>
                            <Column header={t('bookingStatus')} body={roomBookingStatusBody}></Column>
                            <Column header={t('actions')} body={roomActionsBody} className="text-right"></Column>
                        </DataTable>
                    </div>
                </div>
            )}

            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg shadow-[#b000ff]/20">
                            <i className={`pi ${editingVenue ? 'pi-pencil' : 'pi-plus'} text-white text-lg`}></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{editingVenue ? `${t('editDetails')}` : t('addBranch')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{editingVenue ? editingVenue.name : (t('venueOnboarding') || 'NEW BRANCH ONBOARDING')}</p>
                        </div>
                    </div>
                }
                visible={isVenueModalOpen}
                onHide={() => setIsVenueModalOpen(false)}
                className="w-full max-w-[95vw] sm:max-w-[800px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-0"
                modal
                draggable={false}
            >
                <form onSubmit={handleSaveVenue} className="flex flex-col">
                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* ── Section 1: Venue Identity ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-[#b000ff]/10 flex items-center justify-center border border-[#b000ff]/20 text-[#b000ff]">
                                    <i className="pi pi-tag text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('venueIdentity') || 'Venue Identity'}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('venueName')}</label>
                                    <InputText value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} required className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#b000ff] focus:ring-4 focus:ring-[#b000ff]/10 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">
                                        {t('phoneContact')}
                                    </label>
                                    <InputText value={venueForm.phone} onChange={e => setVenueForm({ ...venueForm, phone: e.target.value })} required className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#b000ff] focus:ring-4 focus:ring-[#b000ff]/10 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">
                                        {t('priceTier')}
                                    </label>
                                    <Dropdown
                                        value={venueForm.priceRange}
                                        options={[
                                            { label: t('budget') + ' ($)', value: '$' },
                                            { label: t('standard') + ' ($$)', value: '$$' },
                                            { label: t('premium') + ' ($$$)', value: '$$$' },
                                            { label: t('luxury') + ' ($$$$)', value: '$$$$' }
                                        ]}
                                        optionLabel="label"
                                        optionValue="value"
                                        onChange={e => setVenueForm({ ...venueForm, priceRange: e.value })}
                                        className="h-14 bg-black/20 border-white/5 rounded-2xl"
                                        pt={{
                                            root: { className: 'h-14 bg-black/20 border-white/5' },
                                            input: { className: 'text-white font-bold h-full flex items-center' }
                                        }}
                                    />
                                </div>
                                {currentUser.role === 'sysadmin' && (
                                    <div className="md:col-span-2 pt-4 border-t border-white/5">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">
                                            {t('organizationOwner')}
                                        </label>
                                        <Dropdown
                                            value={venueForm.organizationId}
                                            options={organizations.map(org => ({ label: org.name, value: org.id }))}
                                            onChange={e => setVenueForm({ ...venueForm, organizationId: e.value })}
                                            placeholder={t('selectOrganization')}
                                            className="h-14 bg-black/20 border-white/5 rounded-2xl"
                                            required
                                            pt={{
                                                root: { className: 'h-14 bg-black/20 border-white/5' },
                                                input: { className: 'text-white font-bold h-full flex items-center' }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Section 2: Location Details ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-[#eb79b2]/10 flex items-center justify-center border border-[#eb79b2]/20 text-[#eb79b2]">
                                    <i className="pi pi-map-marker text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('locationDetails') || 'Location Details'}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('district')}</label>
                                    <Dropdown
                                        value={venueForm.district}
                                        options={['Sukhbaatar', 'Chingeltei', 'Bayangol', 'Bayanzurkh', 'Khan-Uul', 'Songinokhairkhan'].map(d => ({ label: t(`district_${d.replace('-', '')}`), value: d }))}
                                        onChange={e => setVenueForm({ ...venueForm, district: e.value })}
                                        placeholder={t('selectDistrict')}
                                        className="h-14 bg-black/20 border-white/5 rounded-2xl"
                                        pt={{
                                            root: { className: 'h-14 bg-black/20 border-white/5' },
                                            input: { className: 'text-white font-bold h-full flex items-center' }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">
                                        {t('gmapLocationLabel')}
                                    </label>
                                    <InputText value={venueForm.gmapLocation} onChange={e => setVenueForm({ ...venueForm, gmapLocation: e.target.value })} placeholder={t('gmapPlaceholder')} className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#eb79b2] focus:ring-4 focus:ring-[#eb79b2]/10 transition-all" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('physicalAddress')}</label>
                                    <InputText value={venueForm.address} onChange={e => setVenueForm({ ...venueForm, address: e.target.value })} required className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#eb79b2] focus:ring-4 focus:ring-[#eb79b2]/10 transition-all" placeholder={t('addressPlaceholderDetail')} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('description')}</label>
                                    <InputTextarea value={venueForm.description} onChange={e => setVenueForm({ ...venueForm, description: e.target.value })} required rows={3} autoResize className="w-full bg-black/20 border-white/5 p-4 font-bold text-white rounded-2xl focus:border-[#eb79b2] focus:ring-4 focus:ring-[#eb79b2]/10 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 3: Opening Hours ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                                        <i className="pi pi-clock text-xs"></i>
                                    </div>
                                    <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('openingHours')}</h4>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/20 border border-white/5">
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{t('customPerDay')}</span>
                                    <Checkbox
                                        checked={venueForm.useCustomHours}
                                        onChange={e => setVenueForm({ ...venueForm, useCustomHours: e.checked })}
                                    />
                                </div>
                            </div>

                            {!venueForm.useCustomHours ? (
                                <div className="bg-black/40 p-8 rounded-3xl border border-white/5 text-center">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">{t('dailyAllDays')}</label>
                                    <InputText
                                        value={venueForm.openHours}
                                        onChange={e => setVenueForm({ ...venueForm, openHours: e.target.value })}
                                        placeholder="10:00 - 04:00"
                                        required={!venueForm.useCustomHours}
                                        className="w-full h-16 bg-black/20 border-white/5 px-4 text-white text-center text-2xl font-black tracking-[0.2em] rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.keys(venueForm.dailyHours).map(day => (
                                        <div key={day} className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">{day}</label>
                                            <InputText
                                                value={venueForm.dailyHours[day]}
                                                onChange={e => setVenueForm({
                                                    ...venueForm,
                                                    dailyHours: { ...venueForm.dailyHours, [day]: e.target.value }
                                                })}
                                                placeholder="10:00 - 04:00"
                                                className="w-full h-12 bg-black/20 border-white/5 px-4 text-white text-center font-black tracking-wider rounded-xl focus:border-orange-500 transition-all"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Section 4: Booking Settings ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500">
                                    <i className="pi pi-calendar-plus text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('bookingSystemSettings')}</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('allowedStartTime')}</label>
                                    <InputText type="time" value={venueForm.bookingWindowStart || ''} onChange={e => setVenueForm({ ...venueForm, bookingWindowStart: e.target.value })} className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('allowedEndTime')}</label>
                                    <InputText type="time" value={venueForm.bookingWindowEnd || ''} onChange={e => setVenueForm({ ...venueForm, bookingWindowEnd: e.target.value })} className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl" />
                                </div>
                                <div className="sm:col-span-2 space-y-6 pt-4 border-t border-white/5">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('maxAdvanceBooking')}</label>
                                            <span className="text-blue-400 font-black text-xs uppercase tracking-widest">{venueForm.advanceBookingDays} {t('days') || 'days'}</span>
                                        </div>
                                        <InputNumber
                                            value={venueForm.advanceBookingDays}
                                            onValueChange={e => setVenueForm({ ...venueForm, advanceBookingDays: e.value })}
                                            min={1} max={30}
                                            showButtons
                                            buttonLayout="horizontal"
                                            decrementButtonClassName="h-14 w-14 bg-black/40 border-white/5 text-white/50 hover:text-white rounded-l-2xl"
                                            incrementButtonClassName="h-14 w-14 bg-black/40 border-white/5 text-white/50 hover:text-white rounded-r-2xl"
                                            inputClassName="w-full h-14 bg-black/20 border-white/5 text-white text-center font-black text-xl"
                                            className="h-14 w-full"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('minBooking')} ({t('hours') || 'hrs'})</label>
                                            <InputNumber
                                                value={venueForm.minBookingHours}
                                                onValueChange={e => setVenueForm({ ...venueForm, minBookingHours: e.value })}
                                                min={0.5} max={12} step={0.5}
                                                showButtons
                                                buttonLayout="horizontal"
                                                decrementButtonClassName="h-12 w-10 bg-black/40 border-white/5 text-white/50 rounded-l-xl"
                                                incrementButtonClassName="h-12 w-10 bg-black/40 border-white/5 text-white/50 rounded-r-xl"
                                                inputClassName="w-full h-12 bg-black/20 border-white/5 text-white text-center font-bold"
                                                className="h-12 w-full"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{t('maxBooking')} ({t('hours') || 'hrs'})</label>
                                            <InputNumber
                                                value={venueForm.maxBookingHours}
                                                onValueChange={e => setVenueForm({ ...venueForm, maxBookingHours: e.value })}
                                                min={1} max={24} step={0.5}
                                                showButtons
                                                buttonLayout="horizontal"
                                                decrementButtonClassName="h-12 w-10 bg-black/40 border-white/5 text-white/50 rounded-l-xl"
                                                incrementButtonClassName="h-12 w-10 bg-black/40 border-white/5 text-white/50 rounded-r-xl"
                                                inputClassName="w-full h-12 bg-black/20 border-white/5 text-white text-center font-bold"
                                                className="h-12 w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 5: Venue Branding ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-[#b000ff]/10 flex items-center justify-center border border-[#b000ff]/20 text-[#b000ff]">
                                    <i className="pi pi-image text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('venueBrandingHeader')}</h4>
                            </div>
                            <div className="space-y-8">
                                <div className="flex flex-col gap-4">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-center">{t('uploadCustomImage')}</label>
                                    <ImageUpload
                                        label=""
                                        currentImage={venueForm.featuredImage}
                                        onUpload={(url) => setVenueForm({ ...venueForm, featuredImage: url })}
                                    />
                                    <div className="relative py-4 flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                        <span className="relative px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] bg-[#0f0f15]">{t('orLabel') || 'OR'}</span>
                                    </div>
                                </div>

                                <ImagePicker
                                    label=""
                                    images={STOCK_IMAGES}
                                    selectedImage={venueForm.featuredImage}
                                    onSelect={(url) => setVenueForm({ ...venueForm, featuredImage: url })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                        <Button label={t('cancel')} type="button" className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all" onClick={() => setIsVenueModalOpen(false)} />
                        <Button
                            label={editingVenue ? t('updateChanges') : t('createVenue')}
                            type="submit"
                            className="flex-1 h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(176,0,255,0.4)] transition-all hover:scale-[1.02]"
                        />
                    </div>
                </form>
            </Dialog>

            {/* Room Form Dialog */}
            <Dialog
                header={
                    <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center shadow-lg shadow-[#b000ff]/20">
                            <i className={`pi ${editingRoom ? 'pi-pencil' : 'pi-plus'} text-white text-lg`}></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-xl font-black text-white tracking-tight uppercase">{editingRoom ? t('editRoom') : t('addRoom')}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mt-0.5">{editingRoom ? editingRoom.name : t('roomReferenceName')}</p>
                        </div>
                    </div>
                }
                visible={isRoomModalOpen}
                onHide={() => setIsRoomModalOpen(false)}
                className="w-full max-w-[95vw] sm:max-w-[750px] premium-dialog"
                contentClassName="bg-[#0f0f15] p-0"
                modal
                draggable={false}
            >
                <form onSubmit={handleSaveRoom} className="flex flex-col">
                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* ── Section 1: Room Identity ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-[#b000ff]/10 flex items-center justify-center border border-[#b000ff]/20 text-[#b000ff]">
                                    <i className="pi pi-tag text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('roomIdentity')}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="flex flex-col gap-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('roomReferenceName')}</label>
                                    <InputText value={roomForm.name} onChange={e => setVenueForm({ ...roomForm, name: e.target.value })} required className="w-full h-14 bg-black/20 border-white/5 px-4 font-black text-white rounded-2xl focus:border-[#b000ff] focus:ring-4 focus:ring-[#b000ff]/10 transition-all" placeholder={t('roomRefPlaceholder')} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('roomCategory')}</label>
                                    <Dropdown
                                        value={roomForm.roomTypeId}
                                        options={roomTypes}
                                        optionLabel="name"
                                        optionValue="id"
                                        onChange={e => {
                                            const type = roomTypes.find(t => t.id === e.value);
                                            let newImg = imgStandard;
                                            if (type?.name?.includes('VIP')) newImg = imgVIP;
                                            else if (type?.name?.includes('Party')) newImg = imgParty;
                                            else if (type?.name?.includes('Small') || type?.name?.includes('Minimal')) newImg = imgMinimal;
                                            setRoomForm({ ...roomForm, roomTypeId: e.value, images: [newImg] });
                                        }}
                                        placeholder={t('selectRoomType')}
                                        className="h-14 bg-black/20 border-white/5 rounded-2xl"
                                        required
                                        pt={{
                                            root: { className: 'h-14 bg-black/20 border-white/5' },
                                            input: { className: 'text-white font-bold h-full flex items-center' }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Amenities ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-3 mb-6 text-left">
                                <div className="w-8 h-8 rounded-xl bg-[#eb79b2]/10 flex items-center justify-center border border-[#eb79b2]/20 text-[#eb79b2]">
                                    <i className="pi pi-star text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('roomAmenities')}</h4>
                            </div>
                            <MultiSelect
                                value={roomForm.roomFeatureIds}
                                options={roomFeatures}
                                onChange={(e) => setRoomForm({ ...roomForm, roomFeatureIds: e.value })}
                                optionLabel="name"
                                optionValue="id"
                                placeholder={t('selectAmenities')}
                                className="w-full min-h-[56px] bg-black/20 border-white/5 rounded-2xl"
                                display="chip"
                                pt={{
                                    root: { className: 'bg-black/20 border-white/5' },
                                    labelContainer: { className: 'p-2' },
                                    token: { className: 'bg-[#b000ff]/20 text-[#b000ff] font-black text-[10px] uppercase rounded-xl border border-[#b000ff]/30 py-1 px-3' }
                                }}
                            />
                        </div>

                        {/* ── Section 3: Capacity & Pricing ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
                                    <i className="pi pi-money-bill text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('capacityAndPricing')}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                <div className="flex flex-col gap-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('maxCapacity')}</label>
                                    <InputNumber
                                        value={roomForm.capacity}
                                        onValueChange={e => setRoomForm({ ...roomForm, capacity: e.value })}
                                        min={1} max={50}
                                        showButtons
                                        buttonLayout="horizontal"
                                        decrementButtonClassName="h-14 w-10 bg-black/40 border-white/5 text-white/50 rounded-l-xl"
                                        incrementButtonClassName="h-14 w-10 bg-black/40 border-white/5 text-white/50 rounded-r-xl"
                                        inputClassName="w-full h-14 bg-black/20 border-white/5 text-white text-center font-black"
                                        className="h-14 w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('ratePerHour')}</label>
                                    <InputNumber
                                        value={roomForm.hourlyRate}
                                        onValueChange={e => setRoomForm({ ...roomForm, hourlyRate: e.value })}
                                        mode="currency" currency="MNT" locale="mn-MN"
                                        inputClassName="w-full h-14 bg-black/20 border-white/5 text-white rounded-2xl px-4 font-black text-xl text-center focus:border-green-500 transition-colors"
                                        className="h-14 w-full"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2">{t('bufferTime') || 'Buffer Time'}</label>
                                    <InputNumber
                                        value={roomForm.bufferMinutes}
                                        onValueChange={e => setRoomForm({ ...roomForm, bufferMinutes: e.value })}
                                        min={0} max={60}
                                        showButtons
                                        buttonLayout="horizontal"
                                        suffix=" min"
                                        decrementButtonClassName="h-14 w-10 bg-black/40 border-white/5 text-white/50 rounded-l-xl"
                                        incrementButtonClassName="h-14 w-10 bg-black/40 border-white/5 text-white/50 rounded-r-xl"
                                        inputClassName="w-full h-14 bg-black/20 border-white/5 text-white text-center font-black"
                                        className="h-14 w-full"
                                    />
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setRoomForm({ ...roomForm, isBookingEnabled: !roomForm.isBookingEnabled })}>
                                    <Checkbox inputId="bookingEnabled" checked={roomForm.isBookingEnabled} onChange={e => setRoomForm({ ...roomForm, isBookingEnabled: e.checked })} />
                                    <label htmlFor="bookingEnabled" className="text-sm font-black text-white/70 tracking-tight cursor-pointer group-hover:text-white transition-colors uppercase">
                                        {t('enableOnlineBooking')}
                                    </label>
                                </div>
                                <Tag
                                    value={roomForm.isBookingEnabled ? t('active') || 'ACTIVE' : t('inactive') || 'INACTIVE'}
                                    className={`text-[9px] px-4 py-2 font-black tracking-widest uppercase rounded-xl border border-white/5 ${roomForm.isBookingEnabled ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}
                                />
                            </div>
                        </div>

                        {/* ── Section 4: Room Presentation ── */}
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-3 mb-6 text-left">
                                <div className="w-8 h-8 rounded-xl bg-[#b000ff]/10 flex items-center justify-center border border-[#b000ff]/20 text-[#b000ff]">
                                    <i className="pi pi-image text-xs"></i>
                                </div>
                                <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('roomPresentationHeader')}</h4>
                            </div>
                            <div className="space-y-8">
                                <div className="flex flex-col gap-4">
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-center">{t('promotionImage')}</label>
                                    <ImageUpload
                                        label=""
                                        currentImage={roomForm.images[0]}
                                        onUpload={(url) => setRoomForm({ ...roomForm, images: [url] })}
                                    />
                                    <div className="relative py-4 flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                                        <span className="relative px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] bg-[#0f0f15]">{t('orLabel') || 'OR'}</span>
                                    </div>
                                </div>

                                <ImagePicker
                                    label=""
                                    images={STOCK_IMAGES}
                                    selectedImage={roomForm.images[0]}
                                    onSelect={(url) => setRoomForm({ ...roomForm, images: [url] })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0f0f15]">
                        <Button label={t('cancel')} type="button" className="flex-1 h-14 text-white font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all" onClick={() => setIsRoomModalOpen(false)} />
                        <Button
                            label={editingRoom ? t('updateChanges') : t('addRoom')}
                            type="submit"
                            className="flex-1 h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(176,0,255,0.4)] transition-all hover:scale-[1.02]"
                        />
                    </div>
                </form>
            </Dialog>

            <Dialog header="Room Types & Features Configuration" visible={isConfigModalOpen} className="w-full max-w-[95vw] lg:max-w-[1000px]" modal onHide={() => setIsConfigModalOpen(false)}>
                <RoomConfiguration />
            </Dialog>

            <RoomPricing
                visible={isPricingModalOpen}
                onHide={() => { setIsPricingModalOpen(false); setSelectedPricingRoom(null); }}
                room={selectedPricingRoom}
                venue={selectedVenue}
            />
        </div>
    );
};

export default VenueManagement;
