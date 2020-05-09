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

        // TODO Processing feedback
        const currentEntry =
            await this.api.start(project, taskType, task);
        await this.state.set('currentEntry', currentEntry);
    }

    async handleChange (event)
    {
        event.preventDefault();

        const { project, taskType, task } = this.getFormData();
        const currentEntryId = this.state.get('currentEntry').id;
        if (currentEntryId == null)
        {
            throw new Error('Cannot change — no task running.');
        }

        // TODO Processing feedback
        const currentEntry = await this.api.update(
            currentEntryId,
            { project, taskType, task },
        );
        await this.state.set('currentEntry', currentEntry);
    }

    async handleStop (event)
    {
        event.preventDefault();

        const currentEntryId = this.state.get('currentEntry').id;
        // TODO Processing feedback
        await this.api.stop(currentEntryId);
        await this.state.set('currentEntry', null);
    }

    reflectState ()
    {
        Array.from(this.root.querySelectorAll('select[name="project"]'))
            .forEach(setSelectValues.bind(null, this.state.get('projectValues')));

        const currentEntry = this.state.get('currentEntry');
        const running = Boolean(currentEntry);

        const {
            project: { id: projectId } = {},
            taskType: { id: taskTypeId } = {},
        } = currentEntry || {};

        let taskValue = '';
        let projectValue = '';
        if (running)
        {
            taskValue = currentEntry.task.value;
            projectValue = `${projectId}+${taskTypeId}`;
        }


        this.root.querySelector('[name=task]').value = taskValue;

        this.root.querySelector('[name=project]').value = projectValue;

        // TODO Update duration

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
}

export default CurrentForm;
