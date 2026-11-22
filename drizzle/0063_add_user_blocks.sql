CREATE TABLE IF NOT EXISTS `user_blocks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `blockerId` INT NOT NULL,
  `blockedId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_blocks_blocker_idx` (`blockerId`),
  KEY `user_blocks_blocked_idx` (`blockedId`)
);
