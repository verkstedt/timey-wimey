import ServiceWorker, {
  TAG_NAME as SERVICE_WORKER,
} from './elements/service-worker.mjs'
import Duration, { TAG_NAME as DURATION } from './elements/tw-duration.mjs'

customElements.define(SERVICE_WORKER, ServiceWorker)
customElements.define(DURATION, Duration, { extends: 'time' })
