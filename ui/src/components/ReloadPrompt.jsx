import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

function ReloadPrompt() {
    const swResult = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    if (!swResult) return null;

    const {
        offlineReady: offlineReadyVal,
        needUpdate: needUpdateVal,
        updateServiceWorker,
    } = swResult;

    const [offlineReady, setOfflineReady] = offlineReadyVal || [false, () => { }];
    const [needUpdate, setNeedUpdate] = needUpdateVal || [false, () => { }];

    const close = () => {
        setOfflineReady(false);
        setNeedUpdate(false);
    };

    if (!offlineReady && !needUpdate) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[2000] p-4 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl animate-[slideUp_0.3s_ease-out] max-w-sm">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <i className={`pi ${offlineReady ? 'pi-check-circle text-green-500' : 'pi-sync text-blue-500'}`}></i>
                    <span className="font-bold text-sm">
                        {offlineReady ? 'App ready to work offline' : 'New version available!'}
                    </span>
                </div>

                <p className="text-xs text-text-muted m-0">
                    {offlineReady
                        ? 'You can now use UB Karaoke without an internet connection.'
                        : 'Update now to get the latest features and fixes.'}
                </p>

                <div className="flex justify-end gap-2 mt-2">
                    {needUpdate && (
                        <Button
                            label="Reload"
                            icon="pi pi-refresh"
                            size="small"
                            onClick={() => updateServiceWorker(true)}
                            className="bg-primary border-none"
                        />
                    )}
                    <Button
                        label="Close"
                        size="small"
                        text
                        onClick={() => close()}
                        className="text-text-muted"
                    />
                </div>
            </div>
        </div>
    );
}

export default ReloadPrompt;
