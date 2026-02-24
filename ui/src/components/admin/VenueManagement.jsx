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
import { Calendar } from 'primereact/calendar';
import { getOpeningHoursMap } from '../../utils/time';
import RoomConfiguration from './RoomConfiguration';
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
    const { venues, activeVenueId, updateVenue, updateVenueStatus, addVenue, deleteVenue, addRoom, updateRoom, deleteRoom, updateRoomStatus, updateRoomSortOrders, addRoomPricing, removeRoomPricing, currentUser, organizations, roomTypes, roomFeatures, refreshData } = useData();
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
        images: [imgStandard],
        roomFeatureIds: [],
        isBookingEnabled: true
    });

    const selectedVenue = venues?.find(v => v.id === activeVenueId);

    // Pricing Form State
    const [pricingForm, setPricingForm] = useState({
        dayType: 'WEEKEND',
        startTime: '18:00',
        endTime: '02:00',
        pricePerHour: 50000,
        isSpecificDate: false,
        dateRange: null, // [start, end]
        priority: 20
    });

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
            <div className="flex gap-3">
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

    const handleAddPricing = async (roomId) => {
        if (!pricingForm.pricePerHour) return;

        const payload = {
            ...pricingForm,
            pricePerHour: Number(pricingForm.pricePerHour),
            priority: Number(pricingForm.priority)
        };

        // Transform form data to entity structure
        if (pricingForm.isSpecificDate && pricingForm.dateRange && pricingForm.dateRange[0]) {
            // Specific Date Mode
            payload.dayType = 'HOLIDAY'; // Placeholder or a new 'SPECIFIC' type if needed.
            payload.startDateTime = pricingForm.dateRange[0];
            payload.endDateTime = pricingForm.dateRange[1] || pricingForm.dateRange[0];
        } else {
            // Recurring Mode - clear specific dates
            payload.startDateTime = null;
            payload.endDateTime = null;
        }

        try {
            await addRoomPricing(roomId, payload);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('pricingRuleAdded') });
            setPricingForm(prev => ({ ...prev, isSpecificDate: false, dateRange: null }));
            refreshData?.();
        } catch (e) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToAddRule') });
        }
    };

    const handleDeletePricing = async (pricingId) => {
        try {
            await removeRoomPricing(pricingId);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('pricingRuleRemoved') });
            refreshData?.();
        } catch (e) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToRemoveRule') });
        }
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
            capacity: Number(roomForm.capacity)
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
                            <Column header={t('status')} body={roomStatusBody}></Column>
                            <Column header={t('bookingStatus')} body={roomBookingStatusBody}></Column>
                            <Column header={t('actions')} body={roomActionsBody} className="text-right"></Column>
                        </DataTable>
                    </div>
                </div>
            )}

            <Dialog header={editingVenue ? t('editDetails') : t('addBranch')} visible={isVenueModalOpen} className="w-full max-w-[95vw] sm:max-w-[700px]" modal onHide={() => setIsVenueModalOpen(false)}>
                <form onSubmit={handleSaveVenue} className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('venueName')}</label>
                        <InputText value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} required className="h-11 shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('district')}</label>
                        <Dropdown
                            value={venueForm.district}
                            options={['Sukhbaatar', 'Chingeltei', 'Bayangol', 'Bayanzurkh', 'Khan-Uul', 'Songinokhairkhan'].map(d => ({ label: t(`district_${d.replace('-', '')}`), value: d }))}
                            onChange={e => setVenueForm({ ...venueForm, district: e.value })}
                            placeholder={t('selectDistrict')}
                            className="h-11"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('phoneContact')}</label>
                        <InputText value={venueForm.phone} onChange={e => setVenueForm({ ...venueForm, phone: e.target.value })} required className="h-11 shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('physicalAddress')}</label>
                        <InputText value={venueForm.address} onChange={e => setVenueForm({ ...venueForm, address: e.target.value })} required className="h-11 shadow-sm" placeholder={t('addressPlaceholderDetail')} />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('gmapLocationLabel')}</label>
                        <InputText value={venueForm.gmapLocation} onChange={e => setVenueForm({ ...venueForm, gmapLocation: e.target.value })} placeholder={t('gmapPlaceholder')} className="h-11 shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('description')}</label>
                        <InputTextarea value={venueForm.description} onChange={e => setVenueForm({ ...venueForm, description: e.target.value })} required rows={2} autoResize className="shadow-sm" />
                    </div>
                    <div className="flex flex-col gap-3 md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-[10px] uppercase tracking-wider text-[#eb79b2]">{t('openingHours')}</label>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-text-muted uppercase">{t('customPerDay')}</span>
                                <Checkbox
                                    checked={venueForm.useCustomHours}
                                    onChange={e => setVenueForm({ ...venueForm, useCustomHours: e.checked })}
                                />
                            </div>
                        </div>

                        {!venueForm.useCustomHours ? (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] text-text-muted uppercase ml-1">{t('dailyAllDays')}</label>
                                <InputText
                                    value={venueForm.openHours}
                                    onChange={e => setVenueForm({ ...venueForm, openHours: e.target.value })}
                                    placeholder="10:00 - 04:00"
                                    required={!venueForm.useCustomHours}
                                    className="h-11 shadow-sm"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                                {Object.keys(venueForm.dailyHours).map(day => (
                                    <div key={day} className="flex flex-col gap-1">
                                        <label className="text-[10px] text-text-muted uppercase ml-1">{day}</label>
                                        <InputText
                                            value={venueForm.dailyHours[day]}
                                            onChange={e => setVenueForm({
                                                ...venueForm,
                                                dailyHours: { ...venueForm.dailyHours, [day]: e.target.value }
                                            })}
                                            placeholder="10:00 - 04:00"
                                            className="h-9 text-sm shadow-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('priceTier')}</label>
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
                            className="h-11"
                        />
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 md:col-span-2">
                        <h4 className="m-0 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#eb79b2]">{t('bookingSystemSettings')}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-text-muted">{t('allowedStartTime')}</label>
                                <InputText type="time" value={venueForm.bookingWindowStart || ''} onChange={e => setVenueForm({ ...venueForm, bookingWindowStart: e.target.value })} className="p-inputtext-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-text-muted">{t('allowedEndTime')}</label>
                                <InputText type="time" value={venueForm.bookingWindowEnd || ''} onChange={e => setVenueForm({ ...venueForm, bookingWindowEnd: e.target.value })} className="p-inputtext-sm" />
                            </div>
                            <div className="sm:col-span-2 flex flex-col gap-1">
                                <label className="text-xs text-text-muted">{t('maxAdvanceBooking')}</label>
                                <InputNumber value={venueForm.advanceBookingDays} onValueChange={e => setVenueForm({ ...venueForm, advanceBookingDays: e.value })} min={1} max={30} showButtons className="p-inputtext-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-text-muted">{t('minBooking')}</label>
                                <InputNumber value={venueForm.minBookingHours} onValueChange={e => setVenueForm({ ...venueForm, minBookingHours: e.value })} min={0.5} max={12} step={0.5} showButtons className="p-inputtext-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-text-muted">{t('maxBooking')}</label>
                                <InputNumber value={venueForm.maxBookingHours} onValueChange={e => setVenueForm({ ...venueForm, maxBookingHours: e.value })} min={1} max={24} step={0.5} showButtons className="p-inputtext-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="m-0 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#eb79b2] mt-4">{t('venueBranding')}</h4>
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('uploadCustomImage')}</label>
                            <ImageUpload
                                label=""
                                currentImage={venueForm.featuredImage}
                                onUpload={(url) => setVenueForm({ ...venueForm, featuredImage: url })}
                            />
                            <p className="text-[10px] text-gray-500 text-center m-0 uppercase tracking-widest">- {t('orLabel')} {t('selectStockImage')} -</p>
                        </div>

                        <ImagePicker
                            label=""
                            images={STOCK_IMAGES}
                            selectedImage={venueForm.featuredImage}
                            onSelect={(url) => setVenueForm({ ...venueForm, featuredImage: url })}
                        />
                    </div>

                    {currentUser.role === 'sysadmin' && (
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                            <label htmlFor="organization" className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('organizationOwner')}</label>
                            <Dropdown
                                id="organization"
                                value={venueForm.organizationId}
                                options={organizations.map(org => ({ label: org.name, value: org.id }))}
                                onChange={e => setVenueForm({ ...venueForm, organizationId: e.value })}
                                placeholder={t('selectOrganization')}
                                className="w-full h-11"
                                required
                            />
                        </div>
                    )}
                    <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                        <Button label={t('cancel')} icon="pi pi-times" outlined onClick={() => setIsVenueModalOpen(false)} className="h-11 px-6 font-bold" />
                        <Button label={editingVenue ? t('updateChanges') : t('createVenue')} icon="pi pi-check" type="submit" className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-wider rounded-lg" />
                    </div>
                </form>
            </Dialog>

            {/* Room Form Dialog */}
            <Dialog
                header={editingRoom ? `${t('editRoom')}: ${editingRoom.name}` : t('addRoom')}
                visible={isRoomModalOpen}
                className="w-full max-w-[95vw] sm:max-w-[750px]"
                modal
                onHide={() => setIsRoomModalOpen(false)}
            >
                <div className="flex flex-col gap-6 py-2">
                    <form onSubmit={handleSaveRoom} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('roomReferenceName')}</label>
                            <InputText value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} required className="h-11 shadow-sm" placeholder={t('roomRefPlaceholder')} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('roomCategory')}</label>
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
                                className="h-11 shadow-sm"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('maxCapacity')}</label>
                            <InputNumber value={roomForm.capacity} onValueChange={e => setRoomForm({ ...roomForm, capacity: e.value })} min={1} max={50} showButtons className="h-11 shadow-sm" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('ratePerHour')}</label>
                            <InputNumber value={roomForm.hourlyRate} onValueChange={e => setRoomForm({ ...roomForm, hourlyRate: e.value })} mode="currency" currency="MNT" locale="mn-MN" className="h-11 shadow-sm" required />
                        </div>
                        <div className="flex items-center gap-3">
                            <Checkbox inputId="bookingEnabled" checked={roomForm.isBookingEnabled} onChange={e => setRoomForm({ ...roomForm, isBookingEnabled: e.checked })} />
                            <label htmlFor="bookingEnabled" className="text-sm font-bold text-white cursor-pointer">{t('enableOnlineBooking')}</label>
                        </div>
                        <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/5 mt-2">
                            <h4 className="m-0 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#eb79b2]">{t('roomPresentation')}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="font-bold text-[10px] uppercase tracking-wider text-text-muted ml-1">{t('promotionImage')}</label>
                                    <ImageUpload
                                        label=""
                                        currentImage={roomForm.images[0]}
                                        onUpload={(url) => setRoomForm({ ...roomForm, images: [url] })}
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 text-center mb-3 uppercase tracking-widest">- OR STOCK GALLERY -</p>
                                    <ImagePicker
                                        label=""
                                        images={STOCK_IMAGES}
                                        selectedImage={roomForm.images[0]}
                                        onSelect={(url) => setRoomForm({ ...roomForm, images: [url] })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-4 border-t border-white/5">
                            <h4 className="m-0 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#eb79b2]">{t('roomAmenities')}</h4>
                            <MultiSelect
                                value={roomForm.roomFeatureIds}
                                options={roomFeatures}
                                onChange={(e) => setRoomForm({ ...roomForm, roomFeatureIds: e.value })}
                                optionLabel="name"
                                optionValue="id"
                                placeholder={t('selectAmenities')}
                                className="w-full h-11 shadow-sm"
                                display="chip"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                            <Button label={t('cancel')} icon="pi pi-times" outlined onClick={() => setIsRoomModalOpen(false)} className="h-11 px-6 font-bold" />
                            <Button label={editingRoom ? t('updateChanges') : t('addRoom')} icon="pi pi-check" type="submit" className="h-11 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-black uppercase tracking-wider rounded-lg" />
                        </div>
                    </form>

                    {/* Advanced Dynamic Pricing — OUTSIDE form to prevent form submit conflicts */}
                    {editingRoom && (
                        <div className="mt-8 pt-8 border-t-2 border-dashed border-white/10">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#eb79b2]/10 flex items-center justify-center">
                                        <i className="pi pi-calendar text-[#eb79b2] text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 className="m-0 text-lg font-bold text-white">{t('advancedPricing')}</h3>
                                        <p className="m-0 text-xs text-gray-500">{t('seasonalOverride')}</p>
                                    </div>
                                </div>
                                <Dropdown
                                    value={pricingForm.isSpecificDate}
                                    options={[
                                        { label: `🔄 ${t('happyHourRecurring')}`, value: false },
                                        { label: `📌 ${t('specificDate')}`, value: true }
                                    ]}
                                    onChange={(e) => setPricingForm({ ...pricingForm, isSpecificDate: e.value })}
                                    className="h-10 text-sm w-56"
                                />
                            </div>

                            {/* Add Rule Form */}
                            <div className="bg-white/5 p-5 rounded-xl border border-white/5 mb-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {!pricingForm.isSpecificDate ? (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('applyTo')}</label>
                                            <Dropdown
                                                value={pricingForm.dayType}
                                                options={[
                                                    { label: t('everyday'), value: 'EVERYDAY' },
                                                    { label: t('weekdays'), value: 'WEEKDAY' },
                                                    { label: t('weekends'), value: 'WEEKEND' }
                                                ]}
                                                onChange={e => setPricingForm({ ...pricingForm, dayType: e.value })}
                                                className="h-10"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('dateRange')}</label>
                                            <Calendar
                                                value={pricingForm.dateRange}
                                                onChange={e => setPricingForm({ ...pricingForm, dateRange: e.value })}
                                                selectionMode="range"
                                                readOnlyInput
                                                placeholder={t('selectDates')}
                                                className="h-10"
                                                showIcon
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('startTime')}</label>
                                        <InputText type="time" value={pricingForm.startTime} onChange={e => setPricingForm({ ...pricingForm, startTime: e.target.value })} className="h-10" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('endTime')}</label>
                                        <InputText type="time" value={pricingForm.endTime} onChange={e => setPricingForm({ ...pricingForm, endTime: e.target.value })} className="h-10" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('specialRatePerHour')}</label>
                                        <InputNumber value={pricingForm.pricePerHour} onValueChange={e => setPricingForm({ ...pricingForm, pricePerHour: e.value })} mode="currency" currency="MNT" locale="mn-MN" className="h-10" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider" title={t('priorityLabel')}>{t('priority')}</label>
                                        <InputNumber value={pricingForm.priority} onValueChange={e => setPricingForm({ ...pricingForm, priority: e.value })} className="h-10" min={0} max={100} showButtons />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            label={t('addPricingRule')}
                                            icon="pi pi-plus"
                                            type="button"
                                            onClick={() => handleAddPricing(editingRoom.id)}
                                            className="h-10 w-full bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Existing Rules Table — use live data from selectedVenue instead of stale editingRoom */}
                            <DataTable
                                value={(() => {
                                    const liveRoom = selectedVenue?.rooms?.find(r => r.id === editingRoom.id);
                                    const rawList = liveRoom?.pricing || liveRoom?.pricingRules || editingRoom.pricing || editingRoom.pricingRules || [];
                                    return [...rawList].sort((a, b) => (b.priority || 0) - (a.priority || 0));
                                })()}
                                className="pricing-datatable text-sm"
                                emptyMessage={t('noPricingRules')}
                            >
                                <Column header={t('schedule')} body={(rowData) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">
                                            {rowData.isHoliday ? t('holidayEvent') : rowData.dayType}
                                        </span>
                                        <span className="text-gray-500 text-xs">
                                            {rowData.startTime} — {rowData.endTime}
                                        </span>
                                    </div>
                                )} />
                                <Column header={t('dates')} body={(rowData) => rowData.startDateTime ?
                                    `${new Date(rowData.startDateTime).toLocaleDateString()} — ${new Date(rowData.endDateTime).toLocaleDateString()}`
                                    : t('recurring')} />
                                <Column header={t('rate')} body={(rowData) => (
                                    <span className="font-black text-[#4CAF50]">{rowData.pricePerHour.toLocaleString()}₮</span>
                                )} />
                                <Column header={t('priority')} body={(rowData) => (
                                    <Tag value={`#${rowData.priority}`} severity="info" className="text-xs" />
                                )} />
                                <Column body={(rowData) => (
                                    <Button
                                        icon="pi pi-trash"
                                        text
                                        severity="danger"
                                        size="small"
                                        onClick={() => handleDeletePricing(rowData.id)}
                                    />
                                )} />
                            </DataTable>
                        </div>
                    )}
                </div>
            </Dialog>

            <Dialog header="Room Types & Features Configuration" visible={isConfigModalOpen} className="w-full max-w-[95vw] lg:max-w-[1000px]" modal onHide={() => setIsConfigModalOpen(false)}>
                <RoomConfiguration />
            </Dialog>
        </div>
    );
};

export default VenueManagement;
