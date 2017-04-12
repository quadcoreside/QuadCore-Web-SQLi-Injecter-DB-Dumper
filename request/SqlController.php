<?php
require_once ROOT.DS.'controller'.DS.'class'.DS.'sql'.DS.'Includer.php';
class SqlController extends Controller
{

  function index(){
    $this->initSessionVar();

  }

  protected function initSessionVar(){
    if ($this->Session->read('recherche_urls') == null) {
      $this->Session->write('recherche_urls', array());
    }
  }

  function get($name = null)
  {
    if ($name != null) {
      $d = array();

      switch ($name) {
        case 'recherche_urls':
          $d[$name] = $this->Session->read($name);
          break;
        
        default:
          $this->set(array('error' => 'Unknow'));
          break;
      }

    }else{
      $this->set(array('error' => 'kill (no param)'));
    }
  	
  }
  function get_all()
  {
    if ($name != null) {
      $a = json_encode($_SESSION);
      $this->set($a);
    }else{
      $this->set(array('error' => 'kill'));
    }
    
  }

  function start($what = null)
  {
    $d = array();
  	switch ($what) {
      case 'recherche':
        if($this->checkPostField(array('dork', 'page', 'engine'))){
          $dork = $this->request->data->dork;
          $page = $this->request->data->page;
          $engine = $this->request->data->engine;
          $sreach = new Rechercheur();
          $resultat = '';
          $page = (is_numeric($page)) ? intval($page) : 1;
          $moteurs = explode(';', $engine);

          if (in_array('google', $moteurs) && in_array('bing', $moteurs) && in_array('yahoo', $moteurs)){
            $resultat .= $sreach->allEngine($dork, $page);
          }else{
            if (in_array('google', $moteurs)){
              $resultat .= $sreach->google($dork, $page);
            }
            if (in_array('bing', $moteurs)){
              $resultat .= $sreach->bing($dork, $page);
            }
            if (in_array('yahoo', $moteurs)){
              $resultat .= $sreach->yahoo($dork, $page);
            }
          }

          $array_url_Ancien = $this->Session->read('recherche_urls');
          $array_url_New = explode("\r\n", $resultat);
          echo $resultat;
          $Array_Finale = array_unique(array_merge($array_url_Ancien, $array_url_New));
          $this->Session->write('recherche_urls', $Array_Finale);
        }else{
          echo "No fields" . print_r($_POST, true);
        }
        break;

      case 'scanne':
          $scn = new Scanneur();
          $array_A_Scanne = $this->Session->read('recherche_urls');
          $resultat = $scn->Scanne($array_A_Scanne);
          $array_url_Ancien = $this->Session->read('scanne_urls');
          $array_url_New = explode("\r\n", $resultat);
          $Array_Finale = array_unique(array_merge($array_url_Ancien, $array_url_New));
          $this->Session->write('scanne_urls', $Array_Finale);
        break;

      case 'analyse':
        if($this->checkPostField(array('url_point'))){
          $url_point = $this->request->data->url_point;
          if (strpos($url_point, "?") !== false && strpos($url_point, "=") !== false)
          {
            $inj = new sqli_inject();
            $inj->Analyse($url_point);
            $this->Session->write('url_analyse', $url_point);
          }else{
            $d['error'] = 'URL format incorecte';
          }
        }
        break;

      case 'dump':
        if($this->checkPostField(array('url_point'))){
          $d = array();
          $url_point = $this->request->data->url_point;
          if (strpos("?", $url_point) !== false && strpos("=", $url_point) !== false && strpos("[t]", $url_point) !== false){
            $this->Session->write('dump_url', $url_point);
            $dmp = new sqli_dump();
            if ($dmp->controlleur($url_point)){
              $d['dump_infos'] = $this->Session->read('dump_infos');
            }
          }else{
            $d['error'] = 'URL formt incorecte';
          }
        }
        break;
      
      default:
          $this->set(array('error' => 'kill'));
        break;
    }
          $this->set($d);
  }

  
}
