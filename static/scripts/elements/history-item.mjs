import formatTime from '../utils/formatTime.mjs';

const TAG_NAME = 'history-item';

const historyItemTemplate = document.createElement('template');
historyItemTemplate.innerHTML = `
    <link rel="stylesheet" href="./stylesheet/index.css" />
    <li class="historyItem">
        <span class="historyItem__start">
            <slot name=start></slot>
        </span>
        —
        <time class="historyItem__end">
            <slot name=end></slot>
        </time>
        <span class="historyItem__project">
            <slot name=project></slot>
        </span>
        <span class="historyItem__taskType">
            <slot name=taskType></slot>
        </span>
        <span class="historyItem__task">
            <slot />
        </span>
        <!-- TODO Resume -->
    </li>
`;

class HistoryItem extends HTMLElement
{
    static observedAttributes = ['item'];

    static createFromItem (item)
    {
        const el = document.createElement(TAG_NAME);

        const startEl = document.createElement('time');
        startEl.slot = 'start';
        startEl.dateTime = item.start;
        startEl.textContent = formatTime(item.start);
        el.appendChild(startEl);

        const endEl = document.createElement('time');
        endEl.slot = 'end';
        endEl.dateTime = item.end;
        endEl.textContent = formatTime(item.end);
        el.appendChild(endEl);

        const projectEl = document.createElement('span');
        projectEl.slot = 'project';
        projectEl.textContent = item.project.value;
        el.appendChild(projectEl);

        const taskTypeEl = document.createElement('span');
        taskTypeEl.slot = 'taskType';
        taskTypeEl.textContent = item.taskType.value;
        el.appendChild(taskTypeEl);

        const taskEl = document.createTextNode(item.task.value);
        el.appendChild(taskEl);

        return el;
    }

    constructor (...argv)
    {
        const result = super(...argv);
        this.attachShadow({ mode: 'open' }).appendChild(
            historyItemTemplate.content.cloneNode(true),
        );
        return result;
    }

    get start ()
    {
        const slot = this.shadowRoot.querySelector('slot[name=start]');
        const el = slot.assignedElements()[0];
        return new Date(el.dateTime);
    }

    get end ()
    {
        const slot = this.shadowRoot.querySelector('slot[name=end]');
        const el = slot.assignedElements()[0];
        return new Date(el.dateTime);
    }

    get startDateString ()
    {
        return this.start.toLocaleDateString();
    }

    get seconds ()
    {
        return this.end.getTime() - this.start.getTime();
    }
}

customElements.define(TAG_NAME, HistoryItem);

export { TAG_NAME };
export default HistoryItem;
