'use strict';

var mongoose = require('mongoose'),
    Thing = mongoose.model('Thing');
var odesk = require('node-odesk');
var config = require('../config/config');
var o = new odesk(config.odesk.key, config.odesk.secret);
var _ = require('underscore');
var q = require('q');
var events = require('events');
var jobsEmitter = new events.EventEmitter();
var Lazy = require('lazy.js');

o.OAuth.accessToken = '41fd55ddb8ead7f0372d436859dd184b';
o.OAuth.accessTokenSecret = '2c21ffc4ba8884ab';

/**
 * Get awesome things
 */
exports.awesomeThings = function(req, res) {
  return Thing.find(function (err, things) {
    if (!err) {
      return res.json(things);
    } else {
      return res.send(err);
    }
  });
};

var MAX_JOBS_FOR_CLIENT = 30;
var MAX_JOBS = 1000;
var jobs = [];
var fs = require('fs');


var existingJobs = {};
var QUERY = 'category:web_development OR category:software_development';
var ONPAGE = 100;
var POLLING_INTERVAL = 5000;

var paging = function(n) {
  // 0;100, 101;100, 202;100 ...
  return n*(ONPAGE+1)+';'+ONPAGE;
};

// pull new jobs
var poll = function(n) {
  if (n === undefined) n = 0;

  var addedJobs = function(jbs) {
    var added = [];
    var intersects = false;
    jbs.reverse().forEach(function(j) {
      if (!existingJobs[j.id]) {
        added.push(j);
      } else {
        intersects = true;
      }
    });
    return [added.reverse(), intersects];
  };

  o.get('profiles/v2/search/jobs.json', {q: QUERY, paging: paging(n)}, function(error, data) {
    if (error) {
      console.error(error);
      setTimeout(poll, POLLING_INTERVAL);
    } else {
      var addedAndIntersects = addedJobs(data.jobs);
      var added = addedAndIntersects[0];
      var intersects = addedAndIntersects[1];
      if (!intersects) {
        console.error('not intersects', n+1);
        poll(n+1);
      } else {
        if (added.length > 0) jobsEmitter.emit('added', added);
        setTimeout(poll, POLLING_INTERVAL);
      }
    }
  });
};

// initial pull of arbitrary bit set of jobs

var initialPoll = function() {
  q.all(_.map(_.range(Math.floor(MAX_JOBS/ONPAGE)), function(n) {
      var d = q.defer();
      o.get('profiles/v2/search/jobs.json', {q: QUERY, paging: paging(n)}, function(error, data) {
        return error ? d.reject(error) : d.resolve(data.jobs);
      });
      return d.promise;
    })).then(function(results) {
      var all = _.flatten(results);
      if (all.length > 0) jobsEmitter.emit('added', all);
      poll();
    }, function(error) {
      console.error(error);
      setTimeout(initialPoll, 10000);
    });
};

initialPoll();


jobsEmitter.on('added', function(added) {
  var flattenJob = function(job) { // I am modify your input
    // for easy handling
    job.country = job.client.country;
    return job;
  };
  added = _.map(added, flattenJob);
  jobs = added.concat(jobs);
  added.forEach(function(job) {
    existingJobs[job.id] = job;
  });
});

var regexIndexOf = function(str, regex, startpos) {
  var indexOf = this.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};

var isLetter = function(s) {
  if (!s) return false;
  if (s.length > 1) throw 'Wrong arg type - ' + s + ' is string but expected "letter"';
  // LIKELY is a letter (someone search umlauts or something? no.)
  return s.toUpperCase() != s.toLowerCase();
};

