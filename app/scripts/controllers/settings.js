'use strict';

/*global _ */

angular.module('yodeskApp')
  .controller('SettingsCtrl', function ($scope, User, Auth, UserSettings, $rootScope, toaster, $location) {
    $scope.errors = {};

    $scope.isLoggedIn = Auth.isLoggedIn;

    $scope.changePassword = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
        .then( function() {
          $scope.message = 'Password successfully changed.';
        })
        .catch( function() {
          form.password.$setValidity('mongoose', false);
          $scope.errors.other = 'Incorrect password';
        });
      }
		};

    // got from odesk API call. don't bother to make call itself, categories is rarely changed and odesk API is unreliable
    $scope.categories = [{"topics":[{"title":"Web Design","id":"8"},{"title":"Web Programming","id":"9"},{"title":"Ecommerce","id":"11"},{"title":"UI Design","id":"13"},{"title":"Website QA","id":"15"},{"title":"Website Project Management","id":"16"},{"title":"Other - Web Development","id":"17"}],"title":"Web Development"},{"topics":[{"title":"Desktop Applications","id":"18"},{"title":"Game Development","id":"20"},{"title":"Scripts & Utilities","id":"21"},{"title":"Software Plug-ins","id":"22"},{"title":"Mobile Apps","id":"23"},{"title":"Application Interface Design","id":"24"},{"title":"Software Project Management","id":"25"},{"title":"Software QA","id":"26"},{"title":"VOIP","id":"27"},{"title":"Other - Software Development","id":"28"}],"title":"Software Development"}];

    $scope.subcategories = _.flatten(_.map($scope.categories,
      function(c) {
        return _.map(c.topics, function(sc) {
          return _.extend(sc, {category: c.title});
        });
      }));

    var parseSettings = function(settings) {
      var parseVal = function(val) {
        if (val instanceof Array) return val;
        if (!val) return [];
        else {
          return _.compact(_.map(val.split(','), function(s) {return s.trim()}));
        }
      };
      return _.object(_.map(settings, function(v, k) {
        return [k, parseVal(v)]
      }));
    };

    var unparseSettings = function(settings) {
      var unparseVal = function(val) {
        if (!val) return [];
        else {
          return val.join(', ');
        }
      };
      return _.object(_.map(settings, function(v, k) {
        if (k === 'subcategories') return [k, v];
        else return [k, unparseVal(v)]
      }));
    };

    $scope.settings = $rootScope.currentUser ? unparseSettings($rootScope.currentUser.settings) : $rootScope.settings;


    $scope.save = function() {
      $scope.settingsSubmitted = true;
      var settings = parseSettings($scope.settings);
      if ($rootScope.currentUser) {
        UserSettings.update(settings).$promise
          .then(function() {
            toaster.pop('success', 'Settings successfully changed');
            $rootScope.settings = settings;
          })
          .catch(function() {
            $scope.errors.other = 'Incorrect settings';
          });
      } else {
        $rootScope.settings = settings;
        toaster.pop('info', 'Settings successfully changed', 'Settings will temporarily persist until next app refresh');
      }

      $location.path('/');



//        Auth.changePassword( $scope.user.oldPassword, $scope.user.newPassword )
//        .then( function() {
//          $scope.message = 'Password successfully changed.';
//        })
//        .catch( function() {
//          form.password.$setValidity('mongoose', false);
//          $scope.errors.other = 'Incorrect password';
//        });
    };

  });
