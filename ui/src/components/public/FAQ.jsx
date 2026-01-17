import React, { useState } from 'react';
import Header from '../Header';
import { useLanguage } from '../../contexts/LanguageContext';

const FAQ = () => {
    const { t } = useLanguage();

    const items = [
        { header: t('faq1_q'), content: t('faq1_a') },
        { header: t('faq2_q'), content: t('faq2_a') },
        { header: t('faq3_q'), content: t('faq3_a') },
        { header: t('faq4_q'), content: t('faq4_a') },
        { header: t('faq5_q'), content: t('faq5_a') }
    ];

    return (
        <div className="min-h-screen bg-[#0B0B15] text-white selection:bg-[#b000ff] selection:text-white flex flex-col">
            <Header />
            <div className="flex-1 py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-black tracking-tighter mb-4 text-white">
                            {t('faqTitle')}
                        </h1>
                        <p className="text-gray-400">{t('faqSubtitle')}</p>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <FAQItem key={index} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FAQItem = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`
            rounded-2xl border transition-all duration-300 overflow-hidden
            ${isOpen ? 'bg-[#1a1a24] border-[#b000ff]/50 shadow-[0_0_20px_rgba(176,0,255,0.1)]' : 'bg-[#1a1a24]/40 border-white/10 hover:border-white/20'}
        `}>
            <button
                className="w-full text-left p-6 flex justify-between items-center focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`font-bold text-lg ${isOpen ? 'text-white' : 'text-gray-300'}`}>{item.header}</span>
                <i className={`pi pi-chevron-down transition-transform duration-300 text-[#b000ff] ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2">
                    {item.content}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
