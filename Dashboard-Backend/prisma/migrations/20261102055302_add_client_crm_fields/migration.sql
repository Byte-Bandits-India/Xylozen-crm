-- AlterTable
ALTER TABLE `Client`
    ADD COLUMN `clientType` VARCHAR(191) NOT NULL DEFAULT 'individual',
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'lead',
    ADD COLUMN `whatsapp` VARCHAR(191) NULL,
    ADD COLUMN `timezone` VARCHAR(191) NULL,
    ADD COLUMN `source` VARCHAR(191) NULL,
    ADD COLUMN `sourceDetails` TEXT NULL,
    ADD COLUMN `industry` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL,
    ADD COLUMN `taxId` VARCHAR(191) NULL,
    ADD COLUMN `currency` VARCHAR(191) NULL,
    ADD COLUMN `preferredChannels` TEXT NULL,
    ADD COLUMN `language` VARCHAR(191) NULL;
