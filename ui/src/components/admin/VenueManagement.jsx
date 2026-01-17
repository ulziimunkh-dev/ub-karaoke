import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { MultiSelect } from 'primereact/multiselect';
import RoomConfiguration from './RoomConfiguration';

// Import local stock images for the gallery
import imgMinimal from '../../assets/defaults/karaoke_minimal.png';
import imgStandard from '../../assets/defaults/karaoke_standard.png';
import imgVIP from '../../assets/defaults/karaoke_vip.png';
import imgParty from '../../assets/defaults/karaoke_party.png';

const STOCK_IMAGES = [
    { id: 'standard', url: imgStandard, label: 'Standard Room' },
    { id: 'vip', url: imgVIP, label: 'VIP Lounge' },
    { id: 'party', url: imgParty, label: 'Party Hall' },
    { id: 'minimal', url: imgMinimal, label: 'Minimal/Small' }
];

const ImagePicker = ({ selectedImage, onSelect, label }) => {
    return (
        <div className="mb-5">
            <label className="block mb-2 text-sm text-text-muted font-medium">{label}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STOCK_IMAGES.map(img => (
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
    const { venues, updateVenue, addVenue, deleteVenue, addRoom, updateRoom, deleteRoom, updateRoomStatus, updateRoomSortOrders, currentUser, organizations, roomTypes, roomFeatures } = useData();
    const { t } = useLanguage();
    const toast = useRef(null);

    // Venue Modal State
    const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null); // If null, adding new. If set, editing.
    const [venueForm, setVenueForm] = useState({
        name: '',
        district: 'Sukhbaatar',
        openHours: '10:00 - 04:00',
        address: '',
        description: '',
        phone: '',
        priceRange: '$$',
        featuredImage: imgStandard,
        bookingWindowStart: '',
        bookingWindowEnd: '',
        advanceBookingDays: 3,
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
        roomFeatureIds: [] // New features selection
    });

    const selectedVenue = venues?.find(v => v.id === selectedVenueId); // Safe access

    // --- VENUE HANDLERS ---
    const openAddVenue = () => {
        setEditingVenue(null);
        setVenueForm({
            name: '',
            district: 'Sukhbaatar',
            openHours: '10:00 - 04:00',
            address: '',
            description: '',
            phone: '',
            priceRange: '$$',
            featuredImage: imgStandard,
            bookingWindowStart: '',
            bookingWindowEnd: '',
            advanceBookingDays: 3
        });
        setIsVenueModalOpen(true);
    };

    const openEditVenue = (venue) => {
        setEditingVenue(venue);
        // Handle openHours object vs string
        let hoursStr = venue.openHours;
        if (venue.openingHours && typeof venue.openingHours === 'object') {
            const days = Object.keys(venue.openingHours);
            if (days.length > 0) {
                hoursStr = venue.openingHours[days[0]].replace('-', ' - ');
            }
        } else if (typeof venue.openHours === 'object') {
            hoursStr = `${venue.openHours.start} - ${venue.openHours.end} `;
        }

        setVenueForm({
            name: venue.name,
            district: venue.district,
            openHours: hoursStr || '10:00 - 04:00',
            address: venue.address || '',
            description: venue.description || '',
            phone: venue.phone || '',
            priceRange: venue.priceRange || '$$',
            featuredImage: venue.featuredImage || venue.image || imgStandard,
            bookingWindowStart: venue.bookingWindowStart || '',
            bookingWindowEnd: venue.bookingWindowEnd || '',
            advanceBookingDays: venue.advanceBookingDays || 3,
            organizationId: venue.organizationId || ''
        });
        setIsVenueModalOpen(true);
    };

    const handleSaveVenue = (e) => {
        e.preventDefault();

        // Transform venueForm to match API DTO
        const hours = venueForm.openHours.replace(/\s/g, '');
        const openingHoursObj = {
            "Monday": hours,
            "Tuesday": hours,
            "Wednesday": hours,
            "Thursday": hours,
            "Friday": hours,
            "Saturday": hours,
            "Sunday": hours
        };

        const venueData = {
            name: venueForm.name,
            district: venueForm.district,
            description: venueForm.description || "Premium karaoke experience in Ulaanbaatar.",
            phone: venueForm.phone || "+976 99000000",
            priceRange: venueForm.priceRange,
            openingHours: openingHoursObj,
            address: venueForm.address,
            organizationId: venueForm.organizationId || currentUser.organizationId,
            amenities: JSON.stringify(["WiFi", "AC", "Premium sound"]),
            images: JSON.stringify([venueForm.featuredImage]),
            featuredImage: venueForm.featuredImage,
            bookingWindowStart: venueForm.bookingWindowStart || null,
            bookingWindowEnd: venueForm.bookingWindowEnd || null,
            advanceBookingDays: venueForm.advanceBookingDays || 3
        };

        if (editingVenue) {
            updateVenue(editingVenue.id, venueData);
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Venue updated successfully' });
        } else {
            addVenue(venueData);
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Venue added successfully' });
        }
        setIsVenueModalOpen(false);
    };

    const handleDeleteVenue = (venueId) => {
        confirmDialog({
            message: t('areYouSure'),
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                deleteVenue(venueId);
                toast.current.show({ severity: 'success', summary: 'Deleted', detail: 'Venue removed successfully' });
            }
        });
    };

    const handleToggleStatus = (venue) => {
        const newIsActive = !venue.isActive;
        updateVenueStatus(venue.id, newIsActive);
        toast.current.show({
            severity: 'info',
            summary: 'Status Updated',
            detail: `Venue marked as ${newIsActive ? 'active' : 'inactive'}`
        });
    };

    // --- ROOM HANDLERS ---
    const handleManageRooms = (venue) => {
        setSelectedVenueId(venue.id);
        setEditingRoom(null);
        setRoomForm({
            name: '',
            type: 'Standard',
            capacity: 6,
            hourlyRate: 40000,
            images: [imgStandard]
        });
        setIsRoomModalOpen(true);
    };

    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name,
            roomTypeId: room.roomTypeId || (roomTypes.find(t => t.name === room.type)?.id), // Try to match by ID or name fallback
            capacity: room.capacity,
            hourlyRate: room.hourlyRate || room.pricePerHour, // Handle both for safety during transition
            images: (room.images && room.images.length > 0) ? room.images : [imgStandard],
            roomFeatureIds: room.roomFeatures?.map(f => f.id) || []
        });
    };

    const handleSaveRoom = (e) => {
        e.preventDefault();
        if (!selectedVenue) return;

        if (editingRoom) {
            updateRoom(selectedVenue.id, editingRoom.id, roomForm);
            setEditingRoom(null); // Reset to add mode
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Room updated' });
        } else {
            addRoom(selectedVenue.id, roomForm);
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Room added' });
        }
        // Reset form keeping defaults or clear?
        setRoomForm({
            name: '',
            roomTypeId: null,
            capacity: 6,
            hourlyRate: 40000,
            images: [imgStandard],
            roomFeatureIds: []
        });
    };

    const handleDeleteRoom = (roomId) => {
        confirmDialog({
            message: t('areYouSure'),
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                deleteRoom(selectedVenue.id, roomId);
                toast.current.show({ severity: 'success', summary: 'Deleted', detail: 'Room removed' });
            }
        });
    };

    const handleRowReorder = async (e) => {
        // e.value is the new reordered array
        const newOrder = e.value.map((room, index) => ({
            roomId: room.id,
            sortOrder: index + 1
        }));
        try {
            await updateRoomSortOrders(selectedVenue.id, newOrder);
            toast.current.show({ severity: 'success', summary: 'Sorted', detail: 'Room order updated' });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update order' });
        }
    };

    const roomRateBody = (rowData) => {
        return (rowData.hourlyRate || rowData.pricePerHour || 0).toLocaleString() + '₮';
    };

    const roomStatusBody = (rowData) => {
        const isActive = rowData.isActive !== false; // Default to active if undefined
        return (
            <div className="flex items-center gap-2">
                <Button
                    icon={isActive ? "pi pi-check-circle" : "pi pi-times-circle"}
                    severity={isActive ? "success" : "danger"}
                    rounded
                    text
                    size="small"
                    onClick={() => updateRoomStatus(selectedVenue.id, rowData.id, !isActive)}
                    tooltip={isActive ? 'Deactivate Room' : 'Activate Room'}
                />
                <span className={`text-xs ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {isActive ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                </span>
            </div>
        );
    };

    const roomActionsBody = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    size="small"
                    onClick={() => handleEditRoom(rowData)}
                />
                <Button
                    icon="pi pi-trash"
                    rounded
                    outlined
                    severity="danger"
                    size="small"
                    onClick={() => handleDeleteRoom(rowData.id)}
                />
            </div>
        );
    };

    const displayVenues = currentUser.role === 'sysadmin'
        ? venues
        : venues.filter(v => v.organizationId === currentUser.organizationId);


    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold m-0">{t('venueManagement')}</h2>
                <div className="flex gap-2">
                    {['sysadmin', 'admin'].includes(currentUser.role) && (
                        <Button
                            label="Room Settings"
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

            <div className="grid gap-4">
                {displayVenues.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <p>No venues found. Add a new branch to get started.</p>
                    </div>
                )}
                {displayVenues.map(venue => {
                    // Safe render openHours
                    const openHoursDisplay = typeof venue.openHours === 'object'
                        ? `${venue.openHours.start} - ${venue.openHours.end}`
                        : venue.openHours;

                    return (
                        <div key={venue.id} className="bg-white/5 p-4 sm:p-5 rounded-xl transition-all duration-300 hover:bg-white/[0.08]" style={{ borderLeft: `6px solid ${venue.isActive === false ? '#ef4444' : '#22c55e'}` }}>
                            <div className="flex flex-col lg:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <h3 className={`text-xl sm:text-2xl font-bold m-0 ${venue.isActive === false ? 'text-gray-500' : 'text-white'}`}>
                                            {venue.name}
                                        </h3>
                                        {venue.isActive === false && <Tag value={t('inactive') || 'Inactive'} severity="danger" className="ml-2" />}
                                        <Button
                                            icon="pi pi-pencil"
                                            onClick={() => openEditVenue(venue)}
                                            text
                                            rounded
                                            className="ml-auto lg:ml-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                        />
                                    </div>
                                    <p className="text-gray-400 my-2 text-sm">{venue.district} • {openHoursDisplay}</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <span className="text-xs sm:text-sm font-bold uppercase text-gray-400">{t('rooms')}: {venue.rooms.length}</span>
                                        <div className="flex gap-1 flex-wrap">
                                            {venue.rooms?.slice(0, 5).map(room => (
                                                <Tag key={room.id} value={room.name} severity={room.isActive === false ? 'danger' : 'info'} style={{ fontSize: '0.7rem' }} />
                                            ))}
                                            {venue.rooms?.length > 5 && <span className="text-xs text-gray-500">+{venue.rooms.length - 5}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col lg:flex-row gap-2 items-center">
                                    <Button
                                        label={t('manageRooms')}
                                        icon="pi pi-building"
                                        onClick={() => handleManageRooms(venue)}
                                        className="w-full lg:w-auto bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-bold hover:shadow-[0_0_15px_rgba(176,0,255,0.5)] transition-all duration-300"
                                    />
                                    <div className="flex gap-2 w-full lg:w-auto">
                                        <Button
                                            label={venue.isActive === false ? (t('reOpen') || 'Activate') : (t('closeBranch') || 'Deactivate')}
                                            icon={venue.isActive === false ? "pi pi-play" : "pi pi-pause"}
                                            severity={venue.isActive === false ? "success" : "warning"}
                                            outlined
                                            onClick={() => handleToggleStatus(venue)}
                                            className="flex-1 lg:flex-none"
                                        />
                                        <Button
                                            icon="pi pi-trash"
                                            severity="danger"
                                            outlined
                                            onClick={() => handleDeleteVenue(venue.id)}
                                            className=""
                                            tooltip={t('delete')}
                                            tooltipOptions={{ position: 'top' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Venue Add/Edit Dialog */}
            <Dialog header={editingVenue ? 'Edit Venue' : 'Add Venue'} visible={isVenueModalOpen} className="w-full max-w-[95vw] sm:max-w-[500px]" modal onHide={() => setIsVenueModalOpen(false)}>
                <form onSubmit={handleSaveVenue} className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-sm text-text-muted">Venue Name</label>
                        <InputText value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} required />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-sm text-text-muted">District</label>
                        <Dropdown value={venueForm.district} options={[
                            'Sukhbaatar', 'Chingeltei', 'Bayangol', 'Bayanzurkh', 'Khan-Uul', 'Songinokhairkhan'
                        ]} onChange={e => setVenueForm({ ...venueForm, district: e.value })} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-sm text-text-muted">Description</label>
                        <InputTextarea value={venueForm.description} onChange={e => setVenueForm({ ...venueForm, description: e.target.value })} required rows={2} autoResize />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-bold text-sm text-text-muted">Phone</label>
                        <InputText value={venueForm.phone} onChange={e => setVenueForm({ ...venueForm, phone: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 flex flex-col gap-2">
                            <label className="font-bold text-sm text-text-muted">Open Hours</label>
                            <InputText value={venueForm.openHours} onChange={e => setVenueForm({ ...venueForm, openHours: e.target.value })} placeholder="10:00 - 04:00" required />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-bold text-sm text-text-muted">Price</label>
                            <Dropdown value={venueForm.priceRange} options={['$', '$$', '$$$', '$$$$']} onChange={e => setVenueForm({ ...venueForm, priceRange: e.value })} />
                        </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg">
                        <h4 className="m-0 mb-3 text-xs font-bold uppercase text-gray-400">Booking Setup</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-text-muted">Allowed Start Time</label>
                                <InputText type="time" value={venueForm.bookingWindowStart || ''} onChange={e => setVenueForm({ ...venueForm, bookingWindowStart: e.target.value })} className="p-inputtext-sm" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-text-muted">Allowed End Time</label>
                                <InputText type="time" value={venueForm.bookingWindowEnd || ''} onChange={e => setVenueForm({ ...venueForm, bookingWindowEnd: e.target.value })} className="p-inputtext-sm" />
                            </div>
                            <div className="sm:col-span-2 flex flex-col gap-1">
                                <label className="text-xs text-text-muted">Max Advance Booking (Days)</label>
                                <InputNumber value={venueForm.advanceBookingDays} onValueChange={e => setVenueForm({ ...venueForm, advanceBookingDays: e.value })} min={1} max={30} showButtons className="p-inputtext-sm" />
                            </div>
                        </div>
                    </div>

                    <ImagePicker
                        label="Venue Featured Image"
                        selectedImage={venueForm.featuredImage}
                        onSelect={(url) => setVenueForm({ ...venueForm, featuredImage: url })}
                    />

                    {currentUser.role === 'sysadmin' && (
                        <div className="field grid grid-cols-1">
                            <label htmlFor="organization" className="block text-sm font-semibold text-text-muted mb-2">Organization</label>
                            <Dropdown
                                id="organization"
                                value={venueForm.organizationId}
                                options={organizations.map(org => ({ label: org.name, value: org.id }))}
                                onChange={e => setVenueForm({ ...venueForm, organizationId: e.value })}
                                placeholder="Select Organization"
                                className="w-full h-10 bg-white border-0 rounded-lg text-sm"
                                required
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-8">
                        <Button label="Cancel" icon="pi pi-times" outlined onClick={() => setIsVenueModalOpen(false)} className="h-10 px-6" />
                        <Button label={editingVenue ? "Update Venue" : "Create Venue"} icon="pi pi-check" type="submit" className="h-10 px-8 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-bold" />
                    </div>
                </form>
            </Dialog>

            {/* Room Management Dialog */}
            <Dialog header={`${t('manageRooms')}: ${selectedVenue?.name}`} visible={isRoomModalOpen} className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-[800px]" modal onHide={() => setIsRoomModalOpen(false)}>
                <div className="flex flex-col gap-4">
                    <div className="overflow-x-auto">
                        <DataTable
                            value={selectedVenue?.rooms}
                            className="mt-2"
                            reorderableRows
                            onRowReorder={handleRowReorder}
                            dataKey="id"
                        >
                            <Column rowReorder style={{ width: '3rem' }} />
                            <Column field="name" header={t('roomName')}></Column>
                            <Column header="Type" body={(rowData) => rowData.roomType?.name || rowData.type}></Column>
                            <Column field="capacity" header={t('capacity')}></Column>
                            <Column header="Features" body={(rowData) => (
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {rowData.roomFeatures?.map(f => (
                                        <Tag key={f.id} value={f.name} severity="info" className="text-[10px]" />
                                    ))}
                                    {(!rowData.roomFeatures || rowData.roomFeatures.length === 0) && (
                                        <span className="text-xs text-gray-500 italic">No features</span>
                                    )}
                                </div>
                            )}></Column>
                            <Column header={t('total')} body={roomRateBody}></Column>
                            <Column header="Status" body={roomStatusBody}></Column>
                            <Column header={t('actions')} body={roomActionsBody}></Column>
                        </DataTable>
                    </div>

                    {/* Add/Edit Room Form */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg">
                        <h4 className="text-lg font-bold m-0 mb-4">{editingRoom ? 'Edit Room' : t('addRoom')}</h4>
                        <form onSubmit={handleSaveRoom} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-text-muted">{t('roomName')}</label>
                                <InputText value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} required />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-text-muted">Type</label>
                                <Dropdown
                                    value={roomForm.roomTypeId}
                                    options={roomTypes}
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Select Type"
                                    onChange={e => {
                                        // Auto-select image based on type name as a hint
                                        const type = roomTypes.find(t => t.id === e.value);
                                        let newImg = imgStandard;
                                        if (type?.name?.includes('VIP')) newImg = imgVIP;
                                        else if (type?.name?.includes('Party')) newImg = imgParty;
                                        else if (type?.name?.includes('Small') || type?.name?.includes('Minimal')) newImg = imgMinimal;

                                        setRoomForm({ ...roomForm, roomTypeId: e.value, images: [newImg] });
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-text-muted">Features</label>
                                <MultiSelect
                                    value={roomForm.roomFeatureIds}
                                    options={roomFeatures}
                                    optionLabel="name"
                                    optionValue="id"
                                    display="chip"
                                    placeholder="Select Features"
                                    onChange={(e) => setRoomForm({ ...roomForm, roomFeatureIds: e.value })}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-text-muted">{t('capacity')}</label>
                                <InputNumber value={roomForm.capacity} onValueChange={e => setRoomForm({ ...roomForm, capacity: e.value })} min={1} required showButtons />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-bold text-sm text-text-muted">{t('pricePerHour')}</label>
                                <InputNumber value={roomForm.hourlyRate} onValueChange={e => setRoomForm({ ...roomForm, hourlyRate: e.value })} mode="currency" currency="MNT" locale="mn-MN" required />
                            </div>
                            <div className="sm:col-span-2">
                                <ImagePicker
                                    label="Room Image"
                                    selectedImage={roomForm.images[0]}
                                    onSelect={(url) => setRoomForm({ ...roomForm, images: [url] })}
                                />
                            </div>
                            <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                                {editingRoom && (
                                    <Button
                                        type="button"
                                        label="Cancel"
                                        outlined
                                        onClick={() => {
                                            setEditingRoom(null);
                                            setEditingRoom(null);
                                            setRoomForm({ name: '', roomTypeId: null, capacity: 6, hourlyRate: 40000, images: [imgStandard], roomFeatureIds: [] });
                                        }}
                                    />
                                )}
                                <Button
                                    type="submit"
                                    label={editingRoom ? t('save') : t('addRoom')}
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </Dialog>



            <Dialog header="Room Types & Features Configuration" visible={isConfigModalOpen} className="w-full max-w-[95vw] lg:max-w-[1000px]" modal onHide={() => setIsConfigModalOpen(false)}>
                <RoomConfiguration />
            </Dialog>

        </div >
    );
};

export default VenueManagement;
