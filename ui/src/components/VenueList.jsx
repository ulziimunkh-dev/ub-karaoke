import React from 'react';
import VenueCard from './VenueCard';
import { useLanguage } from '../contexts/LanguageContext';

const VenueList = ({ venues = [], onBook, distances }) => {
    const { t } = useLanguage();

    if (!venues || venues.length === 0) {
        return (
            <div className="container no-results">
                <h2>{t('noVenues')}</h2>
            </div>
        );
    }

    return (
        <div className="container venue-list">
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
