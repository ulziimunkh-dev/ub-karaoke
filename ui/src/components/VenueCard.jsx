import React from 'react';
import { formatDistance } from '../utils/geolocation';
import { useLanguage } from '../contexts/LanguageContext';
import { isVenueOpen, formatTimeRange, getCurrentDayName, getOpeningHoursMap } from '../utils/time';

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

    const isOpen = isVenueOpen(venue.openingHours);

    return (
        <div className={`group bg-[#151521] rounded-2xl overflow-hidden border border-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] relative flex flex-col h-full ${!isOpen ? 'opacity-80 grayscale-[0.8]' : ''}`}>

            {/* Image Section */}
            <div className="relative h-40 md:h-56 overflow-hidden">
                <img src={featuredImage} alt={venue.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

                {/* Badges */}
                <div className="absolute top-3 left-3 bg-[#a000ff] tag-responsive rounded text-white font-bold shadow-md">
                    {distance ? `${formatDistance(distance)} ${t('away')}` : '2.4km'}
                </div>

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md tag-responsive rounded font-medium text-white/90">
                    {venue.district}
                </div>

                {/* Closed Overlay */}
                {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] z-10">
                        <div className="bg-black/80 text-white px-4 py-1.5 rounded-full font-bold border border-white/20 text-sm">
                            ({t('closed')})
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-3 md:p-5 flex flex-col flex-grow relative">
                {/* Name & Rating */}
                <div className="flex justify-between items-start mb-0.5">
                    <h3 className="text-base md:text-xl font-bold text-white tracking-tight line-clamp-1">
                        {venue.name}
                    </h3>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 bg-[#b000ff]/10 px-2 py-0.5 rounded border border-[#b000ff]/20">
                            <span className="text-[#eb79b2] text-xs">★</span>
                            <span className="font-bold text-[#eb79b2] text-xs">{Number(venue.rating || 0).toFixed(1)}</span>
                        </div>
                        {venue.totalReviews && (
                            <span className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-tighter">
                                {venue.totalReviews} {t('reviewsCount')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Subtext info */}
                <div className="flex flex-col gap-0.5 mb-3">
                    <p className="text-gray-400 text-xs truncate m-0 font-medium">{venue.address || venue.district}</p>
                </div>

                {/* Working Hours Info */}
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 bg-white/5 px-2 md:px-3 py-1.5 md:py-2 rounded-xl border border-white/5">
                    <span className="text-base md:text-xl">🕒</span>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">{t('workingHours')}</span>
                        <span className="text-white text-xs font-bold leading-none">
                            {(() => {
                                try {
                                    const hoursMap = getOpeningHoursMap(venue.operatingHours || venue.openingHours);
                                    const day = getCurrentDayName();
                                    const range = hoursMap[day] || hoursMap['Daily'];
                                    return range ? formatTimeRange(range) : '10:00AM-04:00AM';
                                } catch (e) {
                                    return '10:00AM-04:00AM';
                                }
                            })()}
                        </span>
                    </div>
                </div>

                {/* Info Chips (Status) */}
                <div className={`mb-4 px-4 py-2 rounded-lg text-xs font-black border flex items-center gap-2.5 transition-colors ${isOpen ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <span className="relative flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    {isOpen ? t('openNow') : t('venueClosed')}
                </div>

                {/* Price & Capacity Row */}
                <div className="mt-auto flex justify-between items-end mb-5">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">{t('capacity')}</span>
                        <span className="text-white font-medium text-sm">Up to {maxCapacity}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('from')}</div>
                        <div className="text-highlight text-base md:text-xl leading-none">
                            {minPrice ? minPrice.toLocaleString() + '₮' : venue.priceRange}
                            <span className="text-[10px] ml-0.5 font-bold opacity-80 text-gray-500">{t('perHourShort')}</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    className={`w-full h-10 md:h-12 rounded-full font-bold text-sm md:text-base transition-all duration-300 transform active:scale-[0.98] uppercase tracking-tighter flex items-center justify-center gap-2 ${venue.isBookingEnabled === false || (!isOpen && venue.isBookingEnabled !== false)
                        ? 'bg-transparent border border-white/10 text-gray-500 cursor-not-allowed'
                        : 'bg-neon-purple-pattern text-white shadow-[0_0_20px_rgba(176,0,255,0.3)] hover:shadow-[0_0_30px_rgba(176,0,255,0.5)]'
                        }`}
                    onClick={() => (isOpen || venue.isBookingEnabled === false) && onBook(venue)}
                    disabled={!isOpen && venue.isBookingEnabled !== false}
                >
                    {venue.isBookingEnabled === false ? t('viewDetails') : (!isOpen ? t('closed') : t('bookNow'))}
                </button>
            </div>
        </div>
    );
};

export default VenueCard;
