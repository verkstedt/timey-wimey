/* eslint-env serviceworker */

'use strict';

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

async function handlePush (jsonData)
{
    const {
        notification: { title, ...options },
    } = JSON.parse(jsonData);
    self.registration.showNotification(title, options);
}


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

function isRequestHtml (request)
{
    return (
        request.url === '/'
        // eslint-disable-next-line no-magic-numbers
        || request.url.indexOf('.html') !== -1
    );
}

self.addEventListener('install', event => {
    event.waitUntil(handleInstall());
});
self.addEventListener('activate', event => {
    event.waitUntil(handleActivate());
});
self.addEventListener('fetch', event => {
    return event.respondWith(handleFetch(event.request));
});
self.addEventListener('push', event => {
    event.waitUntil(handlePush(event.data.text()));
});
