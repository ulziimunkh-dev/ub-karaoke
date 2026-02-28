import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useLanguage } from '../../contexts/LanguageContext';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';

const CustomTooltip = ({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
    isLastStep,
    doNotShowAgain,
    setDoNotShowAgain
}) => {
    const { t } = useLanguage();

    return (
        <div {...tooltipProps} className="bg-[#1e1e2d] text-white p-4 border-round-xl shadow-6 max-w-sm">
            <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="m-0 text-lg font-bold text-[#b000ff]">{t(step.title)}</h3>
                {step.showSkipButton && !isLastStep && (
                    <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text p-button-sm text-gray-400 hover:text-white hover:surface-hover"
                        {...skipProps}
                    />
                )}
            </div>

            <div className="text-sm line-height-3 text-gray-300 mb-4">
                {t(step.content)}
            </div>

            <div className="flex flex-column gap-3">
                <div className="flex align-items-center">
                    <Checkbox
                        inputId="doNotShowAgain"
                        checked={doNotShowAgain}
                        onChange={(e) => setDoNotShowAgain(e.checked)}
                        className="mr-2"
                    />
                    <label htmlFor="doNotShowAgain" className="text-xs text-gray-400 cursor-pointer">
                        {t('tourDoNotShow')}
                    </label>
                </div>

                <div className="flex justify-content-between align-items-center mt-2 border-t border-white-alpha-10 pt-3">
                    <div className="flex gap-2">
                        {index > 0 && (
                            <Button
                                label={t('tourPrev')}
                                text
                                size="small"
                                className="text-gray-400"
                                {...backProps}
                            />
                        )}
                    </div>
                    <Button
                        label={isLastStep ? t('tourClose') : t('tourNext')}
                        size="small"
                        className="bg-gradient-to-r from-[#b000ff] to-[#5d00ff] border-none text-white font-bold"
                        {...primaryProps}
                    />
                </div>
            </div>
        </div>
    );
};

export default function StaffOnboardingTour({ embedded }) {
    const { t } = useLanguage();
    const [run, setRun] = useState(false);
    const [doNotShowAgain, setDoNotShowAgain] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenStaffTour');
        if (!hasSeenTour) {

            let timeoutId;

            // Function to check and start
            const attemptStart = () => {
                const venueSelector = document.querySelector('.tour-venue-selector');
                const roomGrid = document.querySelector('.tour-room-grid');

                // The venue selector must contain actual text/elements, not just the div
                if (venueSelector && roomGrid) {
                    timeoutId = setTimeout(() => {
                        setRun(true);
                    }, 500);
                    return true;
                }
                return false;
            };

            // First try immediately
            if (!attemptStart()) {
                // If not, use an observer to watch for DOM changes
                const observer = new MutationObserver((mutations, obs) => {
                    if (attemptStart()) {
                        obs.disconnect(); // Stop watching once found
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: false
                });

                return () => {
                    observer.disconnect();
                    clearTimeout(timeoutId);
                };
            }
        }
    }, []);

    const steps = [
        {
            target: '.tour-venue-selector',
            title: 'tourVenueTitle',
            content: 'tourVenueContent',
            disableBeacon: true,
            placement: 'bottom-start',
            spotlightPadding: 5
        },
        {
            target: '.tour-room-grid',
            title: 'tourRoomsTitle',
            content: 'tourRoomsContent',
            placement: 'top',
            spotlightPadding: 5
        }
    ];

    if (!embedded) {
        steps.push(
            {
                target: '.tour-notification-bell',
                title: 'tourNotificationTitle',
                content: 'tourNotificationContent',
                placement: 'bottom-end' // Changed to be safer if it's on the edge
            },
            {
                target: '.tour-profile-menu',
                title: 'tourProfileTitle',
                content: 'tourProfileContent',
                placement: 'bottom-end'
            }
        );
    }

    const handleJoyrideCallback = (data) => {
        const { status, type, step, action } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        console.log('Joyride Callback:', { status, type, step, action });

        if (type === 'error:target_not_found') {
            console.warn('Joyride target not found:', step.target);
        }

        if (finishedStatuses.includes(status)) {
            setRun(false);
            if (doNotShowAgain) {
                localStorage.setItem('hasSeenStaffTour', 'true');
            }
        }
    };

    if (steps.length === 0) return null;

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            showProgress
            showSkipButton
            steps={steps}
            disableOverlay={window.innerWidth < 768}
            disableScrolling={window.innerWidth < 768}
            styles={{
                options: {
                    zIndex: 100000,
                    primaryColor: '#b000ff',
                },
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }
            }}
            tooltipComponent={(props) => (
                <CustomTooltip
                    {...props}
                    doNotShowAgain={doNotShowAgain}
                    setDoNotShowAgain={setDoNotShowAgain}
                />
            )}
        />
    );
}
