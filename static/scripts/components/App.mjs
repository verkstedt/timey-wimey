import areEqual from '../utils/areEqual.mjs';

import LoginForm from './LoginForm.mjs';
import CurrentForm from './CurrentForm.mjs';
import History from './History.mjs';

class App
{
    state;

    api;

    loginForm;

    currentForm;

    history;

    root = null;


    stateRefreshPromise = null;

    constructor (state, api)
    {
        this.state = state;
        this.api = api;

        this.loginForm = new LoginForm(this.state, this.api);
        this.currentForm = new CurrentForm(this.state, this.api);
        this.history = new History(this.state, this.api);

        this.handleStateChange = this.handleStateChange.bind(this);

        this.state.addEventListener(this.handleStateChange);

        this.refreshState();
    }

    async bind (root)
    {
        this.root = root;

        this.loginForm.bind(this.root.querySelector('#login'));
        this.currentForm.bind(this.root.querySelector('#current'));
        this.history.bind(
            this.root.querySelector('#history'),
            this.root.querySelector('#month-tpl'),
        );
        // TODO Log out

        this.reflectState();

        // TODO Refetch in background from time to time,
        //      but not when form is focused
    }

    async unbind ()
    {
        this.loginForm.unbind();
        this.currentForm.unbind();

        this.root = null;
    }

    async handleStateChange (oldState)
    {
        const { auth: oldAuth } = oldState;
        const { auth: newAuth } = this.state.get();
        if (!areEqual(oldAuth, newAuth))
        {
            this.refreshState();
            return;
        }

        if (this.root)
        {
            this.reflectState();
        }
    }

    isAuthorized ()
    {
        const { auth: { login, token } } = this.state.get();
        return (login != null && token != null);
    }

    async refreshState ()
    {
        if (!this.isAuthorized())
        {
            await this.state.clear();
            return;
        }

        const currentEntry = await this.api.fetchCurrent();

        const customers = await this.api.fetchCustomers();
        const projects = await this.api.fetchProjects();
        const taskTypes = await this.api.fetchTaskTypes();
        // FIXME Not all project × taskType combinations make sense
        const projectValues = {};
        taskTypes.forEach((taskType) => {
            projects.forEach((project) => {
                const customer = Array.from(customers.values()).find(
                    ({ projectIds }) => projectIds.has(project.id),
                );
                const key = `${project.id}+${taskType.id}`;
                const name = `${taskType.name}, ${project.name}, ${customer.name}`;
                projectValues[key] = name;
            });
        });
        // TODO Group by client + project
        // TODO Add “Frequently used“ group

        const today = new Date();
        const startOfLastMonth = new Date(today.toDateString());
        startOfLastMonth.setDate(1);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        const history =
            await this.api.fetchHistory(startOfLastMonth, today);

        await this.state.set({ currentEntry, projectValues, history });
    }

    reflectState ()
    {
        const authorized = this.isAuthorized();
        this.root.dataset.authorized = authorized ? 'true' : 'false';

        if (authorized)
        {
            this.currentForm.reflectState();
            this.history.reflectState();
        }
    }
}

export default App;
