import { html } from 'lit'

import AppElement from './AppElement.mjs'

import './Day.mjs'

const monthNameFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
})

class Month extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    api: { state: true, attribute: false },
    refreshHistory: { state: true, attribute: false },
    monthDateString: { type: String, state: true, attribute: true },
  }

  render() {
    const { history } = this.state.get()
    const monthHistoryEntries = history.filter(
      (entry) => entry.end && entry.start.startsWith(this.monthDateString)
    )

    return html`
      <section class="o-month">
        <h2 class="u-stickyHeader o-month__header">
          <time name="month-name" .dateTime=${this.monthDateString}>
            ${monthNameFormatter.formatToParts(
              new Date(this.monthDateString)
            )[0].value}
          </time>
        </h2>
        <details open>
          <summary class="a-detailsSummary">
            <dl class="o-progressTimer">
              <div class="m-timer">
                <dt class="m-timer__label m-timer__label--month">Total</dt>
                <dd class="m-timer__value m-timer__value--month">
                  <time
                    is="tw-duration"
                    name="total-value"
                    class="a-duration"
                    .dateTime=${`PT${Math.round(
                      monthHistoryEntries
                        .map(
                          ({ start, end }) => new Date(end) - new Date(start)
                        )
                        .reduce((carry, duration) => carry + duration, 0) / 1000
                    )}S`}
                  ></time>
                </dd>
              </div>
            </dl>
          </summary>
          <div name="days">
            ${monthHistoryEntries.map(
              ({ id: entryId }) => html`
                <tw-entry
                  .state=${this.state}
                  .api=${this.api}
                  .refreshHistory=${this.refreshHistory}
                  .entryId=${entryId}
                />
              `
            )}
          </div>
        </details>
      </section>
    `
  }
}

customElements.define('tw-month', Month)
