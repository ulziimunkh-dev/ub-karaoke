import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const data = await api.getPayments();
            setPayments(data);
        } catch (error) {
            console.error('Failed to load payments:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Payment History</h2>
                <button onClick={loadPayments} className="btn btn-outline" style={{ padding: '5px 15px' }}>Refresh</button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th style={{ padding: '10px' }}>Date</th>
                                <th style={{ padding: '10px' }}>Amount</th>
                                <th style={{ padding: '10px' }}>Method</th>
                                <th style={{ padding: '10px' }}>Status</th>
                                <th style={{ padding: '10px' }}>Booking ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(payment => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid #222' }}>
                                    <td style={{ padding: '10px', color: '#888' }}>
                                        {new Date(payment.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                        {Number(payment.amount).toLocaleString()} {payment.currency}
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                            background: payment.method === 'CASH' ? '#4CAF50' : '#2196F3'
                                        }}>
                                            {payment.method}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px' }}>{payment.status}</td>
                                    <td style={{ padding: '10px' }}>#{payment.bookingId}</td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No payments found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;
