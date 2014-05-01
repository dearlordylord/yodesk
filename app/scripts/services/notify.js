'use strict';

angular.module('yodeskApp')
  .service('notify', function (jobs, $window) {
    var beep = $('<audio src="beep.wav"></audio>');

    var isFocused = true;
    var appTitle = 'yodesk';

    var newJobs = 0;

    $($window).on('focus', function() {
      isFocused = true;
      $window.document.title = appTitle;
      newJobs = 0;
    });

    $($window).on('blur', function() {
      isFocused = false;
    });


    jobs.scope.$on('added', function(e, u) {
      if (!isFocused) {
        newJobs += u.length;
        beep[0].play();
        $window.document.title = '('+newJobs+') new jobs';
      }
    });
    return {};
  });