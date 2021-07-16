import areEqual from '../utils/areEqual.mjs';
import hasFocusedInput from '../utils/hasFocusedInput.mjs';

import LoginForm from './LoginForm.mjs';
import CurrentForm from './CurrentForm.mjs';
import History from './History.mjs';

class App
{
    static REFRESH_THROTTLE_MS = 5000;

    state;

    isLoading = true;

    api;

    window;

    loginForm;

    currentForm;

    history;

    root = null;

    lastRefreshTimestampMs = 0;

    constructor (state, api, window)
    {
        this.state = state;
        this.api = api;
        this.window = window;

        this.loginForm = new LoginForm(this.state, this.api);
        this.currentForm = new CurrentForm(this.state, this.api);
        this.history = new History(this.state, this.api);

        this.handleStateChange =
            this.handleStateChange.bind(this);
        this.handlePageReactivation =
            this.handlePageReactivation.bind(this);

        this.state.addEventListener(this.handleStateChange);

        this.throttledRefreshAndReflect();
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

        window.addEventListener('visibilitychange', this.handlePageReactivation);
        window.addEventListener('focus', this.handlePageReactivation);
        window.addEventListener('pageshow', this.handlePageReactivation);
    }

    async unbind ()
    {
        this.loginForm.unbind();
        this.currentForm.unbind();

        this.root = null;

        window.removeEventListener('visibilitychange', this.handlePageReactivation);
        window.removeEventListener('focus', this.handlePageReactivation);
        window.removeEventListener('pageshow', this.handlePageReactivation);
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

    async handlePageReactivation ()
    {
        if (this.window.document.hidden)
        {
            return;
        }

        // Don’t refresh if a input is focused
        if (hasFocusedInput(document))
        {
            return;
        }

        this.throttledRefreshAndReflect();
    }

    isAuthorized ()
    {
        const { auth: { login, token } } = this.state.get();
        return (login != null && token != null);
    }

    async throttledRefreshAndReflect ()
    {
        const now = Date.now();

        if (now - this.lastRefreshTimestampMs > App.REFRESH_THROTTLE_MS)
        {
            this.lastRefreshTimestampMs = now;
            await this.refreshState();
            this.reflectState();
        }
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
