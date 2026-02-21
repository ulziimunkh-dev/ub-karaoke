import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';

const Finance = () => {
    const {
        earnings, payouts, payoutAccounts,
        requestPayout, addPayoutAccount, updatePayoutStatus,
        currentUser, bookings, processRefund, venues, refreshData
    } = useData();
    const { t } = useLanguage();
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedEarnings, setSelectedEarnings] = useState([]);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ payoutAccountId: '' });
    const [accountForm, setAccountForm] = useState({
        bankName: '', accountNumber: '', accountHolder: '', isDefault: true
    });
    const toast = useRef(null);

    const isSysAdmin = currentUser?.role === 'sysadmin';

    // Analytics calculation
    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.netAmount), 0);
    const pendingEarnings = earnings.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + Number(e.netAmount), 0);
    const totalPayouts = payouts.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.totalAmount), 0);

    const formatCurrency = (value) => {
        return Number(value).toLocaleString() + '₮';
    };

    const statusBodyTemplate = (rowData) => {
        return <Tag value={t(rowData.status?.toLowerCase())} severity={getStatusSeverity(rowData.status)} />;
    };

    const getStatusSeverity = (status) => {
        switch (status) {
            case 'PAID':
            case 'COMPLETED':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'FAILED':
            case 'CANCELLED':
                return 'danger';
            default:
                return null;
        }
    };

    const handleRequestPayout = async () => {
        if (selectedEarnings.length === 0) {
            toast.current.show({ severity: 'warn', summary: t('selectionRequired'), detail: t('payoutItemsSelection') });
            return;
        }

        const defaultAccount = payoutAccounts.find(a => a.isDefault) || payoutAccounts[0];
        if (!defaultAccount) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('addPayoutAccountFirst') });
            return;
        }

        setPayoutForm({ payoutAccountId: defaultAccount.id });
        setIsPayoutModalOpen(true);
    };

    const submitPayoutRequest = async () => {
        try {
            await requestPayout({
                earningIds: selectedEarnings.map(e => e.id),
                payoutAccountId: payoutForm.payoutAccountId
            });
            setIsPayoutModalOpen(false);
            setSelectedEarnings([]);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('payoutRequestedSuccess') });
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('payoutRequestFailed') });
        }
    };

    const handleAddAccount = async () => {
        try {
            await addPayoutAccount(accountForm);
            setIsAccountModalOpen(false);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('payoutAccountAdded') });
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('payoutAccountAddFailed') });
        }
    };

    const handleUpdatePayoutStatus = async (id, status) => {
        try {
            await updatePayoutStatus(id, status);
            toast.current.show({ severity: 'success', summary: t('success'), detail: t('payoutMarkedAs', { status: t(status.toLowerCase()) }) });
            refreshData?.();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: t('error'), detail: t('updateFailed') });
        }
    };

    return (
        <div className="finance-page">
            <Toast ref={toast} />
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white m-0">{t('financeSettlement')}</h2>
                    <p className="text-gray-500 text-sm">{t('financeSettlementDesc')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        icon="pi pi-refresh"
                        outlined
                        onClick={() => refreshData?.()}
                        className="p-button-sm h-10 w-10"
                        tooltip={t('refresh')}
                        tooltipOptions={{ position: 'bottom' }}
                    />
                    <Button
                        label={t('addBankAccount')}
                        icon="pi pi-plus"
                        className="p-button-outlined p-button-sm"
                        onClick={() => setIsAccountModalOpen(true)}
                    />
                    <Button
                        label={t('requestPayout')}
                        icon="pi pi-money-bill"
                        className="p-button-primary p-button-sm"
                        onClick={handleRequestPayout}
                        disabled={selectedEarnings.length === 0}
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{t('totalNetEarnings')}</span>
                        <span className="text-2xl font-black text-[#4caf50]">{formatCurrency(totalEarnings)}</span>
                    </div>
                </Card>
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{t('availableForPayout')}</span>
                        <span className="text-2xl font-black text-[#ff9800]">{formatCurrency(pendingEarnings)}</span>
                    </div>
                </Card>
                <Card className="bg-[#1e1e2d] border border-white/5 shadow-xl">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{t('totalPaidOut')}</span>
                        <span className="text-2xl font-black text-[#b000ff]">{formatCurrency(totalPayouts)}</span>
                    </div>
                </Card>
            </div>

            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="custom-tabview">
                <TabPanel header={t('earningsTab')} leftIcon="pi pi-chart-line mr-2">
                    <DataTable
                        value={earnings}
                        selection={selectedEarnings}
                        onSelectionChange={e => setSelectedEarnings(e.value)}
                        dataKey="id"
                        paginator
                        rows={10}
                        className="mt-4"
                        responsiveLayout="stack"
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
                        <Column field="id" header={t('id')} body={(r) => `#E-${r.id}`} className="text-xs text-gray-500"></Column>
                        <Column field="createdAt" header={t('date')} body={(r) => new Date(r.createdAt).toLocaleDateString()}></Column>
                        <Column field="venueId" header={t('venue')} body={(r) => venues.find(v => v.id === r.venueId)?.name || t('na')}></Column>
                        <Column field="grossAmount" header={t('gross')} body={(r) => formatCurrency(r.grossAmount)}></Column>
                        <Column field="commissionAmount" header={t('comm')} body={(r) => formatCurrency(r.commissionAmount)} className="text-red-400"></Column>
                        <Column field="netAmount" header={t('net')} body={(r) => <span className="font-bold text-green-400">{formatCurrency(r.netAmount)}</span>}></Column>
                        <Column field="status" header={t('status')} body={statusBodyTemplate}></Column>
                    </DataTable>
                </TabPanel>

                <TabPanel header={t('payoutsTab')} leftIcon="pi pi-send mr-2">
                    <DataTable value={payouts} paginator rows={10} className="mt-4">
                        <Column field="id" header={t('id')} body={(r) => `#P-${r.id}`} className="text-xs text-gray-500"></Column>
                        <Column field="createdAt" header={t('date')} body={(r) => new Date(r.createdAt).toLocaleDateString()}></Column>
                        <Column field="totalAmount" header={t('amount')} body={(r) => <span className="font-bold">{formatCurrency(r.totalAmount)}</span>}></Column>
                        <Column field="payoutAccount" header={t('bankAccount')} body={(r) => r.payoutAccount ? `${r.payoutAccount.bankName} (${r.payoutAccount.accountNumber})` : t('na')}></Column>
                        <Column field="status" header={t('status')} body={statusBodyTemplate}></Column>
                        {isSysAdmin && (
                            <Column header={t('actions')} body={(r) => (
                                <div className="flex gap-2">
                                    {r.status === 'PENDING' && (
                                        <>
                                            <Button icon="pi pi-check" className="p-button-rounded p-button-success p-button-text" onClick={() => handleUpdatePayoutStatus(r.id, 'PAID')} />
                                            <Button icon="pi pi-times" className="p-button-rounded p-button-danger p-button-text" onClick={() => handleUpdatePayoutStatus(r.id, 'FAILED')} />
                                        </>
                                    )}
                                </div>
                            )} />
                        )}
                    </DataTable>
                </TabPanel>

                <TabPanel header={t('bankAccountsTab')} leftIcon="pi pi-building mr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {payoutAccounts.map(account => (
                            <Card key={account.id} className="relative bg-[#1e1e2d] border border-white/5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="m-0 text-white">{account.bankName}</h4>
                                        <p className="text-gray-500 text-xs mt-1">{t('owner')}: {account.accountHolder}</p>
                                    </div>
                                    {account.isDefault && <Tag value={t('default')} severity="info" />}
                                </div>
                                <h3 className="text-xl font-mono tracking-wider m-0 text-gray-300">{account.accountNumber}</h3>
                            </Card>
                        ))}
                    </div>
                </TabPanel>
            </TabView>

            {/* Payout Request Modal */}
            <Dialog header={t('requestPayout')} visible={isPayoutModalOpen} className="w-[400px]" onHide={() => setIsPayoutModalOpen(false)}>
                <div className="flex flex-col gap-4">
                    <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                        <p className="text-sm text-blue-200 m-0">{t('requestPayoutItems', { count: selectedEarnings.length })}</p>
                        <h2 className="text-2xl font-black text-white mt-1">
                            {formatCurrency(selectedEarnings.reduce((sum, e) => sum + Number(e.netAmount), 0))}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('selectBankAccount')}</label>
                        <Dropdown
                            value={payoutForm.payoutAccountId}
                            options={payoutAccounts}
                            optionLabel="bankName"
                            optionValue="id"
                            placeholder={t('selectAccountLabel')}
                            className="w-full"
                            onChange={(e) => setPayoutForm({ ...payoutForm, payoutAccountId: e.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button label={t('cancel')} className="p-button-text" onClick={() => setIsPayoutModalOpen(false)} />
                        <Button label={t('submitRequest')} className="p-button-primary" onClick={submitPayoutRequest} />
                    </div>
                </div>
            </Dialog>

            {/* Bank Account Modal */}
            <Dialog header={t('addPayoutAccount')} visible={isAccountModalOpen} className="w-[450px]" onHide={() => setIsAccountModalOpen(false)}>
                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('bankName')}</label>
                        <InputText value={accountForm.bankName} onChange={e => setAccountForm({ ...accountForm, bankName: e.target.value })} placeholder={t('bankPlaceholder')} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('accountHolderName')}</label>
                        <InputText value={accountForm.accountHolder} onChange={e => setAccountForm({ ...accountForm, accountHolder: e.target.value })} placeholder={t('holderPlaceholder')} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('accountNumber')}</label>
                        <InputText value={accountForm.accountNumber} onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })} placeholder={t('numberPlaceholder')} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Checkbox checked={accountForm.isDefault} onChange={e => setAccountForm({ ...accountForm, isDefault: e.checked })} id="isDefault" />
                        <label htmlFor="isDefault" className="text-sm">{t('setAsDefaultPayout')}</label>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button label={t('cancel')} className="p-button-text" onClick={() => setIsAccountModalOpen(false)} />
                        <Button label={t('saveAccount')} className="p-button-primary" onClick={handleAddAccount} />
                    </div>
                </div>
            </Dialog>

            <style>{`
                .custom-tabview .p-tabview-nav {
                    background: transparent;
                    border: none;
                }
                .custom-tabview .p-tabview-panels {
                    background: transparent;
                    padding: 0;
                }
                .custom-tabview .p-tabview-nav li .p-tabview-nav-link {
                    background: transparent;
                    border: none;
                    color: #666;
                    font-weight: bold;
                }
                .custom-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
                    color: #b000ff;
                    border-bottom: 2px solid #b000ff;
                }
            `}</style>
        </div>
    );
};

export default Finance;
