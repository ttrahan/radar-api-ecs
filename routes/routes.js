'use strict';
module.exports = routes;

function routes(app) {
  app.all('/', function (req, res) {
    logger.info('Status page');
    if (process.env.NODE_ENV === 'dev') {
      res.status(200).json({
        status: 'OK -- dev',
        body: req.body,
        query: req.query,
        params: req.params,
        method: req.method
      });
    }
    else {
      res.status(200).json({
        status: 'OK',
        body: req.body,
        query: req.query,
        params: req.params,
        method: req.method
      });
    }
  });

  app.all('/info', require('./info.js'));
  app.get('/issues', require('./issues.js'));

  app.use(
    function (req, res) {
      res.status(404);
      logger.error('Page not found');
      res.send('Page does not exist');
    }
  );
}
