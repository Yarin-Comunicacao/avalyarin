ALTER TABLE `user_follows`
  ADD COLUMN `decision` ENUM('accepted', 'accepted_follow_back', 'rejected') NULL AFTER `status`;
