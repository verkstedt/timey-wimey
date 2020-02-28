import {
    isAuthorized,
    login,
    logout,
} from '../clockodo/index.mjs';

const TAG_NAME = 'logged-in';
const DIALOG_ID = 'login-dialog';
const FORM_ID = 'login-form';
const SIGN_OUT_ID = 'sign-out';

const loginTemplate = document.createElement('template');
const loggedInTemplate = document.createElement('template');
loginTemplate.innerHTML = `
    <dialog id=${DIALOG_ID}>
        <h1>Log in</h1>
        <form id=${FORM_ID} method=POST>
            <p>
                <label for=login>
                    E-mail
                </label>
                <input type=email id=login name="login" autocomplete="email" />
            </p>
            <p>
                <label for=password>
                    API token
                </label>
                <input type=password id=password name="password" autocomplete="current-password" />
                You can get it from
                <a
                    target="_blank"
                    rel="noopener nofollow"
                    href="https://my.clockodo.com/en/users/editself#grouphead_api"
                >
                    your settings page
                </a>.
            </p>

            <button type="submit">
                Let me track my time
            </button>
        </form>
    </dialog>
`;
loggedInTemplate.innerHTML = `
    <link rel="stylesheet" href="./stylesheet/index.css" />
    <nav class="nav">
        <a class="nav__item nav__item--link" href="https://my.clockodo.com/en/entries?listType=chron">
            entries on clockodo.com
        </a>
        <button id=${SIGN_OUT_ID} class="nav__item nav__item--action" type=button>Sign out</button>
    </nav>
    <div>
        <slot></slot>
    </div>
`;

class LoggedIn extends HTMLElement
{
    authorized = undefined;

    constructor (...argv)
    {
        const result = super(...argv);
        this.attachShadow({ mode: 'open' });
        return result;
    }

    static handleSubmit (event)
    {
        event.preventDefault();
        const data = new FormData(event.target);
        login(data.get('login'), data.get('password'));
    }

    async connectedCallback ()
    {
        if (!this.isConnected)
        {
            return;
        }

        this.authorized = undefined;
        this.authorized = await isAuthorized();
        this.shadowRoot.textContent = '';
        if (this.authorized)
        {
            this.shadowRoot.appendChild(
                loggedInTemplate.content.cloneNode(true),
            );
            const signOut = this.shadowRoot.getElementById(SIGN_OUT_ID);
            signOut.addEventListener('click', logout);
        }
        else
        {
            this.shadowRoot.appendChild(
                loginTemplate.content.cloneNode(true),
            );
            const dialog = this.shadowRoot.getElementById(DIALOG_ID);
            dialog.showModal();
            const form = this.shadowRoot.getElementById(FORM_ID);
            form.addEventListener('submit', LoggedIn.handleSubmit);
        }
    }

    isAuthorized ()
    {
        return this.authorized;
    }
}

customElements.define(TAG_NAME, LoggedIn);

export { TAG_NAME };
export default LoggedIn;
