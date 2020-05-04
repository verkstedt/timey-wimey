import deepAssign from './utils/deepAssign.mjs';

const DEFAULT_STATE = {
    auth: {
        login: null,
        token: null,
    },
    currentEntry: {
        id: null,
        project: {
            id: null,
        },
        taskType: {
            id: null,
        },
        task: {
            value: null,
        },
        start: null,
        end: null,
    },
};

class State
{
    state = null;

    callbacks = []

    constructor (storage)
    {
        this.storage = storage;
        this.state = this.storage.get() || DEFAULT_STATE;
    }

    async persist ()
    {
        this.storage.set(this.state);
    }

    get (name)
    {
        return this.state[name];
    }

    // TODO If nested → your code is bad and you should feel bad
    async set (newStateDiff)
    {
        const oldState = this.state;
        const oldStateJson = JSON.stringify(oldState);
        const newState = deepAssign({}, oldState, newStateDiff);

        if (JSON.stringify(newState) !== oldStateJson)
        {
            this.state = newState;
            await Promise.all(
                this.callbacks.map((callback) => callback(oldState)),
            );
            await this.persist();
        }
    }

    async clear ()
    {
        this.state = DEFAULT_STATE;
        this.persist();
    }

    addEventListener (callback)
    {
        this.callbacks.push(callback);
    }
}

export default State;
