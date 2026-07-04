<?php

// if(isset($_POST["accept"])){

			$person  = new CommentData();
			$person->user_id = Core::$user->id ;
			$person->comment = $_POST["comment"];
			$person->post_id = $_POST["post_id"];
			$person->ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
			if(isset(Core::$user)) {
				$authorName = !empty(Core::$user->username)
					? Core::$user->username
					: trim(Core::$user->name . ' ' . Core::$user->lastname);
				$authorEmail = Core::$user->email;
			} else {
				$authorName = "Anonimo";
				$authorEmail = null;
			}
			$spamResult = Core::checkSpam($authorName, $person->comment, $authorEmail);
			if($spamResult['isSpam']) {
				$person->status = 0; // Denied / Spam
				$person->spam_reason = $spamResult['reason'];
				$person->add();
				Core::alert("Tu mensaje ha sido detectado como spam.");
			} else {
				$person->status = 2; // Approved / Public
				$person->add();
			}
			//Core::alert("Informacion enviada exitosamente!");
				
//}
Core::redir("./?view=post&id=$_POST[post_id]");
?>