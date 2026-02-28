export const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
};

export const isTabletDevice = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua.toLowerCase());
};

export const canOpenApp = () => {
    return isMobileDevice() || isTabletDevice();
};
