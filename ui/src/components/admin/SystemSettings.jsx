import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { useLanguage } from '../../contexts/LanguageContext';

const SystemSettings = () => {
    const { settings, setSettings, promos, addPromotion, deletePromotion } = useData();
    const { t } = useLanguage();
    const [tempSettings, setTempSettings] = useState(settings);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [newPromo, setNewPromo] = useState({
        code: '',
        discountType: 'PERCENT',
        value: 10,
        validFrom: new Date(),
        validTo: new Date(new Date().setMonth(new Date().getMonth() + 1))
    });
    const toast = useRef(null);

    const handleSave = () => {
        setSettings(tempSettings);
        toast.current.show({ severity: 'success', summary: t('settingsSaved'), detail: t('settingsSavedDetail') });
    };

    const handleAddPromo = async () => {
        try {
            if (!newPromo.code || !newPromo.value) {
                toast.current.show({ severity: 'warn', summary: t('validationError'), detail: t('fillAllFields') });
                return;
            }
            await addPromotion(newPromo);
            toast.current.show({ severity: 'success', summary: t('promoAdded'), detail: t('promoCodeCreated', { code: newPromo.code }) });
            setIsPromoModalOpen(false);
            setNewPromo({
                code: '',
                discountType: 'PERCENT',
                value: 10,
                validFrom: new Date(),
                validTo: new Date(new Date().setMonth(new Date().getMonth() + 1))
            });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('promoAddFailed') });
        }
    };

    const handleDeletePromo = async (id) => {
        try {
            await deletePromotion(id);
            toast.current.show({ severity: 'success', summary: t('promoDeleted'), detail: t('promoRemoved') });
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('promoDeleteFailed') });
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
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl" header={
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

                        <div className="flex justify-end pt-2">
                            <Button
                                label={t('saveFinancialSettings')}
                                icon="pi pi-check"
                                className="p-button-primary px-8 h-12 font-bold shadow-lg shadow-[#b000ff]/20"
                                onClick={handleSave}
                            />
                        </div>
                    </div>
                </Card>

                {/* Promo Codes */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl" header={
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-ticket text-[#eb79b2]"></i> {t('activePromoCodes')}
                        </h3>
                        <Button icon="pi pi-plus" label={t('addNew')} className="p-button-sm p-button-outlined" onClick={() => setIsPromoModalOpen(true)} />
                    </div>
                }>
                    <div className="flex flex-col gap-4 pt-2">
                        {promos.length === 0 && (
                            <div className="text-center py-8 text-gray-600">
                                <i className="pi pi-info-circle text-2xl mb-2"></i>
                                <p className="m-0 italic">{t('noActivePromos')}</p>
                            </div>
                        )}
                        {promos.map((promo, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:border-[#b000ff]/30 transition-all group">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[#ff9800] tracking-wider uppercase">{promo.code}</span>
                                        <Tag
                                            value={promo.discountType === 'PERCENT' ? `${promo.value}% ${t('off')}` : `-${Number(promo.value).toLocaleString()}₮`}
                                            severity="success"
                                            className="text-[10px]"
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">
                                        {t('validRange', { start: new Date(promo.validFrom).toLocaleDateString(), end: new Date(promo.validTo).toLocaleDateString() })}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-rounded p-button-text p-button-danger p-button-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeletePromo(promo.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Dialog
                header={t('addNewPromoCode')}
                visible={isPromoModalOpen}
                onHide={() => setIsPromoModalOpen(false)}
                className="w-full max-w-md"
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button label={t('cancel')} onClick={() => setIsPromoModalOpen(false)} className="p-button-text" />
                        <Button label={t('createPromotion')} onClick={handleAddPromo} className="p-button-primary" />
                    </div>
                }
            >
                <div className="flex flex-col gap-4 pt-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500">{t('promoCodeLabel')}</label>
                        <InputText
                            value={newPromo.code}
                            onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. WELCOME10"
                            className="bg-black/20"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500">{t('type')}</label>
                            <Dropdown
                                value={newPromo.discountType}
                                options={[
                                    { label: t('percentage'), value: 'PERCENT' },
                                    { label: t('fixedAmount'), value: 'FIXED' }
                                ]}
                                onChange={e => setNewPromo({ ...newPromo, discountType: e.value })}
                                className="bg-black/20"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500">{t('value')}</label>
                            <InputNumber
                                value={newPromo.value}
                                onValueChange={e => setNewPromo({ ...newPromo, value: e.value })}
                                className="bg-black/20"
                                min={0}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500">{t('startDate')}</label>
                            <Calendar
                                value={newPromo.validFrom}
                                onChange={e => setNewPromo({ ...newPromo, validFrom: e.value })}
                                showIcon
                                className="bg-black/20"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500">{t('endDate')}</label>
                            <Calendar
                                value={newPromo.validTo}
                                onChange={e => setNewPromo({ ...newPromo, validTo: e.value })}
                                showIcon
                                className="bg-black/20"
                            />
                        </div>
                    </div>
                </div>
            </Dialog>

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
        </div>
    );
};

export default SystemSettings;
