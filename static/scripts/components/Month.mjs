import Day from './Day.mjs';

class Month
{
    state;

    api;

    refreshHistory;

    monthDateString;

    root = null;

    dayTpl = null;

    days = [];

    constructor (state, api, refreshHistory, monthDateString)
    {
        this.state = state;
        this.api = api;
        this.refreshHistory = refreshHistory;
        this.monthDateString = monthDateString;
    }

    async bind (root, dayTpl)
    {
        this.root = root;
        this.dayTpl = dayTpl;

        this.reflectState();
    }

    async unbind ()
    {
        this.days.forEach((day) => day.unbind());

        this.root = null;
        this.dayTpl = null;
    }

    reflectState ()
    {
        const document = this.root.ownerDocument;
        const { history } = this.state.get();
        const monthHistoryEntries = history
            .filter(
                (entry) => (
                    entry.end
                    && entry.start.startsWith(this.monthDateString)
                ),
            );

        const monthNameFormatter = new Intl.DateTimeFormat(
            undefined,
            { month: 'long' },
        );

        const monthName =
            monthNameFormatter
                .formatToParts(new Date(this.monthDateString))[0]
                .value;

        const monthNameElement = this.root.querySelector('[name="month-name"]');
        monthNameElement.dateTime = this.monthDateString;
        monthNameElement.textContent = monthName;

        const totalMs = monthHistoryEntries
            .map(({ start, end }) => new Date(end) - new Date(start))
            .reduce(
                (carry, duration) => carry + duration,
                0,
            );
        this.root.querySelector('[name="total-value"]').dateTime =
            `PT${Math.round(totalMs / 1000)}S`;

        const dayKeys = new Set();
        monthHistoryEntries.forEach((entry) => {
            // / FIXME Should always be String
            const start =
                entry.start instanceof Date
                    ? entry.start.toISOString()
                    : entry.start;
            const dayKey = start.split('T')[0];
            dayKeys.add(dayKey);
        });
        const daysRoot = this.root.querySelector('[name="days"]');
        const dayTplElement = this.dayTpl.content.children[0];
        const days = document.createDocumentFragment();
        Array.from(dayKeys).sort().reverse().forEach((dayKey) => {
            const dayElement =
                document.importNode(dayTplElement, true);
            const day = new Day(
                this.state,
                this.api,
                this.refreshHistory,
                dayKey,
            );
            this.days.push(day);
            const entryTpl = dayElement.querySelector('[name="entry-tpl"]');
            const breakTpl = dayElement.querySelector('[name="break-tpl"]');
            day.bind(dayElement, entryTpl, breakTpl);
            days.appendChild(dayElement);
        });

        daysRoot.textContent = '';
        daysRoot.appendChild(days);
    }
}

export default Month;
