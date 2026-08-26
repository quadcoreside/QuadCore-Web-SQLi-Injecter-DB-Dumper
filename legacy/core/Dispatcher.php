<?php
class Dispatcher
{
	var $request;

	function __construct()
	{
		$this->request = new stdClass();
		$this->request->url = current(explode('?', $_SERVER['REQUEST_URI']));
		$this->request->url = (BASE_URL == DS) ? $this->request->url : str_replace(BASE_URL , '',  $this->request->url);

		if(!empty($_REQUEST)){
			$this->request->data = new stdClass();
			foreach ($_REQUEST as $k => $v) {
				$this->request->data->$k = $v;
			}
		}

		Router::parse($this->request->url, $this->request);
		$controller = $this->loadController();
		$action = $this->request->action;

		if (!empty($this->request->controller)) {
			if(!in_array($action, array_diff(get_class_methods($controller), get_class_methods('Controller')))){
				header("HTTP/1.0 404 Not Found");
				$this->error('Access Denied Not Found');
				die('Controller: '.$this->request->controller.'<br> Not method: '. $action);
			}
			call_user_func_array(array($controller, $action), $this->request->params);
			$controller->render($action);
		}else{
			$controller = new Controller($this->request);
			$controller->redirect('home/index', 301);
		}
	}

	function loadController() {
		$name = ucfirst($this->request->controller).'Controller';
		$file = ROOT.DS.'request'.DS.'controller'.DS.$name.'.php';
		if (!file_exists($file)) {
			die($file);
		}
		require $file;
    	$controller = new $name($this->request);

		return $controller;
	}


	function redirect($url, $code = null){
		if($code == 301){
			header("HTTP/1.0 301 Moved Permanently");
		}
		header("Location: ".self::url($url));
	}

	function e404($message = 'Page Introuvable'){
		header("HTTP/1.0 404 Not Found");
		$controller = new Controller();
		$this->controller->render('/errors/404');
		die();
	}

	function error($message = 'Access Denied'){
		echo json_encode(array('error' => true,'message' => $message));
		exit;
	}
}

class Router
{
	static $routes = array();
	static $prefixes = array();

	static function prefix($url, $prefixe) {
		self::$prefixes[$url] = $prefixe;
	}

	static function parse($url, $request){
		$url = trim($url, '/');
		if(empty($url)){
			$url = Router::$routes[0]['url'];
		}else{
			$match = false;
			foreach (Router::$routes as $v) {
				if(!$match && preg_match($v['redirreg'], $url, $match)){
					$url = $v['origin'];
					foreach ($match as $k => $v) {
						$url = str_replace(':'.$k, $v, $url);
					}
					$match = true;
				}
			}
		}

		$params = explode('/', $url);
		if(in_array($params[0], array_keys(self::$prefixes))){
			$request->prefix = self::$prefixes[$params[0]];
			array_shift($params);
		}
		$request->controller = $params[0];
		$request->action = isset($params[1]) ? $params[1] : 'index';
		foreach (self::$prefixes as $k => $v) {
			if(strpos($request->action, $v.'_') === 0){
				$request->prefixes = $v;
				$request->action = str_replace($v.'_', '', $v);
			}
		}
		$request->params = array_slice($params, 2);
		return true;
	}

	static function connect($redir, $url){
		$r = array();
		$r['params'] = array();
		$r['url'] = $url;

		$r['originreg'] = preg_replace('/([a-z0-9]+):([^\/]+)/', '${1}:(?P<${1}>${2})', $url);
		$r['originreg'] = str_replace('/*', '(?P<args>/?.*)', $r['originreg']);
		$r['originreg'] = '/^' . str_replace('/', '\/', $r['originreg']) . '$/';

		$r['origin'] = preg_replace('/([a-z0-9]+):([^\/]+)/', ':${1}', $url);
		$r['origin'] = str_replace('/*', ':args:', $r['origin']);

		$params = explode('/', $url);
		foreach ($params as $k => $v) {
			if(strpos($v, ':')){
				$p = explode(':', $v);
				$r['params'][$p[0]] = $p[1];
			}
		}

		$r['redirreg'] = $redir;
		$r['redirreg'] = str_replace('/*', '(?P<args>/?.*)', $r['redirreg']);
		foreach ($r['params'] as $k => $v) {
			$r['redirreg'] = str_replace(":$k" , "(?P<$k>$v)", $r['redirreg']);
		}
		$r['redirreg'] = '/^' . str_replace('/', '\/', $r['redirreg']) . '$/';

		$r['redir'] = preg_replace('/:([a-z0-9]+)/', ':${1}:', $redir);
		$r['redir'] = str_replace('/*', ':args:', $r['redir']);

		self::$routes[] = $r;
	}

	static function url($url = ''){
		trim($url, '/');
		foreach (self::$routes as $v) {
			if(preg_match($v['originreg'], $url, $match)){
				$url = $v['redir'];
				foreach ($match as $k => $w) {
					$url = str_replace(":$k:", $w, $url);
				}
			}
		}
		foreach (self::$prefixes as $k => $v) {
			if(strpos($url, $v) === 0){
				$url = str_replace($v, $k, $url);
			}
		}
		return BASE_URL.'/'.$url;
	}

	static function webroot($url){
		trim($url, '/');
		return BASE_URL.'/'.$url;
	}

}
