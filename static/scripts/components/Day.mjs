import Entry from './Entry.mjs';

// FIXME Util
function createDayNameFormatter ()
{
    const dayNameFormatter = new Intl.DateTimeFormat(
        undefined,
        { day: 'numeric', weekday: 'long' },
    );

    return {
        format: (date) => {
            const relDate = new Date();
            if (date.toDateString() === relDate.toDateString())
            {
                return 'Today';
            }

            relDate.setDate(relDate.getDate() - 1);
            if (date.toDateString() === relDate.toDateString())
            {
                return 'Yesterday';
            }

            return dayNameFormatter.format(date);
        },
    };
}

class Day
{
    state;

    api;

    dayDateString;

    root = null;

    entryTpl = null;

    entries = [];

    constructor (state, api, dayDateString)
    {
        this.state = state;
        this.api = api;
        this.dayDateString = dayDateString;
    }

    async bind (root, entryTpl)
    {
        this.root = root;
        this.entryTpl = entryTpl;

        this.reflectState();
    }

    async unbind ()
    {
        this.entries.forEach((entry) => entry.unbind());

        this.root = null;
        this.entryTpl = null;
    }

    reflectState ()
    {
        const { history } = this.state.get();

        const dayNameFormatter = createDayNameFormatter();

        const dayNameElement = this.root.querySelector('[name="day-name"]');
        dayNameElement.textContent =
            dayNameFormatter.format(new Date(this.dayDateString));

        const dayHistoryEntries = history
            .filter(
                (entry) => (
                    entry.end
                    && entry.start.startsWith(this.dayDateString)
                ),
            )
            .sort((a, b) => new Date(b.start) - new Date(a.start));

        const totalMs = dayHistoryEntries
            .map(({ start, end }) => new Date(end) - new Date(start))
            .reduce(
                (carry, duration) => carry + duration,
                0,
            );
        this.root.querySelector('[name="total-value"]').dateTime =
            `PT${Math.round(totalMs / 1000)}S`;

        const entriesRoot = this.root.querySelector('[name="entries"]');
        const entryTplElement = this.entryTpl.content.children[0];
        const entries = document.createDocumentFragment();
        dayHistoryEntries.forEach(({ id: entryId }) => {
            const entryElement =
                document.importNode(entryTplElement, true);
            const entry = new Entry(this.state, this.api, entryId);
            this.entries.push(entry);
            entry.bind(entryElement);
            entries.appendChild(entryElement);
        });
        entriesRoot.textContent = '';
        entriesRoot.appendChild(entries);
    }
}

export default Day;
