<?php
class AnalyseController extends Controller
{

	function start() {
		$this->checkPostField(array('url_point', 'union'));
		$data = $this->request->data;
		$d = array();

		if (strpos($data->url_point, '?') !== false && strpos($data->url_point, '=') !== false) {
			if (strpos($data->union, '[t]') !== false) {
				$inj = new sqli_inject();
				$d['result'] = $inj->uniqueAnalyse($data->url_point, $data->union);
				$d['url_point'] = $data->url_point;
				$d['success'] = true;
		  } else {
				$d['success'] = false;
				$d['message'] = 'Format de union incorecte absence de la var [t]';
			}
		} else {
			$d['success'] = false;
			$d['message'] = 'Url point is not valid';
		}

		$this->set($d);
	}

}
