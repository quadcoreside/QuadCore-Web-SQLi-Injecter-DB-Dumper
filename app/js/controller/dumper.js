/*
 QUADCORE ENGINEERING MSB
*/
app.controller('DumperCtrl', function($scope, DumperService, usSpinnerService, $cookies) {

	var intervalIds = [];
	$scope.workspaces = [  {
			name : '',
			name_rows : [],
			data_rows : []
		}
	];
	$scope.dumper = {
		url_point : '',
		diagram : {}
	};
	$scope.currentWorkspace = null;
	$scope.cancel = true;

	function restore() {
		if ($cookies.getObject('dumper')) {
			$scope.dumper = $cookies.getObject('dumper');
		} if ($cookies.getObject('currentWorkspace')) {
			$scope.currentWorkspace = $cookies.getObject('currentWorkspace');
		}
	}
	restore();
	function save() {
		$cookies.putObject('dumper', $scope.dumper, { expires: '2020'});
		//$cookies.putObject('workspaces', $scope.workspaces, { expires: '2020'});
		$cookies.putObject('currentWorkspace', $scope.currentWorkspace, { expires: '2020'});
	}

	$scope.loading = function(state, id){
		if (id == null) { id = 2; }
	    if (state) {
			$scope.cancel = false;
	      	usSpinnerService.spin('spinner-' + id);
	    } else {
	      	usSpinnerService.stop('spinner-' + id);
	    }
  	}
  	$scope.setCancel = function(state) {
		$scope.cancel = state;
		for (var i=0; i < intervalIds.length; i++) {
	        clearInterval(intervalIds[i]);
	    }
	}

	$scope.instance = {
		name_dump : null,
		row_count : null,
		infos : null
	};

	$scope.start = function() {
		if($scope.dumper.url_point){
			$scope.dumper.url_point = $scope.dumper.url_point.replace(/\s/g, '+');

			if($scope.dumper.url_point.indexOf("http") > -1 && $scope.dumper.url_point.indexOf("[t]") > -1){
				$scope.loading(true, 1);

				DumperService.startDump($scope.dumper.url_point).then(function(data_response){
					$scope.data_response = data_response;

					if (data_response.success) {
						$('.tree').clearCheckedPath();
					} else {
						if (data_response.message) {
							alert(data_response.message);
						}
					}
					if (data_response) {
						$scope.dumper = data_response;
						$cookies.putObject('dumper', data_response, { expires: '2020'});
					}

					$scope.loading(false, 1);

				}, function(msg){
					alert(msg);
					$scope.loading(false, 1);
				});

			} else {
				alert("Le format de l'url ciblé est incorrecte.");
			}
		}else{
			alert("Veuillez renseigner l'url ciblé.");
		}
  	}

	$scope.getDiagramMore = function(obj) {
		$scope.loading(true, 2);
		var stringDiagram = angular.toJson($scope.dumper.diagram);

		DumperService.getDiagram($scope.dumper.url_point, obj, stringDiagram).then(function(data_response){
			$scope.data_response = data_response;

			if (data_response.success) {
				if(typeof(data_response.diagram) != "undefined" && data_response.diagram !== null) {
					$scope.dumper.diagram = data_response.diagram;
					$cookies.putObject('dumper', $scope.dumper, { expires: '2020'});
				}
			} else {
				if (data_response.message) {
					alert(data_response.message);
				}
			}

			$scope.loading(false, 2);

		}, function(msg){
			alert(msg);
		});
	}

	$scope.getDumpData = function() {
		$scope.loading(true, 1);
		var stringDiagram = angular.toJson($scope.dumper.diagram);

		if ($scope.workspaces[0]) {
			$scope.workspaces.push( $scope.workspaces[0] );
			$scope.workspaces[0] = {
				name : '',
				name_rows : [],
				data_rows : []
			};
		}

		DumperService.getStartDumperData($scope.dumper.url_point, stringDiagram).then(function(data_response){
			$scope.data_response = data_response;

			if (data_response.success) {
				$scope.data_response = data_response;
				$scope.instance.name_dump = data_response.name_dump;
				$scope.instance.row_count = data_response.row_count;
				$scope.instance.infos = data_response.infos;

				var dd = {
					name : data_response.name_dump,
					name_rows : data_response.infos.colonnes.split(','),
					row_count: 0,
					data_rows : []
				};
				$scope.workspaces[0] = dd;
				$scope.changeCurrentWorkspace( $scope.workspaces[0] );
				setInterval(refreshDGV(), 1000);

				if ($scope.instance.infos != null) {
					var instance = JSON.stringify($scope.instance.infos);
					$scope.dump_row = $scope.workspaces[0].row_count = $scope.instance.row_count;

					for (var i = 0; i < $scope.dump_row; i++) {

						DumperService.dumpRow($scope.dumper.url_point, instance, i).then(function(data_response){
							if (data_response.row) {
								$scope.workspaces[0].data_rows.push(data_response.row);
							}
						}, function(msg){
							alert('Row: ' + i + ' ' + msg);
						});

						if ($scope.cancel == true){
							alert('Cancel => i => ' + i);
		               		break;
			            }

					};

					$scope.loading(false, 3);
				}
				save();

			} else {
				if (data_response.message) {
					alert(data_response.message);
				}
			}
			$scope.loading(false, 1);

		}, function(msg){
			alert(msg);
			$scope.loading(false, 1);
		});

	}

	function dmpRow(instance, i) {
		$scope.data_ = DumperService.dumpRow($scope.dumper.url_point, instance, i).then(function(data_response){
			if (data_response.row) {
				$scope.workspaces[0].data_rows.push(data_response.row);
			}
		}, function(msg){
			alert('Row: ' + i + ' ' + msg);
		});
		return true;
	}

    function refreshDGV() {
		$scope.workspaces.forEach(function (wk, index) {

	        var colData = { workspace: wk.name };
	        var columns = buildColumns(wk.name_rows);

	        wk.bsTableControl = {
	            options: {
	                data: wk.data_rows,
	                rowStyle: function (row, index) {
	                    return { classes: 'none' };
	                },
	                height: 400,
	                cache: true,
	                striped: true,
	                pagination: true,
	                pageSize: 100,
	                pageList: [5, 10, 25, 50, 100, 200, 300, 500],
	                search: true,
	                showColumns: true,
	                showRefresh: true,
	                showExport: true,
	                exportDataType: 'all',
	                minimumCountColumns: 2,
	                clickToSelect: false,
	                showToggle: true,
	                maintainSelected: true,
	                mobileResponsive: true,
	                minHeight: 500,
	                cookie: true,
	                cookieIdTable: 'DTI-' + wk.name,
	                cookieExpire: '1y',
	                columns: columns
	            }
	        };

	    });
	}
    refreshDGV();

    $scope.changeCurrentWorkspace = function (wk) {
        $scope.currentWorkspace = wk;
    };

    $scope.deleteWk = function(wk) {
    	if (confirm('Remove ' + wk.name + ' work space ?')) {
	    	var index = $scope.workspaces.indexOf(wk);
	    	if (index > -1) {
			    $scope.workspaces.splice(index, 1);
			}
			$scope.currentWorkspace = $scope.workspaces[index - 1];
			save();
		}
    };

    function buildColumns(name_columns) {
    	var formColumns = [];

    	name_columns.forEach(function (k, v) {
    		formColumns.push({
	            field: k,
	            title: k,
	            align: 'center',
	            valign: 'middle',
	            sortable: true
	        })
	    });

        return formColumns;
    }

});

/*var checkedPathJson = JSON.stringify($('.tree').getCheckedPath());*/
