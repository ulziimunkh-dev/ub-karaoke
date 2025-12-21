import React from 'react';
import { districts } from '../data/venues';
import { useLanguage } from '../contexts/LanguageContext';

const FilterBar = ({ onFilterChange, filters }) => {
    const { t } = useLanguage();

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="filter-bar">
            <div className="container filter-content">
                <div className="search-wrapper">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <input
                            id="search-input"
                            type="text"
                            name="search"
                            placeholder=" "
                            value={filters.search}
                            onChange={handleChange}
                            className="search-input"
                        />
                        <label htmlFor="search-input">{t('searchPlaceholder')}</label>
                    </div>
                </div>

                <div className="filter-group">
                    <select name="district" value={filters.district} onChange={handleChange} className="filter-select">
                        <option value="">{t('allDistricts')}</option>
                        {districts.map(d => (
                            <option key={d} value={d}>
                                {t(`district_${d.replace('-', '')}`)}
                            </option>
                        ))}
                    </select>


                    <select name="rating" value={filters.rating} onChange={handleChange} className="filter-select">
                        <option value="0">{t('anyRating')}</option>
                        <option value="3">{t('stars3')}</option>
                        <option value="4">{t('stars4')}</option>
                        <option value="4.5">{t('stars45')}</option>
                    </select>

                    <button
                        className={`btn ${filters.nearMe ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => onFilterChange({ ...filters, nearMe: !filters.nearMe })}
                    >
                        {t('nearMe')}
                    </button>

                    <select
                        name="capacity"
                        value={filters.capacity}
                        onChange={handleChange}
                        className="filter-select"
                        style={{ width: '130px' }}
                    >
                        <option value="">{t('filterCapacity')}</option>
                        <option value="1-5">1-5 {t('people')}</option>
                        <option value="6-10">6-10 {t('people')}</option>
                        <option value="11-15">11-15 {t('people')}</option>
                        <option value="16-20">16-20 {t('people')}</option>
                        <option value="21-25">21-25 {t('people')}</option>
                        <option value="25+">25+ {t('people')}</option>
                    </select>

                    <button
                        className={`btn ${filters.partyCapable ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => onFilterChange({ ...filters, partyCapable: !filters.partyCapable })}
                    >
                        {t('filterPartyCapable')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
