'use strict';

angular.module('yodeskApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngAnimate',
  'toaster',
  'btford.socket-io',
  'angular-google-analytics'
])
  .config(function ($routeProvider, $locationProvider, $httpProvider, AnalyticsProvider) {

    AnalyticsProvider.setAccount('UA-50606772-1');
    AnalyticsProvider.trackPages(true);

    // Use analytics.js instead of ga.js
//    AnalyticsProvider.useAnalytics(true);

    // Ignore first page view... helpful when using hashes and whenever your bounce rate looks obscenely low.
//    AnalyticsProvider.ignoreFirstPageLoad(true);

    AnalyticsProvider.useEnhancedLinkAttribution(true);

    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      })
      .when('/login', {
        templateUrl: 'partials/login',
        controller: 'LoginCtrl'
      })
      .when('/signup', {
        templateUrl: 'partials/signup',
        controller: 'SignupCtrl'
      })
      .when('/settings', {
        templateUrl: 'partials/settings',
        controller: 'SettingsCtrl'
       // authenticate: true
      });
      
    $locationProvider.html5Mode(true);
      
    // Intercept 401s and redirect you to login
    $httpProvider.interceptors.push(['$q', '$location', function($q, $location) {
      return {
        'responseError': function(response) {
          if(response.status === 401) {
            $location.path('/login');
            return $q.reject(response);
          }
          else {
            return $q.reject(response);
          }
        }
      };
    }]);
  })
  /*jshint unused: false */
  .run(function ($rootScope, $location, Auth, socket) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$routeChangeStart', function (event, next) {
      if (next.authenticate && !Auth.isLoggedIn()) {
        $location.path('/login');
      }
    });
  });