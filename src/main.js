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

  app.factory('imgEncodeService', ['$q', function ($q) {

    function convertImg(url) {
      var deferred = $q.defer();
      var canvas = document.createElement('CANVAS'),
          ctx = canvas.getContext('2d'),
          img = new Image;
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = function() {
        var dataURL;
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        dataURL = canvas.toDataURL('image/jpeg');
        deferred.resolve(dataURL);
        canvas = null;
      }
      return deferred.promise;
    }

    return convertImg;

  }]);

  app.factory('artApiService', ['$resource', function ($resource) {

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

  app.factory('imgService', ['artApiService', 'imgEncodeService', '$q', function (artApiService, imgEncodeService, $q) {

    function setImg() {
      var deferred = $q.defer();
      chrome.storage.local.get('artwork', function (data) {

        var today = moment(new Date());
        var updated = moment(JSON.parse(data.artwork.lastUpdated));
        var imgExpired = !updated.isSame(today, 'minute');
        var page = Math.floor(Math.random() * 4229);
        if (imgExpired) {

          artApiService.query(angular.extend(config, {p: page})).$promise.then(function (response){

            var imgData = response[0];
            var url = imgData.webImage.url;

            imgEncodeService(url).then(function (data) {
              imgData.dataUrl = data;
              imgData.lastUpdated = JSON.stringify(new Date());
              chrome.storage.local.set({artwork: imgData}, function (){
                deferred.resolve(imgData);
              });
            });

          });

        } else {
          deferred.resolve(data.artwork);
        }

      });
      return deferred.promise;
    }

    return setImg;

  }]);

  app.controller('TabController', ['$scope', '$http', 'imgService', function ($scope, $http, imgService) {

    $scope.browserHeight = window.innerHeight;

    imgService().then(function(data){
      $scope.art = data;
    });

  }]);

})();