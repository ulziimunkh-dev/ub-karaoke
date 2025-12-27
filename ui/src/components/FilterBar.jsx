import React from 'react';
import { districts } from '../data/venues';
import { useLanguage } from '../contexts/LanguageContext';

const FilterBar = ({ onFilterChange, filters }) => {
    const { t, language } = useLanguage();

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ ...filters, [name]: value });
    };

    return (
        <div className="py-6 border-b border-white/5 mb-8 bg-[#0B0B15] sticky top-[80px] z-40">
            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Search */}
                <div className="w-full md:flex-1 md:min-w-[200px] relative">
                    <input
                        id="search-input"
                        type="text"
                        name="search"
                        placeholder={language === 'en' ? 'Search karaoke...' : 'Караоке хайх...'}
                        value={filters.search}
                        onChange={handleChange}
                        className="w-full h-11 bg-[#151521] border border-[#2A2A35] text-white px-4 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-[#b000ff] focus:ring-1 focus:ring-[#b000ff]/30 placeholder:text-gray-600"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                    <select
                        name="district"
                        value={filters.district}
                        onChange={handleChange}
                        className="h-11 bg-[#151521] border border-[#2A2A35] text-gray-300 px-4 rounded-lg cursor-pointer focus:outline-none focus:border-[#5d2cff] transition-all hover:border-[#3A3A45] text-sm appearance-none min-w-[120px]"
                    >
                        <option value="">{t('allDistricts')}</option>
                        {districts.map(d => (
                            <option key={d} value={d}>
                                {t(`district_${d.replace('-', '')}`)}
                            </option>
                        ))}
                    </select>

                    <select
                        name="rating"
                        value={filters.rating}
                        onChange={handleChange}
                        className="h-11 bg-[#151521] border border-[#2A2A35] text-gray-300 px-4 rounded-lg cursor-pointer focus:outline-none focus:border-[#5d2cff] transition-all hover:border-[#3A3A45] text-sm appearance-none min-w-[120px]"
                    >
                        <option value="0">{t('anyRating')}</option>
                        <option value="3">{t('stars3')}</option>
                        <option value="4">{t('stars4')}</option>
                        <option value="4.5">{t('stars45')}</option>
                    </select>

                    <button
                        className={`h-11 px-5 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center border ${filters.nearMe
                            ? 'bg-[#b000ff] border-white/20 text-white shadow-[0_0_25px_rgba(176,0,255,0.5)] scale-105 z-10'
                            : 'bg-[#151521] border-[#2A2A35] text-gray-400 hover:border-[#b000ff] hover:text-[#b000ff] hover:shadow-[0_0_15px_rgba(176,0,255,0.2)]'
                            }`}
                        onClick={() => onFilterChange({ ...filters, nearMe: !filters.nearMe })}
                    >
                        {t('nearMe')}
                    </button>

                    {/* Capacity Filter */}
                    <select
                        name="capacity"
                        value={filters.capacity}
                        onChange={handleChange}
                        className="h-11 bg-[#151521] border border-[#2A2A35] text-gray-300 px-4 rounded-lg cursor-pointer focus:outline-none focus:border-[#5d2cff] transition-all hover:border-[#3A3A45] text-sm appearance-none"
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
                        className={`h-11 px-5 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center border ${filters.partyCapable
                            ? 'bg-neon-purple-pattern border-white/20 text-white shadow-[0_0_25px_rgba(176,0,255,0.5)] scale-105 z-10'
                            : 'bg-[#151521] border-[#2A2A35] text-gray-400 hover:border-[#b000ff] hover:text-[#b000ff] hover:shadow-[0_0_15px_rgba(176,0,255,0.2)]'
                            }`}
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
