-- AlterTable: Add ACTIVE temporarily alongside AVAILABLE
ALTER TABLE `vehicles` MODIFY `status` ENUM('DRAFT', 'AVAILABLE', 'ACTIVE', 'SOLD', 'RENTED', 'MAINTENANCE') NOT NULL DEFAULT 'DRAFT';

-- Update Data: Migrate AVAILABLE to ACTIVE
UPDATE `vehicles` SET `status` = 'ACTIVE' WHERE `status` = 'AVAILABLE';

-- AlterTable: Remove AVAILABLE
ALTER TABLE `vehicles` MODIFY `status` ENUM('DRAFT', 'ACTIVE', 'SOLD', 'RENTED', 'MAINTENANCE') NOT NULL DEFAULT 'DRAFT';
