'use strict';

/* jshint camelcase:false*/
var request = require('sync-request');
module.exports = issues;

var indexData = {};
var obsWindow = [1, 2, 4, 7, 10, 15, 30];
var typeNameArray = ['question', 'bug', 'feature request', 'other'];
var stateNameArray = ['resolved', 'triaged', 'in progress', 'other'];

function issues(req, res, next) {
  logger.info('Issues page');
  try {
    if (req.query.token !== undefined) {
      if (req.query.state === 'Open') {
        mainLoadingGET('open', req, res, next);
      } else if (req.query.state === 'Close') {
        mainLoadingGET('closed', req, res, next);
      }
    } else {
      res.redirect('/');
    }
  } catch (e) {
    if (e.statusCode === 401) {
      logger.error('Access Error');
      load(res, 'accessError');
    }
  }
}

function mainLoadingGET(state, req, res) {
  var data = '';
  var issue_array = [];
  var no_issues_mod100 = 0;

  var repo = req.query.repo;
  var days = req.query.days;
  var daysEnd = req.query.daysEnd;
  var token = req.query.token;
  var loadState = state;
  global.accessToken = token;
  var page = 1;

  while (data.length % 100 === 0 && no_issues_mod100 === 0) {
    var options = {
      headers: {
        'User-Agent': 'gitissues'
      }
    };
    var data_json = request('GET', 'https://api.github.com/repos/' + repo +
      '/issues?state=' + state +
      '&access_token=' + token +
      '&client_id=966ce4cafe87b84a29c5' +
      '&client_secret=4ff2bb2883f32c9702dd12a6c2464009f07c1550' +
      '&page=' + page + '&per_page=100', options);
    if (data_json.statusCode === 404) {
      logger.error('Repo Error');
      loadState = 'repoError';
      break;
    }
    else {
      data = JSON.parse(data_json.getBody());
      issue_array = issue_array.concat(data);
      if (data.length === 0) {
        no_issues_mod100 = 1;
      }
      page++;
    }
  }
  indexData.totalNumber = issue_array.length;
  indexData.days = days;
  indexData.daysEnd = daysEnd;
  indexData.numberOfIssues = 0;
  indexData.obsWindow = obsWindow;
  indexData.repo = repo;
  indexData.numberOfIssuesClosedWithin = 0;
  if (loadState === 'open') {
    open(issue_array);
  } else if (loadState === 'closed') {
    close(issue_array);
  }
  load(res, loadState);
}

function open(issue_array) {
  var noIssues = Array.apply(null, new Array(obsWindow.length + 1))
    .map(Number.prototype.valueOf, 0);
  var within = 0;
  var type = 0;
  var status = 0;
  var issueMatrix = zeros([4, 4]);
  for (var i = 0; i < issue_array.length; i++) {
    within = 0;
    var daysPast = daysFromCurrent(issue_array[i].created_at);
    if (indexData.days < daysPast && daysPast < indexData.daysEnd) {
      indexData.numberOfIssues++;
      if (indexData.repo === 'shippable/support') {
        if (issue_array[i].labels.length === 0) {
          type = mapped('');
          status = mapped('');
        }
        else if (issue_array[i].labels.length === 1) {
          type = mapped(issue_array[i].labels[0].name);
          status = mapped('');
        }
        else {
          type = mapped(issue_array[i].labels[0].name);
          status = mapped(issue_array[i].labels[1].name);
        }
        issueMatrix[type][status]++;
      }
    }
    for (var j = 0; j < noIssues.length - 1; j++) {
      if (daysPast < obsWindow[j]) {
        noIssues[j]++;
        within = 1;
        break;
      }
    }
    if (within === 0) {
      noIssues[obsWindow.length]++;
    }
  }
  indexData.noIssues = noIssues;
  indexData.issueMatrix = issueMatrix;
  indexData.typeNameArray = typeNameArray;
  indexData.stateNameArray = stateNameArray;
}

function close(issue_array) {
  var noIssues = Array.apply(null, new Array(obsWindow.length + 1))
    .map(Number.prototype.valueOf, 0);
  var noIssuesClosedWithin = Array.apply(null, new Array(obsWindow.length + 1))
    .map(Number.prototype.valueOf, 0);
  var withinClosedWithin = 0;
  var within = 0;
  var issueMatrix = zeros([4, 4]);
  for (var i = 0; i < issue_array.length; i++) {
    within = 0;
    withinClosedWithin = 0;
    var daysPast =
      dateDiff(issue_array[i].created_at, issue_array[i].closed_at);
    var closedWithin = daysFromCurrent(issue_array[i].closed_at);
    if (indexData.days < daysPast && daysPast < indexData.daysEnd) {
      indexData.numberOfIssues++;
    }
    if (indexData.days < closedWithin && closedWithin < indexData.daysEnd) {
      indexData.numberOfIssuesClosedWithin++;
    }
    for (var j = 0; j < noIssues.length - 1; j++) {
      if (daysPast < obsWindow[j]) {
        noIssues[j]++;
        within = 1;
        break;
      }
    }
    for (j = 0; j < noIssuesClosedWithin.length - 1; j++) {
      if (closedWithin < obsWindow[j]) {
        noIssuesClosedWithin[j]++;
        withinClosedWithin = 1;
        break;
      }
    }
    if (within === 0) {
      noIssues[obsWindow.length]++;
    }
    if (withinClosedWithin === 0) {
      noIssuesClosedWithin[obsWindow.length]++;
    }
  }
  indexData.noIssuesClosedWithin = noIssuesClosedWithin;
  indexData.noIssues = noIssues;
  indexData.issueMatrix = issueMatrix;
}

function load(res, state) {
  res.send({indexData: indexData, state: state});
}

function daysFromCurrent(dateString) {
  var curr = new Date();
  var inpDate = new Date(dateString);
  return (curr.getTime() - inpDate.getTime()) / (1000 * 3600 * 24);
}

function dateDiff(dateString_open, dateString_close) {
  var open = new Date(dateString_open);
  var close = new Date(dateString_close);
  return (close.getTime() - open.getTime()) / (1000 * 3600 * 24);
}

function mapped(theString) {
  switch (theString) {
    case 'question':
    case 'resolved':
      return 0;
    case 'bug':
    case 'triaged':
      return 1;
    case 'feature request':
    case 'in progress':
      return 2;
    default:
      return 3;
  }
}

function zeros(dimensions) {
  var array = [];
  for (var i = 0; i < dimensions[0]; ++i) {
    array.push(dimensions.length === 1 ? 0 : zeros(dimensions.slice(1)));
  }
  return array;
}