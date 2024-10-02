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

  console.log({
    jiraAccess,
    code,
  });

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
      url.searchParams.set("limit", "50");
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${jiraAccess.access_token}`,
        },
      });
      const newWorklogs = await res.json();
      setWorklogs(newWorklogs.results);
      console.log(newWorklogs);
    }
  }, [jiraAccess]);

  if (!code && !jiraAccess) {
    return html`<${LoginToJira} />`;
  } else if (worklogs === undefined) {
    return html`<div>Loading…</div>`;
  } else {
    return html`
      <h1>timey-wimey</h1>
      <${EntryList} worklogs=${worklogs} />
    `;
  }
};

render(html`<${App} />`, document.body);
