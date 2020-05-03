import './define-elements.mjs';

import Storage from './Storage.mjs';
import State from './State.mjs';
import Api from './api/clockodo.mjs';
import App from './components/App.mjs';

const state = new State(new Storage('state'));
const api = new Api(state.get('auth').login, state.get('auth').token);
const app = new App(state, api);
app.bind(document.body);
