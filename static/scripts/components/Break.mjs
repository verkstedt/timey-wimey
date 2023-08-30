import { html } from 'lit'
import isToday from '../utils/isToday.mjs'
import AppElement from './AppElement.mjs'

class Break extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    prevEntryId: { type: String, state: true, attribute: true },
    entryId: { type: String, state: true, attribute: true },
  }

  calcDuration() {
    const { history, currentEntry } = this.state.state
    const entry = history.find(({ id }) => id === this.entryId)
    const entryEnd = entry.end
    if (!this.prevEntryId && !isToday(new Date(entryEnd))) {
      return 0
    }

    const prevEntry = this.prevEntryId
      ? history.find(({ id }) => id === this.prevEntryId)
      : null
    const prevEntryStart =
      prevEntry?.start ||
      (currentEntry
        ? new Date(currentEntry.start)
        : // TODO Should be ticking
          new Date())

    const durationSec = Math.round(
      (new Date(entryEnd) - new Date(prevEntryStart)) / 1000
    )

    return durationSec
  }

  render() {
    const durationSec = this.calcDuration()
    return html` <div
      class="o-entryList__item o-entryList__item--break m-break"
      data-component="break"
      .hidden=${durationSec === 0}
    >
      <time
        is="tw-duration"
        class="a-duration"
        name="duration"
        precision="s"
        .dateTime=${`PT${durationSec}S`}
      >
      </time>
      break
    </div>`
  }
}

customElements.define('tw-break', Break)
