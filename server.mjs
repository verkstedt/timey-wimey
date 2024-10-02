import http from "http";
import { URL } from "url";

const jiraCloudInstanceName = "verkstedt";
const CLIENT_ID = "ivj3dGmVjIMEi1UpzBPQaHCFZ6FUxfxCHXY6JNbcd4r4e9HqTw";
const CLIENT_SECRET =
  "4xUZIdoo79iII8Av7O4tbzzMgOQMNy10iGZonUvUla4kChzD9U4s9gPwUOY4tPcjwsbLUcgch7Ww1bq9xje0nbIe8GEWiHDKkjWf1ivVjzZGexswJLuiex5Zh89BPGLT";
const REDIRECT_URI = "https://dusohj-ip-80-133-126-7.tunnelmole.net/";

const port = 3000; // You can change this to any port you prefer
const TEMPO_API_URL = "https://api.eu.tempo.io/4/";

// From https://${jiraCloudInstanceName}.atlassian.net/plugins/servlet/ac/io.tempo.jira/tempo-app#!/configuration/api-integration
const API_TOKEN = process.env.TEMPO_API_TOKEN;

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url.substring(1), TEMPO_API_URL);

  const options = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  };

  if (req.headers["content-type"]) {
    options.headers["Content-Type"] = req.headers["content-type"];
  }

  // If the request has a body, read it and add it to the fetch options
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const body = await getRequestBody(req);
    options.body = body;
  }

  try {
    console.log(options.method, urlObj.toString(), options);
    const response = await fetch(urlObj, options);

    // Read the entire response body
    const responseBody = await response.text();

    // Forward the status and headers
    res.writeHead(response.status, {
      ...response.headers,
      "Access-Control-Allow-Origin": "*",
    });

    // Send the entire response body at once
    res.end(responseBody);
  } catch (error) {
    console.error("Proxy request error:", error);
    res.writeHead(500);
    res.end("Proxy error");
  }
});

// Helper function to read the request body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

server.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
