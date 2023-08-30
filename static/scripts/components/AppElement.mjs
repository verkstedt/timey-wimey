import { LitElement } from 'lit'

export default class AppElement extends LitElement {
  createRenderRoot() {
    // Create so called “light DOM” which allows styles to bleed in and out
    return this
  }
}
