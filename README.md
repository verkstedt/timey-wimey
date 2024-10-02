# Timey–wimey time tracking thing

v2 switches from clockodo to Tempo.

## Getting started

0. Go to (replace `NAME` with your instance name) https://NAME.atlassian.net/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/identity-service
0. Add application.
0. Create a tunnel that will make your app accessible from the internet, e.g.

   ```sh
   npx tunnelmole 8080
   ```

0. Update vars (client api, secret and redirect uri) on top of the `index.mjs` file.

   ⚠ You will have to update the redirect uri every time you restart the tunnel.

0. Run CORS proxy to make it possible to access Tempo API from your browser:

   ```sh
   npx local-cors-proxy --proxyUrl https://api.eu.tempo.io --proxyPartial ''
   ```

0. FINALLY! In another terminal, run

   ```sh
   npx @11ty/eleventy-dev-server
   ```

0. Open https://localhost:8080/