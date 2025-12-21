import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

const Finance = () => {
    const { transactions, bookings, processRefund } = useData();
    const [view, setView] = useState('transactions'); // 'transactions' | 'refunds'

    const refundCandidates = bookings.filter(b => b.status === 'Cancelled' && b.paymentStatus === 'Paid');

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Finance & Payments</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className={`btn btn-sm ${view === 'transactions' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView('transactions')}
                    >
                        Transaction History
                    </button>
                    <button
                        className={`btn btn-sm ${view === 'refunds' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView('refunds')}
                    >
                        Process Refunds {refundCandidates.length > 0 && <span style={{ background: 'red', padding: '0 6px', borderRadius: '10px', fontSize: '0.8rem' }}>{refundCandidates.length}</span>}
                    </button>
                    <button className="btn btn-outline btn-sm">Export CSV</button>
                </div>
            </div>

            {view === 'transactions' && (
                <div style={{ background: '#2a2a2a', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#333', textAlign: 'left' }}>
                                <th style={{ padding: '15px' }}>ID</th>
                                <th style={{ padding: '15px' }}>Date</th>
                                <th style={{ padding: '15px' }}>Type</th>
                                <th style={{ padding: '15px' }}>Amount</th>
                                <th style={{ padding: '15px' }}>Method</th>
                                <th style={{ padding: '15px' }}>Ref ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.slice().reverse().map(tx => (
                                <tr key={tx.id} style={{ borderBottom: '1px solid #444' }}>
                                    <td style={{ padding: '15px', color: '#888' }}>#{tx.id}</td>
                                    <td style={{ padding: '15px' }}>{new Date(tx.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            color: tx.type === 'Refund' ? '#F44336' : '#4CAF50',
                                            fontWeight: 'bold'
                                        }}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>{tx.amount.toLocaleString()}₮</td>
                                    <td style={{ padding: '15px' }}>{tx.method}</td>
                                    <td style={{ padding: '15px' }}>Bk #{tx.bookingId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'refunds' && (
                <div>
                    <h3>Pending Refunds</h3>
                    {refundCandidates.length === 0 ? (
                        <p style={{ color: '#888', fontStyle: 'italic' }}>No pending refunds.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {refundCandidates.map(booking => (
                                <div key={booking.id} style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4>Booking #{booking.id} - {booking.user}</h4>
                                        <p style={{ color: '#aaa', margin: '5px 0' }}>Cancelled on {booking.date}</p>
                                        <p>Amount: <strong>{booking.total.toLocaleString()}₮</strong></p>
                                    </div>
                                    <button
                                        className="btn btn-outline"
                                        style={{ borderColor: '#F44336', color: '#F44336' }}
                                        onClick={() => processRefund(booking.id)}
                                    >
                                        Approve Refund
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Finance;
