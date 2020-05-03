const TAG_NAME = 'service-worker';

class ServiceWorker extends HTMLElement
{
    connectedCallback ()
    {
        if (!this.isConnected)
        {
            return;
        }

        const href = this.getAttribute('href');

        if (
            'serviceWorker' in navigator
            && (
                window.location.protocol === 'https:'
                || /^(localhost|127\.0\.0\.1|::1|)$/.test(
                    window.location.hostname.toLowerCase(),
                )
            )
        )
        {
            navigator.serviceWorker.register(href);
        }
    }
}

export { TAG_NAME };
export default ServiceWorker;
