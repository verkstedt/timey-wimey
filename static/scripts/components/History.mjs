import { html } from 'lit'
import AppElement from './AppElement.mjs'

import './Month.mjs'

class History extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    api: { state: true, attribute: false },
    refreshHistory: { state: true, attribute: false },
  }

  render() {
    if (!this.state) {
      return 'Initialising' // TODO Remove this after App is refactored
    }

    const { history } = this.state.get()
    const monthKeys = new Set()
    history.forEach((item) => {
      // / FIXME Should always be String
      const start =
        item.start instanceof Date ? item.start.toISOString() : item.start
      const monthKey = start.split('-').slice(0, 2).join('-')
      monthKeys.add(monthKey)
    })

    return html`
      ${Array.from(monthKeys)
        .sort()
        .reverse()
        .map(
          (monthKey) => html`<tw-month
            .state=${this.state}
            .api=${this.api}
            .refreshHistory=${this.refreshHistory}
            .monthDateString=${monthKey}
          />`
        )}
    `
  }
}

customElements.define('tw-history', History)
