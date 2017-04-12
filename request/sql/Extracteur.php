<?php
class Extracteur
{
	function RepareGog($url)
	{
		$url = $this->Decode($url);
		$url = str_replace('/url?q=', '', $url);
		$arrfin = explode('&sa=', $url);
		$url = $arrfin[0];
		return html_entity_decode(urldecode($url));
	}
	function Decode($str)
	{
		return html_entity_decode(urldecode($str));
	}
  private function getNomDom($url)
  {
  	$u = explode('/', $url);
  	return $u[2];
  }
  function BlackList($url)
  {
    $black = array(
      'google',
      'msn',
      'yahoo',
      'ebay',
      'youtube',
      'facebook',
      'twitter',
      'github',
      'pastebin.com',
      'stackoverflow.com',
	  	'.phpni.',
      'php.net',
    );
    $ok = false;
    foreach($black as $element)
    {
      if(strpos($url, $element) !== false)
      {
        $ok = true;
        break;
      }
    }
    return $ok;
  }
  function VerfierURL($url)
	{
	    $domUrl = $this->getNomDom($url);
	    if((!$this->VerfierExistDom($domUrl)) && (!$this->BlackList($url)))
	    {
	      if(isset($_POST['url_with_param']) && $_POST['url_with_param'] == 1)
	      {
	        if((strpos('?', $url) !== false) && (strpos('=', $url) !== false)) {
	          return true; }
	        else {
	          return false;
	        }
	      }
	      else
	      {
	        return true;
	      }
	    }
	}
  function VerfierExistDom($dom)
  {
  	$ok = false;
  	if(isset($_SESSION['url_trouver'])) {
		    $Urls = $_SESSION['url_trouver'];
		    foreach ($Urls as $element)
		    {
		        if(!empty($element) && strpos($dom, $element) !== false)
		        {
		          $ok = true;
		          break;
		        } else { }
		    }
		}
    return $ok;
  }
}
