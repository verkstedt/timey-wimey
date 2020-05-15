class Entry
{
    state;

    api;

    entryId;

    root = null;

    constructor (state, api, entryId)
    {
        this.state = state;
        this.api = api;
        this.entryId = entryId;
    }

    async bind (root)
    {
        this.root = root;

        this.reflectState();
    }

    async unbind ()
    {
        this.root = null;
    }

    reflectState ()
    {
        // TODO <time is=tw-time />
        const timeFormatter = new Intl.DateTimeFormat(document.documentElement.lang, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
        });

        const { history } = this.state.get();
        const entry = history.find(({ id }) => id === this.entryId);

        this.root.querySelector('[name="entry-task"]')
            .textContent = entry.task.value;
        this.root.querySelector('[name="entry-project"]')
            .textContent = `${entry.taskType.value} (${entry.project.value})`;

        const startElement = this.root.querySelector('[name="entry-start"]');
        startElement.dateTime = entry.start;
        startElement.textContent = timeFormatter.format(new Date(entry.start));

        const endElement = this.root.querySelector('[name="entry-end"]');
        const durationElement = this.root.querySelector('[name="entry-duration"]');
        endElement.dateTime = entry.end;
        endElement.textContent = timeFormatter.format(new Date(entry.end));

        const durationSec = Math.round(
            (new Date(entry.end) - new Date(entry.start)) / 1000,
        );
        durationElement.dateTime = `PT${durationSec}S`;
    }
}

export default Entry;
