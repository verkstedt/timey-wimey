class Entry
{
    state;

    api;

    refreshHistory;

    entryId;

    root = null;

    constructor (state, api, refreshHistory, entryId)
    {
        this.state = state;
        this.api = api;
        this.refreshHistory = refreshHistory;
        this.entryId = entryId;

        this.handleEditClick = this.handleEditClick.bind(this);
        this.handleSplitClick = this.handleSplitClick.bind(this);
    }

    static getEntryIdFromEvent (event)
    {
        const element = event.currentTarget;
        const container = element.closest('[data-component="entry"]');
        return container.dataset.entryId;
    }

    handleEditClick (event)
    {
        event.preventDefault();
        const entryId = Entry.getEntryIdFromEvent(event);

        // TODO Implement editing entries
        const win2 = window.open(
            `https://my.clockodo.com/en/entries/editentry/?id=${entryId}`,
        );
        this.refreshAfterWindowCloses(win2);
    }

    handleSplitClick (event)
    {
        event.preventDefault();
        const entryId = Entry.getEntryIdFromEvent(event);

        // TODO Implement splitting entries
        const win2 = window.open(
            `https://my.clockodo.com/en/entries/split/?id=${entryId}`,
        );
        this.refreshAfterWindowCloses(win2);
    }

    refreshAfterWindowCloses (win)
    {
        const id = window.setInterval(() => {
            if (win.closed)
            {
                window.clearInterval(id);
                this.refreshHistory();
            }
        }, 200);
    }

    async bind (root)
    {
        this.root = root;

        this.root.dataset.entryId = this.entryId;

        root.querySelector('[data-component="edit"]')
            .addEventListener('click', this.handleEditClick);
        root.querySelector('[data-component="split"]')
            .addEventListener('click', this.handleSplitClick);

        this.reflectState();
    }

    async unbind ()
    {
        this.root = null;
    }

    reflectState ()
    {
        // TODO <time is=tw-time />
        const timeFormatter = new Intl.DateTimeFormat(
            undefined,
            {
                hour: 'numeric',
                minute: '2-digit',
                hour12: false,
            },
        );

        const { history } = this.state.get();
        const entry = history.find(({ id }) => id === this.entryId);

        this.root.querySelector('[name="entry-task"]')
            .textContent = entry.task.value;
        this.root.querySelector('[name="entry-project"]')
            .textContent = `${entry.project.name}`;

        const startElement = this.root.querySelector('[name="entry-start"]');
        startElement.dateTime = entry.start;
        startElement.textContent = timeFormatter.format(
            new Date(entry.start),
        );

        const endElement = this.root.querySelector('[name="entry-end"]');
        const durationElement = this.root.querySelector('[name="entry-duration"]');
        endElement.dateTime = entry.end;
        endElement.textContent = timeFormatter.format(
            new Date(entry.end),
        );

        const durationSec = Math.round(
            (new Date(entry.end) - new Date(entry.start)) / 1000,
        );
        durationElement.dateTime = `PT${durationSec}S`;
    }
}

export default Entry;
