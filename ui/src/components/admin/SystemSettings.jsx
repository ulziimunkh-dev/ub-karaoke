import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

const SystemSettings = () => {
    const { settings, setSettings, promos } = useData();
    const [tempSettings, setTempSettings] = useState(settings);

    const handleSave = () => {
        setSettings(tempSettings);
        alert('Settings Saved!');
    };

    return (
        <div>
            <h2>System Settings</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px' }}>
                {/* Financial Config */}
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                    <h3>Financial Configuration</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>VAT Tax Rate (0.1 = 10%)</label>
                            <input
                                type="number" step="0.01"
                                value={tempSettings.taxRate}
                                onChange={e => setTempSettings({ ...tempSettings, taxRate: parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '10px', background: '#333', border: 'none', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Service Charge (0.05 = 5%)</label>
                            <input
                                type="number" step="0.01"
                                value={tempSettings.serviceCharge}
                                onChange={e => setTempSettings({ ...tempSettings, serviceCharge: parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '10px', background: '#333', border: 'none', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Currency Symbol</label>
                            <input
                                value={tempSettings.currency}
                                onChange={e => setTempSettings({ ...tempSettings, currency: e.target.value })}
                                style={{ width: '100%', padding: '10px', background: '#333', border: 'none', color: 'white' }}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                    </div>
                </div>

                {/* Promo Codes */}
                <div style={{ background: '#2a2a2a', padding: '20px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Promo Codes</h3>
                        <button className="btn btn-sm btn-outline">+ Add</button>
                    </div>

                    <div style={{ marginTop: '15px' }}>
                        {promos.map((promo, idx) => (
                            <div key={idx} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px', background: '#333', marginBottom: '10px', borderRadius: '5px'
                            }}>
                                <div>
                                    <span style={{ fontWeight: 'bold', color: '#FFC107' }}>{promo.code}</span>
                                    <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#ccc' }}>
                                        {promo.discountPercent ? `${promo.discountPercent}% OFF` : `-${promo.discountAmount}₮`}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>Exp: {promo.expiry}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
