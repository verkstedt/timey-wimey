import { html, Component, render, useState, useEffect } from "htm/preact";

const JIRA_CLOUD_INSTANCE_NAME = "";
const CLIENT_ID = "";
const CLIENT_SECRET = "";

const REDIRECT_URI = window.location.href.split("?")[0];

const API_BASE = "http://localhost:8010/";

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

/** @param {Worklog} worklog */
const EntryListItem = ({ worklog }) => {
  const startDate = new Date(worklog.startDate + "T" + worklog.startTime);
  const endDate = new Date(
    startDate.getTime() + worklog.timeSpentSeconds * 1_000
  );

  const durationFormatter = new Intl.DurationFormat(navigator.language, {
    style: "narrow",
  });

  const hours = Math.floor(worklog.timeSpentSeconds / 3600);
  const minutes = Math.floor((worklog.timeSpentSeconds % 3600) / 60);
  const seconds = worklog.timeSpentSeconds % 60;
  const duration = { hours, minutes, seconds };

  return html`
    <div className="entry-list-item">
      <p class="entry-list-item__description">${worklog.description}</p>
      <p class="entry-list-item__time">
        ${startDate.toLocaleTimeString()} — ${endDate.toLocaleTimeString()}
      </p>
      <p class="entry-list-item__duration">
        ${durationFormatter.format(duration)}
      </p>
  </div>
`;
};

const EntryList = ({ worklogs }) => html`
  <ol reversed>
    ${worklogs.map(
      (worklog) => html`
        <li>
          <${EntryListItem} worklog=${worklog} />
        </li>
      `
    )}
  </ol>
`;

const DayList = ({ worklogs }) => {
  const worklogsByDay = worklogs.reduce((acc, worklog) => {
    const date = new Date(worklog.startDate);
    const key = date.toISOString().split("T")[0];
    acc[key] = acc[key] || [];
    acc[key].push(worklog);
    return acc;
  }, {});

  const dateFormatter = new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "full",
  });

  return html`
    ${Object.entries(worklogsByDay).map(([day, worklogs]) => {
      const date = new Date(day);
      const formattedDate = dateFormatter.format(date);
      return html`
        <section>
          <h4>${formattedDate}</h4>
          <${EntryList} worklogs=${worklogs} />
        </section>
      `;
    })}
  `;
};

const MonthList = ({ worklogs }) => {
  const worklogsByMonth = worklogs.reduce((acc, worklog) => {
    const date = new Date(worklog.startDate);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    acc[key] = acc[key] || [];
    acc[key].push(worklog);
    return acc;
  }, {});

  const monthFormatter = new Intl.DateTimeFormat(navigator.language, {
    month: "long",
  });

  return html`
    ${Object.entries(worklogsByMonth).map(([monthKey, worklogs]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(year, month - 1);
      const monthName = monthFormatter.format(date);
      return html`
        <section>
          <h3>${monthName}</h3>
          <${DayList} worklogs=${worklogs} />
        </section>
      `;
    })}
  `;
};

const LoginToJira = () => {
  return html`
    <a
      href="https://${JIRA_CLOUD_INSTANCE_NAME}.atlassian.net/plugins/servlet/ac/io.tempo.jira/oauth-authorize/?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}"
      >Login to Jira</a
    >
  `;
};

const code = new URL(window.location.href).searchParams.get("code");
window.history.replaceState({}, "", window.location.href.split("?")[0]);

const App = () => {
  const [jiraAccess, setJiraAccess] = useState(
    JSON.parse(localStorage.getItem("jiraAccess") || "null")
  );
  const [worklogs, setWorklogs] = useState(undefined);

  useEffect(() => {
    if (jiraAccess) {
      localStorage.setItem("jiraAccess", JSON.stringify(jiraAccess));
    }
  }, [jiraAccess]);

  useEffect(async () => {
    if (code && !jiraAccess) {
      const url = new URL("oauth/token", API_BASE);
      const body = new URLSearchParams();
      body.set("grant_type", "authorization_code");
      body.set("code", code);
      body.set("redirect_uri", REDIRECT_URI);
      body.set("client_id", CLIENT_ID);
      body.set("client_secret", CLIENT_SECRET);

      const result = await fetch(url, {
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = await result.json();
      setJiraAccess(data);
    }
  }, [code, jiraAccess]);

  useEffect(async () => {
    if (jiraAccess) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);

      const url = new URL("4/worklogs", API_BASE);
      url.searchParams.set("from", startDate.toISOString().split("T")[0]);
      url.searchParams.set("to", endDate.toISOString().split("T")[0]);
      // “infinity”
      url.searchParams.set("limit", 1_000_000);
      url.searchParams.set("orderBy", "START_DATE_TIME");
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${jiraAccess.access_token}`,
        },
      });
      const newWorklogs = await res.json();
      setWorklogs(newWorklogs.results);
    }
  }, [jiraAccess]);

  if (!code && !jiraAccess) {
    return html`<${LoginToJira} />`;
  } else if (worklogs === undefined) {
    return html`<div>Loading…</div>`;
  } else {
    return html`
      <h1>timey-wimey</h1>
      <${MonthList} worklogs=${worklogs} />
    `;
  }
};

render(html`<${App} />`, document.body);
