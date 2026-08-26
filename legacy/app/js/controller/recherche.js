/*
 QUADCORE ENGINEERING MSB
*/
app.controller('RechercheCtrl', function($scope, RechercheService, usSpinnerService) {

  $scope.loading = function(state){
    if (state) {
      usSpinnerService.spin('spinner-1');
    } else {
      usSpinnerService.stop('spinner-1');
    }
  }
  $scope.urls = {};
	$scope.recherche = {
	  dorks: 'page.php?id=',
	  page: 1,
	  chk_google: true
  };

	$scope.startRecherche = function() {
    var moteur = "";
    var erreur = 0;

    if(!$scope.recherche.dorks){
        alert("Veuillez remplir le champ dork !");
        erreur++;
    } if(!$scope.recherche.page && erreur == 0){
        alert("Veuillez remplir un nombre de page !");
        erreur++;
    } if(!$scope.recherche.chk_google && !$scope.recherche.chk_bing && !$scope.recherche.chk_yahoo){
        alert("Veuillez choisir un moteur de recheche !");
        erreur++;
    }

    if(erreur == 0){
        if($scope.recherche.chk_google){
            moteur += "google;";
        } if($scope.recherche.chk_bing){
            moteur += "bing;";
        } if($scope.chk_yahoo){
            moteur += "yahoo;";
        }

        if(moteur != ""){
          $scope.recherche.moteur = moteur;
          $scope.loading(true);

          for (var i = 0; i < $scope.recherche.page; i++) {
            RechercheService.postRecherche($scope.recherche, $scope.urls).then(function(data_response){
              $scope.data_response = data_response;
              if (data_response.success) {
                $scope.urls = data_response.urls;
              } else {
                if (data_response.message) {
                  alert(data_response.message);
                } else {
                  alert(data_response);
                }
              }
              $scope.loading(false);
            }, function(msg){
              alert(msg);
              $scope.loading(false);
            });
            setTimeout(1000);
          }

        } else {
          alert("Veuillez sélectionnez un moteur de recherche.");
        }
    }
  }

  $scope.clear = function() {
    $scope.urls = RechercheService.getUrls().then(function(urls){
        $scope.loading(false);
        $scope.urls = urls;
    }, function(msg){
        alert(msg);
    });
  }

  $scope.export = function() {
    var root_folder = '/' +  window.location.href.split('/')[3];
    window.location.href = root_folder + '/recherche/exporte';
  }

});
