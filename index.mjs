import { html, Component, render, useState, useEffect } from "htm/preact";

const API_BASE = "http://localhost:3000/";

/**
 * @typedef {Object} JiraApiIssue
 * @property {string} id
 * @property {string} self
 */

/**
 * @typedef {Object} Worklog
 * @property {string} startDate
 * @property {string} startTime
 * @property {string} description
 * @property {string} timeSpentSeconds
 * @property {string} JiraApiIssue
 */

const EntryListItem = ({ worklog }) => html`
  <div>
    <span>${worklog.date}</span>
    <span>${worklog.description}</span>
  </div>
`;

const EntryList = ({ worklogs }) => html`
  <ol>
    ${worklogs.map(
      (worklog) => html`
        <li>
          <${EntryListItem} worklog=${worklog} />
        </li>
      `
    )}
  </ol>
`;

const App = () => {
  const [worklogs, setWorklogs] = useState(undefined);

  useEffect(async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);

    const url = new URL("worklogs", API_BASE);
    url.searchParams.set("from", startDate.toISOString().split("T")[0]);
    url.searchParams.set("to", endDate.toISOString().split("T")[0]);
    url.searchParams.set("limit", "50");
    const res = await fetch(url);
    const newWorklogs = await res.json();
    setWorklogs(newWorklogs.results);
    console.log(newWorklogs);
  }, []);

  console.log(worklogs);

  if (worklogs === undefined) {
    return html`<div>Loading…</div>`;
  }

  return html`
    <h1>timey-wimey</h1>
    <${EntryList} worklogs=${worklogs} />
  `;
};

render(html`<${App} />`, document.body);
