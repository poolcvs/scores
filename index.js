/*
  index.js
  Compares scores.
*/

// ########## IMPORTS

// Module to keep secrets local.
require('dotenv').config();
// Module to access files.
const fs = require('fs/promises');
// Module to create an HTTP server and client.
const http = require('http');
// Function to compare scores.
const {comparer} = require(`testilo/procs/compare/${process.env.COMPARER}/index`);

// ########## FUNCTIONS

// Creates and serves a result.
const compare = async (scoredReports, response) => {
  try {
    const comparison = await comparer(scoredReports);
    response.end(comparison);
  }
  catch(error) {
    await serveError(error, response);
  }
};
// Handles a request.
const requestHandler = async (request, response) => {
  const {method} = request;
  // Get its URL.
  const requestURL = request.url;
  // If the URL ends with a slash:
  if (requestURL.endsWith('/')) {
    // Redirect the client permanently.
    response.writeHead(301, {'Location': requestURL.slice(0, -1)});
    response.end();
  }
  // Otherwise, if the request is a GET request:
  else if (method === 'GET') {
    // If it is for the stylesheet:
    if (requestURL.endsWith('style.css')) {
      // Serve it.
      const styleSheet = await fs.readFile('style.css', 'utf8');
      response.end(styleSheet);
    }
    // Otherwise, if it is for the application icon:
    else if (requestURL.includes('favicon.')) {
      // Get the site icon.
      const icon = await fs.readFile('favicon.ico');
      // Serve it.
      response.setHeader('Content-Type', 'image/x-icon');
      response.write(icon, 'binary');
      response.end('');
    }
    // Otherwise, if it is for the score comparison:
    else if (['/scores', '/scores/index.html'].includes(requestURL)) {
      // Get the reports.
      const allReportNames = await fs.readdir('../testu/reports');
      const jsonReportNames = allReportNames.filter(reportName => reportName.endsWith('.json'));
      const reports = [];
      for (const reportName of jsonReportNames) {
        const reportJSON = await fs.readFile(`../testu/reports/${reportName}`, 'utf8');
        const report = JSON.parse(reportJSON);
        reports.push(report);
      };
      // Get a comparison of them.
      const comparison = await comparer(reports);
      // Serve it.
      response.setHeader('Content-Location', '/scores/result');
      response.end(comparison);
    }
  }
  // Otherwise, i.e. if it uses another method:
  else {
    // Report this.
    console.log(`ERROR: Request with prohibited method ${method} received`);
  }
};
// ########## SERVER
const serve = (protocolModule, options) => {
  const server = protocolModule.createServer(options, requestHandler);
  const port = process.env.PORT || '3009';
  server.listen(port, () => {
    console.log(`Scores server listening at http://localhost:${port}.`);
  });
};
serve(http, {});
