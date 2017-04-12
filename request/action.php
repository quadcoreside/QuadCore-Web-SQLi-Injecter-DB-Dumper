<?php
session_start();
//ignore_user_abort(true);
//ini_set('max_execution_time', 0);
require_once 'scanneur_class.php';

if(!isset($_SESSION["url_trouver"]))
{
	$_SESSION["url_trouver"] = array();
}
if(!isset($_SESSION["url_vulne"]))
{
	$_SESSION["url_vulne"] = array();
}
if(!isset($_SESSION["obj_dump"]))
{
	$_SESSION["obj_dump"] = new sqli_dump();
}

$dmp = $_SESSION["obj_dump"];

 if(isset($_GET["demmarer"]))
{
	if ($_GET["demmarer"] == 'recherche' && isset($_GET["dork"]) && isset($_GET["page"]) && isset($_GET["moteur"])
		&& !empty($_GET["dork"]) && !empty($_GET["page"]) && !empty($_GET["moteur"]))
	{
		$dork = $_GET['dork'];
		$page = $_GET['page'];
		$resultat = "";
		$sreach = new Rechercheur();
		if(!is_numeric($page)) { $page = 1; } else { $page = intval($page); }
		$moteurs = explode(';', $_GET["moteur"]);
		if (in_array("google", $moteurs) && in_array("bing", $moteurs) && in_array("yahoo", $moteurs))
		{
			$resultat .= $sreach->allEngine($dork, $page);
			$moteurs = array();
		}
		if (in_array("google", $moteurs))
		{
			$resultat .= $sreach->google($dork, $page);
		}
		if (in_array("bing", $moteurs))
		{
			$resultat .= $sreach->bing($dork, $page);
		}
		if (in_array("yahoo", $moteurs))
		{
			$resultat .= $sreach->yahoo($dork, $page);
		}
		$array_url_Ancien = $_SESSION["url_trouver"];
		$array_url_New = explode("\r\n", $resultat);
	  $Array_Finale = array_unique(array_merge($array_url_Ancien, $array_url_New));
		$_SESSION["url_trouver"] = $Array_Finale;
	}
	else if($_GET["demmarer"] == 'scanne')
	{
		$scn = new Scanneur();
		$array_A_Scanne = $_SESSION["url_trouver"];
		$resultat = $scn->Scanne($array_A_Scanne);
		$array_url_Ancien = $_SESSION["url_vulne"];
		$array_url_New = explode("\r\n", $resultat);
	  $Array_Finale = array_unique(array_merge($array_url_Ancien, $array_url_New));
		$_SESSION["url_vulne"] = $Array_Finale;
	}

	else if($_GET["demmarer"] == 'analyse-url')
	{
		if(isset($_GET["url"]))
		{
			$url = $_GET["url"];
            if (strpos($url, "?") !== false && strpos($url, "=") !== false)
            {
        				$inj = new sqli_inject();
                $inj->Analyse($url);
                $_SESSION["url_analyse"] = $url;
            }
            else
            {
                $_SESSION["erreur"] = "URL format incorecte";
                echo "URL format incorecte";
            }
		}
		else
		{
			echo "No POST";
		}
	}
}

else if(isset($_GET["dump"]))
{
	if($_GET["dump"] == 'start') {
		if(isset($_GET["url"]))
		{
            $url = $_GET["url"];
            if (strpos("?", $url) !== false && strpos("=", $url) !== false && strpos("[t]", $url) !== false)
            {
            	$_SESSION["url_dump"] = $_GET["url"];
                $dmp = new sqli_dump();
                if ($dmp->controlleur($url))
                {
                	echo $_SESSION["analyse_infos"];
                    echo "OK";
                }
            }
            else
            {
            	$_SESSION["erreur"] = "URL format incorecte";
            }
		} else { echo "No GET"; }
	}
	else if ($_GET["dump"] == 'get_inf') {
		if(isset($_SESSION["analyse_infos"]))
		{
			echo $_SESSION["analyse_infos"];
		}
	}
	else if($_GET["dump"] == 'get_db') {
		if(isset($_SESSION["basededonnes"])){
			$_SESSION["basededonnes"] = "";
			$dmp->setAllBD();
		}
	}
	else if($_GET["dump"] == 'get_tables') {
		if(isset($_GET["db_name"]))
		{
            $_SESSION["tables"] = "";
            $dmp->setTable($_GET["db_name"]);
		}
	}
	else if($_GET["dump"] == 'get_colonnes') {
		if(isset($_POST["db_name"]) && isset($_POST["table_name"]))
		{
            $_SESSION["colonnes"] = "";
            $dmp->setColonne($_POST["db_name"], $_POST["table_name"]);
		}
	}
}

else if(isset($_GET["exporter"]))
{
	if($_GET["exporter"] == 'url_trouver') {
		$arr = $_SESSION["url_trouver"];
		$Listeurls = "";
		foreach($arr as $elmt) {
			if(!empty($elmt))
				$Listeurls .= $elmt."\r\n";
		}
		$fichier = 'urls_quadcore_'.$_SESSION["nomutilisateur"].'.txt';
		$handle = fopen($fichier, "w");
		fwrite($handle, $Listeurls);
		fclose($handle);
		header('Content-type: text/plain');
		header('Content-Length: '.filesize($fichier));
		header('Content-Disposition: attachment; filename='.$fichier);
		readfile($fichier);
		unlink($fichier);
	}
	else if($_GET["exporter"] == 'url_vulne') {
		$arr = $_SESSION["url_vulne"];
		$Listeurls = "";
		foreach($arr as $elmt) {
			if(!empty($elmt))
				$Listeurls .= $elmt."\r\n";
		}
		$fichier = 'urls_quadcore_'.$_SESSION["nomutilisateur"].'.txt';
		$handle = fopen($fichier, "w");
		fwrite($handle, $Listeurls);
		fclose($handle);
		header('Content-type: text/plain');
		header('Content-Length: '.filesize($fichier));
		header('Content-Disposition: attachment; filename='.$fichier);
		readfile($fichier);
		unlink($fichier);
	}
}

else if(isset($_GET["nettoyer"]))
{
	if($_GET["nettoyer"] == 'url') {
		$_SESSION["url_trouver"] = array();
	}
	else if($_GET["nettoyer"] == 'url_vulne') {
		$_SESSION["url_vulne"] = array();
	}
}

else if(isset($_GET["importer"]))
{
	if($_GET["importer"] == 'url')
	{
		if(isset($_POST["content-file"]))
		{
			$content = $_POST["content-file"];
			$arrayDeja = $_SESSION["url_trouver"];
			$arrContent = explode("\r\n", $content);
		  	$Array_Finale = array_unique(array_merge($arrayDeja, $arrContent));
		  	$_SESSION["url_trouver"] = $Array_Finale;
		  	echo "OK";
		}
		else
		{
			echo "No POST";
		}
	}
}

?>
