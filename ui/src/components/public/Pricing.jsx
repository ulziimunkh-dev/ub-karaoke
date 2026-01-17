import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import Header from '../Header';
import { useLanguage } from '../../contexts/LanguageContext';

const Pricing = () => {
    const [plans, setPlans] = useState([]);
    const { t } = useLanguage();

    useEffect(() => {
        api.getPlans().then(setPlans).catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-[#0B0B15] text-white selection:bg-[#b000ff] selection:text-white flex flex-col">
            <Header />
            <div className="flex-1 flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#b000ff]/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="text-center max-w-3xl mb-16 relative z-10">
                    <h2 className="text-5xl font-black tracking-tighter sm:text-6xl mb-6">
                        {t('pricingTitle')}
                    </h2>
                    <p className="text-xl text-gray-400 font-medium">
                        {t('pricingSubtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl relative z-10">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`
                                relative flex flex-col p-8 rounded-3xl border transition-all duration-300 group
                                ${plan.code === 'GROWTH'
                                    ? 'bg-[#1a1a24]/80 border-[#b000ff] shadow-[0_0_40px_rgba(176,0,255,0.15)] scale-105 z-20'
                                    : 'bg-[#1a1a24]/40 border-white/10 hover:border-white/20 hover:bg-[#1a1a24]/60'
                                }
                            `}
                        >
                            {plan.code === 'GROWTH' && (
                                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                                    <span className="bg-gradient-to-r from-[#b000ff] to-[#eb79b2] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                        {t('mostPopular')}
                                    </span>
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-2xl font-bold text-white uppercase tracking-wide">{plan.name}</h3>
                                <p className="text-sm text-gray-400 mt-2 h-10">{plan.features?.description}</p>
                            </div>

                            <div className="my-8 flex items-baseline">
                                <span className="text-5xl font-black tracking-tighter text-white">
                                    {plan.monthlyFee === 0 ? 'Custom' : `₮${(plan.monthlyFee / 1000)}k`}
                                </span>
                                {plan.monthlyFee > 0 && <span className="ml-2 text-lg font-medium text-gray-500">{t('month')}</span>}
                            </div>

                            <div className="flex-1">
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <i className="pi pi-check-circle text-[#b000ff] mt-1 text-lg"></i>
                                        <span className="text-gray-300">
                                            {t('commission')}: <strong className="text-white">{plan.commissionRate}%</strong>
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <i className="pi pi-check-circle text-[#b000ff] mt-1 text-lg"></i>
                                        <span className="text-gray-300">
                                            {plan.maxBranches ? `${plan.maxBranches} ${t('branches')}` : t('unlimitedBranches')}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <i className="pi pi-check-circle text-[#b000ff] mt-1 text-lg"></i>
                                        <span className="text-gray-300">
                                            {plan.maxRooms ? t('upToRooms', { count: plan.maxRooms }) : t('unlimitedRooms')}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <i className="pi pi-check-circle text-[#b000ff] mt-1 text-lg"></i>
                                        <span className="text-gray-300">
                                            {plan.features?.bestFor && t('bestFor', { target: plan.features.bestFor })}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <i className="pi pi-check-circle text-[#b000ff] mt-1 text-lg"></i>
                                        <span className="text-gray-300">
                                            {t('digitalBooking')}
                                        </span>
                                    </li>
                                </ul>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10">
                                <Button
                                    label={plan.monthlyFee === 0 ? t('contactSales') : t('getStarted')}
                                    className={`
                                        w-full py-4 font-bold text-lg rounded-xl transition-all duration-300
                                        ${plan.code === 'GROWTH'
                                            ? 'bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white shadow-[0_4px_20px_rgba(176,0,255,0.4)] hover:shadow-[0_6px_25px_rgba(176,0,255,0.6)] hover:-translate-y-0.5'
                                            : 'bg-transparent border border-white/20 text-white hover:bg-white/10'
                                        }
                                    `}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Pricing;
