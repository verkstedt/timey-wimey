import setSelectValues from '../utils/setSelectValues.mjs';

class CurrentForm
{
    state;

    api;

    root = null;

    constructor (state, api)
    {
        this.state = state;
        this.api = api;

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleStop = this.handleStop.bind(this);
    }

    async bind (root)
    {
        this.root = root;

        this.root.addEventListener('submit', this.handleSubmit);
        this.root.querySelector('[name=change]').addEventListener('click', this.handleChange);
        this.root.querySelector('[name=stop]').addEventListener('click', this.handleStop);
    }

    async unbind ()
    {
        this.root.removeEventListener('submit', this.handleSubmit);
        this.root.querySelector('[name=change]').removeEventListener('click', this.handleChange);
        this.root.querySelector('[name=stop]').removeEventListener('click', this.handleStop);
    }

    async handleSubmit (event)
    {
        event.preventDefault();

        const { project, taskType, task } = this.getFormData();

        await this.processUI(async () => {
            const currentEntry =
                await this.api.start(project, taskType, task);
            await this.state.set({ currentEntry });
        });
    }

    async handleChange (event)
    {
        event.preventDefault();

        const { project, taskType, task } = this.getFormData();
        const {
            currentEntry: { id: currentEntryId },
        } = this.state.get();
        if (currentEntryId == null)
        {
            throw new Error('Cannot change — no task running.');
        }

        await this.processUI(async () => {
            const currentEntry = await this.api.update(
                currentEntryId,
                { project, taskType, task },
            );
            await this.state.set({ currentEntry });
        });
    }

    async handleStop (event)
    {
        event.preventDefault();

        const {
            currentEntry: { id: currentEntryId },
        } = this.state.get();

        await this.processUI(async () => {
            await this.api.stop(currentEntryId);
            await this.state.set({ currentEntry: null });
        });
    }

    async processUI (job)
    {
        const loader = this.root.querySelector('[data-loader]');
        loader.hidden = false;

        try
        {
            await job();
        }
        finally
        {
            loader.hidden = true;
        }
    }

    reflectState ()
    {
        const {
            projectValues = [],
            currentEntry,
        } = this.state.get();

        Array.from(this.root.querySelectorAll('select[name="project"]'))
            .forEach(setSelectValues.bind(null, projectValues));

        const taskValues = this.getTasksWithUsage();
        Array.from(this.root.querySelectorAll('datalist[name="task__list"]'))
            .forEach(setSelectValues.bind(null, taskValues));

        const running = Boolean(currentEntry);

        const {
            task: { value: task } = {},
            project: { id: projectId } = {},
            taskType: { id: taskTypeId } = {},
            start: startString,
        } = currentEntry || {};

        let taskValue = '';
        let projectValue = '';
        let startValue = '';
        if (running)
        {
            taskValue = task;
            projectValue = `${projectId}+${taskTypeId}`;
            startValue = new Date(startString);
        }


        this.root.querySelector('[name=task]').value = taskValue;

        this.root.querySelector('[name=project]').value = projectValue;

        const duration = this.root.querySelector('[name=duration]');
        duration.runningSince = startValue;

        this.root.querySelector('[name=stop]').disabled = !running;

        this.root.querySelector('[name=change]').disabled = !running;
    }

    getFormData ()
    {
        const data = new FormData(this.root);
        const task = data.get('task');
        // TODO Validate
        const projectAndTaskType = data.get('project').split('+');
        const project = Number(projectAndTaskType[0]);
        const taskType = Number(projectAndTaskType[1]);

        return {
            project,
            taskType,
            task,
        };
    }

    getTasksWithUsage ()
    {
        const { history } = this.state.get();

        const tasksUsage = Object.values(history).reduce(
            (carry, { task: { value: taskName } }) => ({
                ...carry,
                // TODO Case insensitive
                [taskName]: (carry[taskName] || 0) + 1,
            }),
            {},
        );

        const sortedTasksUsage = Object.fromEntries(
            Object.entries(tasksUsage).sort(([, a], [, b]) => b - a),
        );

        return (Object.keys(sortedTasksUsage));
    }
}

export default CurrentForm;
