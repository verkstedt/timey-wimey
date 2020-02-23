import {
    isAuthorized,
    login,
    fetchProjects,
    fetchTaskTypes,
    fetchCurrent,
    start,
    stop,
    fetchHistory,
} from './clockodo/index.mjs';

const IS_LOCALHOST = /^(localhost|127\.0\.0\.1|::1|)$/.test(window.location.hostname.toLowerCase());

function markInitialized ()
{
    document.body.removeAttribute('data-initialized');
}

function registerServiceWorker ()
{
    if (
        'serviceWorker' in navigator
        && (window.location.protocol === 'https:' || IS_LOCALHOST)
    )
    {
        navigator.serviceWorker.register('/serviceWorker.js');
    }
}

async function handleCurrentSubmit (event)
{
    event.preventDefault();

    const form = event.target;
    const running = form.dataset.running === 'true';
    const data = new FormData(form);

    if (running)
    {
        await stop(Number(data.get('id')));
    }
    else
    {
        await start(
            Number(data.get('projectId')),
            Number(data.get('taskTypeId')),
            data.get('taskName'),
        );
    }

    window.location.reload();
}

function addEventListeners ()
{
    document.getElementById('current-form').addEventListener('submit', handleCurrentSubmit);
}

function formatTime (date)
{
    if (date.toISOString().split('T')[0] === (new Date()).toISOString().split('T')[0])
    {
        return date.toLocaleTimeString();
    }
    return date.toLocaleString();
}

function populateSelect (element, data)
{
    // eslint-disable-next-line no-param-reassign
    element.innerHTML = '<option value=""></option>';
    // TODO Sort by last used
    data.forEach(({ id, name }) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        element.appendChild(option);
    });
}

function reflectProjects (projects)
{
    populateSelect(
        document.getElementById('current-project'),
        projects,
    );
}

function reflectTaskTypes (taskTypes)
{
    populateSelect(
        document.getElementById('current-task-type'),
        taskTypes,
    );
}

function reflectCurrentEntry (entry)
{
    const currentForm = document.getElementById('current-form');
    const idElement = document.getElementById('current-id');
    const projectElement = document.getElementById('current-project');
    const taskTypeElement = document.getElementById('current-task-type');
    const taskElement = document.getElementById('current-task');
    const startElement = document.getElementById('current-start');
    const submitButton = document.getElementById('play-stop');

    if (entry)
    {
        currentForm.setAttribute('data-running', 'true');
        submitButton.textContent = submitButton.dataset.stopLabel;

        idElement.value = entry.id;
        projectElement.value = entry.project.id;
        taskTypeElement.value = entry.taskType.id;
        taskElement.value = entry.task.value;
        startElement.datetime = entry.start;
        startElement.textContent = formatTime(entry.start);
    }
    else
    {
        currentForm.setAttribute('data-running', 'false');
        submitButton.textContent = submitButton.dataset.startLabel;

        idElement.value = null;
        projectElement.value = null;
        taskTypeElement.value = null;
        taskElement.value = null;
        startElement.datetime = null;
        startElement.textContent = null;
    }
}

function reflectHistory (history)
{
    const rootEl = document.getElementById('history');

    let prevDateString = null;
    history.reverse().forEach((item) => {
        const dateString = item.start.toLocaleDateString();
        if (dateString !== prevDateString)
        {
            const heading = document.createElement('h2');
            heading.textContent = dateString;
            rootEl.appendChild(heading);
        }
        prevDateString = dateString;

        const itemEl = document.getElementById('historyItem').content.cloneNode(true);

        const startEl = itemEl.querySelector('.historyItem__start');
        startEl.dateTime = item.start.toISOString();
        startEl.textContent = item.start.toLocaleTimeString();

        const endEl = itemEl.querySelector('.historyItem__end');
        endEl.dateTime = item.end.toISOString();
        endEl.textContent = item.end.toLocaleTimeString();

        itemEl.querySelector('.historyItem__project').textContent = item.project.value;
        itemEl.querySelector('.historyItem__taskType').textContent = item.taskType.value;
        itemEl.querySelector('.historyItem__task').textContent = item.task.value;

        rootEl.appendChild(itemEl);
    });
}

function showLogin ()
{
    document.getElementById('login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(event.target);
        login(data.get('login'), data.get('password'));
    });
    document.getElementById('login-dialog').showModal();
}

async function main ()
{
    registerServiceWorker();

    if (!await isAuthorized())
    {
        showLogin();
        markInitialized();
        return;
    }

    // TODO Loading feedback

    const currentEntryPromise = await fetchCurrent();
    const projectsPromise = fetchProjects();
    const taskTypesPromise = fetchTaskTypes();

    const today = new Date();
    const startDate = new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        1,
    );
    const endDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );
    const historyPromise = fetchHistory(startDate, endDate);

    reflectProjects(await projectsPromise);
    reflectTaskTypes(await taskTypesPromise);
    reflectCurrentEntry(await currentEntryPromise);
    reflectHistory(await historyPromise);

    addEventListeners();

    markInitialized();
}

main();
