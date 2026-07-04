<?php


// 14 de Abril del 2014
// Core.php
// @brief obtiene las configuraciones, muestra y carga los contenidos necesarios.

class Core {

	public static $debug_sql = false;
	public static $user = null;
	public static $post;
	public static $get;
	

	public static function includeCSS(){
		$path = "res/css/";
		$handle=opendir($path);
		if($handle){
			while (false !== ($entry = readdir($handle)))  {
				if($entry!="." && $entry!=".."){
					$fullpath = $path.$entry;
				if(!is_dir($fullpath)){
						echo "<link rel='stylesheet' type='text/css' href='".$fullpath."' />";

					}
				}
			}
		closedir($handle);
		}

	}

	public static function addFlash($type,$message){

		$flash = "<p class='alert alert-".$type."'>".$message."<p>";
		if(!isset($_SESSION["flashes"])){ $_SESSION["flashes"]=  array(); }

		$flashes = $_SESSION["flashes"];
		$flashes[] = $flash;
		$_SESSION["flashes"] = $flashes;

	}


	public static function getFlashes(){

		if(isset($_SESSION["flashes"])){
			$flashes = $_SESSION["flashes"];
			foreach($flashes as $f){
				echo $f;
			}
			unset($_SESSION["flashes"]);
		}

	}


	public static function redir($url){
		echo "<script>window.location='".$url."';</script>";
	}

	public static function alert($txt){
		echo "<script>alert('".$txt."');</script>";
	}

	public static function g($f,$v){
		$ret = false;
		if(isset($_GET[$f]) && $_GET[$f]==$v){ $ret = true; }
		return $ret;
	}

	public static function num($n){
		if(is_numeric($n)){
			return number_format($n,2,".",",");
		}else{
			return $n;
		}
	}

	public static function includeJS(){
		$path = "res/js/";
		$handle=opendir($path);
		if($handle){
			while (false !== ($entry = readdir($handle)))  {
				if($entry!="." && $entry!=".."){
					$fullpath = $path.$entry;
				if(!is_dir($fullpath)){
						echo "<script type='text/javascript' src='".$fullpath."'></script>";

					}
				}
			}
		closedir($handle);
		}

	}

	public static function checkSpam($author, $content, $email = null){
		$url = getenv("ANTISPAM_API_URL");
		if(!$url) {
			return array('isSpam' => false, 'reason' => null, 'score' => 0);
		}

		$data = array(
			'author' => $author,
			'content' => $content,
			'client_ip' => $_SERVER['REMOTE_ADDR'] ?? null,
		);
		if($email) {
			$data['user_email'] = $email;
		}

		$payload = json_encode($data);

		$apiKey = getenv("ANTISPAM_API_KEY");
		$headers = array(
			'Content-Type: application/json',
			'Content-Length: ' . strlen($payload),
		);
		if($apiKey) {
			$headers[] = 'X-API-Key: ' . $apiKey;
		}

		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLINFO_HEADER_OUT, true);
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		curl_setopt($ch, CURLOPT_TIMEOUT, 10);

		$result = curl_exec($ch);
		curl_close($ch);

		if($result){
			$json = json_decode($result, true);
			if(isset($json['isSpam'])){
				return array(
					'isSpam' => $json['isSpam'] === true,
					'reason' => isset($json['reason']) ? $json['reason'] : null,
					'score'  => isset($json['score']) ? $json['score'] : 0
				);
			}
		}
		return array('isSpam' => false, 'reason' => null, 'score' => 0);
	}

}

?>