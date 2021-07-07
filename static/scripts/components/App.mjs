import areEqual from '../utils/areEqual.mjs';

import LoginForm from './LoginForm.mjs';
import CurrentForm from './CurrentForm.mjs';
import History from './History.mjs';

class App
{
    state;

    isLoading = true;

    api;

    loginForm;

    currentForm;

    history;

    root = null;

    constructor (state, api)
    {
        this.state = state;
        this.api = api;

        this.loginForm = new LoginForm(this.state, this.api);
        this.currentForm = new CurrentForm(this.state, this.api);
        this.history = new History(this.state, this.api);

        this.handleStateChange = this.handleStateChange.bind(this);

        this.state.addEventListener(this.handleStateChange);

        this.refreshState().then(() => this.reflectState());
    }

    async bind (root)
    {
        this.root = root;

        this.loadingMessage = this.root.querySelector('#loading-message');

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
        const projects = await this.api.fetchProjects();

        const today = new Date((new Date()).toDateString());
        const endOfToday = new Date(today);
        endOfToday.setMilliseconds(24 * 60 * 60 * 1000 - 1);
        const startOfLastMonth = new Date(today);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        const history =
            await this.api.fetchHistory(startOfLastMonth, endOfToday);

        this.isLoading = false;
        await this.state.set({ currentEntry, projects, history });
    }

    reflectState ()
    {
        const authorized = this.isAuthorized();
        this.root.dataset.authorized = authorized ? 'true' : 'false';

        this.loadingMessage.hidden = !this.isLoading;

        if (authorized)
        {
            this.currentForm.reflectState();
            this.history.reflectState();
        }
    }
}

export default App;
