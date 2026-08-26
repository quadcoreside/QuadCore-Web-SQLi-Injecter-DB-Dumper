<?php
class Session
{
	function __construct(){
		if(!isset($_SESSION)){
			session_start();
		}
	}

	public function setFlash($message, $type = 'success', $title = ''){
		$_SESSION['flash'] = array(
			'title' => $title,
			'message' => $message,
			'type' => $type
		);
	}

	public function flash(){
		if(isset($_SESSION['flash']['message'])){
			$html = '<div class="ui container">
				<div class="ui '.$_SESSION['flash']['type'].' message">
				    <div class="header">'.$_SESSION['flash']['title'].'</div>
				    <p>'.$_SESSION['flash']['message'].'</p>
				</div>
			</div><br/>';
			$_SESSION['flash'] = array();
			return $html;
		}
	}

	public function write($key, $value = null){
		if (is_array($key)) {
			$_SESSION += $key;
		} else {
			$_SESSION[$key] = $value;
		}
	}

	public function read($key = null) {
		if($key){
			if(isset($_SESSION[$key])){
				return $_SESSION[$key];
			} else {
				return false;
			}
		}else{
			return $_SESSION;
		}
	}

	static function isLogged(){
		if(isset($_SESSION['User']->id)){
			return true;
		}else{
			return false;
		}
	}

}
