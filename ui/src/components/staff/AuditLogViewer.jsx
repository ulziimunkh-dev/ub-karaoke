import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';

const AuditLogViewer = () => {
    const { t } = useLanguage();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [allActions, setAllActions] = useState([]);
    const { staffs } = useData();

    useEffect(() => {
        // Fetch all actions once on mount to populate the dropdown exhaustively
        const fetchInitialActions = async () => {
            try {
                const data = await api.getAuditLogs();
                const actions = [...new Set(data.map(l => l.action?.toUpperCase()))].filter(Boolean).sort();
                setAllActions(actions);
            } catch (err) {
                console.error('Failed to pre-fetch actions:', err);
            }
        };
        fetchInitialActions();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [selectedAction, selectedStaff]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await api.getAuditLogs({
                action: selectedAction || undefined,
                staffId: selectedStaff || undefined
            });
            setLogs(data);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const dateBodyTemplate = (rowData) => {
        const d = new Date(rowData.createdAt);
        return (
            <div className="flex flex-col">
                <span className="font-bold text-white text-xs">{d.toLocaleDateString()}</span>
                <span className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{d.toLocaleTimeString()}</span>
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        const action = rowData.action?.toUpperCase();
        let severity = 'info';
        if (action.includes('DELETE') || action.includes('REVOKE')) severity = 'danger';
        if (action.includes('CREATE') || action.includes('ADD')) severity = 'success';
        if (action.includes('UPDATE') || action.includes('EDIT')) severity = 'warning';

        return <Tag value={action} severity={severity} className="text-[9px] px-2 py-0.5" />;
    };

    const userBodyTemplate = (rowData) => {
        const name = rowData.actorName || (rowData.staff?.username || rowData.user?.username || 'System');
        const type = rowData.actorType || (rowData.staffId ? 'STAFF' : (rowData.userId ? 'USER' : 'SYSTEM'));
        const initial = (name || 'S').charAt(0).toUpperCase();

        return (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black border border-white/10 text-[#eb79b2]">
                    {initial}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300">{name}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${type === 'STAFF' ? 'text-blue-400' : (type === 'USER' ? 'text-green-400' : 'text-gray-500')}`}>
                        {type}
                    </span>
                </div>
            </div>
        );
    };

    const deviceBodyTemplate = (rowData) => {
        return (
            <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono text-gray-400">{rowData.ipAddress || '0.0.0.0'}</span>
                <span className="text-[8px] text-gray-600 truncate max-w-[120px]" title={rowData.userAgent}>
                    {rowData.userAgent || 'Unknown'}
                </span>
            </div>
        );
    };

    const resourceBodyTemplate = (rowData) => {
        return (
            <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black text-white uppercase tracking-tighter italic">{rowData.resource}</span>
                <span className="text-[9px] text-gray-500 font-mono">ID: {rowData.resourceId}</span>
            </div>
        );
    };

    const detailsBodyTemplate = (rowData) => {
        return (
            <div className="text-[10px] text-gray-500 font-mono max-h-12 overflow-y-auto custom-scrollbar p-2 bg-black/20 rounded border border-white/5 leading-relaxed">
                {JSON.stringify(rowData.details)}
            </div>
        );
    };

    return (
        <div className="audit-viewer">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white m-0 uppercase tracking-tighter">{t('auditLogs')}</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium italic">{t('auditLogsDesc')}</p>
                </div>
                <Button
                    label={t('refreshStream')}
                    icon="pi pi-refresh"
                    onClick={loadLogs}
                    loading={loading}
                    className="h-10 px-6 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 transition-all font-bold text-sm"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-6 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('filterByEvent')}</span>
                    <Dropdown
                        value={selectedAction}
                        options={[
                            { label: t('allEvents'), value: null },
                            ...(allActions.length > 0 ? allActions : [...new Set(logs.map(l => l.action?.toUpperCase()))].filter(Boolean).sort()).map(a => ({ label: a, value: a }))
                        ]}
                        onChange={(e) => setSelectedAction(e.value)}
                        optionLabel="label"
                        optionValue="value"
                        placeholder={t('allEvents')}
                        className="w-48 text-sm bg-black/20 border-white/10"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t('filterByStaff')}</span>
                    <Dropdown
                        value={selectedStaff}
                        options={[
                            { label: t('allStaff'), value: null },
                            ...(staffs?.map(s => ({ label: s.username || s.fullName, value: s.id })) || [])
                        ]}
                        onChange={(e) => setSelectedStaff(e.value)}
                        optionLabel="label"
                        optionValue="value"
                        placeholder={t('allStaff')}
                        className="w-48 text-sm bg-black/20 border-white/10"
                    />
                </div>
            </div>

            <Card className="bg-[#1a1a24] border border-white/5 shadow-2xl p-0 overflow-hidden">
                <DataTable
                    value={logs}
                    paginator
                    rows={15}
                    loading={loading}
                    rowsPerPageOptions={[15, 30, 50]}
                    sortField="createdAt"
                    sortOrder={-1}
                    className="p-datatable-sm select-none"
                    responsiveLayout="scroll"
                >
                    <Column field="createdAt" header={t('timestamp')} body={dateBodyTemplate} sortable headerClassName="bg-white/5 font-bold px-4 py-3 text-gray-400 uppercase text-[10px] tracking-widest text-left" style={{ width: '150px' }}></Column>
                    <Column field="action" header={t('activity')} body={actionBodyTemplate} sortable headerClassName="bg-white/5 font-bold px-4 py-3 text-gray-400 uppercase text-[10px] tracking-widest text-left" style={{ width: '120px' }}></Column>
                    <Column field="actorName" header={t('actor')} body={userBodyTemplate} sortable headerClassName="bg-white/5 font-bold px-4 py-3 text-gray-400 uppercase text-[10px] tracking-widest text-left"></Column>
                    <Column field="resource" header={t('targetEntity')} body={resourceBodyTemplate} sortable headerClassName="bg-white/5 font-bold px-4 py-3 text-gray-400 uppercase text-[10px] tracking-widest text-left"></Column>
                    <Column field="ipAddress" header="IP / Device" body={deviceBodyTemplate} headerClassName="bg-white/5 font-bold px-4 py-3 text-gray-400 uppercase text-[10px] tracking-widest text-left" style={{ width: '150px' }}></Column>
                    <Column field="details" header={t('eventMetadata')} body={detailsBodyTemplate} headerClassName="bg-white/5 font-bold px-4 py-3 text-gray-400 uppercase text-[10px] tracking-widest text-left"></Column>
                </DataTable>
            </Card>

            <style>{`
                .audit-viewer .p-card-body {
                    padding: 0;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
                .p-datatable .p-datatable-tbody > tr {
                    background: transparent !important;
                    color: white !important;
                    border-bottom: 1px solid rgba(255,255,255,0.03) !important;
                }
                .p-datatable .p-datatable-tbody > tr:hover {
                    background: rgba(255,255,255,0.01) !important;
                }
            `}</style>
        </div>
    );
};

export default AuditLogViewer;
