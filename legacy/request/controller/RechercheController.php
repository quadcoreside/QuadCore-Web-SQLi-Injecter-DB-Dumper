<?php
class RechercheController extends Controller
{
  function start()
  {
    $d = array();

    $this->checkPostField(array('dorks', 'engines'));
    $data = $this->request->data;

    $sreacher = new Rechercheur();
    $resultat = '';
    $moteurs = explode(';', $data->engines);

    if (in_array('google', $moteurs) && in_array('bing', $moteurs) && in_array('yahoo', $moteurs)){
      $resultat = $sreacher->allEngine($data->dorks, 1);
    }else{
      if (in_array('google', $moteurs)){
        $resultat = $sreacher->google($data->dorks, 1);
      }
    }

    $array_url_Ancien = isset($data->urls) ? explode("\r\n", $data->urls) : array();
    $Array_Finale = array_unique(array_merge($array_url_Ancien, $resultat));

    $d['urls'] = $Array_Finale;
    $d['success'] = true;
      
    $this->set($d);
  }

  function exporte()
  {
		$Listeurls = $this->Session->read('recherche_urls');

    $dir = APP.DS.'logs'.DS.date('m-Y');
    if(!file_exists($dir))  mkdir($dir, 0700);

    $fichier = $dir.DS.'urls_'.date('d-m-Y-H-i').'.txt';

		$handle = fopen($fichier, "w");
		fwrite($handle, implode("\r\n", $Listeurls));
		fclose($handle);

		header('Content-type: text/plain');
		header('Content-Length: '.filesize($fichier));
		header('Content-Disposition: attachment; filename='.basename($fichier));
		readfile($fichier);
  }

}
