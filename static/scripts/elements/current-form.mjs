import formatTime from '../utils/formatTime.mjs';
import {
    start,
    stop,
} from '../clockodo/index.mjs';

const TAG_NAME = 'current-form';

const FORM_ID = 'current-form';
const ID_ID = 'task-id';
const PROJECT_ID = 'projects';
const TASK_TYPE_ID = 'task-types';
const TASK_ID = 'task';
const TASK_LIST_ID = 'task-list';
const SUBMIT_ID = 'submit';
const START_TIME_ID = 'start';

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="./stylesheet/index.css" />
    <form id=${FORM_ID} class="current">
        <input type=hidden id=${ID_ID} name="id" />
        <p>
            <label for=current-task>
                Task
            </label>
            <input id=${TASK_ID} list=${TASK_LIST_ID} name="taskName" required />
            <datalist id=${TASK_LIST_ID}>
            </datalist>
        </p>
        <p>
            <label for=current-task-type>
                Task type
            </label>
            <select id=${TASK_TYPE_ID} name="taskTypeId" required>
                <option></option>
            </select>
        </p>
        <p>
            <label for=current-project>
                Project
            </label>
            <select id=${PROJECT_ID} name="projectId" required>
                <option></option>
            </select>
        </p>
        <!-- TODO If running and data is changed, show “Update“ button -->
        <button
            id=${SUBMIT_ID}
            type=submit
            data-start-label="Start"
            data-stop-label="Stop"
        >
        </button>
        <p class="current-timer">
            Running since <time id=${START_TIME_ID}></time>.
        </p>
    </form>
`;

function createOptions (data)
{
    const fragment = document.createDocumentFragment();
    // TODO Sort by last used
    data.forEach(({ id = null, name, ...rest }) => {
        const option = document.createElement('option');
        if (id != null)
        {
            option.value = id;
        }
        option.textContent = name;
        Object.entries(rest).forEach(([key, value]) => {
            option.dataset[key] = value;
        });
        fragment.appendChild(option);
    });
    return fragment;
}

class CurrentForm extends HTMLElement
{
    projects = [];

    taskTypes = [];

    entry = null;

    constructor (...argv)
    {
        const result = super(...argv);
        this.attachShadow({ mode: 'open' });
        return result;
    }

    static async handleSubmit (event)
    {
        event.preventDefault();

        const form = event.target;
        const running = form.dataset.running === 'true';
        const data = new FormData(form);

        if (running)
        {
            await stop(Number(data.get('id')));
        }
        else
        {
            await start(
                Number(data.get('projectId')),
                Number(data.get('taskTypeId')),
                data.get('taskName'),
            );
        }

        window.location.reload();
    }

    static handleTaskChange (event)
    {
        // TODO Debounce?
        const task = event.target;
        const option = Array.from(task.list.children)
            .find((element) => element.textContent === task.value);
        if (!option)
        {
            return;
        }

        task.form[PROJECT_ID].value = option.dataset.projectId;
        task.form[TASK_TYPE_ID].value = option.dataset.taskTypeId;
        // TODO Start the clock~
    }

    static handleTaskInput (event)
    {
        const task = event.target;
        if (task.value === '')
        {
            task.form[PROJECT_ID].value = '';
            task.form[TASK_TYPE_ID].value = '';
        }
    }

    connectedCallback ()
    {
        if (!this.isConnected)
        {
            return;
        }

        const content = template.content.cloneNode(true);

        const form = content.getElementById(FORM_ID);
        const id = content.getElementById(ID_ID);
        const project = content.getElementById(PROJECT_ID);
        const taskType = content.getElementById(TASK_TYPE_ID);
        const task = content.getElementById(TASK_ID);
        const taskList = content.getElementById(TASK_LIST_ID);
        const submit = content.getElementById(SUBMIT_ID);
        // TODO This should be a custom element that ticks.
        const startTime = content.getElementById(START_TIME_ID);

        project.appendChild(createOptions(this.projects));
        taskType.appendChild(createOptions(this.taskTypes));
        if (this.history)
        {
            taskList.appendChild(createOptions(Array.from(
                this.history.reduce((map, item) => {
                    const key = item.task.value;
                    if (!map.has(key))
                    {
                        map.set(key, {
                            name: item.task.value,
                            projectId: item.project.id,
                            taskTypeId: item.taskType.id,
                        });
                    }
                    return map;
                }, new Map()).values(),
            )));
            task.addEventListener('change', CurrentForm.handleTaskChange);
            task.addEventListener('input', CurrentForm.handleTaskInput);
        }

        const { entry } = this;
        if (entry)
        {
            form.setAttribute('data-running', 'true');
            submit.textContent = submit.dataset.stopLabel;

            id.value = entry.id;
            project.value = entry.project.id;
            taskType.value = entry.taskType.id;
            task.value = entry.task.value;
            startTime.datetime = entry.start;
            startTime.textContent = formatTime(entry.start);
        }
        else
        {
            form.setAttribute('data-running', 'false');
            submit.textContent = submit.dataset.startLabel;

            id.value = null;
            project.value = null;
            taskType.value = null;
            task.value = null;
            startTime.datetime = null;
            startTime.textContent = null;
        }

        form.addEventListener('submit', CurrentForm.handleSubmit);

        this.shadowRoot.appendChild(content);
    }
}

customElements.define(TAG_NAME, CurrentForm);

export { TAG_NAME };
export default CurrentForm;
