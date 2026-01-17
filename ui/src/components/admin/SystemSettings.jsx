import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';

const SystemSettings = () => {
    const { settings, setSettings, promos } = useData();
    const [tempSettings, setTempSettings] = useState(settings);
    const toast = useRef(null);

    const handleSave = () => {
        setSettings(tempSettings);
        toast.current.show({ severity: 'success', summary: 'Settings Saved', detail: 'System configuration updated successfully' });
    };

    return (
        <div className="system-settings">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold m-0 text-white">System Settings</h2>
                    <p className="text-gray-500 text-sm mt-1">Configure global platform parameters and promotional offers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Config */}
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl" header={
                    <div className="p-4 border-b border-white/5">
                        <h3 className="m-0 text-lg font-bold text-white flex items-center gap-2">
                            <i className="pi pi-dollar text-[#b000ff]"></i> Financial Configuration
                        </h3>
                    </div>
                }>
                    <div className="flex flex-col gap-6 pt-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">VAT Tax Rate</label>
                            <InputNumber
                                value={tempSettings.taxRate}
                                onValueChange={e => setTempSettings({ ...tempSettings, taxRate: e.value })}
                                minFractionDigits={2}
                                maxFractionDigits={4}
                                suffix=" (Multiplier)"
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">Example: 0.10 for 10% VAT</small>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Service Charge</label>
                            <InputNumber
                                value={tempSettings.serviceCharge}
                                onValueChange={e => setTempSettings({ ...tempSettings, serviceCharge: e.value })}
                                minFractionDigits={2}
                                maxFractionDigits={4}
                                suffix=" (Multiplier)"
                                className="w-full"
                            />
                            <small className="text-gray-600 px-1 italic">Example: 0.05 for 5% charge</small>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Currency Symbol</label>
                            <InputText
                                value={tempSettings.currency}
                                onChange={e => setTempSettings({ ...tempSettings, currency: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        <Divider className="border-white/5" />

                        <div className="flex justify-end pt-2">
                            <Button
                                label="Save Financial Settings"
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
                            <i className="pi pi-ticket text-[#eb79b2]"></i> Active Promo Codes
                        </h3>
                        <Button icon="pi pi-plus" label="Add New" className="p-button-sm p-button-outlined" />
                    </div>
                }>
                    <div className="flex flex-col gap-4 pt-2">
                        {promos.length === 0 && (
                            <div className="text-center py-8 text-gray-600">
                                <i className="pi pi-info-circle text-2xl mb-2"></i>
                                <p className="m-0 italic">No active promotions currently configured.</p>
                            </div>
                        )}
                        {promos.map((promo, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 bg-black/20 rounded-xl border border-white/5 hover:border-[#b000ff]/30 transition-all group">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-[#ff9800] tracking-wider">{promo.code}</span>
                                        <Tag
                                            value={promo.discountPercent ? `${promo.discountPercent}% OFF` : `-${Number(promo.discountAmount).toLocaleString()}₮`}
                                            severity="success"
                                            className="text-[10px]"
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Expires: {new Date(promo.expiry).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-secondary p-button-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Button icon="pi pi-trash" className="p-button-rounded p-button-text p-button-danger p-button-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <style jsx>{`
                .system-settings :global(.p-card-body) {
                    padding: 1.5rem;
                }
                .system-settings :global(.p-inputnumber-input),
                .system-settings :global(.p-inputtext) {
                    background: rgba(0,0,0,0.2) !important;
                    border: 1px solid rgba(255,255,255,0.05) !important;
                    color: white !important;
                }
                .system-settings :global(.p-inputnumber-input:focus),
                .system-settings :global(.p-inputtext:focus) {
                    border-color: #b000ff !important;
                    box-shadow: 0 0 0 1px rgba(176,0,255,0.2) !important;
                }
            `}</style>
        </div>
    );
};

export default SystemSettings;
