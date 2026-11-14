-- CreateTable
CREATE TABLE `SheetLink` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kind` VARCHAR(191) NOT NULL,
    `spreadsheetId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `tab` VARCHAR(191) NULL,
    `intervalMinutes` INTEGER NOT NULL DEFAULT 15,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncedAt` DATETIME(3) NULL,
    `lastStatus` VARCHAR(191) NULL,
    `lastMessage` TEXT NULL,
    `lastCreated` INTEGER NOT NULL DEFAULT 0,
    `lastUpdated` INTEGER NOT NULL DEFAULT 0,
    `createdByPublicId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SheetLink_kind_key`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
