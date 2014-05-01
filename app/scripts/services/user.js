'use strict';

angular.module('yodeskApp')
  .factory('User', function ($resource) {
    return $resource('/api/users/:id', {
      id: '@id'
    }, { //parameters default
      update: {
        method: 'PUT',
        params: {}
      },
      get: {
        method: 'GET',
        params: {
          id:'me'
        }
      }
	  });
  })
  .factory('UserSettings', function ($resource) {
    return $resource('/api/users/settings', null, {
      update: {
        method: 'PUT'
      }
    });
  });
