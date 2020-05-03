import LoginForm from './LoginForm.mjs';
import CurrentForm from './CurrentForm.mjs';

class App
{
    state;

    api;

    loginForm;

    root = null;


    stateRefreshPromise = null;

    constructor (state, api)
    {
        this.state = state;
        this.api = api;

        this.loginForm = new LoginForm(this.state, this.api);
        this.currentForm = new CurrentForm(this.state, this.api);

        this.handleStateChange = this.handleStateChange.bind(this);

        this.state.addEventListener(this.handleStateChange);

        this.refreshState();
    }

    async bind (root)
    {
        this.root = root;

        this.loginForm.bind(this.root.querySelector('#login'));
        this.currentForm.bind(this.root.querySelector('#current'));
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
        if (JSON.stringify(oldState.auth) !== JSON.stringify(this.state.get('auth')))
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
        const auth = this.state.get('auth');
        return (auth.login != null && auth.token != null);
    }

    async refreshState ()
    {
        if (!this.isAuthorized())
        {
            await this.state.clear();
            return;
        }

        const currentEntry = await this.api.fetchCurrent();
        await this.state.set('currentEntry', currentEntry);

        const projects = await this.api.fetchProjects();
        const taskTypes = await this.api.fetchTaskTypes();
        const projectValues = {};
        taskTypes.forEach((taskType) => {
            projects.forEach((project) => {
                const key = `${project.id}+${taskType.id}`;
                const name = `${taskType.name} (${project.name})`;
                projectValues[key] = name;
            });
        });
        // TODO Group by client + project
        // TODO Add “Frequently used“ group
        await this.state.set('projectValues', projectValues);
    }

    reflectState ()
    {
        const authorized = this.isAuthorized();
        this.root.dataset.authorized = authorized ? 'true' : 'false';

        if (authorized)
        {
            this.currentForm.reflectState();
        }
    }
}

export default App;
