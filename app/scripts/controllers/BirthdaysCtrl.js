(function() {
  'use strict';

  angular.module('populationioApp')


  .controller('BirthdaysCtrl', ['$scope', '$state', '$sce', '$filter', '$rootScope', 'PopulationIOService', 'ProfileService',
    function($scope, $state, $sce, $filter, $rootScope, PopulationIOService, ProfileService) {

      var countries = [];

      $rootScope.$on('loadBirthdays', function() {
        if ($rootScope.birthdaysLoadingStarted !== true) {
          console.log("loading loadBirthdays");
          d3.csv('data/countries.csv', function(data) {
            countries = data;
            _loadDataFromServer();
          });
        }
      });

      var _getCountry = function(name) {
        for (var i = 0; i < countries.length; i += 1) {
          var country = countries[i];
          if (country.POPIO_NAME === name) {
            return country;
          }
        }
        return null;
      };

      var _getCountriesByContinent = function(continent) {
        var res = [];
        for (var i = 0; i < countries.length; i += 1) {
          var country = countries[i];
          if (country.CONTINENT === continent) {
            res.push(country);
          }
        }
        console.log('returning in _getCountriesByContinent'+ res.length + '   '+res);
        return res;
      };

      $scope.$watch('selectedContinental', function(newValue, oldValue) {
        if ( oldValue !== newValue) {
          _updateContinentalCountries();
        }
      });

      var _updateContinentalCountries = function() {
        $scope.continentDataBeingLoaded = true;
        console.log('startujemy z _updateContinentalCountries');
        //$rootScope.$emit('loadingOn');
        $rootScope.loadingDataSections += 1;
        $scope.continentsData = [];

        var continentalCountries = _getCountriesByContinent($scope.selectedContinental),
          responseCounter = 0;

        //$scope.loading += continentalCountries.length;

        _loadAllCountryBirthdays(continentalCountries, function(country, birthdays) {
          if (country && birthdays && parseInt(birthdays, 0) > 0) {
            $scope.continentsData.push({
              countryAbbr: _getCountry(country).GMI_CNTRY,
              countryTitle: country,
              value: birthdays
            });
          }

          responseCounter += 1;
          console.log('responseCounter krajow w Kontynencie '+responseCounter + ' / '+ continentalCountries.length);
          //$scope.loading -= 1;

          if (continentalCountries.length === responseCounter) {
            $scope.$broadcast('continentsDataLoaded');
            console.log('zajeto wszystkie kraje '+ responseCounter);
            $rootScope.loadingDataSections -= 1;
            $scope.continentDataBeingLoaded = false;
            //$rootScope.$emit('loadingOff')
          }
        });

      };

      var _updateCountriesAroundTheWorld = function() {
        $scope.worldData = [];

        var countriesAroundTheWorld = [
            'China', 'India', 'United States', 'Indonesia', 'Brazil',
            'Pakistan', 'Russian Federation', 'Japan', 'Nigeria',
            'Bangladesh', 'Mexico'
          ],
          responseCounter = 0;

        //$scope.loading += countriesAroundTheWorld.length;

        _loadAllCountryBirthdays(countriesAroundTheWorld, function(country, birthdays) {

          if (country && birthdays) {
            $scope.worldData.push({
              countryAbbr: _getCountry(country).GMI_CNTRY,
              countryTitle: country,
              value: birthdays
            });
          }

          responseCounter += 1;
          //$scope.loading -= 1;

          if (countriesAroundTheWorld.length === responseCounter) {
            $scope.$broadcast('worldDataLoaded');
          }
        });
      };

      var _loadAllCountryBirthdays = function(countries, callback) {

        var _loadCountryBirthdays = function(country) {
          PopulationIOService.loadPopulationByAge({
            year: $filter('date')(Date.now(), 'yyyy'),
            country: country,
            age: ProfileService.getAge()
          }, function(data) {
            _oneAjaxFinished();
            if (_getCountry(country).GMI_CNTRY) {
              callback(country, data[0].total / 365);
            }
          }, function() {
            _oneAjaxFinished();
            callback();
          });

        };

        for (var j = 0; j < countries.length; j += 1) {
          _loadCountryBirthdays(countries[j].POPIO_NAME || countries[j]);
        }
      };

      var _initiateLoading = function() {
        $rootScope.openConnectionsBirthdays = 12;
        $rootScope.loadingDataSections += 1;
        $rootScope.birthdaysLoadingStarted = true;
      };

      var _oneAjaxFinished = function() {
        $rootScope.openConnectionsBirthdays -= 1;

        if ($rootScope.openConnectionsBirthdays === 0) {
          $rootScope.loadingDataSections -= 1;
          $rootScope.$emit('birthdaysLoaded');
          ProfileService.hideBirthdaysCtrl = false;
          console.log('brithdays loaded');
        }
      };

      var _loadDataFromServer = function() {
        console.log('loading brithdays');
        _initiateLoading();
        //$scope.loading = 1;
        $scope.continentsData = [];
        $scope.worldData = [];
        $scope.selectedContinental = 'Asia';
        $scope.birthdayShare = null;
        $scope.$apply();

        $scope.$broadcast('continentsDataLoaded');
        $scope.$broadcast('worldDataLoaded');

        PopulationIOService.loadPopulationByAge({
          year: $filter('date')(Date.now(), 'yyyy'),
          country: 'World',
          age: ProfileService.getAge()
        }, function(data) {
          $scope.birthdayShare = $sce.trustAsHtml([
            '<span>' + $filter('number')(parseInt(data[0].total / 365, 0), 0),
            '</span> people around the world and that approximately ',
            '<span>' + $filter('number')(parseInt(data[0].total / 365 / 24, 0), 0),
            '</span> people were born in the same hour?'
          ].join(''));

          _oneAjaxFinished();
        }, function() {
          _oneAjaxFinished();
        });

        _updateCountriesAroundTheWorld();
        _updateContinentalCountries();
      };
    }
  ])


  ;
}());