import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';

const RoomPricing = ({ visible, onHide, room, venue }) => {
    const { addRoomPricing, removeRoomPricing, refreshData } = useData();
    const { t } = useLanguage();
    const toast = useRef(null);

    const [pricingForm, setPricingForm] = useState({
        dayType: 'WEEKEND',
        startTime: '18:00',
        endTime: '02:00',
        pricePerHour: 50000,
        isSpecificDate: false,
        dateRange: null,
        priority: 20
    });

    const handleAddPricing = async () => {
        if (!pricingForm.pricePerHour || !room) return;

        const payload = {
            ...pricingForm,
            pricePerHour: Number(pricingForm.pricePerHour),
            priority: Number(pricingForm.priority)
        };

        if (pricingForm.isSpecificDate && pricingForm.dateRange && pricingForm.dateRange[0]) {
            payload.dayType = 'HOLIDAY';
            payload.startDateTime = pricingForm.dateRange[0];
            payload.endDateTime = pricingForm.dateRange[1] || pricingForm.dateRange[0];
        } else {
            payload.startDateTime = null;
            payload.endDateTime = null;
        }

        try {
            await addRoomPricing(room.id, payload);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('pricingRuleAdded') });
            setPricingForm(prev => ({ ...prev, isSpecificDate: false, dateRange: null }));
            refreshData?.();
        } catch (e) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToAddRule') });
        }
    };

    const handleDeletePricing = async (pricingId) => {
        try {
            await removeRoomPricing(pricingId);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('pricingRuleRemoved') });
            refreshData?.();
        } catch (e) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('failedToRemoveRule') });
        }
    };

    // Get live pricing data from venue (not stale room prop)
    const getLivePricingRules = () => {
        if (!room || !venue) return [];
        const liveRoom = venue.rooms?.find(r => r.id === room.id);
        const rawList = liveRoom?.pricing || liveRoom?.pricingRules || room.pricing || room.pricingRules || [];
        return [...rawList].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    };

    if (!room) return null;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header={
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#eb79b2]/20 to-[#b000ff]/20 flex items-center justify-center">
                            <i className="pi pi-dollar text-[#eb79b2] text-lg"></i>
                        </div>
                        <div>
                            <h3 className="m-0 text-lg font-bold text-white uppercase tracking-tight">{t('advancedPricing')}: {room.name}</h3>
                            <p className="m-0 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                {t('baseRate')}: {(room.hourlyRate || 0).toLocaleString()}₮/hr • {t('bufferTime') || 'Buffer'}: {room.bufferMinutes || 15} min
                            </p>
                        </div>
                    </div>
                }
                visible={visible}
                onHide={onHide}
                className="w-full max-w-[95vw] sm:max-w-[800px]"
                modal
            >
                <div className="flex flex-col gap-6 pt-2">

                    {/* Add Rule Section */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#eb79b2]/10 flex items-center justify-center border border-[#eb79b2]/10">
                                    <i className="pi pi-plus text-[#eb79b2] text-sm"></i>
                                </div>
                                <h4 className="m-0 text-xs font-black uppercase tracking-[0.2em] text-white/70">{t('addPricingRule') || 'Add New Rule'}</h4>
                            </div>
                            <Dropdown
                                value={pricingForm.isSpecificDate}
                                options={[
                                    { label: `🔄 ${t('happyHourRecurring')}`, value: false },
                                    { label: `📌 ${t('specificDate')}`, value: true }
                                ]}
                                onChange={(e) => setPricingForm({ ...pricingForm, isSpecificDate: e.value })}
                                className="h-9 text-[10px] font-black uppercase tracking-wider w-48 bg-black/40 border-white/10"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                            {!pricingForm.isSpecificDate ? (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('applyTo')}</label>
                                    <Dropdown
                                        value={pricingForm.dayType}
                                        options={[
                                            { label: t('everyday'), value: 'EVERYDAY' },
                                            { label: t('weekdays'), value: 'WEEKDAY' },
                                            { label: t('weekends'), value: 'WEEKEND' }
                                        ]}
                                        onChange={e => setPricingForm({ ...pricingForm, dayType: e.value })}
                                        className="h-11 font-bold"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('dateRange')}</label>
                                    <Calendar
                                        value={pricingForm.dateRange}
                                        onChange={e => setPricingForm({ ...pricingForm, dateRange: e.value })}
                                        selectionMode="range"
                                        readOnlyInput
                                        placeholder={t('selectDates')}
                                        className="h-11"
                                        showIcon
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('startTime')}</label>
                                <InputText type="time" value={pricingForm.startTime} onChange={e => setPricingForm({ ...pricingForm, startTime: e.target.value })} className="h-11 font-bold text-center tracking-widest bg-black/20" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('endTime')}</label>
                                <InputText type="time" value={pricingForm.endTime} onChange={e => setPricingForm({ ...pricingForm, endTime: e.target.value })} className="h-11 font-bold text-center tracking-widest bg-black/20" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">{t('specialRatePerHour')}</label>
                                <InputNumber
                                    value={pricingForm.pricePerHour}
                                    onValueChange={e => setPricingForm({ ...pricingForm, pricePerHour: e.value })}
                                    mode="currency" currency="MNT" locale="mn-MN"
                                    inputClassName="w-full h-11 bg-black/20 border-white/10 text-white px-4 font-black transition-colors text-center"
                                    className="h-11 shadow-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1" title={t('priorityLabel')}>{t('priority')}</label>
                                <InputNumber
                                    value={pricingForm.priority}
                                    onValueChange={e => setPricingForm({ ...pricingForm, priority: e.value })}
                                    min={0} max={100}
                                    showButtons
                                    buttonLayout="horizontal"
                                    decrementButtonClassName="p-button-secondary bg-white/5 border-white/10"
                                    incrementButtonClassName="p-button-secondary bg-white/5 border-white/10"
                                    inputClassName="w-full h-11 bg-black/20 border-white/10 text-white text-center font-bold"
                                    className="h-11 shadow-sm"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    label={t('addPricingRule')}
                                    icon="pi pi-plus"
                                    type="button"
                                    onClick={handleAddPricing}
                                    className="h-11 w-full bg-gradient-to-r from-[#b000ff] to-[#eb79b2] border-none font-black text-xs uppercase tracking-widest shadow-[0_4px_12px_rgba(176,0,255,0.3)] hover:shadow-[0_4px_20px_rgba(176,0,255,0.4)] transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rules List Section */}
                    <div className="bg-white/5 rounded-2xl border border-white/5 shadow-xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <h4 className="m-0 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t('activePricingRules') || 'Active Pricing Rules'}</h4>
                        </div>
                        <DataTable
                            value={getLivePricingRules()}
                            className="pricing-datatable text-sm"
                            emptyMessage={t('noPricingRules')}
                            rowClassName={() => 'bg-transparent hover:bg-white/5 transition-colors'}
                        >
                            <Column header={t('schedule')} body={(rowData) => (
                                <div className="flex flex-col">
                                    <span className="font-black text-[10px] text-[#eb79b2] uppercase tracking-widest">
                                        {rowData.isHoliday ? t('holidayEvent') : rowData.dayType}
                                    </span>
                                    <span className="text-white font-bold text-xs flex items-center gap-1">
                                        <i className="pi pi-clock text-[10px] opacity-40"></i>
                                        {rowData.startTime} — {rowData.endTime}
                                    </span>
                                </div>
                            )} />
                            <Column header={t('dates')} body={(rowData) => (
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {rowData.startDateTime ?
                                        <div className="flex flex-col">
                                            <span>{new Date(rowData.startDateTime).toLocaleDateString()}</span>
                                            <span>{new Date(rowData.endDateTime).toLocaleDateString()}</span>
                                        </div>
                                        : <Tag value={t('recurring')} className="text-[9px] font-black uppercase bg-white/5 border border-white/10" />
                                    }
                                </div>
                            )} />
                            <Column header={t('rate')} body={(rowData) => (
                                <span className="font-black text-green-400 tabular-nums">{rowData.pricePerHour.toLocaleString()}₮</span>
                            )} />
                            <Column header={t('priority')} body={(rowData) => (
                                <Tag value={`#${rowData.priority}`} className="text-[9px] font-black bg-[#4a90e2]/20 text-[#4a90e2] border border-[#4a90e2]/20" />
                            )} />
                            <Column body={(rowData) => (
                                <Button
                                    icon="pi pi-trash"
                                    text
                                    severity="danger"
                                    size="small"
                                    onClick={() => handleDeletePricing(rowData.id)}
                                    className="hover:bg-red-500/10"
                                />
                            )} />
                        </DataTable>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default RoomPricing;
