<?php
class DumperController extends Controller
{

	function start() {
		$this->checkPostField(array('url_point'));
		$data = $this->request->data;
		$d = array();

		if (strpos($data->url_point, '[t]') !== false) {
			$dmp = new sqli_dump();
			$dmp->url_point = $data->url_point;
			$obj = $dmp->getFirst();

			$d['url_point'] = $dmp->url_point;
			$this->set($obj);
			$d['success'] = true;
		} else {
			$d['success'] = false;
			$d['message'] = 'Url point is not valid';
		}

		$this->set($d);
	}

	function get_diagram() {
		$d = array();
		$this->checkPostField(array('url_point', 'object', 'diagram'));
		$data = $this->request->data;

		$dmp = new sqli_dump();
		$dmp->url_point = $data->url_point;
		$diagram = new StdClass();
		$d = array();

		if (!$diagram = @json_decode($data->diagram)) {
			$d['success'] = false;
			$d['message'] = 'Error json failed decode';
		}

		if ($data->object == 'basededonne') {
			$diagram = $dmp->getAllDb();
		} else {

			$i = 0;
			foreach ($diagram as $k => $db) {

				if ($data->object == 'tables') {
					if ($db->checked == true) {
						$diagram[$i]->childs = $dmp->getTable($db->name);
					}
				}

				if ($data->object == 'colonnes') {
					$t = 0;
					$tables = $db->childs;
					foreach ($tables as $tb_k => $tb) {

						if ($tb->checked == true) {
					  		$column = $dmp->getColonne($db->name, $tb->name);
					  		$tables[$t]->childs = $column;
						}


						$t++;
					}
				}

				$i++;
			}

		}

		if (!empty($diagram)) {
			$d['success'] = true;
			$d['diagram'] = $diagram;
		} else {
			$d['success'] = false;
			$d['message'] = 'Error try again.';
		}

		$this->set($d);
	}

	function get_initDump() {
		$this->checkPostField(array('url_point', 'diagram'));
		$data = $this->request->data;
		$dmp = new sqli_dump();
		$dmp->url_point = $data->url_point;
		$d = array();

		if (!$diagram = @json_decode($data->diagram)) {
			$d['success'] = false;
			$d['message'] = 'Error json failed decode';
		}

		$i = 0;
		$name_dump = '';
		$row_count = '';
		$wrap_colonnes = '';
		$db_name = '';
		$tb_name = '';
		//print_r($diagram);
		foreach ($diagram as $k => $db) {

			foreach ($db->childs as $tb_k => $tb) {

				foreach ($tb->childs as $cl_k => $cl) {
					if ($cl->checked == true) {
						$wrap_colonnes .= $cl->name . ',';
					}
				}
				$wrap_colonnes = rtrim($wrap_colonnes, ',');
				if (!empty($wrap_colonnes)) {
					$name_dump = $db->name . '.' . $tb->name;
					$db_name = $db->name;
					$tb_name = $tb->name;
					$row_count = $dmp->getNombreDonne($db->name, $tb->name);
					break;
				}

			}

			$i++;
		}

		if (!empty($name_dump) && !empty($row_count) && $row_count > 0) {
			$d['success'] = true;
			$d['name_dump'] = $name_dump;
			$d['row_count'] = $row_count;
			$d['infos'] = array(
				'db_name' => $db_name,
				'tb_name' => $tb_name,
				'colonnes' => $wrap_colonnes
			);
		} else {
			if ($row_count == 0) {
				$d['message'] = '0 rows found';
			} else {
				$d['message'] = 'Error, try again. Code: RC+0';
			}
			$d['success'] = false;

			$d['name_dump'] = $name_dump;
			$d['row_count'] = $row_count;
		}

		$this->set($d);
	}

	function get_row() {
		$this->checkPostField(array('url_point', 'infos'));
		$data = $this->request->data;
		$d = array();
		$dmp = new sqli_dump();
		$dmp->url_point = $data->url_point;

		if (!$infos = @json_decode($data->infos)) {
			$d['success'] = false;
			$d['message'] = 'Error json failed decode';
		} if (!isset($data->row) || !is_numeric($data->row)) {
			echo "Error nbr row";
			exit;
		}
		$colonnes = explode(',', $infos->colonnes);
		$rowData = $dmp->getRow($infos->db_name, $infos->tb_name, $colonnes, $data->row);

		$row = array();
		$i = 0;
		foreach ($colonnes as $key => $value) {
			$row += array( $value => $rowData[$i] );
			$i++;
		}

		if (!empty($rowData)) {
			$d['success'] = true;
			$d['row'] = $row;
		} else {
			$d['success'] = false;
			$d['message'] = 'Error, try again. Row data:' . print_r($rowData, true);
		}

		$this->set($d);
	}

	function exporte() {
		$this->checkPostField(array('urls'));
		$data = $this->request->data;

		$Listeurls = implode(',', $data->urls);

		$fichier = ROOT . DS . 'logs' . DS . date('m-Y') . DS . 'urls_' . date('d-m-Y-H-i') . '.txt';
		$handle = fopen($fichier, "w");
		fwrite($handle, $Listeurls);
		fclose($handle);

		header('Content-type: text/plain');
		header('Content-Length: ' . filesize($fichier));
		header('Content-Disposition: attachment; filename='.basename($fichier));
		readfile($fichier);
	}

}
