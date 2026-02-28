import React, { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { useNotifications } from '../contexts/NotificationContext';
import { Divider } from 'primereact/divider';
import { useLanguage } from '../contexts/LanguageContext';

const NotificationBell = () => {
    const op = useRef(null);
    const [viewAllVisible, setViewAllVisible] = useState(false);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        connected
    } = useNotifications();
    const { t } = useLanguage();

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
                tooltip={t('notifications')}
                tooltipOptions={{ position: 'bottom' }}
            >
                {unreadCount > 0 && <Badge value={unreadCount} severity="danger" className="absolute top-0 right-0" />}
            </Button>

            {!connected && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-500 border-circle border-2 border-white" title={t('offline')} />
            )}

            <OverlayPanel ref={op} style={{ width: '350px' }} className="shadow-4">
                <div className="flex justify-content-between align-items-center mb-3">
                    <span className="text-xl font-bold">{t('notifications')}</span>
                    {unreadCount > 0 && (
                        <Button label={t('markAllRead')} text size="small" onClick={markAllAsRead} />
                    )}
                </div>

                <Divider className="my-2" />

                <div className="max-h-30rem overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="text-center p-4 text-color-secondary">
                            <i className="pi pi-bell-slash text-4xl mb-2 opacity-20" />
                            <p>{t('noNotifications')}</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-3 border-round mb-2 cursor-pointer transition-colors transition-duration-200 ${!notif.readAt ? 'border-left-3 border-blue-500' : 'hover:surface-100'}`}
                                style={!notif.readAt ? { backgroundColor: 'var(--blue-100, #dbeafe)' } : {}}
                                onClick={() => !notif.readAt && markAsRead(notif.id)}
                            >
                                <div className="flex align-items-start gap-3">
                                    <i className={getIcon(notif)} style={{ fontSize: '1.2rem', marginTop: '2px' }} />
                                    <div className="flex-1">
                                        <div className="flex align-items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-color">{t(notif.title)}</span>
                                            {!notif.readAt && (
                                                <span className="inline-block border-circle bg-blue-500" style={{ width: '8px', height: '8px', flexShrink: 0 }} />
                                            )}
                                        </div>
                                        <div className="text-xs text-color mb-2 line-height-3" style={{ opacity: 0.75 }}>{t(notif.message)}</div>
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
                    <Button label={t('viewAll')} text size="small" onClick={() => {
                        op.current.hide();
                        setViewAllVisible(true);
                    }} />
                </div>
            </OverlayPanel>

            <Dialog
                header={
                    <div className="flex justify-content-between align-items-center pr-4">
                        <span className="text-xl font-bold">{t('notifications')}</span>
                        {unreadCount > 0 && (
                            <Button label={t('markAllRead')} text size="small" onClick={markAllAsRead} />
                        )}
                    </div>
                }
                visible={viewAllVisible}
                style={{ width: '90vw', maxWidth: '600px' }}
                onHide={() => setViewAllVisible(false)}
            >
                <div className="flex flex-column gap-3 mt-3">
                    {notifications.length === 0 ? (
                        <div className="text-center p-6 text-color-secondary">
                            <i className="pi pi-bell-slash text-6xl mb-4 opacity-20" />
                            <p className="text-xl">{t('noNotifications')}</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 border-round surface-card border-1 border-white-alpha-10 shadow-1 flex align-items-start gap-3 transition-colors transition-duration-200 ${!notif.readAt ? 'border-left-3 border-blue-500' : ''}`}
                                style={!notif.readAt ? { backgroundColor: 'var(--blue-100, #dbeafe)' } : {}}
                                onClick={() => !notif.readAt && markAsRead(notif.id)}
                            >
                                <i className={`${getIcon(notif)} text-xl`} style={{ marginTop: '2px' }} />
                                <div className="flex-1">
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <div className="flex align-items-center gap-2">
                                            <span className="text-base font-bold text-color">{t(notif.title)}</span>
                                            {!notif.readAt && (
                                                <span className="inline-block border-circle bg-blue-500" style={{ width: '8px', height: '8px', flexShrink: 0 }} />
                                            )}
                                        </div>
                                        <span className="text-xs text-color-secondary font-mono bg-white-alpha-10 px-2 py-1 border-round">{formatDate(notif.createdAt)}</span>
                                    </div>
                                    <div className="text-sm text-color-secondary line-height-3 mb-3">{t(notif.message)}</div>
                                    <div className="flex justify-content-end">
                                        <Button
                                            icon="pi pi-trash"
                                            label={t('delete') || "Delete"}
                                            text
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
                        ))
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default NotificationBell;
