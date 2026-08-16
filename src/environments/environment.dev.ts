export const environment = {
  production: false,
  // API base URLs sourced from appsettings.json during runtime
  // You can access them via HttpClient calls to the config endpoint or import JSON directly if needed
  // For now, we expose the same defaults used locally.
  apiBaseUrl: 'http://localhost:5219/api',
  reportBaseUrl: 'http://localhost:5219/api/report',
  signalRBaseUrl: 'http://localhost:5219/api/signalR'
};
