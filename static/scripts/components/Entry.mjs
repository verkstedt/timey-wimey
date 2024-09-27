import { html } from 'lit'

import insertWordBreaks from '../utils/insertWordBreaks.mjs'

import AppElement from './AppElement.mjs'

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: false,
})

class Entry extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    api: { state: true, attribute: false },
    refreshHistory: { state: true, attribute: false },
    entryId: { type: String, state: true, attribute: true },
  }

  refreshAfterWindowCloses(win) {
    const id = window.setInterval(() => {
      if (win.closed) {
        window.clearInterval(id)
        this.refreshHistory()
      }
    }, 200)
  }

  #handleEditClick() {
    // TODO Implement editing entries
    const win2 = window.open(
      `https://my.clockodo.com/entries/editentry/?id=${this.entryId}`
    )
    this.refreshAfterWindowCloses(win2)
  }

  #handleSplitClick() {
    // TODO Implement splitting entries
    const win2 = window.open(
      `https://my.clockodo.com/entries/split/?id=${this.entryId}`
    )
    this.refreshAfterWindowCloses(win2)
  }

  render() {
    const { history } = this.state.get()
    const entry = history.find((e) => e.id === this.entryId)

    return html`
      <li class="o-entryList__item o-entryList__item--entry m-entry">
        <h4 name="entry-task" class="m-entry__task">
          ${insertWordBreaks(entry.task.value)}
        </h4>
        <span class="u-sr">filed under</span>
        <span name="entry-project" class="m-entry__project">
          ${insertWordBreaks(entry.project.name)}
        </span>
        <div class="m-entry__times">
          <div class="m-entry__duration">
            <span class="u-sr">for</span>
            <time
              is="tw-duration"
              name="entry-duration"
              class="a-duration"
              .dateTime=${`PT${Math.round(
                (new Date(entry.end) - new Date(entry.start)) / 1000
              )}S`}
            >
            </time>
          </div>
          <div class="m-entry__timeframe a-timeframe">
            <span class="u-sr">from</span>
            <time class="a-timeframe__from" name="entry-start">
              ${timeFormatter.format(new Date(entry.start))}
            </time>
            <span class="u-sr">to</span>
            <time class="a-timeframe__to" name="entry-end">
              ${timeFormatter.format(new Date(entry.end))}
            </time>
          </div>
        </div>
        <div class="m-actions">
          <button
            class="a-button m-actions__action"
            type="button"
            @click=${this.#handleSplitClick}
          >
            Split
          </button>
          <button
            class="a-button m-actions__action"
            type="button"
            @click=${this.#handleEditClick}
          >
            Edit
          </button>
        </div>
      </li>
    `
  }
}

customElements.define('tw-entry', Entry)
