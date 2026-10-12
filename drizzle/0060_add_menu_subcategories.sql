CREATE TABLE `menu_subcategories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `establishmentId` int NOT NULL,
  `categoryName` varchar(128) NOT NULL,
  `name` varchar(128) NOT NULL,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `menu_subcategories_id` PRIMARY KEY(`id`)
);
