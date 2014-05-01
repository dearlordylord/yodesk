'use strict';

angular.module('yodeskApp')
  .factory('Session', function ($resource) {
    return $resource('/api/session/');
  });
