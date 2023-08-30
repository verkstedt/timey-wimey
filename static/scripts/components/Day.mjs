import { html } from 'lit'

import AppElement from './AppElement.mjs'

import './Break.mjs'
import './Entry.mjs'

const dayNameFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  weekday: 'long',
})

class Day extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    api: { state: true, attribute: false },
    refreshHistory: { state: true, attribute: false },
    dayDateString: { type: String, state: true, attribute: true },
  }

  render() {
    const { history } = this.state.get()
    const dayHistoryEntries = history
      .filter(
        (entry) => entry.end && entry.start.startsWith(this.dayDateString)
      )
      .sort((a, b) => new Date(b.start) - new Date(a.start))

    return html`
      <section class="o-day">
        <h3 class="u-stickyHeader o-day__header">
          <time name="day-name">
            ${dayNameFormatter.format(new Date(this.dayDateString))}
          </time>
        </h3>
        <dl class="u-stickyHeader o-progressTimer o-progressTimer--day">
          <div class="m-timer">
            <dt
              class="m-timer__label m-timer__label--day o-progressTimer__label o-progressTimer__label--from"
              aria-label="Time logged for 26th April"
            >
              Total
            </dt>
            <dd
              class="m-timer__value m-timer__value--day o-progressTimer__value o-progressTimer__value--from"
            >
              <time
                is="tw-duration"
                name="total-value"
                class="a-duration"
                .dateTime=${`PT${Math.round(
                  dayHistoryEntries
                    .map(({ start, end }) => new Date(end) - new Date(start))
                    .reduce((carry, duration) => carry + duration, 0) / 1000
                )}S`}
              ></time>
            </dd>
          </div>
          <div class="m-timer">
            <dt
              class="m-timer__label m-timer__label--day o-progressTimer__label o-progressTimer__label--to"
              aria-label="time required for 1st of April"
            >
              out of
            </dt>
            <dd
              class="m-timer__value m-timer__value--day o-progressTimer__value o-progressTimer__value--to"
            >
              <!-- TODO Obtain real value -->
              <time
                is="tw-duration"
                name="total-expected"
                class="a-duration"
                datetime="PT8H"
                precision="m"
              ></time>
            </dd>
          </div>
        </dl>
        <ol name="entries" reversed class="o-entryList">
          ${dayHistoryEntries.map(({ id: entryId }, index) => {
            const prevEntryId = dayHistoryEntries[index - 1]?.id
            return html`
              <tw-break
                .state=${this.state}
                .prevEntryId=${prevEntryId}
                .entryId=${entryId}
              />
              <tw-entry
                .state=${this.state}
                .api=${this.api}
                .refreshHistory=${this.refreshHistory}
                .entryId=${entryId}
              />
            `
          })}
        </ol>
      </section>
    `
  }
}

customElements.define('tw-day', Day)
