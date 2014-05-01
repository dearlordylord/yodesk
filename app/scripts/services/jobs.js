'use strict';

angular.module('yodeskApp')
  .service('jobs', function (socketFactory, $rootScope, socket) {
    var MAX_JOBS = 30;
    var scope = $rootScope.$new();
    var jobs = [];
    $rootScope.$on('socket:jobs', function(e, j) {
      jobs = j;
      scope.$emit('jobs', jobs);
    });
    $rootScope.$on('socket:added', function(e, u) {
      jobs = _.first(u.concat(jobs), MAX_JOBS);
      scope.$emit('added', u);
    });
    $rootScope.$watch('settings', function(settings, old) {
      socket.emit('settings', settings || {});
    });
    return {
      get: function() {
        return jobs;
      },
      scope: scope
    }
  });



