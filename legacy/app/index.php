<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<link rel="icon" href="favicon.ico" />
	<title>SQLi SCANNER - by QuadCore Engineering MSB</title>
	<link href="css/bootstrap.css" rel="stylesheet" />
	<link href="css/bootstrap-table.min.css" rel="stylesheet" />
	<link href="css/custom.css" rel="stylesheet" />
	<link href="css/style.css" rel="stylesheet" />
	<script src="js/assets/jquery.min.js"></script>
	<script src="js/assets/bootstrap.min.js"></script>
	<script src="js/assets/treeview.js"></script>
	<script src="js/assets/angular.min.js"></script>
	<script src="js/assets/angular-route.min.js"></script>
	<script src="js/assets/angular-cookies.min.js"></script>
	<script src="js/assets/spin.min.js"></script>
	<script src="js/assets/angular-spinner.min.js"></script>
	<script src="js/assets/bootstrap-table.min.js"></script>
	<script src="js/assets/bootstrap-table-angular.min.js"></script>
	<script src="js/assets/tableExport.js"></script>
	<script src="js/assets/bootstrap-table-export.min.js"></script>
	<script src="js/assets/bootstrap-table-cookie.min.js"></script>
	<script src="js/assets/bootstrap-table-mobile.min.js"></script>
	<script src="js/assets/app.js"></script>
	<script src="js/service/main.js"></script>
	<script src="js/controller/main.js"></script>
	<script src="js/service/recherche.js"></script>
	<script src="js/controller/recherche.js"></script>
	<script src="js/service/analyse.js"></script>
	<script src="js/controller/analyse.js"></script>
	<script src="js/service/dumper.js"></script>
	<script src="js/controller/dumper.js"></script>
</head>
<body ng-app="SqliAppOne">

	<div id="wrapper">
		<nav class="navbar navbar-default navbar-cls-top " role="navigation" style="margin-bottom: 0">
			<div class="navbar-header">
				<a class="navbar-brand">SQLi SCANNER</a>
			</div>
			<div style="color: white; padding: 15px 50px 5px 50px; float: right; font-size: 16px;"> QuadCore Engineering <em>bêta</em> 2017  &copy;</div>
		</nav>
	</div>

	<div ng-controller="MainController">

	    <div class="container-fluid">

				<div style="margin-top: 10px;">
			        <ul class="nav nav-pills">
			            <li ng-repeat="tab in tabs" ng-class="{ active: tab == dossierCourant }"><a ng-click="selectionDossier(tab)" href="#{{tab.value}}">{{tab.label}}</a></li>
			        </ul>
				</div>

			<span us-spinner spinner-key="spinner-1"></span>

	        <div ng-view=""></div>

	    </div>

	</div>
</body>
</html>
