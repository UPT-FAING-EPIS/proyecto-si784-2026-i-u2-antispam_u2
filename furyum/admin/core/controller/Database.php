<?php
class Database {
	public static $db;
	public static $con;
	public $user;
	public $host;
	public $pass;
	public $ddbb;

	function __construct(){
		$this->user = getenv('DB_USER') ?: "root";
		$this->pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";
		$this->host = getenv('DB_HOST') ?: "localhost";
		$this->ddbb = getenv('DB_NAME') ?: "furyum";
	}

	function connect(){
		$con = new mysqli($this->host,$this->user,$this->pass,$this->ddbb);
		return $con;
	}

	public static function getCon(){
		if(self::$con==null && self::$db==null){
			self::$db = new Database();
			self::$con = self::$db->connect();
		}
		return self::$con;
	}
	
}
?>
