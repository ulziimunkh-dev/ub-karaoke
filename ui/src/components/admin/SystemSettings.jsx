import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../utils/api';

const SystemSettings = () => {
    const { settings, setSettings } = useData();
    const { t } = useLanguage();
    const [tempSettings, setTempSettings] = useState(settings);
    const toast = useRef(null);

    const handleSave = async () => {
        try {
            await api.updateSettings(tempSettings);
            setSettings(tempSettings);
            toast.current.show({ severity: 'success', summary: t('settingsSaved'), detail: t('settingsSavedDetail') });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to save settings' });
        }
    };

    return (
        <div className="system-settings">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold m-0 text-white">{t('systemSettings')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('systemSettingsDesc')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Config */}
                <Card className="hidden bg-[#1e1e2d] border border-white/5 shadow-xl" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-dollar text-[#b000ff]"></i> {t('financialConfig')}
                        </h3>
                    </div>
                }>
                    <div className="flex flex-col gap-6 pt-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('vatRate')}</label>
                            <InputNumber
                                value={tempSettings.taxRate}
                                onValueChange={e => setTempSettings({ ...tempSettings, taxRate: e.value })}
                                minFractionDigits={2}
                                maxFractionDigits={4}
                                suffix={t('multiplierSuffix')}
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">{t('vatExample')}</small>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('serviceCharge')}</label>
                            <InputNumber
                                value={tempSettings.serviceCharge}
                                onValueChange={e => setTempSettings({ ...tempSettings, serviceCharge: e.value })}
                                minFractionDigits={2}
                                maxFractionDigits={4}
                                suffix={t('multiplierSuffix')}
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">{t('chargeExample')}</small>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('currencySymbol')}</label>
                            <InputText
                                value={tempSettings.currency}
                                onChange={e => setTempSettings({ ...tempSettings, currency: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        <Divider className="border-white/5" />

                        <Divider className="border-white/5" />
                    </div>
                </Card>

                {/* Payout Settings */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-send text-[#eb79b2]"></i> {t('payoutManagement')}
                        </h3>
                    </div>
                }>
                    <div className="flex flex-col gap-6 pt-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('payoutLimit')}</label>
                            <InputNumber
                                value={tempSettings.payout_min_limit ?? 100000}
                                onValueChange={e => setTempSettings({ ...tempSettings, payout_min_limit: e.value })}
                                mode="currency"
                                currency="MNT"
                                locale="mn-MN"
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">{t('payoutLimitDesc')}</small>
                        </div>
                    </div>
                </Card>

                {/* Refund Policy Config */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl lg:col-span-2" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-shield text-[#4CAF50]"></i> {t('refundPolicyTitle') || 'Cancellation & Refund Policy'}
                        </h3>
                    </div>
                }>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('refundTier1Hours') || 'Free Cancellation Window (hours)'}</label>
                            <InputNumber
                                value={tempSettings.refund_tier1_hours ?? 24}
                                onValueChange={e => setTempSettings({ ...tempSettings, refund_tier1_hours: e.value })}
                                suffix=" h"
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">{t('refundTier1HoursDesc')}</small>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Tier 1 Fee (%)</label>
                            <InputNumber
                                value={tempSettings.refund_tier1_fee_percent ?? 0}
                                onValueChange={e => setTempSettings({ ...tempSettings, refund_tier1_fee_percent: e.value })}
                                suffix=" %"
                                max={100}
                                min={0}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('refundTier2Hours') || 'Partial Cancellation Window (hours)'}</label>
                            <InputNumber
                                value={tempSettings.refund_tier2_hours ?? 4}
                                onValueChange={e => setTempSettings({ ...tempSettings, refund_tier2_hours: e.value })}
                                suffix=" h"
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">{t('refundTier2HoursDesc')}</small>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('refundTier2Fee') || 'Partial Cancellation Penalty (%)'}</label>
                            <InputNumber
                                value={tempSettings.refund_tier2_fee_percent ?? 50}
                                onValueChange={e => setTempSettings({ ...tempSettings, refund_tier2_fee_percent: e.value })}
                                suffix=" %"
                                max={100}
                                min={0}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{t('refundTier3Fee') || 'Late Cancellation Penalty (%)'}</label>
                            <InputNumber
                                value={tempSettings.refund_tier3_fee_percent ?? 100}
                                onValueChange={e => setTempSettings({ ...tempSettings, refund_tier3_fee_percent: e.value })}
                                suffix=" %"
                                max={100}
                                min={0}
                                className="w-full md:w-1/2"
                            />
                        </div>
                    </div>
                </Card>

                {/* Notification Config */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl lg:col-span-2" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-bell text-[#2196F3]"></i> {t('notificationConfig') || 'Notification Config'}
                        </h3>
                    </div>
                }>
                    <div className="flex flex-col gap-6 pt-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                {t('adminEmailRecipients')}
                                <i className="pi pi-info-circle" title={t('adminEmailsInfo')} style={{ fontSize: '1rem', cursor: 'help' }}></i>
                            </label>
                            <InputText
                                value={tempSettings.ADMIN_EMAILS || ''}
                                onChange={e => setTempSettings({ ...tempSettings, ADMIN_EMAILS: e.target.value })}
                                placeholder="admin1@example.com, admin2@example.com"
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">{t('adminEmailsDesc')}</small>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mt-8 flex justify-end">
                <Button
                    label={t('saveSystemSettings')}
                    icon="pi pi-save"
                    className="p-button-primary px-8 h-12 font-bold shadow-lg shadow-[#b000ff]/20"
                    onClick={handleSave}
                />
            </div>

            <style>{`
                .system-settings .p-card-body {
                    padding: 1.5rem;
                }
                .system-settings .p-inputnumber-input,
                .system-settings .p-inputtext {
                    background: rgba(0,0,0,0.2) !important;
                    border: 1px solid rgba(255,255,255,0.05) !important;
                    color: white !important;
                }
                .system-settings .p-inputnumber-input:focus,
                .system-settings .p-inputtext:focus {
                    border-color: #b000ff !important;
                    box-shadow: 0 0 0 1px rgba(176,0,255,0.2) !important;
                }
            `}</style>
        </div >
    );
};

export default SystemSettings;
