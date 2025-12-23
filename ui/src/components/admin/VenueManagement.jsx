import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';

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
        <div className="image-picker" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.9rem', color: '#aaa' }}>{label}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {STOCK_IMAGES.map(img => (
                    <div
                        key={img.id}
                        onClick={() => onSelect(img.url)}
                        style={{
                            cursor: 'pointer',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: selectedImage === img.url ? '3px solid #E91E63' : '2px solid transparent',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}
                    >
                        <img src={img.url} alt={img.label} style={{ width: '100%', height: '60px', objectFit: 'cover' }} />
                        {selectedImage === img.url && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(233, 30, 99, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center'
                            }}>
                                <span style={{ color: 'white', fontSize: '1.2rem' }}>✓</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const VenueManagement = () => {
    const { venues, updateVenue, addVenue, deleteVenue, addRoom, updateRoom, deleteRoom } = useData();
    const { t } = useLanguage();

    // Safety check BEFORE derived state
    // DEBUGGING: Temporarily allowing render even if empty to see debug info
    // if (!venues || !Array.isArray(venues)) {
    //    return <div style={{ color: 'white', padding: '20px' }}>Loading Venues... (Status: {venues ? 'Invalid Data' : 'Not Loaded'})</div>;
    // }

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
        featuredImage: imgStandard
    });

    // Room Modal State
    const [selectedVenueId, setSelectedVenueId] = useState(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // Room Form State
    const [editingRoom, setEditingRoom] = useState(null); // If null, adding new.
    const [roomForm, setRoomForm] = useState({
        name: '',
        type: 'Standard',
        capacity: 6,
        hourlyRate: 40000,
        images: [imgStandard]
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
            hoursStr = `${venue.openHours.start} - ${venue.openHours.end}`;
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
            advanceBookingDays: venue.advanceBookingDays || 3
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
            amenities: [],
            images: [venueForm.featuredImage],
            featuredImage: venueForm.featuredImage,
            address: venueForm.address || "Ulaanbaatar, Mongolia",
            bookingWindowStart: venueForm.bookingWindowStart || null,
            bookingWindowEnd: venueForm.bookingWindowEnd || null,
            advanceBookingDays: venueForm.advanceBookingDays || 3
        };

        if (editingVenue) {
            updateVenue(editingVenue.id, venueData);
        } else {
            addVenue(venueData);
        }
        setIsVenueModalOpen(false);
    };

    const handleDeleteVenue = (venueId) => {
        if (window.confirm(t('areYouSure'))) {
            deleteVenue(venueId);
        }
    };

    const handleToggleStatus = (venue) => {
        updateVenue(venue.id, { closed: !venue.closed });
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
            type: room.type,
            capacity: room.capacity,
            hourlyRate: room.hourlyRate || room.pricePerHour, // Handle both for safety during transition
            images: (room.images && room.images.length > 0) ? room.images : [imgStandard]
        });
    };

    const handleSaveRoom = (e) => {
        e.preventDefault();
        if (!selectedVenue) return;

        if (editingRoom) {
            updateRoom(selectedVenue.id, editingRoom.id, roomForm);
            setEditingRoom(null); // Reset to add mode
        } else {
            addRoom(selectedVenue.id, roomForm);
        }
        // Reset form keeping defaults or clear?
        setRoomForm({
            name: '',
            type: 'Standard',
            capacity: 6,
            hourlyRate: 40000,
            images: [imgStandard]
        });
    };

    const handleDeleteRoom = (roomId) => {
        if (window.confirm(t('areYouSure')) && selectedVenue) {
            deleteRoom(selectedVenue.id, roomId);
        }
    };


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>{t('venueManagement')}</h2>
                <button className="btn btn-primary" onClick={openAddVenue}>{t('addBranch')}</button>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
                {venues.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
                        <p>No venues found. Add a new branch to get started.</p>
                    </div>
                )}
                {venues.map(venue => {
                    // Safe render openHours
                    const openHoursDisplay = typeof venue.openHours === 'object'
                        ? `${venue.openHours.start} - ${venue.openHours.end}`
                        : venue.openHours;

                    return (
                        <div key={venue.id} style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px', borderLeft: venue.closed ? '5px solid red' : '5px solid #4CAF50' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <h3 style={{ margin: 0, color: venue.closed ? '#888' : 'white' }}>
                                            {venue.name} {venue.closed && t('closed')}
                                        </h3>
                                        <button className="btn btn-text" onClick={() => openEditVenue(venue)} style={{ fontSize: '1.2rem', padding: '0 5px' }}>✎</button>
                                    </div>
                                    <p style={{ color: '#aaa', margin: '5px 0' }}>{venue.district} • {openHoursDisplay}</p>
                                    <p style={{ fontSize: '0.9rem' }}>{t('rooms')}: {venue.rooms.length}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-sm btn-outline" onClick={() => handleToggleStatus(venue)}>
                                        {venue.closed ? t('reOpen') : t('closeBranch')}
                                    </button>
                                    <button className="btn btn-sm btn-primary" onClick={() => handleManageRooms(venue)}>{t('manageRooms')}</button>
                                    <button className="btn btn-sm btn-outline" style={{ borderColor: 'red', color: 'red' }} onClick={() => handleDeleteVenue(venue.id)}>X</button>
                                </div>
                            </div>

                            {/* Compact Room List Preview */}
                            <div style={{ marginTop: '15px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {venue.rooms?.map(room => (
                                    <span key={room.id} style={{
                                        background: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                        border: '1px solid #444', color: room.status === 'Maintenance' ? 'orange' : 'white'
                                    }}>
                                        {room.name} {room.status === 'Maintenance' && '⚠️'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Venue Add/Edit Modal */}
            {isVenueModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#222', padding: '30px', borderRadius: '10px', width: '400px', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3>{editingVenue ? 'Edit Venue' : 'Add Venue'}</h3>
                            <button className="btn btn-text" onClick={() => setIsVenueModalOpen(false)}>X</button>
                        </div>
                        <form onSubmit={handleSaveVenue} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                placeholder="Venue Name"
                                value={venueForm.name}
                                onChange={e => setVenueForm({ ...venueForm, name: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}
                                required
                            />
                            <select
                                value={venueForm.district}
                                onChange={e => setVenueForm({ ...venueForm, district: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}
                            >
                                <option value="Sukhbaatar">Sukhbaatar</option>
                                <option value="Chingeltei">Chingeltei</option>
                                <option value="Bayangol">Bayangol</option>
                                <option value="Bayanzurkh">Bayanzurkh</option>
                                <option value="Khan-Uul">Khan-Uul</option>
                                <option value="Songinokhairkhan">Songinokhairkhan</option>
                            </select>
                            <input
                                placeholder="Description"
                                value={venueForm.description}
                                onChange={e => setVenueForm({ ...venueForm, description: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}
                                required
                            />
                            <input
                                placeholder="Phone (e.g., +976 99112233)"
                                value={venueForm.phone}
                                onChange={e => setVenueForm({ ...venueForm, phone: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}
                                required
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    placeholder="Open Hours (e.g., 10:00 - 04:00)"
                                    value={venueForm.openHours}
                                    onChange={e => setVenueForm({ ...venueForm, openHours: e.target.value })}
                                    style={{ flex: 2, padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}
                                    required
                                />
                                <select
                                    value={venueForm.priceRange}
                                    onChange={e => setVenueForm({ ...venueForm, priceRange: e.target.value })}
                                    style={{ flex: 1, padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px' }}
                                >
                                    <option value="$">$</option>
                                    <option value="$$">$$</option>
                                    <option value="$$$">$$$</option>
                                    <option value="$$$$">$$$$</option>
                                </select>
                            </div>

                            {/* Booking Configuration Section */}
                            <div style={{ background: '#333', padding: '15px', borderRadius: '5px' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ccc' }}>Booking Configuration (Optional)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#888' }}>Allowed Start Time</label>
                                        <input
                                            type="time"
                                            value={venueForm.bookingWindowStart || ''}
                                            onChange={e => setVenueForm({ ...venueForm, bookingWindowStart: e.target.value })}
                                            style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: '#888' }}>Allowed End Time</label>
                                        <input
                                            type="time"
                                            value={venueForm.bookingWindowEnd || ''}
                                            onChange={e => setVenueForm({ ...venueForm, bookingWindowEnd: e.target.value })}
                                            style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#888' }}>Max Advance Booking (Days)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Default: 3"
                                        value={venueForm.advanceBookingDays || ''}
                                        onChange={e => setVenueForm({ ...venueForm, advanceBookingDays: Number(e.target.value) })}
                                        style={{ width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '5px 0 0 0' }}>Creating limit for how many days in advance customers can book.</p>
                                </div>
                            </div>

                            <ImagePicker
                                label="Venue Featured Image"
                                selectedImage={venueForm.featuredImage}
                                onSelect={(url) => setVenueForm({ ...venueForm, featuredImage: url })}
                            />

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>{t('save')}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Room Management Modal */}
            {isRoomModalOpen && selectedVenue && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#222', padding: '30px', borderRadius: '10px', width: '700px', maxHeight: '80vh', overflowY: 'auto', color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3>{t('manageRooms')}: {selectedVenue.name}</h3>
                            <button className="btn btn-text" onClick={() => setIsRoomModalOpen(false)}>X</button>
                        </div>

                        {/* Existing Rooms List */}
                        <table style={{ width: '100%', marginBottom: '30px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>{t('roomName')}</th>
                                    <th style={{ padding: '10px' }}>Type</th>
                                    <th style={{ padding: '10px' }}>{t('capacity')}</th>
                                    <th style={{ padding: '10px' }}>{t('total')}</th>
                                    <th style={{ padding: '10px' }}>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedVenue.rooms.map(room => (
                                    <tr key={room.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '10px' }}>{room.name}</td>
                                        <td style={{ padding: '10px' }}>{room.type}</td>
                                        <td style={{ padding: '10px' }}>{room.capacity}</td>
                                        <td style={{ padding: '10px' }}>{room.hourlyRate?.toLocaleString()}₮</td>
                                        <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => handleEditRoom(room)}
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                ✎
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                style={{ color: 'red', borderColor: 'red' }}
                                                onClick={() => handleDeleteRoom(room.id)}
                                            >
                                                {t('delete')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Add/Edit Room Form */}
                        <h4 style={{ marginBottom: '15px' }}>{editingRoom ? 'Edit Room' : t('addRoom')}</h4>
                        <form onSubmit={handleSaveRoom} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <input
                                placeholder={t('roomName')}
                                value={roomForm.name}
                                onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                required
                            />
                            <select
                                value={roomForm.type}
                                onChange={e => {
                                    const newType = e.target.value;
                                    let newImg = imgStandard;
                                    if (newType === 'VIP') newImg = imgVIP;
                                    else if (newType === 'Party') newImg = imgParty;
                                    else if (newType === 'Small') newImg = imgMinimal;

                                    setRoomForm({ ...roomForm, type: newType, images: [newImg] });
                                }}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                            >
                                <option value="Standard">Standard</option>
                                <option value="VIP">VIP</option>
                                <option value="Party">Party</option>
                                <option value="Small">Small</option>
                                <option value="Themed">Themed</option>
                            </select>
                            <input
                                type="number"
                                placeholder={t('capacity')}
                                value={roomForm.capacity}
                                onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                required
                            />
                            <input
                                type="number"
                                placeholder={t('pricePerHour')}
                                value={roomForm.hourlyRate}
                                onChange={e => setRoomForm({ ...roomForm, hourlyRate: Number(e.target.value) })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                required
                            />
                            <div style={{ gridColumn: 'span 2' }}>
                                <ImagePicker
                                    label="Room Image"
                                    selectedImage={roomForm.images[0]}
                                    onSelect={(url) => setRoomForm({ ...roomForm, images: [url] })}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {editingRoom ? t('save') : t('addRoom')}
                                </button>
                                {editingRoom && (
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => {
                                            setEditingRoom(null);
                                            setRoomForm({ name: '', type: 'Standard', capacity: 6, hourlyRate: 40000 });
                                        }}
                                        style={{ width: '100px' }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VenueManagement;
