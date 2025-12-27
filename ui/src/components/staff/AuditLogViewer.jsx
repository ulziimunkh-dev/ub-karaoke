import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await api.getAuditLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const dateBodyTemplate = (rowData) => {
        return new Date(rowData.createdAt).toLocaleString();
    };

    const actionBodyTemplate = (rowData) => {
        return <Tag value={rowData.action} severity="success" />;
    };

    const userBodyTemplate = (rowData) => {
        return rowData.user ? rowData.user.username : `User #${rowData.userId}`;
    };

    const resourceBodyTemplate = (rowData) => {
        return `${rowData.resource} #${rowData.resourceId}`;
    };

    const detailsBodyTemplate = (rowData) => {
        return (
            <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                {JSON.stringify(rowData.details)}
            </div>
        );
    };

    return (
        <div className="card">
            <div className="flex justify-content-between align-items-center mb-4">
                <h2 className="m-0">Audit Logs</h2>
                <Button label="Refresh" icon="pi pi-refresh" onClick={loadLogs} loading={loading} outlined />
            </div>

            <DataTable value={logs} paginator rows={10} loading={loading}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sortField="createdAt" sortOrder={-1} className="mt-2">
                <Column field="createdAt" header="Date" body={dateBodyTemplate} sortable></Column>
                <Column field="action" header="Action" body={actionBodyTemplate} sortable></Column>
                <Column field="user.username" header="User" body={userBodyTemplate} sortable></Column>
                <Column field="resource" header="Resource" body={resourceBodyTemplate} sortable></Column>
                <Column field="details" header="Details" body={detailsBodyTemplate}></Column>
            </DataTable>
        </div>
    );
};

export default AuditLogViewer;
