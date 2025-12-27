import React from 'react';
import VenueCard from './VenueCard';
import { useLanguage } from '../contexts/LanguageContext';

const VenueList = ({ venues = [], onBook, distances }) => {
    const { t } = useLanguage();

    if (!venues || venues.length === 0) {
        return (
            <div className="container mx-auto py-24 text-center text-text-muted flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease]">
                <div className="text-6xl mb-6 opacity-50 grayscale animate-pulse">🎤</div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('noVenues')}</h2>
                <p className="max-w-md mx-auto opacity-70">{t('noVenuesDesc') || 'Admin needs to add venues or try adjusting filters'}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
            {venues.map(venue => (
                <VenueCard
                    key={venue.id}
                    venue={venue}
                    onBook={onBook}
                    distance={distances ? distances[venue.id] : null}
                />
            ))}
        </div>
    );
};

export default VenueList;
