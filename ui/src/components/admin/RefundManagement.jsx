import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { useLanguage } from '../../contexts/LanguageContext';

const RefundManagement = () => {
    const { t, language } = useLanguage();
    const toast = useRef(null);
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const fetchRefunds = async () => {
        setLoading(true);
        try {
            const data = await api.getOrgRefunds();
            setRefunds(data);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: t('error'), detail: t('failedToLoadRefunds') || 'Failed to load refunds' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRefunds(); }, []);

    const handleProcess = async (refund) => {
        setProcessingId(refund.id);
        try {
            await api.processRefund(refund.id);
            setRefunds(prev => prev.map(r => r.id === refund.id ? { ...r, status: 'COMPLETED' } : r));
            toast.current?.show({ severity: 'success', summary: t('refundProcessed'), detail: `${t('refundInitiated')} ${Number(refund.amount).toLocaleString()}₮ ${t('refundProcessedSuccess')}` });
            setShowDetails(false);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: t('error'), detail: e.response?.data?.message || t('failedToProcessRefund') || 'Failed to process refund' });
        } finally {
            setProcessingId(null);
        }
    };

    const statusSeverity = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'info';
            case 'COMPLETED': return 'success';
            case 'REJECTED': return 'danger';
            default: return null;
        }
    };

    const statusTemplate = (row) => (
        <Tag value={row.status} severity={statusSeverity(row.status)} />
    );

    const amountTemplate = (row) => (
        <span className="text-green-400 font-bold">{Number(row.amount).toLocaleString()}₮</span>
    );

    const dateTemplate = (row) => (
        <span className="text-xs text-gray-400">
            {new Date(row.createdAt).toLocaleString(language === 'mn' ? 'mn-MN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
    );

    const actionTemplate = (row) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-eye"
                className="p-button-info p-button-sm p-button-rounded p-button-text"
                tooltip={t('viewDetails')}
                onClick={() => { setSelectedRefund(row); setShowDetails(true); }}
            />
            {row.status === 'PENDING' && (
                <Button
                    icon="pi pi-check"
                    label={t('markProcessed')}
                    className="p-button-success p-button-sm p-button-rounded"
                    loading={processingId === row.id}
                    onClick={() => handleProcess(row)}
                />
            )}
        </div>
    );

    const pendingCount = refunds.filter(r => r.status === 'PENDING').length;

    return (
        <div className="refund-management pt-4 px-6 md:px-0">
            <Toast ref={toast} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-[0_10px_25px_rgba(245,158,11,0.4)]">
                        <i className="pi pi-wallet text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="m-0 text-3xl font-black text-white tracking-tight leading-none">{t('refundManagement')}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="m-0 text-text-muted text-xs font-bold uppercase tracking-[0.2em] opacity-60">{t('customerCancellationRefunds')}</p>
                            {pendingCount > 0 && (
                                <>
                                    <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">{pendingCount} {t('pending').toUpperCase()}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    icon="pi pi-refresh"
                    outlined
                    onClick={fetchRefunds}
                    className="h-11 w-11 rounded-xl border-white/10 text-white/50 hover:text-white hover:bg-white/5"
                    tooltip="Refresh"
                    loading={loading}
                />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: t('total'), count: refunds.length, color: 'from-[#b000ff] to-[#eb79b2]', icon: 'pi-list' },
                    { label: t('pending'), count: refunds.filter(r => r.status === 'PENDING').length, color: 'from-amber-500 to-orange-500', icon: 'pi-clock' },
                    { label: t('completedRefunds'), count: refunds.filter(r => r.status === 'COMPLETED').length, color: 'from-green-600 to-emerald-500', icon: 'pi-check-circle' },
                    { label: t('totalRefunded'), count: `${refunds.filter(r => r.status === 'COMPLETED').reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}₮`, color: 'from-blue-600 to-cyan-500', icon: 'pi-dollar' },
                ].map(card => (
                    <div key={card.label} className="bg-white/5 rounded-2xl border border-white/5 p-5">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                            <i className={`pi ${card.icon} text-white text-sm`}></i>
                        </div>
                        <p className="text-2xl font-black text-white m-0 leading-none">{card.count}</p>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1 m-0">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white/5 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <DataTable
                    value={refunds}
                    paginator
                    rows={10}
                    loading={loading}
                    className="datatable-modern"
                    responsiveLayout="scroll"
                    dataKey="id"
                    sortField="createdAt"
                    sortOrder={-1}
                    emptyMessage={
                        <div className="py-16 text-center">
                            <i className="pi pi-wallet text-4xl text-gray-700 mb-3 block"></i>
                            <p className="text-gray-500 font-black uppercase tracking-widest text-sm">{t('noRefundsFound')}</p>
                        </div>
                    }
                >
                    <Column
                        header={t('bookingRef')}
                        body={row => (
                            <span className="font-mono text-xs text-[#eb79b2] font-bold">
                                #{row.payment?.bookingId?.slice(-8).toUpperCase() || row.paymentId?.slice(-8).toUpperCase() || '—'}
                            </span>
                        )}
                        className="pl-6"
                        headerClassName="pl-6"
                    />
                    <Column header={t('amount')} body={amountTemplate} sortField="amount" sortable />
                    <Column header={t('refundReason')} body={row => (
                        <span className="text-xs text-gray-400 max-w-xs block truncate">{row.reason || '—'}</span>
                    )} />
                    <Column header={t('status')} body={statusTemplate} sortField="status" sortable />
                    <Column header={t('refundDate')} body={dateTemplate} sortField="createdAt" sortable />
                    <Column header={t('actions')} body={actionTemplate} className="pr-6" headerClassName="pr-6" />
                </DataTable>
            </div>

            {/* Details Dialog */}
            <Dialog
                header={
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <i className="pi pi-wallet text-amber-400"></i>
                        </div>
                        <div>
                            <p className="m-0 text-white font-bold">{t('refundDetails')}</p>
                            <p className="m-0 text-[10px] text-gray-500 uppercase tracking-widest">#{selectedRefund?.id?.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                }
                visible={showDetails}
                onHide={() => setShowDetails(false)}
                className="w-full max-w-md"
                modal
            >
                {selectedRefund && (
                    <div className="flex flex-col gap-4 pt-2">
                        <div className="bg-white/5 rounded-2xl border border-white/5 p-5">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t('refundAmount')}</span>
                                <Tag value={selectedRefund.status} severity={statusSeverity(selectedRefund.status)} />
                            </div>
                            <p className="text-3xl font-black text-green-400 m-0">{Number(selectedRefund.amount).toLocaleString()}₮</p>
                        </div>

                        <div className="bg-white/5 rounded-2xl border border-white/5 p-5 flex flex-col gap-3">
                            <div>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('refundReason')}</span>
                                <p className="text-sm text-white/80 m-0">{selectedRefund.reason || '—'}</p>
                            </div>
                            <div>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('date')}</span>
                                <p className="text-sm text-white/80 m-0">{new Date(selectedRefund.createdAt).toLocaleString(language === 'mn' ? 'mn-MN' : 'en-US')}</p>
                            </div>
                            <div>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">{t('payoutRef')}</span>
                                <p className="text-xs font-mono text-[#eb79b2] m-0">{selectedRefund.paymentId}</p>
                            </div>
                        </div>

                        {selectedRefund.status === 'PENDING' && (
                            <Button
                                label={t('markProcessed')}
                                icon="pi pi-check"
                                className="h-12 w-full bg-gradient-to-r from-green-600 to-emerald-500 border-none text-white font-black uppercase tracking-widest rounded-xl shadow-[0_8px_20px_rgba(34,197,94,0.3)] hover:opacity-90"
                                loading={processingId === selectedRefund.id}
                                onClick={() => handleProcess(selectedRefund)}
                            />
                        )}

                        <Button label={t('close')} text onClick={() => setShowDetails(false)} className="h-10 font-bold text-white/30 hover:text-white" />
                    </div>
                )}
            </Dialog>

            <style>{`
                .refund-management .p-datatable .p-datatable-thead > tr > th {
                    background: transparent !important;
                    border-bottom: 2px solid rgba(255,255,255,0.05) !important;
                    padding: 1.25rem 1rem !important;
                    color: #555 !important;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                }
                .refund-management .p-datatable .p-datatable-tbody > tr {
                    background: transparent !important;
                    border-bottom: 1px solid rgba(255,255,255,0.03) !important;
                }
                .refund-management .p-datatable .p-datatable-tbody > tr:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
                .refund-management .p-datatable .p-datatable-tbody > tr > td {
                    padding: 1.25rem 1rem !important;
                }
                .refund-management .p-paginator {
                    background: transparent !important;
                    border: none !important;
                    padding: 1.5rem !important;
                }
            `}</style>
        </div>
    );
};

export default RefundManagement;
