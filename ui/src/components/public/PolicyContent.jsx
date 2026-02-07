import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const PolicyContent = () => {
    const { t } = useLanguage();

    const sections = [
        { id: 1, title: 'acceptanceTerms', text: 'acceptanceText' },
        { id: 2, title: 'bookingCancellation', text: 'cancellationPolicy' },
        { id: 3, title: 'dataPrivacy', text: 'privacyText' },
        { id: 4, title: 'codeOfConduct', text: 'conductText' }
    ];

    return (
        <div className="space-y-6 md:space-y-8 py-2 md:py-4">
            <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[#b000ff] to-[#eb79b2] bg-clip-text text-transparent uppercase tracking-wider text-center mb-6 md:mb-8">
                {t('policyTitle')}
            </h2>

            <div className="space-y-6 md:space-y-8">
                {sections.map((section) => (
                    <section key={section.id} className="relative pl-10 md:pl-12">
                        <div className="absolute left-0 top-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-[0_0_15px_rgba(176,0,255,0.3)]">
                            {section.id}
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-white mb-1.5 md:mb-2 tracking-tight">
                            {t(section.title)}
                        </h3>
                        <p className="text-gray-400 text-xs md:text-sm leading-relaxed text-justify">
                            {t(section.text)}
                        </p>
                    </section>
                ))}
            </div>

            <div className="pt-6 md:pt-8 border-t border-white/5 text-center">
                <p className="text-[8px] md:text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium">
                    {t('lastUpdated')}
                </p>
            </div>
        </div>
    );
};

export default PolicyContent;
