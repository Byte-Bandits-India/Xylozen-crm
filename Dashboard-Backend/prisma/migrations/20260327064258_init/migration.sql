-- CreateTable
CREATE TABLE `Account` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'LOCKED', 'DELETED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Account_publicId_key`(`publicId`),
    UNIQUE INDEX `Account_email_key`(`email`),
    UNIQUE INDEX `Account_username_key`(`username`),
    INDEX `Account_email_idx`(`email`),
    INDEX `Account_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Credential` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountPublicId` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `passwordChangedAt` DATETIME(3) NULL,
    `failedAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,

    UNIQUE INDEX `Credential_accountPublicId_key`(`accountPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountPublicId` VARCHAR(191) NOT NULL,
    `refreshTokenHash` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `deviceName` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedAt` DATETIME(3) NULL,

    INDEX `Session_accountPublicId_revokedAt_idx`(`accountPublicId`, `revokedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthProvider` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountPublicId` VARCHAR(191) NOT NULL,
    `provider` ENUM('GOOGLE', 'FACEBOOK', 'APPLE') NOT NULL,
    `providerUserId` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AuthProvider_provider_providerUserId_key`(`provider`, `providerUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailVerification` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountPublicId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` BIGINT NOT NULL,
    `permissionId` BIGINT NOT NULL,

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountRole` (
    `accountPublicId` VARCHAR(191) NOT NULL,
    `roleId` BIGINT NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`accountPublicId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountPublicId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `profileImage` TEXT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,

    UNIQUE INDEX `UserProfile_accountPublicId_key`(`accountPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `companyName` VARCHAR(191) NULL,
    `avatar` TEXT NULL,
    `billingAddressLine1` VARCHAR(191) NULL,
    `billingAddressLine2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByPublicId` VARCHAR(191) NULL,

    UNIQUE INDEX `Client_publicId_key`(`publicId`),
    INDEX `Client_name_idx`(`name`),
    INDEX `Client_email_idx`(`email`),
    INDEX `Client_createdByPublicId_idx`(`createdByPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `title` VARCHAR(191) NULL,
    `featureProject` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `taxAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(12, 2) NOT NULL,
    `receivedAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `balanceDue` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `issuedDate` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByPublicId` VARCHAR(191) NULL,

    UNIQUE INDEX `Invoice_publicId_key`(`publicId`),
    UNIQUE INDEX `Invoice_invoiceNumber_key`(`invoiceNumber`),
    INDEX `Invoice_invoiceNumber_idx`(`invoiceNumber`),
    INDEX `Invoice_status_idx`(`status`),
    INDEX `Invoice_issuedDate_idx`(`issuedDate`),
    INDEX `Invoice_dueDate_idx`(`dueDate`),
    INDEX `Invoice_createdByPublicId_idx`(`createdByPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClientInvoice` (
    `clientId` BIGINT NOT NULL,
    `invoiceId` BIGINT NOT NULL,

    INDEX `ClientInvoice_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`clientId`, `invoiceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceItem` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `invoiceId` BIGINT NOT NULL,
    `itemName` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `taxPercent` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `discount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InvoiceItem_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoicePayment` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `invoiceId` BIGINT NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'WALLET', 'CHEQUE', 'OTHER') NOT NULL,
    `referenceNo` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `paidAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InvoicePayment_publicId_key`(`publicId`),
    INDEX `InvoicePayment_invoiceId_idx`(`invoiceId`),
    INDEX `InvoicePayment_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `expenseId` VARCHAR(191) NOT NULL,
    `expenseType` ENUM('FIXED', 'OPERATIONAL') NOT NULL DEFAULT 'OPERATIONAL',
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `comments` TEXT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `expenseDate` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PAID', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `recurring` BOOLEAN NOT NULL DEFAULT false,
    `frequency` VARCHAR(191) NULL,
    `vendorName` VARCHAR(191) NULL,
    `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'WALLET', 'CHEQUE', 'OTHER') NULL,
    `receiptUrl` TEXT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paidByPublicId` VARCHAR(191) NULL,
    `createdByPublicId` VARCHAR(191) NULL,

    UNIQUE INDEX `Expense_publicId_key`(`publicId`),
    UNIQUE INDEX `Expense_expenseId_key`(`expenseId`),
    INDEX `Expense_expenseType_idx`(`expenseType`),
    INDEX `Expense_category_idx`(`category`),
    INDEX `Expense_expenseDate_idx`(`expenseDate`),
    INDEX `Expense_dueDate_idx`(`dueDate`),
    INDEX `Expense_status_idx`(`status`),
    INDEX `Expense_paidByPublicId_idx`(`paidByPublicId`),
    INDEX `Expense_createdByPublicId_idx`(`createdByPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contribution` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `contributorName` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `contributionDate` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `color` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdByPublicId` VARCHAR(191) NULL,

    UNIQUE INDEX `Contribution_publicId_key`(`publicId`),
    INDEX `Contribution_contributorName_idx`(`contributorName`),
    INDEX `Contribution_contributionDate_idx`(`contributionDate`),
    INDEX `Contribution_createdByPublicId_idx`(`createdByPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `type` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `category` ENUM('REVENUE', 'EXPENSE', 'CAPITAL', 'INVOICE_PAYMENT', 'ADJUSTMENT', 'REFUND', 'WITHDRAWAL', 'DEPOSIT') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `date` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `referenceNo` VARCHAR(191) NULL,
    `invoiceId` BIGINT NULL,
    `invoicePaymentId` BIGINT NULL,
    `expenseId` BIGINT NULL,
    `contributionId` BIGINT NULL,
    `createdByPublicId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Transaction_publicId_key`(`publicId`),
    INDEX `Transaction_type_idx`(`type`),
    INDEX `Transaction_category_idx`(`category`),
    INDEX `Transaction_date_idx`(`date`),
    INDEX `Transaction_invoiceId_idx`(`invoiceId`),
    INDEX `Transaction_expenseId_idx`(`expenseId`),
    INDEX `Transaction_contributionId_idx`(`contributionId`),
    INDEX `Transaction_invoicePaymentId_idx`(`invoicePaymentId`),
    INDEX `Transaction_createdByPublicId_idx`(`createdByPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('FINANCIAL_SUMMARY', 'REVENUE_REPORT', 'EXPENSE_REPORT', 'INVOICE_REPORT', 'CLIENT_REPORT', 'CASHFLOW_REPORT') NOT NULL,
    `status` ENUM('PENDING', 'GENERATED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `fromDate` DATETIME(3) NULL,
    `toDate` DATETIME(3) NULL,
    `format` VARCHAR(191) NOT NULL,
    `fileUrl` TEXT NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `generatedByPublicId` VARCHAR(191) NULL,

    UNIQUE INDEX `Report_publicId_key`(`publicId`),
    INDEX `Report_type_idx`(`type`),
    INDEX `Report_status_idx`(`status`),
    INDEX `Report_generatedByPublicId_idx`(`generatedByPublicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthAuditLog` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountPublicId` VARCHAR(191) NOT NULL,
    `action` ENUM('SIGNUP', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ACCOUNT_DELETED', 'CREATE', 'UPDATE', 'DELETE', 'MARK_PAID', 'GENERATE_REPORT') NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityAuditLog` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accountPublicId` VARCHAR(191) NULL,
    `action` ENUM('SIGNUP', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'ACCOUNT_DELETED', 'CREATE', 'UPDATE', 'DELETE', 'MARK_PAID', 'GENERATE_REPORT') NOT NULL,
    `entityType` ENUM('USER', 'CLIENT', 'INVOICE', 'INVOICE_PAYMENT', 'EXPENSE', 'CONTRIBUTION', 'TRANSACTION', 'REPORT') NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `oldData` JSON NULL,
    `newData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Credential` ADD CONSTRAINT `Credential_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthProvider` ADD CONSTRAINT `AuthProvider_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailVerification` ADD CONSTRAINT `EmailVerification_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountRole` ADD CONSTRAINT `AccountRole_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountRole` ADD CONSTRAINT `AccountRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_createdByPublicId_fkey` FOREIGN KEY (`createdByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_createdByPublicId_fkey` FOREIGN KEY (`createdByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientInvoice` ADD CONSTRAINT `ClientInvoice_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClientInvoice` ADD CONSTRAINT `ClientInvoice_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoicePayment` ADD CONSTRAINT `InvoicePayment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_paidByPublicId_fkey` FOREIGN KEY (`paidByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_createdByPublicId_fkey` FOREIGN KEY (`createdByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contribution` ADD CONSTRAINT `Contribution_createdByPublicId_fkey` FOREIGN KEY (`createdByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_createdByPublicId_fkey` FOREIGN KEY (`createdByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_invoicePaymentId_fkey` FOREIGN KEY (`invoicePaymentId`) REFERENCES `InvoicePayment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_expenseId_fkey` FOREIGN KEY (`expenseId`) REFERENCES `Expense`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_contributionId_fkey` FOREIGN KEY (`contributionId`) REFERENCES `Contribution`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_generatedByPublicId_fkey` FOREIGN KEY (`generatedByPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthAuditLog` ADD CONSTRAINT `AuthAuditLog_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityAuditLog` ADD CONSTRAINT `ActivityAuditLog_accountPublicId_fkey` FOREIGN KEY (`accountPublicId`) REFERENCES `Account`(`publicId`) ON DELETE SET NULL ON UPDATE CASCADE;
