CREATE TABLE `Geom` (`id` int(11) NOT NULL AUTO_INCREMENT, `polygon_name` varchar(45) NOT NULL, `geom` geometry NOT NULL, `description` varchar(45) DEFAULT NULL, PRIMARY KEY (`id`,`polygon_name`), UNIQUE KEY `id_UNIQUE` (`id`)) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=latin1

