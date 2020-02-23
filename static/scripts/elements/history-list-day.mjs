import { TAG_NAME as HISTORY_ITEM } from './history-item.mjs';

const TAG_NAME = 'history-list-day';

const historyListDayTemplate = document.createElement('template');
historyListDayTemplate.innerHTML = `
    <h2>
        <slot name="date" />
    </h2>

    <ol reversed>
        <slot />
    </ol>

    <footer>
        In total: <slot name=total />
    </footer>
`;

class HistoryListDay extends HTMLElement
{
    style = { display: 'list' };

    constructor (...argv)
    {
        const result = super(...argv);
        this.attachShadow({ mode: 'open' }).appendChild(
            historyListDayTemplate.content.cloneNode(true),
        );
        return result;
    }

    appendChild (child)
    {
        const existingStartDateString = this.startDateString;
        const childStartDateString = child.startDateString;
        if (existingStartDateString && childStartDateString
            !== existingStartDateString)
        {
            throw new Error('All elements must has the same starting date.');
        }

        if (this.children.length === 0)
        {
            const dateEl = document.createElement('time');
            dateEl.slot = 'date';
            dateEl.textContent = childStartDateString;
            this.shadowRoot.appendChild.call(this, dateEl);

            const totalEl = document.createElement('time');
            totalEl.slot = 'total';
            this.shadowRoot.appendChild.call(this, totalEl);
        }

        this.shadowRoot.appendChild.call(this, child);

        const totalEl = this.querySelector('time[slot=total]');
        const totalSec = Math.round(Array.from(this.children)
            .filter((ch) => ch.tagName === HISTORY_ITEM.toUpperCase())
            .reduce((curry, ch) => curry + ch.seconds, 0) / 1000);
        totalEl.dateTime = `P${totalSec}S`;
        totalEl.textContent =
            (new Date(0, 0, 0, 0, 0, totalSec)).toLocaleTimeString();
    }

    get startDateString ()
    {
        const existingItem = this.querySelector(HISTORY_ITEM);
        if (existingItem == null)
        {
            return null;
        }

        return existingItem.startDateString;
    }
}

customElements.define(TAG_NAME, HistoryListDay);

export { TAG_NAME };
export default HistoryListDay;
