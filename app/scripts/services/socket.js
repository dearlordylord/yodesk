'use strict';

angular.module('yodeskApp')
  .service('socket', function (socketFactory, $rootScope) {
    var listeners = [
      'jobs',
      'added'
    ];
    /*global io */
    var ioSocket = io.connect();
    var socket = socketFactory({
      ioSocket: ioSocket
    });
    listeners.forEach(function(name) {
      socket.forward(name, $rootScope);
    });
//      $rootScope.$on('$locationChangeStart', function(next, current) {
//        socket.emit('heartbeat');
//      });
//    authFactory.scope.$on('connect', function(e, token) {
//      var ioSocket = io.connect(location.protocol+'//'+location.host.split(':')[0] + ':1338');
//      var socket = socketFactory({
//        ioSocket: ioSocket
//      });
//      listeners.forEach(function(name) {
//        socket.forward(name, $rootScope);
//      });
//      var cancel = authFactory.scope.$on('disconnect', function(e) {
//        ioSocket.disconnect();
//        cancel();
//      });
//      $rootScope.$on('$locationChangeStart', function(next, current) {
//        socket.emit('heartbeat');
//      });
//    });
    return socket;
  });
