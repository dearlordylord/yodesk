'use strict';

angular.module('yodeskApp')
  .controller('LoginCtrl', function ($scope, Auth, $location, $rootScope) {
    $scope.user = {};
    $scope.errors = {};

    $scope.login = function(form) {
      $scope.submitted = true;
      
      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function(u) {
          // Logged in, redirect to home
          $rootScope.settings = u.settings;
          $location.path('/');
        })
        .catch( function(err) {
          err = err.data;
          $scope.errors.other = err.message;
        });
      }
    };
  });