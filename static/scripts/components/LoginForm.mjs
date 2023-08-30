import { html } from 'lit'

import AppElement from './AppElement.mjs'

class LoginForm extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    api: { state: true, attribute: false },
  }

  #handleSubmit(event) {
    event.preventDefault()

    const data = new FormData(event.target)
    const login = data.get('login')
    const token = data.get('password')

    if (this.api.login(login, token)) {
      this.state.set({ auth: { login, token } })
    }
  }

  render() {
    if (!this.api) return html`test`

    return html`
    <form
      class="o-form m-loader__wrapper u-unauthorized"
      id="login"
      method="POST"
      @submit=${this.#handleSubmit}
      >
        <p class="m-formElement">
          <label class="m-formElement__label" for="login_login"> E-Mail </label>
          <input
            id="login_login"
            class="m-formElement__input a-input a-input--login"
            type="email"
            name="login"
            autocomplete="email"
            required
          />
        </p>
        <p class="m-formElement">
          <label class="m-formElement__label" for="login_password">
            <abbr>API</abbr> token
          </label>
          <input
            id="login_password"
            class="m-formElement__input a-input a-input--password"
            type="password"
            name="password"
            autocomplete="current-password"
            aria-describedby="login_password_desc"
            required
          />
        </p>
        <p id="login_password_desc">
          You can find your API token on
          <a
            target="_blank"
            rel="noopener nofollow"
            href="https://my.clockodo.com/en/users/editself#grouphead_api"
            >Clockodo settings page</a
          >.
        </p>
        <div class="m-actions">
          <button
            class="a-button a-button--primary m-actions__action"
            type="submit"
          >
            Let me track my time
          </button>
        </div>

        <!-- TODO <tw-loader active /> -->
        <div hidden data-loader class="m-loader__animation" aria-live="polite">
          Things are happening…
        </div>
      </form>
    `
  }
}

customElements.define('tw-login-form', LoginForm)
