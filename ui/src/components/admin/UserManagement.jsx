import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';

const UserManagement = () => {
    const { users, addUser, updateUser, toggleUserStatus, currentUser } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'staff', name: '' });

    const handleAddUser = (e) => {
        e.preventDefault();
        addUser({ ...newUser, isActive: true });
        setNewUser({ username: '', password: '', role: 'staff', name: '' });
        setIsModalOpen(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>User Management</h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Staff</button>
            </div>

            <div style={{ background: '#2a2a2a', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#333', textAlign: 'left' }}>
                            <th style={{ padding: '15px' }}>Name</th>
                            <th style={{ padding: '15px' }}>Username</th>
                            <th style={{ padding: '15px' }}>Role</th>
                            <th style={{ padding: '15px' }}>Status</th>
                            <th style={{ padding: '15px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid #444' }}>
                                <td style={{ padding: '15px' }}>{user.name}</td>
                                <td style={{ padding: '15px' }}>{user.username}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                        background: user.role === 'admin' ? '#E91E63' : '#2196F3', color: 'white'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{ color: user.isActive ? '#4CAF50' : '#F44336' }}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    {user.id !== currentUser.id && user.role !== 'admin' && (
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => toggleUserStatus(user.id)}
                                        >
                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#222', padding: '30px', borderRadius: '10px', width: '400px' }}>
                        <h3>Add New Staff</h3>
                        <form onSubmit={handleAddUser} style={{ display: 'grid', gap: '15px' }}>
                            <input
                                placeholder="Full Name"
                                value={newUser.name}
                                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                required
                            />
                            <input
                                placeholder="Username"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                required
                            />
                            <input
                                placeholder="Password"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                                required
                            />
                            <select
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                style={{ padding: '10px', background: '#333', border: 'none', color: 'white' }}
                            >
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
