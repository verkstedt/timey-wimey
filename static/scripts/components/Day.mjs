import './Entry.mjs'
import Break from './Break.mjs'

// FIXME Util
function createDayNameFormatter() {
  const dayNameFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    weekday: 'long',
  })

  return {
    format: (date) => {
      const relDate = new Date()
      if (date.toDateString() === relDate.toDateString()) {
        return 'Today'
      }

      relDate.setDate(relDate.getDate() - 1)
      if (date.toDateString() === relDate.toDateString()) {
        return 'Yesterday'
      }

      return dayNameFormatter.format(date)
    },
  }
}

class Day {
  state

  api

  refreshHistory

  dayDateString

  root = null

  entries = []

  constructor(state, api, refreshHistory, dayDateString) {
    this.state = state
    this.api = api
    this.refreshHistory = refreshHistory
    this.dayDateString = dayDateString
  }

  async bind(root, breakTpl) {
    this.root = root
    this.breakTpl = breakTpl

    this.reflectState()
  }

  async unbind() {
    this.entries.forEach((entry) => entry.unbind())

    this.root = null
    this.breakTpl = null
  }

  reflectState() {
    const { history } = this.state.get()

    const dayNameFormatter = createDayNameFormatter()

    const dayNameElement = this.root.querySelector('[name="day-name"]')
    dayNameElement.textContent = dayNameFormatter.format(
      new Date(this.dayDateString)
    )

    const dayHistoryEntries = history
      .filter(
        (entry) => entry.end && entry.start.startsWith(this.dayDateString)
      )
      .sort((a, b) => new Date(b.start) - new Date(a.start))

    const totalMs = dayHistoryEntries
      .map(({ start, end }) => new Date(end) - new Date(start))
      .reduce((carry, duration) => carry + duration, 0)
    this.root.querySelector('[name="total-value"]').dateTime = `PT${Math.round(
      totalMs / 1000
    )}S`

    const entriesRoot = this.root.querySelector('[name="entries"]')
    const breakTplElement = this.breakTpl.content.children[0]
    const entries = document.createDocumentFragment()
    let prevEntryId
    dayHistoryEntries.forEach(({ id: entryId }) => {
      const entryBreakElement = document.importNode(breakTplElement, true)
      const entryBreak = new Break(this.state, prevEntryId, entryId)
      this.entries.push(entryBreak)
      entryBreak.bind(entryBreakElement)
      entries.appendChild(entryBreakElement)

      // TODO <tw-entry .state={this.state} .api={this.api} .refreshHistory={this.refreshHistory} .entryId={entryId} />
      const entry = document.createElement('tw-entry')
      entry.state = this.state
      entry.api = this.api
      entry.refreshHistory = this.refreshHistory
      entry.entryId = entryId
      entries.appendChild(entry)

      prevEntryId = entryId
    })
    entriesRoot.textContent = ''
    entriesRoot.appendChild(entries)
  }
}

export default Day
