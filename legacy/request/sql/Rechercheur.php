<?php
class Rechercheur
{
	public $curl;
	public $ext;
	public $errors;
	var $keyword	=	"empty";
	var $urlList	=	"";
	var $time1		=	4000000;
	var $time2		=	8000000;
	var $proxy		=	"";
	var $cookie		=	"";
	var $header		=	"";
	var $ei			=	"";

	function __construct() {
		$this->curl = new Curl();
		$this->ext = new Extracteur();
		$this->errors = array();

		$this->cookie = tempnam ("/tmp", "cookie");
		$this->headers[] = "Accept: text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5";
		$this->headers[] = "Connection: keep-alive";
		$this->headers[] = "Keep-Alive: 115";
		$this->headers[] = "Accept-Charset: ISO-8859-1,utf-8;q=0.7,*;q=0.7";
		$this->headers[] = "Accept-Language: en-us,en;q=0.5";
		$this->headers[] = "Pragma: ";
	}
	function getpagedata($url)
	{
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_USERAGENT,'Mozilla/5.0 (Windows NT 5.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1');
		curl_setopt($ch, CURLOPT_ENCODING, 'gzip,deflate');
		curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
		curl_setopt($ch, CURLOPT_COOKIEFILE,  $this->cookie);
		curl_setopt($ch, CURLOPT_COOKIEJAR,  $this->cookie);
		curl_setopt($ch, CURLOPT_PROXY, $this->proxy);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
		$data = curl_exec($ch);
		curl_close($ch);
		return $data;
	}
	function pause() {
		usleep(rand($this->time1, $this->time2));
	}
	function initGoogle() {
		$data = $this->getpagedata('http://www.google.com');		//	Open google.com ( Might redirect to country specific site e.g. www.google.co.in)
		$this->pause();
		$this->getpagedata('http://www.google.com/ncr');	//	Moves back to google.com
	}
	// This function opens the preference page and saves the count for "Results per page" to 100
	function setPreference() {
		$data=$this->getpagedata('http://www.google.com/preferences?hl=en');
		preg_match('/<input value="(.*?)" name="sig" type="hidden">/', $data, $matches);
		$this->pause();
		$mat = isset($matches[1]) ? urlencode($matches[1]) : '';
		$this->getpagedata('http://www.google.com/setprefs?sig='.$mat.'&hl=en&lr=lang_en&safeui=images&suggon=2&newwindow=0&num=100&q=&prev=http%3A%2F%2Fwww.google.com%2F&submit2=Save+Preferences+');
	}
	function fetchUrlList()
	{
		for($i = 0; $i < 201; $i = $i + 100)
		{
			$data=$this->getpagedata('http://www.google.com/search?q='.$this->keyword.'&num=100&hl=en&biw=1280&bih=612&prmd=ivns&ei='.$this->ei.'&start='.$i.'&sa=N');
			preg_match('/;ei=(.*?)&amp;ved/', $data, $matches);
			$this->ei = @urlencode($matches[1]);
			if ($data) {
				if(preg_match("/sorry.google.com/", $data)) {
					$this->errors[] = "You are blocked";
					exit;
				} else {
					preg_match_all('@<h3\s*class="r">\s*<a[^<>]*href="([^<>]*)"[^<>]*>(.*)</a>\s*</h3>@siU', $data, $matches);
					for ($j = 0; $j < count($matches[2]); $j++) {
						$url = $matches[1][$j];
						$url = $this->ext->RepareGog($url);
						if ($this->ext->VerfierURL($url)) {
							$this->urlList[] = $url;
						}
					}
				}
			}
			else
			{
				$this->errors[] = 'Problem fetching the data';
				exit;
			}
			$this->pause();
		}
	}
	function getUrlList($keyword, $proxy='') {
		$this->keyword=$keyword;
		$this->proxy=$proxy;
		$this->initGoogle();
		$this->pause();
		$this->setPreference();
		$this->pause();
		$this->fetchUrlList();
		return $this->urlList;
	}
	function google($dork, $page)
	{
		return $this->getUrlList($dork);
	}
}
class BingSearch {

	function __construct(){
		parent::__construct();
		
		$this->preferences['results_per_page'] = 10;
	}
	
	private function setResultsPerPage($count){
	
		$count_allowed = array(10, 15, 30, 50);
		
		// open up the bing options page
		$html_form = $this->client->get("http://www.bing.com/account/web")->getBody();
		
		// parse various session values from that page
		preg_match_all('/<input[^>]*name="\b(guid|sid|ru|uid)\b"[^>]*value="(.*?)"/i', $html_form, $matches, PREG_SET_ORDER);
		
		if($matches){
			
			// change some of them
			$options = array(
				'rpp'		=> $count,
				'pref_sbmt'	=> 1,
			);
			
			foreach($matches as $match){
				$options[$match[1]] = $match[2];
			}
			
			// submit the form and get the cookie that determines the number of results per page
			$this->client->get("http://www.bing.com/account/web", array('query' => $options), array());
		}
		
	}
	
	// en-us, en-gb, it-IT, ru-RU...
	private function setSearchMarket($search_market){
		$body = $this->client->get("http://www.bing.com/account/worldwide")->getBody();
		
		if(preg_match('/<a href="([^"]*setmkt='.$search_market.'[^"]*)"/i', $body, $matches)){

			$url = htmlspecialchars_decode($matches[1]);
			
			// this will set the session cookie
			$this->client->get($url);
		}
	}
	
	// override
	function setPreference($name, $value){
	
		if($name == 'search_market'){
			$this->setSearchMarket($value);
		}
		
		if($name == 'results_per_page'){
			$this->setResultsPerPage($value);
		}

		parent::setPreference($name, $value);
	}

	function extractResults($html){
	
		// ads ID=SERP,5417.1,Ads	ID=SERP,5106.1
		// bing local ID=SERP,5079.1 
		// bing local ID=SERP,5486.1
		
		// news ID=SERP,5371.1
		
		// result ID=SERP,5167.1
		// result ID=SERP,5151.1	
		
		preg_match_all('/<h3><a href="([^"]+)" h="ID=SERP,[0-9]{4}\.1"/', $html, $matches);
		
		return $matches ? $matches[1] : array();
	}
	
	function search($query, $page = 1){
	
		$sr = new SearchResponse();
		$start = ($page-1) * $this->preferences['results_per_page'] + 1;
		
			$response = $this->client->get("http://www.bing.com/search?q={$query}&first={$start}");
			
			// get HTML body
			$body = $response->getBody();
			$sr->html = $body;
			
			$sr->results = $this->extractResults($body);
			
			$sr->has_next_page = strpos($body, "\"sw_next\">Next") !== false;
		
		
		
		return $sr;
	}
}
