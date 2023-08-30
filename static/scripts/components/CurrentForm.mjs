import { html } from 'lit'

import AppElement from './AppElement.mjs'

class CurrentForm extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    api: { state: true, attribute: false },
    taskInputValue: { state: true, attribute: false },
    projectInputValue: { state: true, attribute: false },
  }

  #handleTaskInput(event) {
    this.taskInputValue = event.target.value
  }
  #handleProjectInput(event) {
    this.projectInputValue = event.target.value
  }

  #handleTaskChange() {
    if (this.taskInputValue === '') {
      return
    }

    const taskListOption = this.getTasksWithUsage().find(
      (option) => option.taskName === this.taskInputValue
    )

    if (!taskListOption) {
      return
    }

    const { project } = taskListOption

    this.projectInputValue = project
  }

  get taskValue() {
    const { currentEntry } = this.state.get()
    return this.taskInputValue ?? (currentEntry?.task?.value || '')
  }

  get projectValue() {
    const { currentEntry } = this.state.get()
    return this.projectInputValue ?? currentEntry?.project?.id
  }

  async #handleSubmit(event) {
    event.preventDefault()

    const history = this.#getHistoryWithCurrentEntryStopped()
    const currentEntry = await this.api.start(this.projectValue, this.taskValue)
    this.state.set({ currentEntry, history })
    window.location.reload()
  }

  async #handleChange() {
    const {
      currentEntry: { id: currentEntryId },
    } = this.state.get()
    if (currentEntryId == null) {
      throw new Error('Cannot change — no task running.')
    }

    const newCurrentEntry = await this.api.update(currentEntryId, {
      project: this.projectValue,
      task: this.taskValue,
    })

    this.state.set({ currentEntry: newCurrentEntry })
  }

  async #handleStop(event) {
    event.preventDefault()

    const {
      currentEntry: { id: currentEntryId },
    } = this.state.get()

    const history = this.#getHistoryWithCurrentEntryStopped()
    await this.api.stop(currentEntryId)
    await this.state.set({ currentEntry: null, history })
    window.location.reload()
  }

  #getHistoryWithCurrentEntryStopped() {
    const { currentEntry, history } = this.state.get()

    if (!currentEntry) {
      return history
    }

    return history.concat([
      {
        ...currentEntry,
        end: new Date().toISOString(),
      },
    ])
  }

  getTasksWithUsage() {
    const { history } = this.state.get()

    const tasksUsage = Object.values(history).reduce((carry, historyEntry) => {
      const {
        task: { value: taskName },
        project: { id: projectId },
      } = historyEntry
      // TODO Case insensitive
      const entry = carry[taskName] || {
        count: 0,
        project: projectId,
      }
      return {
        ...carry,
        [taskName]: {
          count: entry.count + 1,
          project: projectId,
        },
      }
    }, {})

    const sortedTasksUsage = Object.entries(tasksUsage)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([taskName, { project }]) => ({
        taskName,
        project,
      }))

    return sortedTasksUsage
  }

  render() {
    if (!this.api) return html`test`

    const { projects = [], currentEntry } = this.state.get()

    return html`
      <form
        class="o-form m-loader__wrapper u-authorized"
        id="current"
        method="POST"
        @submit=${this.#handleSubmit}
      >
        <p class="m-formElement">
          <label class="m-formElement__label" for="current_task"> Task </label>
          <input
            id="current_task"
            class="m-formElement__input a-input a-input--text"
            name="task"
            type="text"
            required
            list="current_task__list"
            @input=${this.#handleTaskInput}
            @change=${this.#handleTaskChange}
            .value=${this.taskValue}
          />
          <datalist id="current_task__list" name="task__list">
            ${this.getTasksWithUsage().map(
              (option) =>
                html`<option
                  value=${option.taskName}
                  data-project=${option.project}
                />`
            )}
          </datalist>
        </p>
        <p class="m-formElement">
          <label class="m-formElement__label" for="current_project">
            Project
          </label>
          <select
            id="current_project"
            class="m-formElement__input a-input a-input--select"
            name="project"
            required
            sdfsdfvalue=${this.projectValue}
            @input=${this.#handleProjectInput}
          >
            ${projects.map(
              (option) =>
                html`<option
                  value=${option.id}
                  ?selected=${option.id === this.projectValue}
                >
                  ${option.name}
                </option>`
            )}
          </select>
        </p>
        <!-- TODO Add required attribute, when implemented -->
        <p class="u-v3 m-formElement">
          <label class="m-formElement__label" for="current_start-time">
            Start time
          </label>
          <input
            id="current_start-time"
            class="m-formElement__input a-input a-input--date"
            name="start-time"
            type="datetime-local"
          />
        </p>
        <dl class="m-timer">
          <dt
            class="m-timer__label m-timer__label--day"
            aria-label="Current task running for"
          >
            Current
          </dt>
          <dd class="m-timer__value timer__value--day">
            <time
              is="tw-duration"
              class="a-duration"
              name="duration"
              precision="s"
            >
            </time>
          </dd>
        </dl>
        <div class="m-actions">
          <button
            class="a-button a-button--primary m-actions__action m-actions__action--primary"
            type="submit"
            name="start"
          >
            Start new
          </button>
          <button
            class="a-button
            m-actions__action"
            type="button"
            name="stop"
            @click=${this.#handleStop}
            ?disabled=${!currentEntry}
          >
            Stop
          </button>
          <button
            class="u-v3 a-button m-actions__action"
            type="button"
            name="split"
          >
            Split
          </button>
          <button
            class="a-button m-actions__action"
            type="button"
            name="change"
            @click=${this.#handleChange}
            ?disabled=${!currentEntry}
          >
            Change
          </button>
        </div>

        <div hidden data-loader class="m-loader__animation" aria-live="polite">
          Things are happening…
        </div>
      </form>
    `
  }
}

customElements.define('tw-current-form', CurrentForm)
