/*
 QUADCORE ENGINEERING MSB
*/
app.service('AnalyseService', function($http, $q, $timeout) {
	var root_folder = '/' +  window.location.href.split('/')[3];
	var config = {
      headers : {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
      }
	}

	var factory = {
		data_post: false,

		reqAnalyse : function(url_point, union){
			var deferred = $q.defer();
			var dataPost = $.param({
				url_point : url_point,
				union : union
 		 	});

			$http.post(root_folder + '/analyse/start', dataPost, config)
			.success(function(data, status){
				factory.data_post = data;
				$timeout(function(){
					deferred.resolve(factory.data_post);
				}, 19999)
			}).error(function(data, status){
				deferred.reject('Impossible de démarrer le dump');
			});

			return deferred.promise;
		}

	};
	return factory;

});
