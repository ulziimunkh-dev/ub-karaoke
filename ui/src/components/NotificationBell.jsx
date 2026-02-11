import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Badge } from 'primereact/badge';
import { useNotifications } from '../contexts/NotificationContext';
import { Divider } from 'primereact/divider';

const NotificationBell = () => {
    const op = useRef(null);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        connected
    } = useNotifications();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getIcon = (notif) => {
        const title = (notif.title || '').toLowerCase();
        if (title.includes('approved') || title.includes('confirmed') || title.includes('checked'))
            return 'pi pi-check-circle text-green-500';
        if (title.includes('rejected'))
            return 'pi pi-times-circle text-red-500';
        if (title.includes('expired'))
            return 'pi pi-exclamation-circle text-orange-500';
        if (title.includes('reminder'))
            return 'pi pi-bell text-yellow-500';
        if (title.includes('reserved') || title.includes('created'))
            return 'pi pi-calendar-plus text-blue-500';
        if (title.includes('completed'))
            return 'pi pi-star text-purple-500';
        return 'pi pi-info-circle text-blue-500';
    };

    return (
        <div className="relative inline-flex align-items-center">
            <Button
                icon="pi pi-bell"
                rounded
                text
                severity="secondary"
                onClick={(e) => op.current.toggle(e)}
                tooltip="Notifications"
                tooltipOptions={{ position: 'bottom' }}
            >
                {unreadCount > 0 && <Badge value={unreadCount} severity="danger" className="absolute top-0 right-0" />}
            </Button>

            {!connected && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 border-circle border-2 border-white" title="Offline" />
            )}

            <OverlayPanel ref={op} style={{ width: '350px' }} className="shadow-4">
                <div className="flex justify-content-between align-items-center mb-3">
                    <span className="text-xl font-bold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button label="Mark all read" text size="small" onClick={markAllAsRead} />
                    )}
                </div>

                <Divider className="my-2" />

                <div className="max-h-30rem overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="text-center p-4 text-color-secondary">
                            <i className="pi pi-bell-slash text-4xl mb-2 opacity-20" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-3 border-round mb-2 cursor-pointer transition-colors transition-duration-200 ${!notif.readAt ? 'bg-blue-50 border-left-3 border-blue-500' : 'hover:surface-100'}`}
                                onClick={() => !notif.readAt && markAsRead(notif.id)}
                            >
                                <div className="flex align-items-start gap-3">
                                    <i className={getIcon(notif)} style={{ fontSize: '1.2rem', marginTop: '2px' }} />
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold mb-1">{notif.title}</div>
                                        <div className="text-xs text-color-secondary mb-2 line-height-3">{notif.message}</div>
                                        <div className="flex justify-content-between align-items-center">
                                            <span className="text-xs opacity-60">{formatDate(notif.createdAt)}</span>
                                            <Button
                                                icon="pi pi-trash"
                                                text
                                                rounded
                                                severity="danger"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notif.id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <Divider className="my-2" />

                <div className="text-center mt-2">
                    <Button label="View All" text size="small" />
                </div>
            </OverlayPanel>
        </div>
    );
};

export default NotificationBell;
