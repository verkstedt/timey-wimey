import './define-elements.mjs'

import Storage from './Storage.mjs'
import State from './State.mjs'
import Api from './api/clockodo.mjs'
import App from './components/App.mjs'

const state = new State(new Storage('state'))
const {
  auth: { login, token },
} = state.get()
const api = new Api(login, token)
const app = new App(state, api, window)
app.bind(document.body)
