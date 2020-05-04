class LoginForm
{
    state;

    api;

    root = null;

    constructor (state, api)
    {
        this.state = state;
        this.api = api;

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    async bind (root)
    {
        this.root = root;

        this.root.addEventListener('submit', this.handleSubmit);
    }

    async unbind ()
    {
        this.root.removeEventListener('submit', this.handleSubmit);
    }

    async handleSubmit (event)
    {
        event.preventDefault();

        const data = new FormData(event.target);
        const login = data.get('login');
        const token = data.get('password');

        if (await this.api.login(login, token))
        {
            await this.state.set({ auth: { login, token } });
        }
    }
}

export default LoginForm;
