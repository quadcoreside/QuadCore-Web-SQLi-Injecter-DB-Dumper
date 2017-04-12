<?php
class Controller
{
  public $request = false;
  private $rendered = false;
	private $jsonRender = false;
	public $vars = array();
	public $layout = 'index';

	function __construct($request)
	{
    $this->Session = new Session();
    $this->request = $request;
    require CORE.DS.'Hook.php';
	}

  public function set($keys, $value = null) {
		if (is_array($keys)) {
			$this->vars += $keys;
		} else {
			$this->vars[$keys] = $value;
		}
	}

	function render($view = null){
	    if($this->rendered) {
	      	if ($this->jsonRender) {
		        echo json_encode($this->vars);
		        $this->jsonRender = true;
	      	}
	      	return false;
	    }
	    extract($this->vars);
	    ob_start('htmlCompress');
		require ROOT.DS.'app'.DS.$this->layout.'.php';
		$this->rendered = true;
	}

	function error($message = 'Access Denied'){
		$this->set('errors', true);
		$this->set('message', $message);
		$this->render();
		die();
	}

  function checkPostField($fields, $createError = true){
		foreach ($fields as $k => $v) {
			if(!isset($_REQUEST[$v]) || empty($_REQUEST[$v])) {
				//print_r($_POST);
				if ($createError) {
					$this->error('Task aborted by Field Checker *_* No fields: ' . print_r($_REQUEST, true));
				}
				$this->render(null);
				exit;
				return false;
			}
		}
		return true;
	}

	function checkGetField($fields, $createError = true){
		foreach ($fields as $k => $v) {
			if(!isset($_GET[$v]) || empty($_GET[$v])) {
				if ($createError) {
					$this->error('Task aborted by Field Checker *_*');
				}
				return false;
			}
		}
		return true;
	}

}
function htmlCompress($html){
    preg_match_all('!(<(?:code|pre).*>[^<]+</(?:code|pre)>)!',$html,$pre);
    $html = preg_replace('!<(?:code|pre).*>[^<]+</(?:code|pre)>!', '#pre#', $html);
    $html = preg_replace('#<!--[^\[].+-->#', '', $html);
    $html = preg_replace('/[\r\n\t]+/', ' ', $html);
    $html = preg_replace('/>[\s]+</', '><', $html);
    $html = preg_replace('/[\s]+/', ' ', $html);
    if(!empty($pre[0]))
    foreach($pre[0] as $tag)
    $html = preg_replace('!#pre#!', $tag, $html,1);
    return $html;
}
