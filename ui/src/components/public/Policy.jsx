import React from 'react';
import Header from '../Header';
import { useLanguage } from '../../contexts/LanguageContext';

const Policy = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-[#0B0B15] text-white selection:bg-[#b000ff] selection:text-white flex flex-col">
            <Header />
            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-[#1a1a24] p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] left-0"></div>

                    <h1 className="text-3xl font-bold text-white mb-10 text-center tracking-wide uppercase">{t('policyTitle')}</h1>

                    <div className="space-y-10 text-gray-300">
                        <section className="group">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#b000ff]/20 text-[#b000ff] font-bold text-sm">1</span>
                                <h2 className="text-xl font-bold text-white group-hover:text-[#eb79b2] transition-colors">{t('acceptanceTerms')}</h2>
                            </div>
                            <p className="leading-relaxed pl-11 text-gray-400">
                                {t('acceptanceText')}
                            </p>
                        </section>

                        <section className="group">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#b000ff]/20 text-[#b000ff] font-bold text-sm">2</span>
                                <h2 className="text-xl font-bold text-white group-hover:text-[#eb79b2] transition-colors">{t('bookingCancellation')}</h2>
                            </div>
                            <p className="leading-relaxed pl-11 text-gray-400">
                                {t('cancellationPolicy')}
                            </p>
                        </section>

                        <section className="group">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#b000ff]/20 text-[#b000ff] font-bold text-sm">3</span>
                                <h2 className="text-xl font-bold text-white group-hover:text-[#eb79b2] transition-colors">{t('dataPrivacy')}</h2>
                            </div>
                            <p className="leading-relaxed pl-11 text-gray-400">
                                {t('privacyText')}
                            </p>
                        </section>

                        <section className="group">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#b000ff]/20 text-[#b000ff] font-bold text-sm">4</span>
                                <h2 className="text-xl font-bold text-white group-hover:text-[#eb79b2] transition-colors">{t('codeOfConduct')}</h2>
                            </div>
                            <p className="leading-relaxed pl-11 text-gray-400">
                                {t('conductText')}
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 text-center text-xs text-gray-600">
                        {t('lastUpdated')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Policy;
