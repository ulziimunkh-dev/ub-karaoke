import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';

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

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Audit Logs</h2>
                <button onClick={loadLogs} className="btn btn-outline" style={{ padding: '5px 15px' }}>Refresh</button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{ padding: '10px' }}>Date</th>
                                <th style={{ padding: '10px' }}>Action</th>
                                <th style={{ padding: '10px' }}>User</th>
                                <th style={{ padding: '10px' }}>Resource</th>
                                <th style={{ padding: '10px' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '10px', color: '#888' }}>
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#4CAF50' }}>
                                        {log.action}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {log.user ? log.user.username : `User #${log.userId}`}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {log.resource} #{log.resourceId}
                                    </td>
                                    <td style={{ padding: '10px', fontSize: '0.85rem', color: '#aaa', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {JSON.stringify(log.details)}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No logs found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AuditLogViewer;
