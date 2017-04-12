/*
 QUADCORE ENGINEERING MSB
*/
app.service('DumperService', function($http, $q, $timeout) {
	var root_folder = '/' +  window.location.href.split('/')[3];
	var config = {
      headers : {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
      }
	}

	var factory = {
		data_post: false,
		data_post_diagram: false,

		startDump : function(url_point){
			var deferred = $q.defer();
			var dataPost = $.param({
				url_point : url_point,
 		 	});
			$http.post(root_folder + '/dumper/start', dataPost, config)
			.success(function(data, status){
				factory.data_post = data;
				$timeout(function(){
					deferred.resolve(factory.data_post);
				}, 2000)
			}).error(function(data, status){
				deferred.reject('Impossible de démarrer le dump');
			});

			return deferred.promise;
		},

		getDiagram : function(url_point, object, diagram){
			var deferred = $q.defer();
			var dataPost = $.param({
				url_point : url_point,
				object : object,
				diagram : diagram
 		 	});

			$http.post(root_folder + '/dumper/get_diagram', dataPost, config)
			.success(function(data, status){
				factory.data_post_diagram = data;
				$timeout(function(){
					deferred.resolve(factory.data_post_diagram);
				}, 2000)
			}).error(function(data, status){
				deferred.reject('Impossible d\'éxecuté l\'action');
			});

			return deferred.promise;
		},

		getStartDumperData : function(url_point, diagram){
			var deferred = $q.defer();
			var dataPost = $.param({
				url_point : url_point,
				diagram : diagram
 		 	});
			$http.post(root_folder + '/dumper/get_initDump', dataPost, config)
			.success(function(data, status){
				factory.data_post = data;
				$timeout(function(){
					deferred.resolve(factory.data_post);
				}, 5000)
			}).error(function(data, status){
				deferred.reject('Erreur Impossible de récuperer les données du dump');
			});

			return deferred.promise;
		},

		dumpRow : function(url_point, instance, row_nbr){
			var deferred = $q.defer();
			var dataPost = $.param({
				url_point : url_point,
				infos : instance,
				row : row_nbr,
 		 	});
			$http.post(root_folder + '/dumper/get_row', dataPost, config)
			.success(function(data, status){
				factory.data_post = data;
				$timeout(function(){
					deferred.resolve(factory.data_post);
				}, 5000)
			}).error(function(data, status){
				deferred.reject('Erreur Impossible de récuperer la ligne de données du dump.');
			});

			return deferred.promise;
		},

	};

	return factory;

});
