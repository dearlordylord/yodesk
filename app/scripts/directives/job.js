'use strict';

angular.module('yodeskApp')
  .directive('job', function($rootScope) {
    return {
      restrict: 'A',
      require: 'ngModel',
      scope: {
        model: '=ngModel'
      },
      templateUrl: 'partials/job.html',
      link: function(scope, element, attrs, ngModel) {



        var highlight = function() {
          scope.show = false;

          scope.job = scope.model.job;
          scope.highlights = scope.model.filteredFields;

          // do it in directive is OK as far as we have only one calendar for app
          moment.lang('en', {
            'calendar' : {
              'lastDay' : 'D MMMM',
              'sameDay' : 'h:mmA',
              'nextDay' : 'D MMMM',
              'lastWeek' : 'D MMMM',
              'nextWeek' : 'D MMMM',
              'sameElse' : 'D MMMM'
            }
          });

          // indicate new job

          var words = 50;
          scope.isFull = false;
          scope.$watch('isFull', function(isFull) {
            if (!isFull) {
              var snippetWords = scope.job.snippet.split(/\s+/);
              var separators = scope.job.snippet.match(/\s+/g);
              if (snippetWords.length > words) {
                separators = separators.slice(0, words - 1);
                scope.snippet = _.flatten(_.zip(snippetWords.slice(0, words), separators)).join('') + '...';
              } else {
                scope.snippet = scope.job.snippet;
                scope.isFull = undefined;
              }
            } else {
              scope.snippet = scope.job.snippet;
            }
            // now highlight stuff
            scope.snippet = hlString(scope.snippet, 'snippet');

            // also highlight title. ng-html-bind doesn't work if we do it right on init
            scope.title = hlString(scope.job.title, 'title');

          });

          function hlString(str, field) {

            var hlShift = 0;
            var hlStart = '<b>';
            var hlEnd = '</b>';
            var hlLength = hlStart.length + hlEnd.length;

            if (scope.highlights[field])
              scope.highlights[field].searchResult.forEach(function(hl) {
                str = [str.slice(0, hl[0] + hlShift),
                  hlStart,
                  str.slice(hl[0] + hlShift, hl[1] + hlShift),
                  hlEnd,
                  str.slice(hl[1] + hlShift)].join('');
                hlShift = hlShift + hlLength;
              });

            return str;
          }
          scope.title = scope.job.title;
          scope.switchFull = function() {
            scope.isFull = !scope.isFull;
          };
          scope.dateFormat = function(str) {
            return moment(str).calendar();
          };
        };

        highlight();
      }
    }
  });