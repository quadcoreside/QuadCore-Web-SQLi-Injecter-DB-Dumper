<?php
class Curl
{
	var $proxy		=	"";
	var $cookie		=	"";
	var $header		=	"";

	function __construct() {
		$this->proxy = "";
		$this->cookie = tempnam ("/tmp", "cookie");
		$this->headers[] = "Accept: text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5";
		$this->headers[] = "Connection: keep-alive";
		$this->headers[] = "Keep-Alive: 115";
		$this->headers[] = "Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7";
		$this->headers[] = "Accept-Language: en-us,en;q=0.5";
		$this->headers[] = "Pragma: ";
	}

	function get($url)
	{
		$ch = curl_init();

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_TIMEOUT, 60);
		curl_setopt($ch, CURLOPT_USERAGENT, $this->getRUA());
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 2);

        curl_setopt($ch, CURLOPT_PROXY, $this->proxy);

		$output = curl_exec($ch);
		curl_close ($ch);
		return $output;
	}
	function getA($url)
	{
		$ch = curl_init();

		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_USERAGENT, $this->getRUA());
		curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate');
		curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
		curl_setopt($ch, CURLOPT_COOKIEFILE,  $this->cookie);
		curl_setopt($ch, CURLOPT_COOKIEJAR,  $this->cookie);
		curl_setopt($ch, CURLOPT_PROXY, $this->proxy);
		curl_setopt($ch, CURLOPT_MAXREDIRS, 2);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 60);

		$data = curl_exec($ch);
		curl_close($ch);
		return $data;
	}
	function post($url, $datas)
	{
	  	$postData = '';
	   	foreach($datas as $k => $v) {
        	$postData .= $k . '='.urlencode($v).'&';
	   	}
	   	rtrim($postData, '&');

	    $ch = curl_init();

	    curl_setopt($ch, CURLOPT_URL, $url);
	    curl_setopt($ch, CURLOPT_TIMEOUT, 50);
	    curl_setopt($ch, CURLOPT_USERAGENT, $this->getRUA());
	    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	    curl_setopt($ch, CURLOPT_HEADER, false);
	    curl_setopt($ch, CURLOPT_POST, count($postData));
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_MAXREDIRS, 2);

	    $output = curl_exec($ch);
	    curl_close($ch);
	    return $output;
	}

	function getRUA()
	{
	    $user_agents = array(
	    	'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.155 Safari/537.36',
	        'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-GB; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6',
	        'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-GB; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6',
	        'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)',
	        'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30)',
	        'Opera/9.20 (Windows NT 6.0; U; en)',
	        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
	        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
	        'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; en) Opera 8.50',
	        'Mozilla/4.0 (compatible; MSIE 6.0; MSIE 5.5; Windows NT 5.1) Opera 7.02 [en]',
	        'Mozilla/5.0 (Macintosh; U; PPC Mac OS X Macurl-O; fr; rv:1.7) Gecko/20040624 Firefox/0.9',
	        'Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/48 (like Gecko) Safari/48',
	    );
	    return $user_agents[rand(0, count($user_agents)-1)];
	}
}
