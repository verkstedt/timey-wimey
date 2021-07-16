import Month from './Month.mjs';

class History
{
    state;

    api;

    refreshHistory;

    root = null;

    monthTpl = null;

    months = [];

    constructor (state, api, refreshHistory)
    {
        this.state = state;
        this.api = api;
        this.refreshHistory = refreshHistory;
    }

    async bind (root, monthTpl)
    {
        this.root = root;
        this.monthTpl = monthTpl;
    }

    async unbind ()
    {
        this.months.forEach((month) => month.unbind());

        this.root = null;
        this.monthTpl = null;
    }

    reflectState ()
    {
        const document = this.root.ownerDocument;
        const monthTplElement = this.monthTpl.content.children[0];
        const { history } = this.state.get();
        const monthKeys = new Set();
        history.forEach((item) => {
            // / FIXME Should always be String
            const start =
                item.start instanceof Date
                    ? item.start.toISOString()
                    : item.start;
            const monthKey = start.split('-').slice(0, 2).join('-');
            monthKeys.add(monthKey);
        });

        const months = document.createDocumentFragment();
        Array.from(monthKeys).sort().reverse().forEach((monthKey) => {
            const monthElement =
                document.importNode(monthTplElement, true);
            const dayTpl = monthElement.querySelector('[name="day-tpl"]');
            const month = new Month(
                this.state,
                this.api,
                this.refreshHistory,
                monthKey,
            );
            this.months.push(month);
            month.bind(monthElement, dayTpl);
            months.appendChild(monthElement);
        });

        this.root.textContent = '';
        this.root.appendChild(months);
    }
}

export default History;
