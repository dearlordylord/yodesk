'use strict';

angular.module('yodeskApp')
  .controller('MainCtrl', function ($scope, $http, $rootScope, jobs, notify) {
    $scope.jobs = jobs.get();
    jobs.scope.$on('jobs', function(e, j) {
      $scope.jobs = j;
    });
    jobs.scope.$on('added', function(e, u) {
      u.reverse().forEach(function(j) {
        $scope.jobs.unshift(j);
        if ($scope.jobs.length > jobs.max) {
          $scope.jobs.pop();
        }
      });
    });
    $scope.existingSettings = function(o) {
      return _.object(_.select(_.map(o, function(v, k) {return [k, v];}), function(kv) {return !!kv[1].length;}))
    }
  });
