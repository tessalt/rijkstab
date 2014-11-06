(function(){

  var config = {
    lang: 'en',
    key: 'Z8SzSYqp',
    format: 'json',
    toppieces: true,
    imgonly: true,
    type: 'painting',
    ps: 1
  }

  var app = angular.module('RijksTab', ['ngResource']);

  app.factory('artService', ['$resource', function ($resource) {

    var resourceConfig = {
      'query': {
        method: 'GET',
        transformResponse: function(response) {
          var arts = angular.fromJson(response).artObjects;
          return arts;
        },
        isArray: true
      }
    }

    return $resource('https://www.rijksmuseum.nl/api/:lang/collection', {}, resourceConfig);

  }]);

  app.controller('TabController', ['$scope', '$http', 'artService', function ($scope, $http, artService) {

    $scope.browserHeight = window.innerHeight;

    var page = Math.floor(Math.random() * 4229);

    artService.query(angular.extend(config, {p: page}), function (response) {
      $scope.art = response[0];
    });

  }]);

})();