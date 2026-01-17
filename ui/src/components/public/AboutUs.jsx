import React from 'react';
import Header from '../Header';
import { useLanguage } from '../../contexts/LanguageContext';

const AboutUs = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-[#0B0B15] text-white selection:bg-[#b000ff] selection:text-white flex flex-col">
            <Header />
            <div className="flex-1 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#eb79b2]/10 blur-[150px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#b000ff]/10 blur-[150px] rounded-full pointer-events-none" />

                <div className="max-w-5xl mx-auto px-4 py-20 relative z-10">
                    <div className="text-center mb-20">
                        <h1 className="text-6xl font-black tracking-tighter mb-6">
                            {t('aboutTitle')}
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            {t('aboutSubtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-white">{t('ourMission')}</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {t('missionText1')}
                            </p>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                {t('missionText2')}
                            </p>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] rounded-3xl transform rotate-3 blur-lg opacity-40"></div>
                            <div className="relative bg-[#1a1a24] p-8 rounded-3xl border border-white/10 shadow-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b000ff] to-[#eb79b2] flex items-center justify-center font-bold text-xl">
                                        UB
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">UB Karaoke Group</h3>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Est. 2024</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 w-3/4 bg-white/10 rounded-full"></div>
                                    <div className="h-2 w-full bg-white/10 rounded-full"></div>
                                    <div className="h-2 w-5/6 bg-white/10 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center text-white">
                        <div className="p-8 rounded-2xl bg-[#1a1a24]/40 border border-white/5 backdrop-blur-sm">
                            <i className="pi pi-users text-4xl text-[#b000ff] mb-4"></i>
                            <h3 className="text-xl font-bold mb-2">{t('communityFirst')}</h3>
                            <p className="text-gray-500">{t('communityDesc')}</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-[#1a1a24]/40 border border-white/5 backdrop-blur-sm">
                            <i className="pi pi-bolt text-4xl text-[#eb79b2] mb-4"></i>
                            <h3 className="text-xl font-bold mb-2">{t('innovation')}</h3>
                            <p className="text-gray-500">{t('innovationDesc')}</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-[#1a1a24]/40 border border-white/5 backdrop-blur-sm">
                            <i className="pi pi-check-circle text-4xl text-green-400 mb-4"></i>
                            <h3 className="text-xl font-bold mb-2">{t('reliability')}</h3>
                            <p className="text-gray-500">{t('reliabilityDesc')}</p>
                        </div>
                    </div>

                    <div className="mt-32 text-center border-t border-white/10 pt-20">
                        <h2 className="text-3xl font-bold mb-8">{t('getInTouch')}</h2>
                        <div className="flex flex-col md:flex-row justify-center gap-12 text-gray-400">
                            <div className="flex flex-col items-center">
                                <i className="pi pi-envelope mb-2 text-2xl text-white"></i>
                                <span>support@ubkaraoke.mn</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <i className="pi pi-phone mb-2 text-2xl text-white"></i>
                                <span>+976 7700-1234</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <i className="pi pi-map-marker mb-2 text-2xl text-white"></i>
                                <span>Central Tower, UB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
