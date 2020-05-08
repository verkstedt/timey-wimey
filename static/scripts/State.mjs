import deepAssign from './utils/deepAssign.mjs';
import deepFreeze from './utils/deepFreeze.mjs';

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
    state;

    callbacks = []

    constructor (storage)
    {
        this.storage = storage;
        this.state = deepFreeze(deepAssign(
            {},
            DEFAULT_STATE,
            this.storage.get() || {},
        ));
    }

    async persist ()
    {
        this.storage.set(this.state);
    }

    get ()
    {
        return this.state;
    }

    // TODO If nested → your code is bad and you should feel bad
    async set (newStateDiff)
    {
        const oldState = this.state;
        const oldStateJson = JSON.stringify(oldState);
        const newState = deepAssign({}, oldState, newStateDiff);

        if (JSON.stringify(newState) !== oldStateJson)
        {
            this.state = deepFreeze(newState);
            await Promise.all(
                this.callbacks.map((callback) => callback(oldState)),
            );
            await this.persist();
        }
    }

    async clear ()
    {
        this.state = deepFreeze(DEFAULT_STATE);
        this.persist();
    }

    addEventListener (callback)
    {
        this.callbacks.push(callback);
    }
}

export default State;
