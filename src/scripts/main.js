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
        var color;
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img, 0, 0);
        dataURL = canvas.toDataURL('image/jpeg');
        deferred.resolve({
          dataUrl: dataURL
        });
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

    function fetchNewImg() {
      var deferred = $q.defer();
      var page = Math.floor(Math.random() * 4229);
      artApiService.query(angular.extend(config, {p: page})).$promise.then(function (response){
        var imgData = response[0];
        var url = imgData.webImage.url;
        imgEncodeService(url).then(function (data) {
          imgData.dataUrl = data.dataUrl;
          imgData.mainColor = data.color;
          imgData.lastUpdated = JSON.stringify(new Date());
          chrome.storage.local.set({artwork: imgData}, function (){
            deferred.resolve(imgData);
          });
        });
      });
      return deferred.promise;
    }

    function setImg() {
      var deferred = $q.defer();
      chrome.storage.local.get('artwork', function (data) {
        if (data.artwork) {
          var today = moment(new Date());
          var updated = moment(JSON.parse(data.artwork.lastUpdated));
          var imgExpired = !updated.isSame(today, 'hour');
          if (imgExpired) {
            fetchNewImg().then(function (response){
              deferred.resolve(response);
            });
          } else {
            deferred.resolve(data.artwork);
          }
        } else {
          fetchNewImg().then(function (response){
            deferred.resolve(response);
          });
        }
      });
      return deferred.promise;
    }

    return {
      setImg: setImg,
      fetchNewImg: fetchNewImg
    };

  }]);

  app.factory('topSitesService', ['$http', '$q', function ($http, $q) {

    function getTopSites() {
      var deferred = $q.defer();
      chrome.topSites.get(function (data){
        deferred.resolve(data);
      });
      return deferred.promise;
    }

    return getTopSites;

  }]);


  app.directive('imageonload', function() {
    return {
      restrict: 'A',
      link: function(scope, e, attrs) {
        var parent = e.parent();
        e.bind('load', function() {
          parent.imgLiquid({
            onItemFinish: function (){
              parent.addClass('img-loaded');
            }
          });
        });
        attrs.$observe('isLoading', function (loading) {
          if (loading) {
            parent.removeClass('img-loaded');
          }
        });
      }
    };
  });

  app.directive('artLoader', function() {
    return {
      restrict: 'E',
      template: '<span class="loader"><span class="loader-inner"></span></span>'
    }
  });

  app.controller('TabController', ['$scope', '$http', '$rootScope', 'imgService', 'topSitesService', function ($scope, $http, $rootScope, imgService, topSitesService) {

    $scope.browserHeight = window.innerHeight;
    $scope.browserWidth = window.innerWidth;

    $scope.topSitesClass = 'hide';

    $scope.loading = true;

    $scope.openApps = function() {
      chrome.tabs.update({url:'chrome://apps'});
    }

    $scope.toggleTopSites = function() {
      if ($scope.topSitesClass === 'hide') {
        $scope.topSitesClass = 'show';
      } else {
        $scope.topSitesClass = 'hide';
      }
    }

    $scope.newImg = function() {
      $scope.loading = true;
      imgService.fetchNewImg().then(function (data){
        $scope.art = data;
        $scope.loading = false;
      });
    }

    imgService.setImg().then(function (data){
      $scope.art = data;
      $scope.loading = false;
    });

    topSitesService().then(function (data){
      $scope.topSites = data;
    });

  }]);

})();