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
         internalCustomers: new Map(),
         internalProjects: new Map(),
         internalServices: new Map(),
     };

     constructor (user, key)
     {
         this.user = user;
         this.key = key;
     }

     static mapInternalCustomer (customer)
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

     static mapInternalProject (project)
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

     static mapInternalService (service)
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

     static mapProject ({
         internalCustomer,
         internalProject,
         internalService,
     })
     {
         return {
             id: `${internalProject.id}+${internalService.id}`,
             name: `${internalService.name}, ${internalProject.name}, ${internalCustomer.name}`,
         };
     }

     destructProjectId (projectId)
     {
         const [
             internalProjectIdString,
             internalServiceIdString,
         ] = projectId.split('+');

         const internalProjectId = Number(internalProjectIdString);
         const internalServiceId = Number(internalServiceIdString);
         const internalCustomerId =
            this.getProjectCustomerId(internalProjectId);

         return {
             internalCustomerId,
             internalProjectId,
             internalServiceId,
         };
     }

     mapEntry (entry)
     {
         if (entry === null)
         {
             return null;
         }

         const {
             customers_id: internalCustomerId,
             customers_name: internalCustomerName,
             projects_id: internalProjectId,
             projects_name: internalProjectName,
             services_id: internalServiceId,
             services_name: internalServiceName,
             text: taskName,
             time_since: startDateString,
             time_until: endDateString,
         } = entry;

         const internalCustomer = this.cache.internalCustomers
             .get(internalCustomerId) || {
             id: Number(internalCustomerId),
             name: internalCustomerName,
             projectId: new Set([Number(internalProjectId)]),
         };
         const internalProject = this.cache.internalProjects
             .get(internalProjectId) || {
             id: Number(internalProjectId),
             name: internalProjectName,
         };
         const internalService = this.cache.internalServices
             .get(internalServiceId) || {
             id: Number(internalServiceId),
             name: internalServiceName,
         };

         return {
             id: entry.id,
             project: this.constructor.mapProject({
                 internalCustomer,
                 internalProject,
                 internalService,
             }),
             task: {
                 value: taskName,
             },
             start: new Date(startDateString),
             end: endDateString ? new Date(endDateString) : null,
         };
     }

     static formatDate (date)
     {
         const d = new Date(date);
         d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
         return d.toISOString().replace('T', ' ').replace(/\..*$/, '');
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
                         this.cache.internalCustomers.set(
                             Number(rawCustomer.id),
                             this.constructor.mapInternalCustomer(
                                 rawCustomer,
                             ),
                         );
                         rawProjects = rawCustomer.projects;
                     }

                     rawProjects.forEach((rawProject) => {
                         this.cache.internalProjects.set(
                             Number(rawProject.id),
                             this.constructor.mapInternalProject(
                                 rawProject,
                             ),
                         );
                     });
                 },
             );
         }
         if (data.services)
         {
             Object.values(data.services).forEach((rawService) => {
                 this.cache.internalServices.set(
                     Number(rawService.id),
                     this.constructor.mapInternalService(rawService),
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
                     this.cache.internalCustomers
                         .get(customerId).billable = billable;
                 }
                 else if (keyParts.length === 2)
                 {
                     const projectId = Number(keyParts.pop());
                     this.cache.internalProjects
                         .get(projectId).billable = billable;
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
            let body;
            try
            {
                body = await response.json();
                body = body?.error?.message || JSON.stringify(body);
            }
            catch (_)
            {
                body = '(non-JSON response)';
            }
            throw new Error(`Got ${response.status} from API: ${body}`);
        }
        const data = await response.json();
        this.updateCache(data);
        return data;
    };

    apiGet = this.apiRequest.bind(null, 'get');

    apiPost = this.apiRequest.bind(null, 'post');

    apiPut = this.apiRequest.bind(null, 'put');

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

    async fetchInternalCustomers ()
    {
        if (this.cache.internalCustomers.size === 0)
        {
            await this.fetchCurrent();
        }
        return this.cache.internalCustomers;
    }

    async fetchInternalProjects ()
    {
        if (this.cache.internalProjects.size === 0)
        {
            await this.fetchCurrent();
        }
        return this.cache.internalProjects;
    }

    async fetchInternalServices ()
    {
        if (this.cache.internalServices.size === 0)
        {
            await this.fetchCurrent();
        }
        return this.cache.internalServices;
    }

    async fetchProjects ()
    {
        const internalCustomers = await this.fetchInternalCustomers();
        const internalProjects = await this.fetchInternalProjects();
        const internalServices = await this.fetchInternalServices();

        // FIXME Not all project × service combinations make sense
        const projects = [];
        internalServices.forEach((internalService) => {
            internalProjects.forEach((internalProject) => {
                const internalCustomer =
                    Array.from(internalCustomers.values()).find(
                        ({ projectIds }) => projectIds.has(
                            internalProject.id,
                        ),
                    );
                projects.push(
                    this.constructor.mapProject({
                        internalCustomer,
                        internalProject,
                        internalService,
                    }),
                );
            });
        });

        // TODO Group by client + project
        // TODO Add “Frequently used“ group
        return projects;
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
        taskName,
        { billable = null } = {},
    )
    {
        const {
            internalCustomerId,
            internalProjectId,
            internalServiceId,
        } = this.destructProjectId(projectId);

        const internalProject = this.cache.internalProjects
            .get(internalProjectId);

        const billableFlag =
            (billable == null) ? internalProject.billable : billable;

        const response = await this.apiPost('clock', {
            customers_id: internalCustomerId,
            projects_id: internalProjectId,
            services_id: internalServiceId,
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
            const {
                internalCustomerId,
                internalProjectId,
                internalServiceId,
            } = this.destructProjectId(project);

            params.customers_id = internalCustomerId;
            params.projects_id = internalProjectId;
            params.services_id = internalServiceId;
        }

        if (task != null)
        {
            params.text = task;
        }

        if (billable != null)
        {
            params.billable = Number(billable);
        }

        const response = await this.apiPut('entries', params);

        return this.mapEntry(response.entry);
    }

    getProjectCustomerId (projectId)
    {
        let projectCustomerId = null;
        for (const customer of this.cache.internalCustomers.values())
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
