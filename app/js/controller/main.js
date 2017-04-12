/*
 QUADCORE ENGINEERING MSB
*/
app.controller('MainController', function($scope, $location, MainService) {

	$scope.loading = true;
	$scope.tabs = [
		{ value: "search", label: 'Recherche' },
		/*{ value: "scanne", label: 'Scanne' },*/
		{ value: "analyse", label: 'Analyse URL' },
		{ value: "dumper", label: 'Dumper' },
	];

	$scope.dossierCourant = null;

	$scope.selectionDossier = function(dossier) {
		$scope.dossierCourant = dossier;
	}

	$scope.$watch(function() {
		return $location.path();
	}, function(newPath) {
		var tabPath = newPath.split("/")
		if (tabPath.length > 1) {
			var valDossier = tabPath[1];
			if (valDossier != '') {
				$scope.tabs.forEach(function(item) {
					if (item.value == valDossier) {
						$scope.selectionDossier(item);
					}
				});
				/*if ($scope.dossierCourant == null) {
					window.href = '#dumper';
				}*/
			} else {
				//window.href = '#dumper';
			}
		}
	});


});
