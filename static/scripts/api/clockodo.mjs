/* eslint-disable no-console */

// TODO Make sure abstraction layer works fine with other APIs:
//      - clockify: https://clockify.me/developers-api
//      - toggl: https://github.com/toggl/toggl_api_docs/blob/master/toggl_api.md

const URL_BASE = 'https://my.clockodo.com/api';

class ApiClockodo
{
    user = null;

    key = null;

    // const actionQueue = [];

     cache = {
         customers: new Map(),
         projects: new Map(),
         taskTypes: new Map(),
     };

     constructor (user, key)
     {
         this.user = user;
         this.key = key;
     }

     static mapCustomer (customer)
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

     static mapProject (project)
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

     static mapTaskType (service)
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

     mapEntry (entry)
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
                 value: this.cache.projects.get(projectId).name,
             },
             taskType: {
                 id: taskTypeId,
                 value: this.cache.taskTypes.get(taskTypeId).name,
             },
             task: {
                 value: taskName,
             },
             start: new Date(startDateString),
             end: endDateString ? new Date(endDateString) : null,
         };
     }

     static formatDate (date)
     {
         return date.toISOString().replace('T', ' ').replace(/\..*$/, '');
     }

     updateCache (data)
     {
         if (data.projects)
         {
             Object.values(data.projects).forEach(
                 (rawCustomerOrProject) => {
                     let rawProjects;
                     if (!rawCustomerOrProject.projects)
                     {
                         rawProjects = [rawCustomerOrProject];
                     }
                     else
                     {
                         const rawCustomer = rawCustomerOrProject;
                         this.cache.customers.set(
                             Number(rawCustomer.id),
                             this.constructor.mapCustomer(rawCustomer),
                         );
                         rawProjects = rawCustomer.projects;
                     }

                     rawProjects.forEach((rawProject) => {
                         this.cache.projects.set(
                             Number(rawProject.id),
                             this.constructor.mapProject(rawProject),
                         );
                     });
                 },
             );
         }
         if (data.services)
         {
             Object.values(data.services).forEach((rawService) => {
                 this.cache.taskTypes.set(
                     Number(rawService.id),
                     this.constructor.mapTaskType(rawService),
                 );
             });
         }
         if (data.billable)
         {
             Object.entries(data.billable).forEach(([key, value]) => {
                 const billable = Boolean(value);
                 const keyParts = key.split('-');
                 if (keyParts.length === 1)
                 {
                     const customerId = Number(keyParts[0]);
                     this.cache.customers.get(customerId).billable =
                        billable;
                 }
                 else if (keyParts.length === 2)
                 {
                     const projectId = Number(keyParts.pop());
                     this.cache.projects.get(projectId).billable =
                        billable;
                 }
             });
         }
     }

    apiRequest = async (
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
                'X-ClockodoApiUser': this.user,
                'X-ClockodoApiKey': this.key,
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
        this.updateCache(data);
        return data;
    };

    apiGet = this.apiRequest.bind(null, 'get');

    apiPost = this.apiRequest.bind(null, 'post');

    // apiPut = this.apiRequest.bind(null, 'put');
    apiDelete = this.apiRequest.bind(null, 'delete');


    async login (user, key) // TODO Check if valid
    {
        this.user = user;
        this.key = key;
        return true;
    }

    async fetchCurrent ()
    {
        const result = await this.apiGet('clock/update');
        return this.mapEntry(result.running);
    }

    async fetchProjects ()
    {
        if (this.cache.projects.size === 0)
        {
            await this.fetchCurrent();
        }
        return this.cache.projects;
    }

    async fetchTaskTypes ()
    {
        if (this.cache.taskTypes.size === 0)
        {
            await this.fetchCurrent();
        }
        return this.cache.taskTypes;
    }

    async fetchHistory (dateStart, dateEnd)
    {
        const result = await this.apiGet('entries', {
            time_since: this.constructor.formatDate(dateStart),
            time_until: this.constructor.formatDate(dateEnd),
        });
        return result.entries.map(this.mapEntry.bind(this));
    }

    async stop (id)
    {
        await this.apiDelete('clock', { id });
    }

    async start (
        projectId,
        taskTypeId,
        taskName,
        { billable = null } = {},
    )
    {
        const project = this.getProject(projectId);
        const projectCustomerId = this.getProjectCustomerId(projectId);

        const billableFlag =
            (billable == null) ? project.billable : billable;

        const response = await this.apiPost('clock', {
            customers_id: projectCustomerId,
            projects_id: projectId,
            services_id: taskTypeId,
            text: taskName,
            billable: Number(billableFlag),
        });

        return this.mapEntry(response.running);
    }

    async update (
        id,
        {
            start = null,
            stop = null,
            project = null,
            taskType = null,
            task = null,
            billable = null,
        },
    )
    {
        const params = { id };

        if (start != null)
        {
            params.time_since = this.formatDate(start);
        }

        if (stop != null)
        {
            params.time_until = this.formatDate(stop);
        }

        if (project != null)
        {
            params.projects_id = project;
            params.customers_id = this.getProjectCustomerId(project);
        }

        if (taskType != null)
        {
            params.services_id = taskType;
        }

        if (task != null)
        {
            params.text = task;
        }

        if (billable != null)
        {
            params.billable = Number(billable);
        }

        const response = await this.apiPost('entries', params);

        return this.mapEntry(response.entry);
    }

    getProject (projectId)
    {
        const project = this.cache.projects.get(projectId);

        if (project == null)
        {
            throw new Error(`Unknown project id=${projectId}`);
        }

        return project;
    }

    getProjectCustomerId (projectId)
    {
        let projectCustomerId = null;
        // eslint-disable-next-line no-restricted-syntax
        for (const customer of this.cache.customers.values())
        {
            if (customer.projectIds.has(projectId))
            {
                projectCustomerId = customer.id;
                break;
            }
        }

        if (projectCustomerId === null)
        {
            throw new Error(`Failed to determine customer for a project id=${projectId}`);
        }

        return projectCustomerId;
    }
}

export default ApiClockodo;
