/*
 QUADCORE ENGINEERING MSB
*/
var app = angular.module('SqliAppOne', [ 'ngRoute', 'angularSpinner', 'bsTable', 'ngCookies' ]);
app.config(function($routeProvider){
	$routeProvider
		.when('/search/', {templateUrl: 'partials/recherche.html', controller: 'RechercheCtrl'})
		.when('/dumper/', {templateUrl: 'partials/dumper.html', controller: 'DumperCtrl'})
		.when('/analyse/', {templateUrl: 'partials/analyse.html', controller: 'AnalyseCtrl'})
		.otherwise({redirectTo : '/search'});
});

app.controller('TreeviewController', function($scope) {
	$scope.onCheck = function(c) {
	  checkParents(c);
	  checkChildren(c);
	}

	var checkParents = function (c)
    {
        var parentLi = c.parents('ul:eq(0)').parents('li:eq(0)');

        if (parentLi.length)
        {
            var siblingsChecked = parseInt($('input[type="checkbox"]:checked', c.parents('ul:eq(0)')).length),
                rootCheckbox = parentLi.find('input[type="checkbox"]:eq(0)');

            if (c.is(':checked')){
                rootCheckbox.prop('checked', true)
            }

            checkParents(rootCheckbox);
        }
    }

    var checkChildren = function (c)
    {
        var childLi = $('ul li input[type="checkbox"]', c.parents('li:eq(0)'));

        if (childLi.length){
            childLi.prop('checked', c.is(':checked'));
        }
    }

	var checkParents = function(c) {
	  if (c.checked) {
	    //c.parent.checked = true;
	  }
	}

	var checkChildren = function(c) {
	  if (c.checked) {
	  	if (c.childs.constructor === Array) {
		    c.childs.forEach(function (k, v) {
		      k.checked = true;
		    });
		}
	  } else {
	    if (c.childs.constructor === Array) {
	    	c.childs.forEach(function (k, v) {
		      k.checked = false;
		    });
	    }
	  }
	}
});
