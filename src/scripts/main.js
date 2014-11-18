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


  function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
      if (angular.equals(list[i], obj)) {
        return true;
      }
    }
    return false;
  };

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

  app.factory('favouritesService', ['$q', function ($q) {

    function setFavourite(title, url) {
      var deferred = $q.defer();
      getFavourites().then(function (oldFavs) {
        var favourites = Object.keys(oldFavs).length ? oldFavs.favourites : [];
        var newFav = {
          title: title,
          url: url
        };
        if (!favourites.length || !containsObject(newFav, oldFavs.favourites)) {
          favourites.push(newFav);
          chrome.storage.local.set({favourites: favourites}, function(){
            deferred.resolve(favourites);
          });
        } else {
          deferred.reject();
        }
      });
      return deferred.promise;
    }

    function getFavourites() {
      var deferred = $q.defer();
      chrome.storage.local.get('favourites', function (data) {
        deferred.resolve(data);
      });
      return deferred.promise;
    }

    return {
      set: setFavourite,
      get: getFavourites
    }

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

  app.controller('TabController', ['$scope', '$http', '$rootScope', 'imgService', 'topSitesService', 'favouritesService', function ($scope, $http, $rootScope, imgService, topSitesService, favouritesService) {

    $scope.browserHeight = window.innerHeight;
    $scope.browserWidth = window.innerWidth;
    $scope.topSitesClass = 'hide';
    $scope.notification = '';
    $scope.notificationClass = 'hide';
    $scope.favouritesClass = 'hide';
    $scope.loading = true;
    $scope.favourites = [];


    $scope.openApps = function() {
      chrome.tabs.update({url:'chrome://apps'});
    }

    $scope.toggleTopSites = function() {
      $scope.favouritesClass = 'hide';
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

    $scope.addFavourite = function() {
      favouritesService.set($scope.art.longTitle, $scope.art.links.web).then(function(newFavourites){
        $scope.notificationClass = 'show';
        $scope.notification = 'Favourite added.';
        window.setTimeout(function(){
          $scope.notificationClass = 'hide';
          $scope.favourites = newFavourites;
          $scope.$apply();
        }, 2000);
      }, function () {
        $scope.notificationClass = 'show';
        $scope.notification = 'Already added to favourites.';
        window.setTimeout(function(){
          $scope.notificationClass = 'hide';
          $scope.$apply();
        }, 2000);
      });
    }

    $scope.toggleFavourites = function() {
      if ($scope.favouritesClass === 'hide') {
        if (!$scope.favourites.length) {
          favouritesService.get().then(function (favourites) {
            $scope.favourites = favourites.favourites;
          });
        }
        $scope.favouritesClass = 'show';
      } else {
        $scope.favouritesClass = 'hide';
      }
      $scope.topSitesClass = 'hide';
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