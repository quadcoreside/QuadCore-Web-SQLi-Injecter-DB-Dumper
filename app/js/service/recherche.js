/*
 QUADCORE ENGINEERING MSB
*/
app.service('RechercheService', function($http, $q, $timeout) {
	var root_folder = '/' +  window.location.href.split('/')[3];
	var config = {
        headers : {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
        }
    };

	var factory = {
		urls : false,
		data_post : false,

		getUrls : function(){
			var deferred = $q.defer();
			if (factory.urls !== false) {
				deferred.resolve(factory.urls);
			}else{
				$http.get(root_folder + '/recherche/get')
					.success(function(data, status){
						factory.urls = data.urls;
						$timeout(function(){
							deferred.resolve(factory.urls);
						}, 2000)
					}).error(function(data, status){
						deferred.reject('Impossible de recuperer les urls');
					});
			}
			return deferred.promise;
		},

		postRecherche : function(recherheObj, urls){
			var deferred = $q.defer();
			var dataPost = $.param({
				dorks : recherheObj.dorks,
				engines : recherheObj.moteur,
				urls : urls
	        });

			$http.post(root_folder + '/recherche/start', dataPost, config)
			.success(function(data, status){
				factory.data_post = data;
				$timeout(function(){
					deferred.resolve(factory.data_post);
				}, 2000)
			}).error(function(data, status){
				deferred.reject('Erreur une requete de recherche a échouer.');
			});

			return deferred.promise;
		},

		clearUrls : function(){
			var deferred = $q.defer();
			$http.get(root_folder + '/recherche/clear')
				.success(function(data, status){
					$timeout(function(){
						deferred.resolve(data);
					}, 2000)
				}).error(function(data, status){
					deferred.reject('Impossible d\'éxecuter l\'action');
				});
			return deferred.promise;
		},

	};
	return factory;

});
