import { html } from 'lit'
import AppElement from './AppElement.mjs'

class Appbar extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
  }

  handleClick = () => {
    window.localStorage.clear()
    window.location.reload()
  }

  render() {
    const mail = this.state.state.auth.login
    const username = mail ? mail.split('@')[0].split('.').join(' ') : null
    return html`<header class="o-appbar">
      <div class="m-headerTitle">Timey Wimey</div>
      <div class="m-headerActions">
        <div>${username}</div>
        <button
        class="a-button--primary"
        .hidden=${!username}
        @click="${this.handleClick}">
          Logout
        </button>
      </div>
    </header>`
  }

}

customElements.define('tw-appbar', Appbar)
