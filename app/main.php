<?php
	session_start();
	ini_set('max_execution_time', 300);
	set_time_limit(0);
	date_default_timezone_set('Europe/Paris');

	define('WEBROOT', dirname(__FILE__));
	define('ROOT', dirname(WEBROOT));
	define('DS', DIRECTORY_SEPARATOR);
	define('APP', ROOT.DS.'app');
	define('CORE', ROOT.DS.'core');
	define('REQU', ROOT.DS.'request');
	define('BASE_URL', dirname(dirname($_SERVER['SCRIPT_NAME'])));

	require CORE.DS.'Includer.php';

	new Dispatcher();
