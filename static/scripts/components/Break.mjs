import isToday from '../utils/isToday.mjs';

class Break
{
    state;

    api;

    prevEntryId;

    entryId;

    root = null;

    constructor (state, prevEntryId, entryId)
    {
        this.state = state;
        this.prevEntryId = prevEntryId;
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
        const { history } = this.state.get();
        const entry = history.find(({ id }) => id === this.entryId);
        const entryEnd = entry.end;
        if (!this.prevEntryId && !isToday(new Date(entryEnd)))
        {
            this.root.hidden = true;
            return;
        }

        const prevEntry =
            this.prevEntryId
                ? history.find(({ id }) => id === this.prevEntryId)
                : null;
        const prevEntryStart =
            prevEntry
                ? prevEntry.start
                // TODO Should be ticking
                : new Date();

        const durationElement = this.root.querySelector('[name="duration"]');

        const durationSec = Math.round(
            (new Date(entryEnd) - new Date(prevEntryStart)) / 1000,
        );

        if (durationSec === 0)
        {
            this.root.hidden = true;
        }
        else
        {
            this.root.hidden = false;
            durationElement.dateTime = `PT${durationSec}S`;
        }
    }
}

export default Break;
