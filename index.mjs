import { html, Component, render } from "htm/preact";

const App = () => html`<h1>timey-wimey</h1>`;

render(html`<${App} />`, document.body);
