import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { api } from '../../utils/api';

const SubscriptionManagement = () => {
    const { currentUser } = useData();
    const { t } = useLanguage();
    const [org, setOrg] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentModal, setPaymentModal] = useState(null); // { plan, duration }
    const [isProcessing, setIsProcessing] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const orgData = await api.getOrganization(currentUser.organizationId);
            const plansData = await api.getPlans();
            setOrg(orgData);
            setPlans(plansData);
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToLoadSubscription') });
        } finally {
            setLoading(false);
        }
    };

    const getStatusSeverity = () => {
        if (!org?.planEndsAt) return 'info';
        const expiry = new Date(org.planEndsAt);
        const now = new Date();
        const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return 'danger';
        if (daysRemaining < 7) return 'warning';
        return 'success';
    };

    const getStatusLabel = () => {
        if (!org?.planId) return t('noActivePlan');
        const severity = getStatusSeverity();
        if (severity === 'danger') return t('expired');
        if (severity === 'warning') return t('expiringSoon');
        return t('active');
    };

    const processPayment = async () => {
        setIsProcessing(true);
        // Simulate payment gateway delay
        setTimeout(async () => {
            try {
                await api.extendOrganizationPlan(org.id, {
                    planId: paymentModal.plan.id,
                    durationMonths: paymentModal.duration
                });
                toast.current.show({ severity: 'success', summary: t('success'), detail: t('subscriptionUpdatedSuccess') });
                setPaymentModal(null);
                loadData();
            } catch (error) {
                toast.current.show({ severity: 'error', summary: t('error'), detail: t('paymentFailed') });
            } finally {
                setIsProcessing(false);
            }
        }, 2000);
    };

    if (loading) return <div className="p-6 text-center"><i className="pi pi-spin pi-spinner text-4xl text-primary"></i></div>;

    return (
        <div className="p-6 subscription-management">
            <Toast ref={toast} />

            <div className="mb-8">
                <h2 className="text-2xl font-black text-white m-0 uppercase tracking-tighter">{t('planSubscription')}</h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">{t('manageSubDesc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Current Status Card */}
                <Card className="lg:col-span-1 bg-[#1a1a24] border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <Tag value={getStatusLabel()} severity={getStatusSeverity()} className="animate-pulse" />
                    </div>

                    <h3 className="m-0 text-gray-500 uppercase text-[10px] font-black tracking-widest mb-4">{t('currentSubscription')}</h3>
                    <div className="flex flex-col gap-2 mb-6">
                        <h1 className="m-0 text-3xl font-black text-white tracking-tighter">{org?.plan?.name || t('standardFree')}</h1>
                        <p className="m-0 text-[#eb79b2] font-black text-lg">
                            {org?.plan?.monthlyFee > 0 ? `${Number(org.plan.monthlyFee).toLocaleString()}₮ / ${t('monthLabel').toLowerCase()}` : t('customPricing')}
                        </p>
                    </div>

                    <Divider className="opacity-10" />

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('validUntil')}</span>
                            <span className="text-white font-bold">{org?.planEndsAt ? new Date(org.planEndsAt).toLocaleDateString() : t('na')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t('planId')}</span>
                            <span className="text-gray-400 font-mono text-xs">{org?.plan?.code || t('na')}</span>
                        </div>
                    </div>
                </Card>

                {/* Quota/Limit Card */}
                <Card className="lg:col-span-2 bg-[#1a1a24] border border-white/5">
                    <h3 className="m-0 text-gray-500 uppercase text-[10px] font-black tracking-widest mb-6">{t('planQuotas')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-white">{t('branchCapacity')}</span>
                                <span className="text-xs text-gray-500 font-black">{org?.venues?.length || 0} / {org?.plan?.maxBranches || '∞'}</span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#b000ff] to-[#eb79b2]"
                                    style={{ width: `${org?.plan?.maxBranches ? (org.venues?.length / org.plan.maxBranches) * 100 : 100}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2 italic">{t('totalVenuesNote')}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <i className="pi pi-check-circle text-[#eb79b2]"></i>
                                <span className="text-sm text-gray-300">{t('commissionRateLabel')}: <span className="text-white font-bold">{org?.plan?.commissionRate}%</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <i className="pi pi-check-circle text-[#eb79b2]"></i>
                                <span className="text-sm text-gray-300">{t('onlineBookings')}: <span className={`font-bold ${org?.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>{org?.status === 'active' ? t('enabled') : t('disabled')}</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <i className="pi pi-check-circle text-[#eb79b2]"></i>
                                <span className="text-sm text-gray-300">{t('prioritySupport')}: <span className="text-white font-bold">{org?.plan?.code === 'FRANCHISE' ? t('yesLabel') : t('noLabel')}</span></span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Select Extension/Upgrade */}
            <div className="mb-6">
                <h3 className="m-0 text-white font-black text-xl tracking-tight uppercase">{t('extendOrUpgrade')}</h3>
                <p className="text-gray-500 text-sm font-medium">{t('choosePlanDesc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(p => {
                    const isCurrent = p.id === org?.plan?.id;
                    return (
                        <div key={p.id} className={`p-6 rounded-2xl border transition-all duration-300 group ${isCurrent ? 'bg-[#b000ff]/10 border-[#b000ff] shadow-lg shadow-[#b000ff]/10' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-white/5 rounded-xl text-2xl">
                                    {p.code === 'STARTER' ? '🚲' : p.code === 'GROWTH' ? '🚗' : '🚀'}
                                </div>
                                {isCurrent && <Tag value="CURRENT" severity="success" className="bg-green-500/20 text-green-400" />}
                            </div>

                            <h3 className="m-0 text-xl font-bold text-white mb-2">{p.name}</h3>
                            <p className="m-0 text-2xl font-black text-white mb-6">
                                {p.monthlyFee.toLocaleString()}₮ <span className="text-xs text-gray-500 font-medium">/ {t('monthLabel').toLowerCase()}</span>
                            </p>

                            <ul className="list-none p-0 m-0 mb-8 flex flex-col gap-3">
                                <li className="flex items-center gap-2 text-xs text-gray-400">
                                    <i className="pi pi-check text-[8px] text-[#eb79b2] font-black"></i>
                                    {t('unlimitedBranches', { count: p.maxBranches || t('unlimitedLabel') })}
                                </li>
                                <li className="flex items-center gap-2 text-xs text-gray-400">
                                    <i className="pi pi-check text-[8px] text-[#eb79b2] font-black"></i>
                                    {t('commissionRateDetail', { rate: p.commissionRate })}
                                </li>
                                <li className="flex items-center gap-2 text-xs text-gray-400">
                                    <i className="pi pi-check text-[8px] text-[#eb79b2] font-black"></i>
                                    {t('coreFeaturesInclude')}
                                </li>
                            </ul>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    label={t('oneMonth')}
                                    className="p-button-sm p-button-outlined border-white/10 text-white font-bold hover:bg-[#eb79b2] hover:border-[#eb79b2]"
                                    onClick={() => setPaymentModal({ plan: p, duration: 1 })}
                                />
                                <Button
                                    label={t('sixMonths')}
                                    className="p-button-sm p-button-outlined border-white/10 text-white font-bold hover:bg-[#eb79b2] hover:border-[#eb79b2]"
                                    onClick={() => setPaymentModal({ plan: p, duration: 6 })}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            <Dialog
                header={t('securePayment')}
                visible={!!paymentModal}
                onHide={() => !isProcessing && setPaymentModal(null)}
                style={{ width: '400px' }}
                className="payment-dialog"
                closable={!isProcessing}
            >
                <div className="p-4">
                    {isProcessing ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-[#b000ff]/20 border-t-[#b000ff] rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <i className="pi pi-lock text-2xl text-[#eb79b2]"></i>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="m-0 text-white font-bold text-xl mb-2">{t('processingPayment')}</h3>
                                <p className="m-0 text-gray-500 text-sm">{t('commGateway')}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{t('planSelection')}</span>
                                    <span className="text-white font-bold">{paymentModal?.plan?.name}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{t('duration')}</span>
                                    <span className="text-white font-bold">{paymentModal?.duration} {paymentModal?.duration === 1 ? t('monthLabel') : t('monthLabel') + 's'}</span>
                                </div>
                                <Divider className="my-3 opacity-10" />
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-bold">{t('totalAmount')}</span>
                                    <span className="text-2xl font-black text-[#eb79b2]">
                                        {(paymentModal?.plan?.monthlyFee * paymentModal?.duration || 0).toLocaleString()}₮
                                    </span>
                                </div>
                            </div>

                            <p className="text-[10px] text-gray-500 text-center mb-6 leading-relaxed uppercase tracking-widest font-bold">
                                {t('paymentDisclaimer', { duration: paymentModal?.duration })}
                            </p>

                            <Button
                                label={t('proceedToPayment')}
                                icon="pi pi-shield"
                                className="w-full h-14 bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none text-white font-bold rounded-xl shadow-[0_10px_20px_rgba(176,0,255,0.3)] hover:shadow-[0_15px_30px_rgba(176,0,255,0.4)] transition-all"
                                onClick={processPayment}
                            />
                        </>
                    )}
                </div>
            </Dialog>

            <style>{`
                .subscription-management .p-card {
                    background: transparent !important;
                    box-shadow: none !important;
                }
                .payment-dialog .p-dialog-header {
                    background: #1a1a24 !important;
                    color: white !important;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                }
                .payment-dialog .p-dialog-content {
                    background: #1a1a24 !important;
                    padding: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default SubscriptionManagement;
