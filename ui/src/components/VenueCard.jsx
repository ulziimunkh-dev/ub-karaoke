import React from 'react';
import { formatDistance } from '../utils/geolocation';
import { useLanguage } from '../contexts/LanguageContext';

// Import local default images
import default1 from '../assets/defaults/karaoke_standard.png';
import default2 from '../assets/defaults/karaoke_vip.png';
import default3 from '../assets/defaults/karaoke_party.png';
import default4 from '../assets/defaults/karaoke_minimal.png';

const VenueCard = ({ venue, onBook, distance }) => {
    const { t } = useLanguage();

    // Calculate price range (use rooms if available, otherwise use venue.priceRange)
    // Parse images if it's a string (depends on DB/API driver behavior)
    let images = venue.images;
    if (typeof images === 'string') {
        try {
            images = JSON.parse(images);
        } catch (e) {
            images = [];
        }
    }

    // Premium Local Default Images
    const DEFAULT_IMAGES = [default1, default2, default3, default4];

    // Pick a default based on venue ID so it stays consistent for the same venue
    const defaultImage = DEFAULT_IMAGES[venue.id % DEFAULT_IMAGES.length];

    const prices = venue.rooms?.map(r => r.hourlyRate) || [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    // Robust check for valid image URL or local asset path
    const isValidImage = (src) => {
        if (!src || typeof src !== 'string') return false;
        return src.startsWith('http') || src.startsWith('/assets/') || src.startsWith('/src/assets/') || src.startsWith('data:image/');
    };

    const featuredImage = isValidImage(venue.featuredImage)
        ? venue.featuredImage
        : (images && images.length > 0 && isValidImage(images[0]) ? images[0] : defaultImage);

    const priceDisplay = minPrice && maxPrice
        ? (minPrice === maxPrice
            ? `${minPrice.toLocaleString()}`
            : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`)
        : venue.priceRange;

    // Calculate max capacity
    const maxCapacity = venue.rooms?.length > 0
        ? Math.max(...venue.rooms.map(r => r.capacity))
        : '?';

    return (
        <div className="venue-card">
            <div className="card-image-wrapper">
                <img src={featuredImage} alt={venue.name} className="card-image" />
                <div className="card-badge">{venue.district}</div>
                {distance && <div className="distance-badge">{formatDistance(distance)} {t('away')}</div>}
            </div>
            <div className="card-content">
                <div className="card-header">
                    <h3 className="venue-name">{venue.name}</h3>
                    <div className="rating">⭐ {Number(venue.rating || 0).toFixed(1)}</div>
                </div>
                <p className="venue-address">{venue.address}</p>

                {venue.isBookingEnabled === false && (
                    <div style={{
                        background: 'rgba(233, 30, 99, 0.1)',
                        color: 'var(--color-accent)',
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        marginBottom: '10px',
                        fontWeight: '600',
                        border: '1px solid var(--color-accent)'
                    }}>
                        ⚠️ {t('onlineBookingDisabled')}
                    </div>
                )}

                <div className="venue-details">
                    <div className="venue-price">
                        <span className="label text-muted">{t('from')} </span>
                        {priceDisplay} {t('perHour')}
                    </div>
                    <div className="venue-capacity text-muted">
                        Max {maxCapacity} {t('capacity')}
                    </div>
                </div>

                <button
                    className={`btn ${venue.isBookingEnabled === false ? 'btn-outline' : 'btn-primary'} full-width`}
                    onClick={() => onBook(venue)}
                >
                    {venue.isBookingEnabled === false ? t('viewDetails') : t('bookNow')}
                </button>
            </div>
        </div>
    );
};

export default VenueCard;
