import { TAG_NAME as HISTORY_DAY_LIST } from './history-list-day.mjs';

const TAG_NAME = 'history-list';

class HistoryList extends HTMLElement
{
    constructor (...argv)
    {
        const result = super(...argv);
        this.attachShadow({ mode: 'open' });
        return result;
    }

    appendChild (child)
    {
        // TODO Month wrapper
        // TODO Week wrapper

        let { lastElementChild } = this.shadowRoot;
        if (
            lastElementChild == null
            || (
                child.startDateString
                !== lastElementChild.startDateString
            )
        )
        {
            lastElementChild = document.createElement(HISTORY_DAY_LIST);
            lastElementChild.setAttribute('date', child.startDateString);
            this.shadowRoot.appendChild(lastElementChild);
        }

        lastElementChild.appendChild(child);
    }

    // eslint-disable-next-line class-methods-use-this
    insertBefore ()
    {
        throw new Error('Unimplemented');
    }

    // eslint-disable-next-line class-methods-use-this
    insertAdjacentElement ()
    {
        throw new Error('Unimplemented');
    }
}

customElements.define(TAG_NAME, HistoryList);

export { TAG_NAME };
export default HistoryList;
