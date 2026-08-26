<?php
	if ($this->request->action != 'index') {
		$this->rendered = true;
		$this->jsonRender = true;
		header('Content-Type: application/json');
	}

?>