exports.jobs = function(socket) {

  // keep settings by-connection
  var settings = {};

  var filtered = function(jobs) {

    var stringHandle = {
      search: function(string, words) {
        if (!string) return [];
        var getIndices = function(searchStr, str) {
          var startIndex = 0, searchStrLen = searchStr.length;
          var index, indices = [];
          str = str.toLowerCase();
          searchStr = searchStr.toLowerCase();
          while ((index = str.indexOf(searchStr, startIndex)) > -1) {
            var endIndex = index + searchStrLen;
            var symbolsAround = (isLetter(str[endIndex]) || isLetter(str[index - 1]));
            startIndex = endIndex;
            if (!symbolsAround) indices.push([index, endIndex]);
          }
          return indices;
        };
        var res = _.flatten(_.select(_.map(words, function(w) {
          return getIndices(w, string);
        }), function(ai) {return ai.length > 0;}), true);
        // check for intersections and merge them
        if (res.length < 2) return res;
        else {
          res.sort(function(s1, s2) {
            return s1[0] - s2[0] === 0 ? 0 : s1[1] - s2[1];
          });
          var mergeSegments = function(segments) {
            if (segments.length === 1) return segments;
            else if (segments.length === 2) {
              var left = segments[0][1], right = segments[1][0];
              if (left < right) return segments;
              else return [[segments[0][0], segments[1][1]]];
            } else {
              var center = Math.floor(segments.length/2);
              var r = _.flatten([mergeSegments(segments.slice(0, center)), mergeSegments(segments.slice(center))], true);
              if (r.length === segments.length) return r;
              else return mergeSegments(r);
            }
          };
          return mergeSegments(res);
        }
      },
      match: function(searchResult) {
        return searchResult && searchResult.length > 0;
      }
    };
    var arrayHandle = {
      search: function(a, words) {
        return _.map(a, function(e) {
          return !!_.find(words, function(w) {
            return e.toLowerCase() === w.toLowerCase();
          });
        });
      },
      match: function(searchResult) {
        var init = function(bool) {return bool;};
        return !!_.find(searchResult, init)
      }
    };

    var blacklistHandle = function(o) {
      function handle() {
        this.match = function(searchResult) {
          return !o.match.call(this, searchResult);
        }
      }
      handle.prototype = o;
      return new handle();
    };

    var filtersMap = {
      title: ['words', 'wordsBlacklist'],
      snippet: ['words', 'wordsBlacklist'],
      skills: ['words', 'wordsBlacklist'],
      subcategory: ['subcategories'],
      country: ['countryBlacklist']
    };

    var isBlacklist = function(name) {
      return name.indexOf('Blacklist') !== -1;
    };

    var settingsIsEmpty = function(settings) {
      return !_.find(settings, function(v, k) {
        return !isBlacklist(k) && !!v;
      });
    };

    // there's three cases: empty setting, match setting and blacklist setting. logic below is supposed to handle this
    return Lazy(jobs).map(function(job) {
      return {
        job: job,
        filteredFields: _.object(_.map(_.pick(job, _.keys(filtersMap)), function(v, field) {
          var filterNames = _.select(filtersMap[field], function(name) {return !_.isEmpty(settings[name])});
          var handle = typeof v === 'string' ? stringHandle : arrayHandle;
          var filtered = _.map(filterNames, function(filterName) {
            var customHandle = isBlacklist(filterName) ? blacklistHandle(handle) : handle;
            var searchResult = customHandle.search(v, settings[filterName]);
            var match = customHandle.match(searchResult);
            return {
              searchResult: searchResult,
              match: match,
              filterName: filterName
            };
          });
          return [field, filtered];
        }))
      }
    }).select(function(o) {
      //we want no 'blacklist' items
      return !_.find(_.flatten(_.values(o.filteredFields)), function(match) {
        return isBlacklist(match.filterName) && !match.match;
      });
    }).map(function(o) {
      // remove unused now blacklists and empty settings
      return _.extend(o, {filteredFields: _.object(_.map(o.filteredFields, function(filtered, field) {
        return [field, _.first(_.select(filtered, function(f) {
          return !isBlacklist(f.filterName);
        }))];
      }))});
    }).select(function(o) {
      // at lreast one match per field or all settings isn't set at all
      return _.find(_.values(o.filteredFields), function(m) {
          // at least one match per field
          return m && m.match;
        }) || !_.find(_.values(o.filteredFields), function(v) {return v !== undefined});
    }).take(MAX_JOBS_FOR_CLIENT).value();
  };

  var addedCallback = function(added) {
    added = filtered(added);
    if (added.length > 0) {
      socket.emit('added', added);
    }
  };

  var fs = require('fs'); // TODO DEBUG

  socket.on('settings', function(s) {
    // start sending jobs only on settings set (or fact that there's no settings is present)
    settings = s;
    socket.emit('jobs', filtered(jobs));
    jobsEmitter.on('added', addedCallback);
//    fs.readFile('debug.log', function(err, data) {
//      if (err) console.warn(err);
//      else {
//        setTimeout(function(){jobsEmitter.emit('added', JSON.parse(data))}, 3000);
//      }
//    });
    socket.on('disconnect', function() {
      jobsEmitter.removeListener('added', addedCallback);
    });
  });

//  o.OAuth.getAuthorizeUrl(function(error, url, requestToken, requestTokenSecret) {
//    if (error) throw error;
//    socket.emit('odesk', [url, requestToken, requestTokenSecret]);
//    /*
//     ["https://www.odesk.com/services/api/auth?oauth_token=a5c7137143dcfadbb9930ef9b0e32c6e","a5c7137143dcfadbb9930ef9b0e32c6e","27a29cd421cc0199"]
//     */
//  });
//  var requestToken = 'a5c7137143dcfadbb9930ef9b0e32c6e';
//  var requestTokenSecret = '27a29cd421cc0199';
//  var verifier = 'a04f98b2b0ce6d2ae9de2d59e27ec4d4';
    // var oauth_token = 'a5c7137143dcfadbb9930ef9b0e32c6e';
//  o.OAuth.getAccessToken(requestToken, requestTokenSecret, verifier, function(error, accessToken, accessTokenSecret) {
//    console.warn(error)
//    console.log(accessToken, accessTokenSecret);
//    socket.emit('odesk', [accessToken, accessTokenSecret]);
//  });
  // ["41fd55ddb8ead7f0372d436859dd184b","2c21ffc4ba8884ab"]

};