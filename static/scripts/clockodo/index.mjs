/* eslint-disable no-console */

const URL_BASE = 'https://my.clockodo.com/api';

const email = localStorage.getItem('email');
const token = localStorage.getItem('token');

// const actionQueue = [];

const cache = {
    customers: new Map(),
    projects: new Map(),
    taskTypes: new Map(),
};

function mapCustomer (customer)
{
    const {
        id,
        name,
    } = customer;

    return {
        id: Number(id),
        name,
        projectIds: new Set(
            customer.projects.map((project) => Number(project.id)),
        ),
    };
}

function mapProject (project)
{
    const {
        id,
        name,
    } = project;

    return {
        id: Number(id),
        name,
    };
}

function mapTaskType (service)
{
    const {
        id,
        name,
    } = service;

    return {
        id: Number(id),
        name,
    };
}

function mapEntry (entry)
{
    if (entry === null)
    {
        return null;
    }

    const {
        projects_id: projectId,
        services_id: taskTypeId,
        text: taskName,
        time_since: startDateString,
        time_until: endDateString,
    } = entry;

    return {
        id: entry.id,
        project: {
            id: projectId,
            value: cache.projects.get(projectId).name,
        },
        taskType: {
            id: taskTypeId,
            value: cache.taskTypes.get(taskTypeId).name,
        },
        task: {
            value: taskName,
        },
        start: new Date(startDateString),
        end: new Date(endDateString),
    };
}

function formatDate (date)
{
    return date.toISOString().replace('T', ' ').replace(/\..*$/, '');
}

function updateCache (data)
{
    if (data.projects)
    {
        Object.values(data.projects).forEach((rawCustomerOrProject) => {
            let rawProjects;
            if (!rawCustomerOrProject.projects)
            {
                rawProjects = [rawCustomerOrProject];
            }
            else
            {
                const rawCustomer = rawCustomerOrProject;
                cache.customers.set(
                    Number(rawCustomer.id),
                    mapCustomer(rawCustomer),
                );
                rawProjects = rawCustomer.projects;
            }

            rawProjects.forEach((rawProject) => {
                cache.projects.set(
                    Number(rawProject.id),
                    mapProject(rawProject),
                );
            });
        });
    }
    if (data.services)
    {
        Object.values(data.services).forEach((rawService) => {
            cache.taskTypes.set(
                Number(rawService.id),
                mapTaskType(rawService),
            );
        });
    }
}

const apiRequest = async (
    method,
    resource,
    { id = null, ...parameters } = {},
) => {
    const url = new URL(`${URL_BASE}/${resource}`);
    if (id !== null)
    {
        url.pathname += `/${id}`;
    }
    const options = {
        method,
        headers: {
            'Accept-Language': navigator.language.split('-')[0],
            'X-ClockodoApiUser': email,
            'X-ClockodoApiKey': token,
        },
    };
    if (Object.keys(parameters).length)
    {
        if (method.toUpperCase() === 'GET')
        {
            url.search = new URLSearchParams(parameters);
        }
        else
        {
            options.body = new URLSearchParams(parameters);
        }
    }
    const response = await fetch(url, options);
    // TODO Handle 401: Unauthorized
    if (response.status !== 200)
    {
        throw new Error(`Got ${response.status} from API`);
    }
    const data = await response.json();
    updateCache(data);
    return data;
};
const apiGet = apiRequest.bind(null, 'get');
const apiPost = apiRequest.bind(null, 'post');
// const apiPut = apiRequest.bind(null, 'put');
const apiDelete = apiRequest.bind(null, 'delete');


async function isAuthorized ()
{
    return email !== null && token !== null;
}

async function login (userEmail, userToken)
{
    localStorage.setItem('email', userEmail);
    localStorage.setItem('token', userToken);
    window.location.reload();
}

async function logout ()
{
    localStorage.clear();
    window.location.reload();
}

// FIXME Make fetchProjects and fetchTaskTypes independent
//       of fetchCurrent

async function fetchCurrent ()
{
    const result = await apiGet('clock/update');
    return mapEntry(result.running);
}

async function fetchProjects ()
{
    return cache.projects;
}

async function fetchTaskTypes ()
{
    return cache.taskTypes;
}

async function fetchHistory (dateStart, dateEnd)
{
    const result = await apiGet('entries', {
        time_since: formatDate(dateStart),
        time_until: formatDate(dateEnd),
    });
    return result.entries.map(mapEntry);
}

async function stop (id)
{
    await apiDelete('clock', { id });
}

async function start (projectId, taskTypeId, taskName)
{
    let projectCustomerId = null;
    // eslint-disable-next-line no-restricted-syntax
    for (const customer of cache.customers.values())
    {
        if (customer.projectIds.has(projectId))
        {
            projectCustomerId = customer.id;
            break;
        }
    }
    if (projectCustomerId === null)
    {
        console.error(projectId, cache);
        throw new Error('Failed to determine customer for a project');
    }

    const response = await apiPost('clock', {
        customers_id: projectCustomerId,
        projects_id: projectId,
        services_id: taskTypeId,
        text: taskName,
        billable: 1, // TODO
    });

    return mapEntry(response.running);
}

// async function update (id, data)
// {
// }


export {
    isAuthorized,
    login,
    logout,
    fetchProjects,
    fetchTaskTypes,
    fetchCurrent,
    fetchHistory,
    stop,
    start,
    // update,
};
