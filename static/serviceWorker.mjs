/* eslint-env serviceworker */
/* eslint no-restricted-globals: ["warn"] */

function createDocumentErrorResponse ()
{
    let html;
    if (navigator.onLine === false)
    {
        html = 'You are offline, yo.';
    }
    else
    {
        html = 'Not available.';
    }

    return new Response(html, {
        status: 200,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/html',
        }),
    });
}

function handleInstall ()
{
    self.skipWaiting();
}

function handleActivate ()
{
    return self.clients.claim();
}

async function handleFetch (request)
{
    try
    {
        return await fetch(request);
    }
    catch (error)
    {
        if (request.destination === 'document')
        {
            return createDocumentErrorResponse(request);
        }

        throw error;
    }
}


self.addEventListener('install', (event) => {
    event.waitUntil(handleInstall());
});
self.addEventListener('activate', (event) => {
    event.waitUntil(handleActivate());
});
self.addEventListener('fetch', (event) => event.respondWith(handleFetch(event.request)));
