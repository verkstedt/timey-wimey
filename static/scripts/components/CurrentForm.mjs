import { html } from 'lit'

import AppElement from './AppElement.mjs'

class CurrentForm extends AppElement {
  static properties = {
    state: { state: true, attribute: false },
    api: { state: true, attribute: false },
    taskValue: { state: true, attribute: false },
    projectValue: { state: true, attribute: false },
  }

  #handleTaskInput(event) {
    this.taskValue = event.target.value
  }

  #handleTaskChange() {
    if (this.taskValue === '') {
      return
    }

    const taskListOption = this.getTasksWithUsage().find(
      (option) => option.taskName === this.taskValue
    )

    if (!taskListOption) {
      return
    }

    const { project } = taskListOption

    this.projectValue = project
  }

  #handleSubmit(event) {
    event.preventDefault()

    const { project, task } = this.#getFormData()

    const history = this.#getHistoryWithCurrentEntryStopped()
    const currentEntry = this.api.start(project, task)
    this.state.set({ currentEntry, history })
  }

  #handleChange(event) {
    event.preventDefault()

    const { project, task } = this.#getFormData()
    const {
      currentEntry: { id: currentEntryId },
    } = this.state.get()
    if (currentEntryId == null) {
      throw new Error('Cannot change — no task running.')
    }

    const currentEntry = this.api.update(currentEntryId, {
      project,
      task,
    })
    this.state.set({ currentEntry })
  }

  #handleStop(event) {
    event.preventDefault()

    const {
      currentEntry: { id: currentEntryId },
    } = this.state.get()

    const history = this.#getHistoryWithCurrentEntryStopped()
    this.api.stop(currentEntryId)
    this.state.set({ currentEntry: null, history })
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

  #getFormData() {
    const data = new FormData(this.root)
    return {
      project: data.get('project'),
      task: data.get('task'),
    }
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

    const taskValue = this.taskValue ?? currentEntry.task?.value
    const projectValue = this.projectValue ?? currentEntry.project?.id

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
            .value=${taskValue}
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
            .value=${projectValue}
          >
            ${projects.map(
              (option) =>
                html`<option value=${option.id}>${option.name}</option>`
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
