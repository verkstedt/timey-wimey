import {
    fetchProjects,
    fetchTaskTypes,
    fetchCurrent,
    fetchHistory,
} from '../clockodo/index.mjs';

import HistoryList from './history-list.mjs';
import HistoryItem from './history-item.mjs';
import CurrentForm from './current-form.mjs';

const TAG_NAME = 'day-page';
const FORM_ID = 'current-form';
const HISTORY_ID = 'history-list';

const loadingTemplate = document.createElement('template');
loadingTemplate.innerHTML = `
    Imma fetchin’ you data.
`;

const template = document.createElement('template');
template.innerHTML = `
    <slot id=${FORM_ID}></slot>
    <slot id=${HISTORY_ID}></slot>
`;

class DayPage extends HTMLElement
{
    constructor (...argv)
    {
        const result = super(...argv);
        this.attachShadow({ mode: 'open' }).appendChild(
            loadingTemplate.content.cloneNode(true),
        );
        this.fetch();
        return result;
    }

    async fetch ()
    {
        const today = new Date();
        const startDate = new Date(
            today.getFullYear(),
            today.getMonth() - 2,
            1,
        );
        const endDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
        );

        const currentEntryPromise = fetchCurrent();
        await fetchCurrent(); // FIXME This fills up the cache

        const projectsPromise = fetchProjects();
        const taskTypesPromise = fetchTaskTypes();
        const historyPromise = fetchHistory(startDate, endDate);

        this.shadowRoot.textContent = '';
        const content = template.content.cloneNode(true);

        const historyList = new HistoryList();
        (await historyPromise).reverse().forEach((item) => {
            historyList.appendChild(HistoryItem.createFromItem(item));
        });
        content.getElementById(HISTORY_ID).replaceWith(historyList);

        const currentForm = new CurrentForm();
        currentForm.projects = await projectsPromise;
        currentForm.taskTypes = await taskTypesPromise;
        currentForm.entry = await currentEntryPromise;
        content.getElementById(FORM_ID).replaceWith(currentForm);

        this.shadowRoot.textContent = '';
        this.shadowRoot.appendChild(content);
    }
}

customElements.define(TAG_NAME, DayPage);

export { TAG_NAME };
export default DayPage;
