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

const calculateTotalDuration = (worklogs) => {
  const totalSeconds = worklogs.reduce(
    (total, worklog) => total + worklog.timeSpentSeconds,
    0
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
};

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

  const durationFormatter = new Intl.DurationFormat(navigator.language, {
    style: "narrow",
  });

  return html`
    ${Object.entries(worklogsByDay).map(([day, dayWorklogs]) => {
      const date = new Date(day);
      const formattedDate = dateFormatter.format(date);
      const totalDuration = calculateTotalDuration(dayWorklogs);
      const totalHours =
        totalDuration.hours +
        totalDuration.minutes / 60 +
        totalDuration.seconds / 3600;
      const expectedHours = 8;
      const durationClass =
        totalHours >= expectedHours
          ? "duration-total--sufficient"
          : "duration-total--insufficient";
      const expectedDuration = { hours: expectedHours, minutes: 0, seconds: 0 };
      return html`
        <section>
          <header class="header">
          <h4>${formattedDate}</h4>
            <p class="duration-total ${durationClass}">
              Total: ${durationFormatter.format(totalDuration)} /
              ${durationFormatter.format(expectedDuration)}
            </p>
          </header>
          <${EntryList} worklogs=${dayWorklogs} />
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
    year: "numeric",
  });

  const durationFormatter = new Intl.DurationFormat(navigator.language, {
    style: "narrow",
  });

  return html`
    ${Object.entries(worklogsByMonth).map(([monthKey, monthWorklogs]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(year, month - 1);
      const monthName = monthFormatter.format(date);
      const totalDuration = calculateTotalDuration(monthWorklogs);
      const workDays = new Set(
        monthWorklogs.map((worklog) => worklog.startDate)
      ).size;
      const totalHours =
        totalDuration.hours +
        totalDuration.minutes / 60 +
        totalDuration.seconds / 3600;
      const expectedHours = workDays * 8;
      const durationClass =
        totalHours >= expectedHours
          ? "duration-total--sufficient"
          : "duration-total--insufficient";
      const expectedDuration = { hours: expectedHours, minutes: 0, seconds: 0 };
      return html`
        <section>
          <header class="header">
          <h3>${monthName}</h3>
            <p class="duration-total ${durationClass}">
              Total: ${durationFormatter.format(totalDuration)} /
              ${durationFormatter.format(expectedDuration)}
            </p>
          </header>
          <${DayList} worklogs=${monthWorklogs} />
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

  const handleLogOut = () => {
    localStorage.clear();
    window.location.reload();
  };

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
      <button type="button" onClick="${handleLogOut}">Log out</button>
      <main>
      <${MonthList} worklogs=${worklogs} />
      </main>
    `;
  }
};

render(html`<${App} />`, document.body);