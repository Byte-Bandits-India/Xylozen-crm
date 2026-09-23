-- ============================================================
-- Financial Dashboard - Full Test Data Dump
-- Database: FinancialDashboard (MySQL)
-- Generated: 2026-03-24
-- ============================================================

USE `FinancialDashboard`;

SET FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- TRUNCATE ALL TABLES (clean slate)
-- ============================================================

TRUNCATE TABLE `ActivityAuditLog`;
TRUNCATE TABLE `AuthAuditLog`;
TRUNCATE TABLE `Report`;
TRUNCATE TABLE `Transaction`;
TRUNCATE TABLE `Contribution`;
TRUNCATE TABLE `Expense`;
TRUNCATE TABLE `InvoicePayment`;
TRUNCATE TABLE `InvoiceItem`;
TRUNCATE TABLE `ClientInvoice`;
TRUNCATE TABLE `Invoice`;
TRUNCATE TABLE `Client`;
TRUNCATE TABLE `EmailVerification`;
TRUNCATE TABLE `AuthProvider`;
TRUNCATE TABLE `Session`;
TRUNCATE TABLE `UserProfile`;
TRUNCATE TABLE `AccountRole`;
TRUNCATE TABLE `RolePermission`;
TRUNCATE TABLE `Permission`;
TRUNCATE TABLE `Role`;
TRUNCATE TABLE `Credential`;
TRUNCATE TABLE `Account`;

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

INSERT INTO `Role` (`id`, `name`, `description`) VALUES
(1, 'SUPER_ADMIN', 'Full system access'),
(2, 'MANAGER', 'Can manage clients, invoices, expenses'),
(3, 'ACCOUNTANT', 'Financial data access'),
(4, 'VIEWER', 'Read-only access'),
(5, 'USER', 'User access'),
(6, 'ADMIN', 'Admin access');

INSERT INTO `Permission` (`id`, `code`, `description`) VALUES
(1, 'users:read', 'View users'),
(2, 'users:write', 'Create/update users'),
(3, 'users:delete', 'Delete users'),
(4, 'clients:read', 'View clients'),
(5, 'clients:write', 'Create/update clients'),
(6, 'clients:delete', 'Delete clients'),
(7, 'invoices:read', 'View invoices'),
(8, 'invoices:write', 'Create/update invoices'),
(9, 'invoices:delete', 'Delete invoices'),
(10, 'expenses:read', 'View expenses'),
(11, 'expenses:write', 'Create/update expenses'),
(12, 'expenses:delete', 'Delete expenses'),
(13, 'transactions:read', 'View transactions'),
(14, 'transactions:write', 'Create/update transactions'),
(15, 'contributions:read', 'View contributions'),
(16, 'contributions:write', 'Create/update contributions'),
(17, 'reports:read', 'View reports'),
(18, 'reports:generate', 'Generate reports');

INSERT INTO `RolePermission` (`roleId`, `permissionId`) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),
(2,1),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),(2,11),(2,12),(2,13),(2,14),(2,15),(2,16),(2,17),(2,18),
(3,4),(3,7),(3,8),(3,10),(3,11),(3,13),(3,14),(3,15),(3,16),(3,17),(3,18),
(4,1),(4,4),(4,7),(4,10),(4,13),(4,15),(4,17);

-- ============================================================
-- ACCOUNTS (8 users)
-- ============================================================
-- Password for ALL accounts: Test@1234
-- bcrypt hash of Test@1234

INSERT INTO `Account` (`id`,`publicId`,`email`,`username`,`status`,`isEmailVerified`,`lastLoginAt`,`createdAt`,`updatedAt`,`deletedAt`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','abrahambillclinton@gmail.com','abraham_admin','ACTIVE',1,'2026-03-24 06:00:00','2026-01-01 10:00:00','2026-03-24 06:00:00',NULL),
(2,'a1b2c3d4-2222-4000-a000-000000000002','priya.sharma@example.com','priya_sharma','ACTIVE',1,'2026-03-23 14:30:00','2026-01-05 09:00:00','2026-03-23 14:30:00',NULL),
(3,'a1b2c3d4-3333-4000-a000-000000000003','rahul.verma@example.com','rahul_verma','ACTIVE',1,'2026-03-22 11:00:00','2026-01-10 08:30:00','2026-03-22 11:00:00',NULL),
(4,'a1b2c3d4-4444-4000-a000-000000000004','anita.desai@example.com','anita_desai','ACTIVE',1,'2026-03-20 09:00:00','2026-01-15 10:00:00','2026-03-20 09:00:00',NULL),
(5,'a1b2c3d4-5555-4000-a000-000000000005','vijay.kumar@example.com','vijay_kumar','SUSPENDED',1,'2026-02-28 16:00:00','2026-01-20 11:00:00','2026-03-01 10:00:00',NULL),
(6,'a1b2c3d4-6666-4000-a000-000000000006','meena.patel@example.com','meena_patel','PENDING_VERIFICATION',0,NULL,'2026-03-20 12:00:00','2026-03-20 12:00:00',NULL),
(7,'a1b2c3d4-7777-4000-a000-000000000007','arjun.nair@example.com','arjun_nair','ACTIVE',1,'2026-03-24 07:30:00','2026-02-01 09:00:00','2026-03-24 07:30:00',NULL),
(8,'a1b2c3d4-8888-4000-a000-000000000008','deleted.user@example.com','deleted_user','DELETED',1,'2026-02-15 10:00:00','2026-01-25 08:00:00','2026-03-10 10:00:00','2026-03-10 10:00:00');

INSERT INTO `Credential` (`id`,`accountPublicId`,`passwordHash`,`passwordChangedAt`,`failedAttempts`,`lockedUntil`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi','2026-03-01 10:00:00',0,NULL),
(2,'a1b2c3d4-2222-4000-a000-000000000002','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi',NULL,0,NULL),
(3,'a1b2c3d4-3333-4000-a000-000000000003','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi',NULL,0,NULL),
(4,'a1b2c3d4-4444-4000-a000-000000000004','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi',NULL,0,NULL),
(5,'a1b2c3d4-5555-4000-a000-000000000005','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi',NULL,3,'2026-03-01 12:00:00'),
(6,'a1b2c3d4-6666-4000-a000-000000000006','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi',NULL,0,NULL),
(7,'a1b2c3d4-7777-4000-a000-000000000007','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi',NULL,0,NULL),
(8,'a1b2c3d4-8888-4000-a000-000000000008','$2b$10$p0cfYNSn3pKZerlU7OJSveWjXVePkMah5VXlF/TlmXWX8DbDzvmzi',NULL,0,NULL);

INSERT INTO `AccountRole` (`accountPublicId`,`roleId`,`assignedAt`) VALUES
('a1b2c3d4-1111-4000-a000-000000000001',1,'2026-01-01 10:00:00'),
('a1b2c3d4-2222-4000-a000-000000000002',2,'2026-01-05 09:00:00'),
('a1b2c3d4-3333-4000-a000-000000000003',3,'2026-01-10 08:30:00'),
('a1b2c3d4-4444-4000-a000-000000000004',3,'2026-01-15 10:00:00'),
('a1b2c3d4-5555-4000-a000-000000000005',4,'2026-01-20 11:00:00'),
('a1b2c3d4-6666-4000-a000-000000000006',4,'2026-03-20 12:00:00'),
('a1b2c3d4-7777-4000-a000-000000000007',2,'2026-02-01 09:00:00'),
('a1b2c3d4-8888-4000-a000-000000000008',4,'2026-01-25 08:00:00');

-- ============================================================
-- USER PROFILES
-- ============================================================

INSERT INTO `UserProfile` (`id`,`accountPublicId`,`firstName`,`lastName`,`phone`,`profileImage`,`dateOfBirth`,`gender`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','Abraham','Bill Clinton','+91-9876543200',NULL,'1994-08-10','Male'),
(2,'a1b2c3d4-2222-4000-a000-000000000002','Priya','Sharma','+91-9876543211',NULL,'1992-03-22','Female'),
(3,'a1b2c3d4-3333-4000-a000-000000000003','Rahul','Verma','+91-9876543212',NULL,'1990-11-08','Male'),
(4,'a1b2c3d4-4444-4000-a000-000000000004','Anita','Desai','+91-9876543213',NULL,'1988-07-30','Female'),
(5,'a1b2c3d4-5555-4000-a000-000000000005','Vijay','Kumar','+91-9876543214',NULL,'1993-01-12','Male'),
(6,'a1b2c3d4-6666-4000-a000-000000000006','Meena','Patel','+91-9876543215',NULL,'1996-09-05','Female'),
(7,'a1b2c3d4-7777-4000-a000-000000000007','Arjun','Nair','+91-9876543216',NULL,'1991-12-20','Male'),
(8,'a1b2c3d4-8888-4000-a000-000000000008','Deleted','User','+91-9876543217',NULL,'1994-04-18','Male');

-- ============================================================
-- SESSIONS
-- ============================================================

INSERT INTO `Session` (`id`,`accountPublicId`,`refreshTokenHash`,`ipAddress`,`userAgent`,`deviceName`,`expiresAt`,`createdAt`,`revokedAt`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','hash_token_active_admin','192.168.1.10','Mozilla/5.0 Chrome/120','MacBook Pro','2026-04-24 06:00:00','2026-03-24 06:00:00',NULL),
(2,'a1b2c3d4-1111-4000-a000-000000000001','hash_token_old_admin','192.168.1.10','Mozilla/5.0 Chrome/119','MacBook Pro','2026-03-20 10:00:00','2026-02-20 10:00:00','2026-03-15 10:00:00'),
(3,'a1b2c3d4-2222-4000-a000-000000000002','hash_token_priya','192.168.1.20','Mozilla/5.0 Safari/17','iPhone 15','2026-04-23 14:30:00','2026-03-23 14:30:00',NULL),
(4,'a1b2c3d4-3333-4000-a000-000000000003','hash_token_rahul','10.0.0.5','Mozilla/5.0 Firefox/121','Windows PC','2026-04-22 11:00:00','2026-03-22 11:00:00',NULL),
(5,'a1b2c3d4-7777-4000-a000-000000000007','hash_token_arjun','172.16.0.1','Mozilla/5.0 Chrome/120','Pixel 8','2026-04-24 07:30:00','2026-03-24 07:30:00',NULL);

-- ============================================================
-- AUTH PROVIDERS
-- ============================================================

INSERT INTO `AuthProvider` (`id`,`accountPublicId`,`provider`,`providerUserId`,`accessToken`,`refreshToken`,`createdAt`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','GOOGLE','google_uid_001','gtoken_001',NULL,'2026-01-01 10:00:00'),
(2,'a1b2c3d4-2222-4000-a000-000000000002','GOOGLE','google_uid_002','gtoken_002',NULL,'2026-01-05 09:00:00'),
(3,'a1b2c3d4-7777-4000-a000-000000000007','FACEBOOK','fb_uid_007','fbtoken_007',NULL,'2026-02-01 09:00:00');

-- ============================================================
-- EMAIL VERIFICATIONS
-- ============================================================

INSERT INTO `EmailVerification` (`id`,`accountPublicId`,`email`,`tokenHash`,`ipAddress`,`expiresAt`,`usedAt`,`createdAt`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','abrahambillclinton@gmail.com','vhash_001','192.168.1.10','2026-01-02 10:00:00','2026-01-01 10:30:00','2026-01-01 10:00:00'),
(2,'a1b2c3d4-6666-4000-a000-000000000006','meena.patel@example.com','vhash_006','192.168.1.60','2026-03-21 12:00:00',NULL,'2026-03-20 12:00:00'),
(3,'a1b2c3d4-2222-4000-a000-000000000002','priya.sharma@example.com','vhash_002','192.168.1.20','2026-01-06 09:00:00','2026-01-05 09:30:00','2026-01-05 09:00:00'),
(4,'a1b2c3d4-3333-4000-a000-000000000003','rahul.verma@example.com','vhash_003','10.0.0.5','2026-01-11 08:30:00','2026-01-10 09:00:00','2026-01-10 08:30:00');

-- ============================================================
-- CLIENTS (15 clients)
-- ============================================================

INSERT INTO `Client` (`id`,`publicId`,`name`,`email`,`phone`,`companyName`,`avatar`,`billingAddressLine1`,`billingAddressLine2`,`city`,`state`,`country`,`postalCode`,`notes`,`isActive`,`createdAt`,`updatedAt`,`createdByPublicId`) VALUES
(1,'c0000001-aaaa-4000-b000-000000000001','Rajesh Mehta','rajesh@techsolutions.in','+91-9000000001','TechSolutions Pvt Ltd',NULL,'42 MG Road','Suite 301','Bengaluru','Karnataka','India','560001','Key enterprise client. Annual contract.',1,'2026-01-02 10:00:00','2026-03-20 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(2,'c0000002-aaaa-4000-b000-000000000002','Sneha Iyer','sneha@designhub.com','+91-9000000002','DesignHub Studios',NULL,'15 Koramangala 4th Block',NULL,'Bengaluru','Karnataka','India','560034','UI/UX design partner.',1,'2026-01-05 11:00:00','2026-03-18 11:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(3,'c0000003-aaaa-4000-b000-000000000003','Amit Saxena','amit@cloudnine.io','+91-9000000003','CloudNine Hosting',NULL,'78 Nehru Place','Tower B','New Delhi','Delhi','India','110019','Hosting and infra vendor.',1,'2026-01-10 09:00:00','2026-03-15 09:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(4,'c0000004-aaaa-4000-b000-000000000004','Deepika Rajan','deepika@freshmart.in','+91-9000000004','FreshMart Retail',NULL,'23 Anna Salai',NULL,'Chennai','Tamil Nadu','India','600002','E-commerce integration project.',1,'2026-01-15 14:00:00','2026-03-10 14:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(5,'c0000005-aaaa-4000-b000-000000000005','Manish Gupta','manish@finedge.com','+91-9000000005','FinEdge Analytics',NULL,'56 Bandra Kurla Complex',NULL,'Mumbai','Maharashtra','India','400051','Financial analytics dashboard client.',1,'2026-01-20 10:00:00','2026-03-05 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(6,'c0000006-aaaa-4000-b000-000000000006','Kavitha Menon','kavitha@greenearth.org','+91-9000000006','GreenEarth Foundation',NULL,'12 MG Marg',NULL,'Kochi','Kerala','India','682011','Non-profit. Discounted rates apply.',1,'2026-02-01 08:00:00','2026-03-01 08:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(7,'c0000007-aaaa-4000-b000-000000000007','Suresh Reddy','suresh@buildpro.in','+91-9000000007','BuildPro Constructions',NULL,'89 Jubilee Hills',NULL,'Hyderabad','Telangana','India','500033','Construction management app project.',1,'2026-02-05 09:30:00','2026-02-28 09:30:00','a1b2c3d4-7777-4000-a000-000000000007'),
(8,'c0000008-aaaa-4000-b000-000000000008','Nisha Agarwal','nisha@stylewave.com','+91-9000000008','StyleWave Fashion',NULL,'34 Park Street',NULL,'Kolkata','West Bengal','India','700016','Fashion e-commerce platform.',1,'2026-02-10 11:00:00','2026-02-25 11:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(9,'c0000009-aaaa-4000-b000-000000000009','Prakash Joshi','prakash@logisync.in','+91-9000000009','LogiSync Logistics',NULL,'67 SG Highway',NULL,'Ahmedabad','Gujarat','India','380015','Logistics tracking system.',1,'2026-02-15 10:00:00','2026-02-20 10:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(10,'c0000010-aaaa-4000-b000-000000000010','Inactive Client','inactive@oldcorp.com','+91-9000000010','OldCorp Ltd',NULL,'1 Residency Road',NULL,'Bengaluru','Karnataka','India','560025','Inactive since Feb 2026.',0,'2026-01-03 10:00:00','2026-02-15 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(11,'c0000011-aaaa-4000-b000-000000000011','Rohan Kapoor','rohan@pixelcraft.io','+91-9000000011','PixelCraft Media',NULL,'22 Linking Road',NULL,'Mumbai','Maharashtra','India','400050','Video production and animation.',1,'2026-02-20 10:00:00','2026-03-22 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(12,'c0000012-aaaa-4000-b000-000000000012','Divya Krishnan','divya@healthbridge.in','+91-9000000012','HealthBridge Clinic',NULL,'5 Jayanagar 4th Block',NULL,'Bengaluru','Karnataka','India','560011','Healthcare appointment system.',1,'2026-02-22 09:00:00','2026-03-21 09:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(13,'c0000013-aaaa-4000-b000-000000000013','Kiran Rao','kiran@edutech.co','+91-9000000013','EduTech Learning',NULL,'9 HITEC City',NULL,'Hyderabad','Telangana','India','500081','Online learning platform.',1,'2026-03-01 10:00:00','2026-03-23 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(14,'c0000014-aaaa-4000-b000-000000000014','Sanjay Malhotra','sanjay@realtyvision.in','+91-9000000014','RealtyVision Pvt Ltd',NULL,'78 Connaught Place',NULL,'New Delhi','Delhi','India','110001','Real estate listing portal.',1,'2026-03-05 11:00:00','2026-03-24 11:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(15,'c0000015-aaaa-4000-b000-000000000015','Pooja Singh','pooja@shopnow.in','+91-9000000015','ShopNow Commerce',NULL,'34 FC Road',NULL,'Pune','Maharashtra','India','411004','D2C e-commerce scaling project.',1,'2026-03-10 12:00:00','2026-03-24 12:00:00','a1b2c3d4-1111-4000-a000-000000000001');

-- ============================================================
-- INVOICES (20 invoices covering all statuses)
-- ============================================================

INSERT INTO `Invoice` (`id`,`publicId`,`invoiceNumber`,`status`,`title`,`featureProject`,`description`,`subtotal`,`taxAmount`,`discountAmount`,`totalAmount`,`receivedAmount`,`balanceDue`,`currency`,`issuedDate`,`dueDate`,`paidAt`,`createdAt`,`updatedAt`,`createdByPublicId`) VALUES
(1,'i0000001-aaaa-4000-c000-000000000001','INV-2026-001','PAID','Website Redesign','Project Alpha','Complete website redesign for TechSolutions',150000.00,27000.00,5000.00,172000.00,172000.00,0.00,'INR','2026-01-15 00:00:00','2026-02-15 00:00:00','2026-02-10 14:00:00','2026-01-15 10:00:00','2026-02-10 14:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(2,'i0000002-aaaa-4000-c000-000000000002','INV-2026-002','PAID','Logo & Branding','Branding Suite','Logo design and brand identity for DesignHub',45000.00,8100.00,0.00,53100.00,53100.00,0.00,'INR','2026-01-20 00:00:00','2026-02-20 00:00:00','2026-02-18 10:00:00','2026-01-20 11:00:00','2026-02-18 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(3,'i0000003-aaaa-4000-c000-000000000003','INV-2026-003','PAID','Cloud Migration','Infra Upgrade','AWS migration for CloudNine Hosting',280000.00,50400.00,10000.00,320400.00,320400.00,0.00,'INR','2026-02-01 00:00:00','2026-03-01 00:00:00','2026-02-28 16:00:00','2026-02-01 09:00:00','2026-02-28 16:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(4,'i0000004-aaaa-4000-c000-000000000004','INV-2026-004','PENDING','Mobile App Dev Phase 1','FreshMart App','React Native mobile app development',350000.00,63000.00,15000.00,398000.00,0.00,398000.00,'INR','2026-03-01 00:00:00','2026-04-01 00:00:00',NULL,'2026-03-01 14:00:00','2026-03-01 14:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(5,'i0000005-aaaa-4000-c000-000000000005','INV-2026-005','PARTIAL','Analytics Dashboard','FinEdge Dashboard','Custom analytics dashboard development',500000.00,90000.00,20000.00,570000.00,300000.00,270000.00,'INR','2026-02-10 00:00:00','2026-03-10 00:00:00',NULL,'2026-02-10 10:00:00','2026-03-10 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(6,'i0000006-aaaa-4000-c000-000000000006','INV-2026-006','OVERDUE','NGO Portal','GreenEarth Web','Web portal for GreenEarth Foundation',85000.00,15300.00,8500.00,91800.00,0.00,91800.00,'INR','2026-01-25 00:00:00','2026-02-25 00:00:00',NULL,'2026-01-25 08:00:00','2026-03-20 08:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(7,'i0000007-aaaa-4000-c000-000000000007','INV-2026-007','DRAFT','Construction ERP','BuildPro ERP','ERP system for construction management',750000.00,135000.00,0.00,885000.00,0.00,885000.00,'INR','2026-03-15 00:00:00','2026-04-15 00:00:00',NULL,'2026-03-15 09:30:00','2026-03-15 09:30:00','a1b2c3d4-7777-4000-a000-000000000007'),
(8,'i0000008-aaaa-4000-c000-000000000008','INV-2026-008','CANCELLED','Fashion App','StyleWave MVP','MVP for fashion e-commerce (cancelled by client)',200000.00,36000.00,0.00,236000.00,0.00,236000.00,'INR','2026-02-12 00:00:00','2026-03-12 00:00:00',NULL,'2026-02-12 11:00:00','2026-03-05 11:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(9,'i0000009-aaaa-4000-c000-000000000009','INV-2026-009','PENDING','Tracking Module','LogiSync Track','Real-time logistics tracking module',180000.00,32400.00,5000.00,207400.00,0.00,207400.00,'INR','2026-03-10 00:00:00','2026-04-10 00:00:00',NULL,'2026-03-10 10:00:00','2026-03-10 10:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(10,'i0000010-aaaa-4000-c000-000000000010','INV-2026-010','PAID','SEO Optimization','TechSolutions SEO','SEO and performance optimization',65000.00,11700.00,0.00,76700.00,76700.00,0.00,'INR','2026-02-20 00:00:00','2026-03-20 00:00:00','2026-03-18 15:00:00','2026-02-20 10:00:00','2026-03-18 15:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(11,'i0000011-aaaa-4000-c000-000000000011','INV-2026-011','PARTIAL','API Integration','CloudNine API','Third-party API integration services',120000.00,21600.00,0.00,141600.00,70000.00,71600.00,'INR','2026-03-01 00:00:00','2026-04-01 00:00:00',NULL,'2026-03-01 09:00:00','2026-03-20 09:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(12,'i0000012-aaaa-4000-c000-000000000012','INV-2026-012','PENDING','UI Revamp','DesignHub UI','UI component library revamp',95000.00,17100.00,5000.00,107100.00,0.00,107100.00,'INR','2026-03-18 00:00:00','2026-04-18 00:00:00',NULL,'2026-03-18 11:00:00','2026-03-18 11:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(13,'i0000013-aaaa-4000-c000-000000000013','INV-2026-013','OVERDUE','Data Pipeline','FinEdge ETL','ETL pipeline for financial data',220000.00,39600.00,0.00,259600.00,0.00,259600.00,'INR','2026-01-30 00:00:00','2026-02-28 00:00:00',NULL,'2026-01-30 10:00:00','2026-03-20 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(14,'i0000014-aaaa-4000-c000-000000000014','INV-2026-014','PAID','Server Setup','CloudNine Infra','Dedicated server provisioning and setup',42000.00,7560.00,2000.00,47560.00,47560.00,0.00,'INR','2026-02-05 00:00:00','2026-03-05 00:00:00','2026-03-02 12:00:00','2026-02-05 10:00:00','2026-03-02 12:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(15,'i0000015-aaaa-4000-c000-000000000015','INV-2026-015','DRAFT','Consulting Q2','TechSolutions Consult','Q2 technology consulting retainer',100000.00,18000.00,0.00,118000.00,0.00,118000.00,'INR','2026-03-22 00:00:00','2026-04-22 00:00:00',NULL,'2026-03-22 10:00:00','2026-03-22 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(16,'i0000016-aaaa-4000-c000-000000000016','INV-2026-016','PAID','Video Production Q1','PixelCraft Videos','Product demo and explainer videos',120000.00,21600.00,0.00,141600.00,141600.00,0.00,'INR','2026-02-15 00:00:00','2026-03-15 00:00:00','2026-03-12 10:00:00','2026-02-15 11:00:00','2026-03-12 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(17,'i0000017-aaaa-4000-c000-000000000017','INV-2026-017','PENDING','Health App MVP','HealthBridge App','Patient management mobile app',280000.00,50400.00,10000.00,320400.00,0.00,320400.00,'INR','2026-03-15 00:00:00','2026-04-15 00:00:00',NULL,'2026-03-15 09:00:00','2026-03-15 09:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(18,'i0000018-aaaa-4000-c000-000000000018','INV-2026-018','PARTIAL','LMS Platform','EduTech LMS','Learning management system with video streaming',450000.00,81000.00,15000.00,516000.00,200000.00,316000.00,'INR','2026-03-05 00:00:00','2026-04-05 00:00:00',NULL,'2026-03-05 10:00:00','2026-03-20 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(19,'i0000019-aaaa-4000-c000-000000000019','INV-2026-019','OVERDUE','Property Portal','RealtyVision Portal','Real estate listing and search portal',375000.00,67500.00,0.00,442500.00,0.00,442500.00,'INR','2026-01-20 00:00:00','2026-02-20 00:00:00',NULL,'2026-01-20 11:00:00','2026-03-24 11:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(20,'i0000020-aaaa-4000-c000-000000000020','INV-2026-020','DRAFT','ShopNow Growth Package','ShopNow Scale','Full-stack D2C platform with analytics',600000.00,108000.00,25000.00,683000.00,0.00,683000.00,'INR','2026-03-24 00:00:00','2026-04-30 00:00:00',NULL,'2026-03-24 12:00:00','2026-03-24 12:00:00','a1b2c3d4-1111-4000-a000-000000000001');

-- ============================================================
-- CLIENT-INVOICE MAPPING
-- ============================================================

INSERT INTO `ClientInvoice` (`clientId`,`invoiceId`) VALUES
(1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),(1,10),(3,11),(2,12),(5,13),(3,14),(1,15),
(11,16),(12,17),(13,18),(14,19),(15,20);

-- ============================================================
-- INVOICE ITEMS (2-3 items per invoice)
-- ============================================================

INSERT INTO `InvoiceItem` (`id`,`invoiceId`,`itemName`,`description`,`quantity`,`unitPrice`,`taxPercent`,`discount`,`total`,`createdAt`) VALUES
(1,1,'Frontend Development','React.js frontend with responsive design',1,80000.00,18.00,3000.00,91400.00,'2026-01-15 10:00:00'),
(2,1,'Backend Development','Node.js API development',1,50000.00,18.00,2000.00,57000.00,'2026-01-15 10:00:00'),
(3,1,'UI/UX Design','Wireframes and mockups',1,20000.00,18.00,0.00,23600.00,'2026-01-15 10:00:00'),
(4,2,'Logo Design','Primary and secondary logo variants',1,25000.00,18.00,0.00,29500.00,'2026-01-20 11:00:00'),
(5,2,'Brand Guidelines','Complete brand identity document',1,20000.00,18.00,0.00,23600.00,'2026-01-20 11:00:00'),
(6,3,'Cloud Architecture','AWS architecture design and planning',1,80000.00,18.00,5000.00,89400.00,'2026-02-01 09:00:00'),
(7,3,'Data Migration','Database migration to RDS',1,100000.00,18.00,5000.00,113000.00,'2026-02-01 09:00:00'),
(8,3,'DevOps Setup','CI/CD pipeline and monitoring',1,100000.00,18.00,0.00,118000.00,'2026-02-01 09:00:00'),
(9,4,'Mobile App UI','React Native UI development',1,150000.00,18.00,5000.00,172000.00,'2026-03-01 14:00:00'),
(10,4,'API Integration','Backend API integration',1,120000.00,18.00,5000.00,136600.00,'2026-03-01 14:00:00'),
(11,4,'Testing & QA','Comprehensive testing suite',1,80000.00,18.00,5000.00,89400.00,'2026-03-01 14:00:00'),
(12,5,'Dashboard Frontend','Interactive charts and visualizations',1,200000.00,18.00,10000.00,226000.00,'2026-02-10 10:00:00'),
(13,5,'Analytics Engine','Data processing and analytics backend',1,200000.00,18.00,5000.00,231000.00,'2026-02-10 10:00:00'),
(14,5,'Report Generator','Automated PDF/Excel report generation',1,100000.00,18.00,5000.00,113000.00,'2026-02-10 10:00:00'),
(15,6,'Portal Development','Full-stack web portal',1,60000.00,18.00,6000.00,64800.00,'2026-01-25 08:00:00'),
(16,6,'CMS Integration','Content management system setup',1,25000.00,18.00,2500.00,27000.00,'2026-01-25 08:00:00'),
(17,7,'ERP Core Modules','Inventory, HR, and Finance modules',1,500000.00,18.00,0.00,590000.00,'2026-03-15 09:30:00'),
(18,7,'Custom Reports','Custom reporting dashboard',1,250000.00,18.00,0.00,295000.00,'2026-03-15 09:30:00'),
(19,9,'Tracking Engine','Real-time GPS tracking system',1,100000.00,18.00,3000.00,115000.00,'2026-03-10 10:00:00'),
(20,9,'Driver App','Driver-side mobile application',1,80000.00,18.00,2000.00,92400.00,'2026-03-10 10:00:00'),
(21,10,'SEO Audit','Complete site SEO audit',1,25000.00,18.00,0.00,29500.00,'2026-02-20 10:00:00'),
(22,10,'Performance Opt','Page speed and core web vitals',1,40000.00,18.00,0.00,47200.00,'2026-02-20 10:00:00'),
(23,11,'API Development','RESTful API development',1,70000.00,18.00,0.00,82600.00,'2026-03-01 09:00:00'),
(24,11,'Integration Testing','End-to-end API testing',1,50000.00,18.00,0.00,59000.00,'2026-03-01 09:00:00'),
(25,12,'Component Library','React component library',1,60000.00,18.00,3000.00,67800.00,'2026-03-18 11:00:00'),
(26,12,'Design System','Figma-to-code design system',1,35000.00,18.00,2000.00,39300.00,'2026-03-18 11:00:00'),
(27,13,'ETL Pipeline','Data extraction and transformation',1,120000.00,18.00,0.00,141600.00,'2026-01-30 10:00:00'),
(28,13,'Data Warehouse','Warehouse schema and loading',1,100000.00,18.00,0.00,118000.00,'2026-01-30 10:00:00'),
(29,14,'Server Provisioning','Dedicated server setup',1,25000.00,18.00,1000.00,28500.00,'2026-02-05 10:00:00'),
(30,14,'Security Hardening','Firewall and security config',1,17000.00,18.00,1000.00,19060.00,'2026-02-05 10:00:00'),
(31,15,'Tech Consulting','Monthly consulting retainer',1,100000.00,18.00,0.00,118000.00,'2026-03-22 10:00:00'),
(32,16,'Video Production','4 explainer + 1 product demo video',1,80000.00,18.00,0.00,94400.00,'2026-02-15 11:00:00'),
(33,16,'Motion Graphics','Animated intro and outro sequences',1,40000.00,18.00,0.00,47200.00,'2026-02-15 11:00:00'),
(34,17,'Patient Module','Patient registration and records',1,140000.00,18.00,5000.00,160200.00,'2026-03-15 09:00:00'),
(35,17,'Doctor Dashboard','Appointment and schedule management',1,140000.00,18.00,5000.00,160200.00,'2026-03-15 09:00:00'),
(36,18,'LMS Core','Course builder and student portal',1,250000.00,18.00,10000.00,285000.00,'2026-03-05 10:00:00'),
(37,18,'Video Streaming','HLS video delivery integration',1,150000.00,18.00,5000.00,172000.00,'2026-03-05 10:00:00'),
(38,18,'Analytics Module','Student progress and engagement analytics',1,50000.00,18.00,0.00,59000.00,'2026-03-05 10:00:00'),
(39,19,'Property Listing Engine','Search, filter and map-based listing',1,200000.00,18.00,0.00,236000.00,'2026-01-20 11:00:00'),
(40,19,'Agent Portal','Agent management and inquiry tracking',1,175000.00,18.00,0.00,206500.00,'2026-01-20 11:00:00'),
(41,20,'Storefront & Catalog','Product catalog with variants and pricing',1,250000.00,18.00,10000.00,285000.00,'2026-03-24 12:00:00'),
(42,20,'Order & Fulfillment','Order management and delivery tracking',1,200000.00,18.00,10000.00,226000.00,'2026-03-24 12:00:00'),
(43,20,'Growth Analytics','Conversion funnel and revenue analytics',1,150000.00,18.00,5000.00,172000.00,'2026-03-24 12:00:00');

-- ============================================================
-- INVOICE PAYMENTS
-- ============================================================

INSERT INTO `InvoicePayment` (`id`,`publicId`,`invoiceId`,`amount`,`paymentMethod`,`referenceNo`,`notes`,`paidAt`,`createdAt`,`updatedAt`) VALUES
(1,'p0000001-aaaa-4000-d000-000000000001',1,100000.00,'BANK_TRANSFER','NEFT-20260205-001','First installment','2026-02-05 10:00:00','2026-02-05 10:00:00','2026-02-05 10:00:00'),
(2,'p0000002-aaaa-4000-d000-000000000002',1,72000.00,'UPI','UPI-20260210-001','Final payment','2026-02-10 14:00:00','2026-02-10 14:00:00','2026-02-10 14:00:00'),
(3,'p0000003-aaaa-4000-d000-000000000003',2,53100.00,'BANK_TRANSFER','NEFT-20260218-002','Full payment','2026-02-18 10:00:00','2026-02-18 10:00:00','2026-02-18 10:00:00'),
(4,'p0000004-aaaa-4000-d000-000000000004',3,150000.00,'BANK_TRANSFER','NEFT-20260215-003','Milestone 1 payment','2026-02-15 10:00:00','2026-02-15 10:00:00','2026-02-15 10:00:00'),
(5,'p0000005-aaaa-4000-d000-000000000005',3,170400.00,'BANK_TRANSFER','NEFT-20260228-004','Final milestone payment','2026-02-28 16:00:00','2026-02-28 16:00:00','2026-02-28 16:00:00'),
(6,'p0000006-aaaa-4000-d000-000000000006',5,200000.00,'CARD','CARD-20260225-001','Partial payment via credit card','2026-02-25 10:00:00','2026-02-25 10:00:00','2026-02-25 10:00:00'),
(7,'p0000007-aaaa-4000-d000-000000000007',5,100000.00,'UPI','UPI-20260310-002','Second partial payment','2026-03-10 10:00:00','2026-03-10 10:00:00','2026-03-10 10:00:00'),
(8,'p0000008-aaaa-4000-d000-000000000008',10,76700.00,'BANK_TRANSFER','NEFT-20260318-005','Full payment','2026-03-18 15:00:00','2026-03-18 15:00:00','2026-03-18 15:00:00'),
(9,'p0000009-aaaa-4000-d000-000000000009',11,70000.00,'CHEQUE','CHQ-20260315-001','Cheque payment partial','2026-03-15 11:00:00','2026-03-15 11:00:00','2026-03-15 11:00:00'),
(10,'p0000010-aaaa-4000-d000-000000000010',14,47560.00,'WALLET','WAL-20260302-001','Paid via Paytm wallet','2026-03-02 12:00:00','2026-03-02 12:00:00','2026-03-02 12:00:00'),
(11,'p0000011-aaaa-4000-d000-000000000011',16,141600.00,'BANK_TRANSFER','NEFT-20260312-006','Full payment for video project','2026-03-12 10:00:00','2026-03-12 10:00:00','2026-03-12 10:00:00'),
(12,'p0000012-aaaa-4000-d000-000000000012',18,200000.00,'UPI','UPI-20260318-003','First milestone LMS','2026-03-18 11:00:00','2026-03-18 11:00:00','2026-03-18 11:00:00');

-- ============================================================
-- EXPENSES (15 expenses across categories)
-- ============================================================

INSERT INTO `Expense` (`id`,`publicId`,`expenseId`,`title`,`category`,`description`,`amount`,`expenseDate`,`status`,`vendorName`,`receiptUrl`,`notes`,`createdAt`,`updatedAt`,`createdByPublicId`) VALUES
(1,'e0000001-aaaa-4000-e000-000000000001','#EXP001','AWS Monthly Jan','Infrastructure','AWS cloud hosting January',32000.00,'2026-01-31 00:00:00','PAID','Amazon Web Services',NULL,'Monthly AWS bill','2026-01-31 10:00:00','2026-01-31 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(2,'e0000002-aaaa-4000-e000-000000000002','#EXP002','AWS Monthly Feb','Infrastructure','AWS cloud hosting February',35000.00,'2026-02-28 00:00:00','PAID','Amazon Web Services',NULL,'Increased usage in Feb','2026-02-28 10:00:00','2026-02-28 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(3,'e0000003-aaaa-4000-e000-000000000003','#EXP003','AWS Monthly Mar','Infrastructure','AWS cloud hosting March',38000.00,'2026-03-20 00:00:00','PENDING','Amazon Web Services',NULL,'Pending approval','2026-03-20 10:00:00','2026-03-20 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(4,'e0000004-aaaa-4000-e000-000000000004','#EXP004','Office Rent Jan','Rent','Monthly office rent',50000.00,'2026-01-05 00:00:00','PAID','Prestige Group',NULL,'Koramangala office','2026-01-05 10:00:00','2026-01-05 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(5,'e0000005-aaaa-4000-e000-000000000005','#EXP005','Office Rent Feb','Rent','Monthly office rent',50000.00,'2026-02-05 00:00:00','PAID','Prestige Group',NULL,NULL,'2026-02-05 10:00:00','2026-02-05 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(6,'e0000006-aaaa-4000-e000-000000000006','#EXP006','Office Rent Mar','Rent','Monthly office rent',50000.00,'2026-03-05 00:00:00','PAID','Prestige Group',NULL,NULL,'2026-03-05 10:00:00','2026-03-05 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(7,'e0000007-aaaa-4000-e000-000000000007','#EXP007','Salary Payout Jan','Salaries','Monthly team salaries',420000.00,'2026-01-28 00:00:00','PAID','Internal Payroll',NULL,'5 team members','2026-01-28 10:00:00','2026-01-28 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(8,'e0000008-aaaa-4000-e000-000000000008','#EXP008','Salary Payout Feb','Salaries','Monthly team salaries',420000.00,'2026-02-28 00:00:00','PAID','Internal Payroll',NULL,NULL,'2026-02-28 10:00:00','2026-02-28 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(9,'e0000009-aaaa-4000-e000-000000000009','#EXP009','Salary Payout Mar','Salaries','Monthly team salaries',420000.00,'2026-03-20 00:00:00','APPROVED','Internal Payroll',NULL,'Pending disbursement','2026-03-20 10:00:00','2026-03-20 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(10,'e0000010-aaaa-4000-e000-000000000010','#EXP010','Figma License','Software','Annual Figma team license',28000.00,'2026-01-10 00:00:00','PAID','Figma Inc',NULL,'Team plan - 5 seats','2026-01-10 10:00:00','2026-01-10 10:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(11,'e0000011-aaaa-4000-e000-000000000011','#EXP011','GitHub Enterprise','Software','Annual GitHub license',45000.00,'2026-01-15 00:00:00','PAID','GitHub',NULL,'Enterprise plan','2026-01-15 10:00:00','2026-01-15 10:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(12,'e0000012-aaaa-4000-e000-000000000012','#EXP012','Team Lunch','Meals','Team lunch at Truffles',4500.00,'2026-03-15 00:00:00','PAID','Truffles Restaurant',NULL,'Monthly team bonding','2026-03-15 10:00:00','2026-03-15 10:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(13,'e0000013-aaaa-4000-e000-000000000013','#EXP013','MacBook Pro','Equipment','New laptop for developer',185000.00,'2026-02-10 00:00:00','PAID','Apple India',NULL,'M3 Max - for Arjun','2026-02-10 10:00:00','2026-02-10 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(14,'e0000014-aaaa-4000-e000-000000000014','#EXP014','Conference Tickets','Travel','React India Conference 2026',15000.00,'2026-03-10 00:00:00','PAID','React India',NULL,'2 tickets','2026-03-10 10:00:00','2026-03-10 10:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(15,'e0000015-aaaa-4000-e000-000000000015','#EXP015','Marketing Campaign','Marketing','Google Ads Q1 campaign',60000.00,'2026-03-01 00:00:00','REJECTED','Google Ads',NULL,'Budget exceeded - rejected','2026-03-01 10:00:00','2026-03-05 10:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(16,'e0000016-aaaa-4000-e000-000000000016','#EXP016','Slack Premium','Software','Team communication tool - annual',18000.00,'2026-01-12 00:00:00','PAID','Slack Technologies',NULL,'25 member workspace','2026-01-12 10:00:00','2026-01-12 10:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(17,'e0000017-aaaa-4000-e000-000000000017','#EXP017','Jira + Confluence','Software','Project management tools annual plan',22000.00,'2026-01-18 00:00:00','PAID','Atlassian',NULL,'10 developer seats','2026-01-18 10:00:00','2026-01-18 10:00:00','a1b2c3d4-2222-4000-a000-000000000002'),
(18,'e0000018-aaaa-4000-e000-000000000018','#EXP018','Office Supplies Mar','Miscellaneous','Stationery, printer ink, etc.',3200.00,'2026-03-08 00:00:00','PAID','Staples India',NULL,NULL,'2026-03-08 10:00:00','2026-03-08 10:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(19,'e0000019-aaaa-4000-e000-000000000019','#EXP019','Internet & Utilities Jan','Utilities','Office internet and electricity',8500.00,'2026-01-31 00:00:00','PAID','Airtel Broadband',NULL,'2 lines 1Gbps each','2026-01-31 10:00:00','2026-01-31 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(20,'e0000020-aaaa-4000-e000-000000000020','#EXP020','AWS Monthly Mar','Infrastructure','AWS cloud hosting March (additional)',12000.00,'2026-03-22 00:00:00','PENDING','Amazon Web Services',NULL,'Reserved instance charge','2026-03-22 10:00:00','2026-03-22 10:00:00','a1b2c3d4-1111-4000-a000-000000000001');

-- ============================================================
-- CONTRIBUTIONS (5 capital contributions)
-- ============================================================

INSERT INTO `Contribution` (`id`,`publicId`,`contributorName`,`amount`,`contributionDate`,`notes`,`color`,`createdAt`,`updatedAt`,`createdByPublicId`) VALUES
(1,'cn000001-aaaa-4000-f000-000000000001','Kousik Bandopadhyay',500000.00,'2026-01-01 00:00:00','Initial seed capital','#2563eb','2026-01-01 10:00:00','2026-01-01 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(2,'cn000002-aaaa-4000-f000-000000000002','Priya Sharma',300000.00,'2026-01-01 00:00:00','Co-founder contribution','#dc2626','2026-01-01 10:00:00','2026-01-01 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(3,'cn000003-aaaa-4000-f000-000000000003','Arjun Nair',200000.00,'2026-02-01 00:00:00','Technical partner investment','#16a34a','2026-02-01 09:00:00','2026-02-01 09:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(4,'cn000004-aaaa-4000-f000-000000000004','Kousik Bandopadhyay',150000.00,'2026-03-01 00:00:00','Additional working capital','#2563eb','2026-03-01 10:00:00','2026-03-01 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(5,'cn000005-aaaa-4000-f000-000000000005','External Investor',1000000.00,'2026-03-15 00:00:00','Angel investment round','#f59e0b','2026-03-15 10:00:00','2026-03-15 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(6,'cn000006-aaaa-4000-f000-000000000006','Abraham Bill Clinton',750000.00,'2026-03-20 00:00:00','Admin top-up capital injection','#7c3aed','2026-03-20 10:00:00','2026-03-20 10:00:00','a1b2c3d4-1111-4000-a000-000000000001'),
(7,'cn000007-aaaa-4000-f000-000000000007','Priya Sharma',100000.00,'2026-03-22 00:00:00','Q1 bonus reinvested as capital','#dc2626','2026-03-22 09:00:00','2026-03-22 09:00:00','a1b2c3d4-2222-4000-a000-000000000002');

-- ============================================================
-- TRANSACTIONS (Ledger entries)
-- ============================================================

INSERT INTO `Transaction` (`id`,`publicId`,`type`,`category`,`amount`,`currency`,`date`,`description`,`referenceNo`,`invoiceId`,`invoicePaymentId`,`expenseId`,`contributionId`,`createdByPublicId`,`createdAt`,`updatedAt`) VALUES
-- Capital contributions
(1,'t0000001-aaaa-4000-a100-000000000001','CREDIT','CAPITAL',500000.00,'INR','2026-01-01 00:00:00','Seed capital - Kousik','CAP-001',NULL,NULL,NULL,1,'a1b2c3d4-1111-4000-a000-000000000001','2026-01-01 10:00:00','2026-01-01 10:00:00'),
(2,'t0000002-aaaa-4000-a100-000000000002','CREDIT','CAPITAL',300000.00,'INR','2026-01-01 00:00:00','Seed capital - Priya','CAP-002',NULL,NULL,NULL,2,'a1b2c3d4-1111-4000-a000-000000000001','2026-01-01 10:00:00','2026-01-01 10:00:00'),
(3,'t0000003-aaaa-4000-a100-000000000003','CREDIT','CAPITAL',200000.00,'INR','2026-02-01 00:00:00','Investment - Arjun','CAP-003',NULL,NULL,NULL,3,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-01 09:00:00','2026-02-01 09:00:00'),
(4,'t0000004-aaaa-4000-a100-000000000004','CREDIT','CAPITAL',150000.00,'INR','2026-03-01 00:00:00','Additional capital - Kousik','CAP-004',NULL,NULL,NULL,4,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-01 10:00:00','2026-03-01 10:00:00'),
(5,'t0000005-aaaa-4000-a100-000000000005','CREDIT','CAPITAL',1000000.00,'INR','2026-03-15 00:00:00','Angel investment','CAP-005',NULL,NULL,NULL,5,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-15 10:00:00','2026-03-15 10:00:00'),
-- Invoice payments (revenue)
(6,'t0000006-aaaa-4000-a100-000000000006','CREDIT','INVOICE_PAYMENT',100000.00,'INR','2026-02-05 10:00:00','INV-2026-001 installment 1','NEFT-20260205-001',1,1,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-05 10:00:00','2026-02-05 10:00:00'),
(7,'t0000007-aaaa-4000-a100-000000000007','CREDIT','INVOICE_PAYMENT',72000.00,'INR','2026-02-10 14:00:00','INV-2026-001 final','UPI-20260210-001',1,2,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-10 14:00:00','2026-02-10 14:00:00'),
(8,'t0000008-aaaa-4000-a100-000000000008','CREDIT','INVOICE_PAYMENT',53100.00,'INR','2026-02-18 10:00:00','INV-2026-002 full payment','NEFT-20260218-002',2,3,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-18 10:00:00','2026-02-18 10:00:00'),
(9,'t0000009-aaaa-4000-a100-000000000009','CREDIT','INVOICE_PAYMENT',150000.00,'INR','2026-02-15 10:00:00','INV-2026-003 milestone 1','NEFT-20260215-003',3,4,NULL,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-02-15 10:00:00','2026-02-15 10:00:00'),
(10,'t0000010-aaaa-4000-a100-000000000010','CREDIT','INVOICE_PAYMENT',170400.00,'INR','2026-02-28 16:00:00','INV-2026-003 final','NEFT-20260228-004',3,5,NULL,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-02-28 16:00:00','2026-02-28 16:00:00'),
(11,'t0000011-aaaa-4000-a100-000000000011','CREDIT','INVOICE_PAYMENT',200000.00,'INR','2026-02-25 10:00:00','INV-2026-005 partial','CARD-20260225-001',5,6,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-25 10:00:00','2026-02-25 10:00:00'),
(12,'t0000012-aaaa-4000-a100-000000000012','CREDIT','INVOICE_PAYMENT',100000.00,'INR','2026-03-10 10:00:00','INV-2026-005 partial 2','UPI-20260310-002',5,7,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-10 10:00:00','2026-03-10 10:00:00'),
(13,'t0000013-aaaa-4000-a100-000000000013','CREDIT','INVOICE_PAYMENT',76700.00,'INR','2026-03-18 15:00:00','INV-2026-010 full','NEFT-20260318-005',10,8,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-18 15:00:00','2026-03-18 15:00:00'),
(14,'t0000014-aaaa-4000-a100-000000000014','CREDIT','INVOICE_PAYMENT',70000.00,'INR','2026-03-15 11:00:00','INV-2026-011 cheque','CHQ-20260315-001',11,9,NULL,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-03-15 11:00:00','2026-03-15 11:00:00'),
(15,'t0000015-aaaa-4000-a100-000000000015','CREDIT','INVOICE_PAYMENT',47560.00,'INR','2026-03-02 12:00:00','INV-2026-014 wallet','WAL-20260302-001',14,10,NULL,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-03-02 12:00:00','2026-03-02 12:00:00'),
-- Expense transactions (debits)
(16,'t0000016-aaaa-4000-a100-000000000016','DEBIT','EXPENSE',32000.00,'INR','2026-01-31 00:00:00','AWS Jan','EXP-001',NULL,NULL,1,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-01-31 10:00:00','2026-01-31 10:00:00'),
(17,'t0000017-aaaa-4000-a100-000000000017','DEBIT','EXPENSE',35000.00,'INR','2026-02-28 00:00:00','AWS Feb','EXP-002',NULL,NULL,2,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-28 10:00:00','2026-02-28 10:00:00'),
(18,'t0000018-aaaa-4000-a100-000000000018','DEBIT','EXPENSE',50000.00,'INR','2026-01-05 00:00:00','Office Rent Jan','EXP-004',NULL,NULL,4,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-01-05 10:00:00','2026-01-05 10:00:00'),
(19,'t0000019-aaaa-4000-a100-000000000019','DEBIT','EXPENSE',50000.00,'INR','2026-02-05 00:00:00','Office Rent Feb','EXP-005',NULL,NULL,5,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-05 10:00:00','2026-02-05 10:00:00'),
(20,'t0000020-aaaa-4000-a100-000000000020','DEBIT','EXPENSE',50000.00,'INR','2026-03-05 00:00:00','Office Rent Mar','EXP-006',NULL,NULL,6,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-05 10:00:00','2026-03-05 10:00:00'),
(21,'t0000021-aaaa-4000-a100-000000000021','DEBIT','EXPENSE',420000.00,'INR','2026-01-28 00:00:00','Salaries Jan','EXP-007',NULL,NULL,7,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-01-28 10:00:00','2026-01-28 10:00:00'),
(22,'t0000022-aaaa-4000-a100-000000000022','DEBIT','EXPENSE',420000.00,'INR','2026-02-28 00:00:00','Salaries Feb','EXP-008',NULL,NULL,8,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-28 10:00:00','2026-02-28 10:00:00'),
(23,'t0000023-aaaa-4000-a100-000000000023','DEBIT','EXPENSE',28000.00,'INR','2026-01-10 00:00:00','Figma License','EXP-010',NULL,NULL,10,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-01-10 10:00:00','2026-01-10 10:00:00'),
(24,'t0000024-aaaa-4000-a100-000000000024','DEBIT','EXPENSE',45000.00,'INR','2026-01-15 00:00:00','GitHub Enterprise','EXP-011',NULL,NULL,11,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-01-15 10:00:00','2026-01-15 10:00:00'),
(25,'t0000025-aaaa-4000-a100-000000000025','DEBIT','EXPENSE',4500.00,'INR','2026-03-15 00:00:00','Team Lunch','EXP-012',NULL,NULL,12,NULL,'a1b2c3d4-7777-4000-a000-000000000007','2026-03-15 10:00:00','2026-03-15 10:00:00'),
(26,'t0000026-aaaa-4000-a100-000000000026','DEBIT','EXPENSE',185000.00,'INR','2026-02-10 00:00:00','MacBook Pro','EXP-013',NULL,NULL,13,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-02-10 10:00:00','2026-02-10 10:00:00'),
(27,'t0000027-aaaa-4000-a100-000000000027','DEBIT','EXPENSE',15000.00,'INR','2026-03-10 00:00:00','Conference Tickets','EXP-014',NULL,NULL,14,NULL,'a1b2c3d4-7777-4000-a000-000000000007','2026-03-10 10:00:00','2026-03-10 10:00:00'),
-- More expense debits
(28,'t0000028-aaaa-4000-a100-000000000028','DEBIT','EXPENSE',18000.00,'INR','2026-01-12 00:00:00','Slack Premium','EXP-016',NULL,NULL,16,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-01-12 10:00:00','2026-01-12 10:00:00'),
(29,'t0000029-aaaa-4000-a100-000000000029','DEBIT','EXPENSE',22000.00,'INR','2026-01-18 00:00:00','Jira + Confluence','EXP-017',NULL,NULL,17,NULL,'a1b2c3d4-2222-4000-a000-000000000002','2026-01-18 10:00:00','2026-01-18 10:00:00'),
(30,'t0000030-aaaa-4000-a100-000000000030','DEBIT','EXPENSE',8500.00,'INR','2026-01-31 00:00:00','Internet & Utilities','EXP-019',NULL,NULL,19,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-01-31 10:00:00','2026-01-31 10:00:00'),
-- New capital contributions
(31,'t0000031-aaaa-4000-a100-000000000031','CREDIT','CAPITAL',750000.00,'INR','2026-03-20 00:00:00','Admin capital injection - Abraham','CAP-006',NULL,NULL,NULL,6,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-20 10:00:00','2026-03-20 10:00:00'),
(32,'t0000032-aaaa-4000-a100-000000000032','CREDIT','CAPITAL',100000.00,'INR','2026-03-22 00:00:00','Priya Q1 bonus reinvested','CAP-007',NULL,NULL,NULL,7,'a1b2c3d4-2222-4000-a000-000000000002','2026-03-22 09:00:00','2026-03-22 09:00:00'),
-- New invoice payment revenues
(33,'t0000033-aaaa-4000-a100-000000000033','CREDIT','INVOICE_PAYMENT',141600.00,'INR','2026-03-12 10:00:00','INV-2026-016 PixelCraft full','NEFT-20260312-006',16,11,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-12 10:00:00','2026-03-12 10:00:00'),
(34,'t0000034-aaaa-4000-a100-000000000034','CREDIT','INVOICE_PAYMENT',200000.00,'INR','2026-03-18 11:00:00','INV-2026-018 LMS milestone 1','UPI-20260318-003',18,12,NULL,NULL,'a1b2c3d4-1111-4000-a000-000000000001','2026-03-18 11:00:00','2026-03-18 11:00:00');

-- ============================================================
-- REPORTS
-- ============================================================

INSERT INTO `Report` (`id`,`publicId`,`name`,`type`,`status`,`fromDate`,`toDate`,`format`,`fileUrl`,`errorMessage`,`createdAt`,`updatedAt`,`generatedByPublicId`) VALUES
(1,'r0000001-aaaa-4000-b100-000000000001','Q1 Financial Summary','FINANCIAL_SUMMARY','GENERATED','2026-01-01 00:00:00','2026-03-31 00:00:00','pdf','/reports/q1_financial_summary.pdf',NULL,'2026-03-20 10:00:00','2026-03-20 10:30:00','a1b2c3d4-1111-4000-a000-000000000001'),
(2,'r0000002-aaaa-4000-b100-000000000002','Jan Revenue Report','REVENUE_REPORT','GENERATED','2026-01-01 00:00:00','2026-01-31 00:00:00','xlsx','/reports/jan_revenue.xlsx',NULL,'2026-02-01 09:00:00','2026-02-01 09:15:00','a1b2c3d4-2222-4000-a000-000000000002'),
(3,'r0000003-aaaa-4000-b100-000000000003','Feb Expense Report','EXPENSE_REPORT','GENERATED','2026-02-01 00:00:00','2026-02-28 00:00:00','pdf','/reports/feb_expenses.pdf',NULL,'2026-03-01 10:00:00','2026-03-01 10:20:00','a1b2c3d4-3333-4000-a000-000000000003'),
(4,'r0000004-aaaa-4000-b100-000000000004','Invoice Aging Report','INVOICE_REPORT','GENERATED','2026-01-01 00:00:00','2026-03-24 00:00:00','csv','/reports/invoice_aging.csv',NULL,'2026-03-22 14:00:00','2026-03-22 14:10:00','a1b2c3d4-1111-4000-a000-000000000001'),
(5,'r0000005-aaaa-4000-b100-000000000005','Client Revenue Report','CLIENT_REPORT','PENDING','2026-01-01 00:00:00','2026-03-24 00:00:00','pdf',NULL,NULL,'2026-03-24 08:00:00','2026-03-24 08:00:00','a1b2c3d4-7777-4000-a000-000000000007'),
(6,'r0000006-aaaa-4000-b100-000000000006','Cashflow Analysis','CASHFLOW_REPORT','FAILED','2026-01-01 00:00:00','2026-03-24 00:00:00','xlsx',NULL,'Timeout: report generation exceeded 30s limit','2026-03-23 16:00:00','2026-03-23 16:05:00','a1b2c3d4-1111-4000-a000-000000000001');

-- ============================================================
-- AUTH AUDIT LOGS
-- ============================================================

INSERT INTO `AuthAuditLog` (`id`,`accountPublicId`,`action`,`ipAddress`,`userAgent`,`createdAt`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','SIGNUP','192.168.1.10','Mozilla/5.0 Chrome/119','2026-01-01 10:00:00'),
(2,'a1b2c3d4-1111-4000-a000-000000000001','LOGIN','192.168.1.10','Mozilla/5.0 Chrome/119','2026-01-01 10:05:00'),
(3,'a1b2c3d4-2222-4000-a000-000000000002','SIGNUP','192.168.1.20','Mozilla/5.0 Safari/17','2026-01-05 09:00:00'),
(4,'a1b2c3d4-3333-4000-a000-000000000003','SIGNUP','10.0.0.5','Mozilla/5.0 Firefox/121','2026-01-10 08:30:00'),
(5,'a1b2c3d4-1111-4000-a000-000000000001','PASSWORD_CHANGE','192.168.1.10','Mozilla/5.0 Chrome/120','2026-03-01 10:00:00'),
(6,'a1b2c3d4-5555-4000-a000-000000000005','LOGIN','192.168.1.50','Mozilla/5.0 Edge/120','2026-02-28 16:00:00'),
(7,'a1b2c3d4-5555-4000-a000-000000000005','LOGOUT','192.168.1.50','Mozilla/5.0 Edge/120','2026-02-28 18:00:00'),
(8,'a1b2c3d4-8888-4000-a000-000000000008','ACCOUNT_DELETED','192.168.1.80','Mozilla/5.0 Chrome/120','2026-03-10 10:00:00'),
(9,'a1b2c3d4-1111-4000-a000-000000000001','LOGIN','192.168.1.10','Mozilla/5.0 Chrome/120','2026-03-24 06:00:00'),
(10,'a1b2c3d4-7777-4000-a000-000000000007','LOGIN','172.16.0.1','Mozilla/5.0 Chrome/120','2026-03-24 07:30:00'),
(11,'a1b2c3d4-1111-4000-a000-000000000001','LOGIN','192.168.1.10','Mozilla/5.0 Chrome/120','2026-03-20 10:00:00'),
(12,'a1b2c3d4-2222-4000-a000-000000000002','LOGIN','192.168.1.20','Mozilla/5.0 Safari/17','2026-03-22 09:00:00'),
(13,'a1b2c3d4-3333-4000-a000-000000000003','LOGIN','10.0.0.5','Mozilla/5.0 Firefox/122','2026-03-23 11:00:00'),
(14,'a1b2c3d4-4444-4000-a000-000000000004','SIGNUP','10.0.0.8','Mozilla/5.0 Chrome/120','2026-01-15 10:00:00'),
(15,'a1b2c3d4-4444-4000-a000-000000000004','LOGIN','10.0.0.8','Mozilla/5.0 Chrome/120','2026-03-20 09:00:00');

-- ============================================================
-- ACTIVITY AUDIT LOGS
-- ============================================================

INSERT INTO `ActivityAuditLog` (`id`,`accountPublicId`,`action`,`entityType`,`entityId`,`oldData`,`newData`,`createdAt`) VALUES
(1,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','CLIENT','c0000001-aaaa-4000-b000-000000000001',NULL,'{"name":"Rajesh Mehta","company":"TechSolutions Pvt Ltd"}','2026-01-02 10:00:00'),
(2,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','INVOICE','i0000001-aaaa-4000-c000-000000000001',NULL,'{"invoiceNumber":"INV-2026-001","totalAmount":172000}','2026-01-15 10:00:00'),
(3,'a1b2c3d4-1111-4000-a000-000000000001','MARK_PAID','INVOICE','i0000001-aaaa-4000-c000-000000000001','{"status":"PENDING"}','{"status":"PAID"}','2026-02-10 14:00:00'),
(4,'a1b2c3d4-2222-4000-a000-000000000002','CREATE','INVOICE','i0000003-aaaa-4000-c000-000000000003',NULL,'{"invoiceNumber":"INV-2026-003","totalAmount":320400}','2026-02-01 09:00:00'),
(5,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','EXPENSE','e0000001-aaaa-4000-e000-000000000001',NULL,'{"title":"AWS Monthly Jan","amount":32000}','2026-01-31 10:00:00'),
(6,'a1b2c3d4-1111-4000-a000-000000000001','UPDATE','CLIENT','c0000010-aaaa-4000-b000-000000000010','{"isActive":true}','{"isActive":false}','2026-02-15 10:00:00'),
(7,'a1b2c3d4-1111-4000-a000-000000000001','DELETE','INVOICE','i0000008-aaaa-4000-c000-000000000008','{"status":"PENDING"}','{"status":"CANCELLED"}','2026-03-05 11:00:00'),
(8,'a1b2c3d4-1111-4000-a000-000000000001','GENERATE_REPORT','REPORT','r0000001-aaaa-4000-b100-000000000001',NULL,'{"name":"Q1 Financial Summary","type":"FINANCIAL_SUMMARY"}','2026-03-20 10:00:00'),
(9,'a1b2c3d4-7777-4000-a000-000000000007','CREATE','CLIENT','c0000006-aaaa-4000-b000-000000000006',NULL,'{"name":"Kavitha Menon","company":"GreenEarth Foundation"}','2026-02-01 08:00:00'),
(10,'a1b2c3d4-2222-4000-a000-000000000002','CREATE','CONTRIBUTION','cn000003-aaaa-4000-f000-000000000003',NULL,'{"contributorName":"Arjun Nair","amount":200000}','2026-02-01 09:00:00'),
(11,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','CLIENT','c0000011-aaaa-4000-b000-000000000011',NULL,'{"name":"Rohan Kapoor","company":"PixelCraft Media"}','2026-02-20 10:00:00'),
(12,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','INVOICE','i0000016-aaaa-4000-c000-000000000016',NULL,'{"invoiceNumber":"INV-2026-016","totalAmount":141600}','2026-02-15 11:00:00'),
(13,'a1b2c3d4-1111-4000-a000-000000000001','MARK_PAID','INVOICE','i0000016-aaaa-4000-c000-000000000016','{"status":"PENDING"}','{"status":"PAID"}','2026-03-12 10:00:00'),
(14,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','CONTRIBUTION','cn000006-aaaa-4000-f000-000000000006',NULL,'{"contributorName":"Abraham Bill Clinton","amount":750000}','2026-03-20 10:00:00'),
(15,'a1b2c3d4-7777-4000-a000-000000000007','CREATE','CLIENT','c0000014-aaaa-4000-b000-000000000014',NULL,'{"name":"Sanjay Malhotra","company":"RealtyVision Pvt Ltd"}','2026-03-05 11:00:00'),
(16,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','INVOICE','i0000020-aaaa-4000-c000-000000000020',NULL,'{"invoiceNumber":"INV-2026-020","totalAmount":683000}','2026-03-24 12:00:00'),
(17,'a1b2c3d4-2222-4000-a000-000000000002','CREATE','EXPENSE','e0000016-aaaa-4000-e000-000000000016',NULL,'{"title":"Slack Premium","amount":18000}','2026-01-12 10:00:00'),
(18,'a1b2c3d4-3333-4000-a000-000000000003','GENERATE_REPORT','REPORT','r0000003-aaaa-4000-b100-000000000003',NULL,'{"name":"Feb Expense Report","type":"EXPENSE_REPORT"}','2026-03-01 10:00:00'),
(19,'a1b2c3d4-1111-4000-a000-000000000001','CREATE','INVOICE','i0000018-aaaa-4000-c000-000000000018',NULL,'{"invoiceNumber":"INV-2026-018","totalAmount":516000}','2026-03-05 10:00:00'),
(20,'a1b2c3d4-1111-4000-a000-000000000001','UPDATE','INVOICE','i0000005-aaaa-4000-c000-000000000005','{"receivedAmount":200000}','{"receivedAmount":300000,"status":"PARTIAL"}','2026-03-10 10:00:00');

-- Insert 10 Fake Expenses
INSERT INTO `Expense` (`id`, `publicId`, `expenseId`, `expenseType`, `title`, `category`, `amount`, `expenseDate`, `dueDate`, `status`, `recurring`, `frequency`, `vendorName`, `paymentMethod`, `createdAt`, `updatedAt`, `paidByPublicId`, `createdByPublicId`) VALUES
(21, 'e0000021-aaaa-4000-e000-000000000021', '#FIX001', 'FIXED', 'Staff Salaries', 'Salaries', 120000.00, '2026-10-01', '2026-10-05', 'PAID', 1, 'monthly', 'Internal', 'BANK_TRANSFER', NOW(), NOW(), 'a1b2c3d4-1111-4000-a000-000000000001', 'a1b2c3d4-1111-4000-a000-000000000001'),
(22, 'e0000022-aaaa-4000-e000-000000000022', '#OPE001', 'OPERATIONAL', 'Legal Consulting', 'Professional Fees', 50000.00, '2026-10-02', '2026-10-10', 'PAID', 0, NULL, 'Law Firm LLC', 'CASH', NOW(), NOW(), 'a1b2c3d4-1111-4000-a000-000000000001', 'a1b2c3d4-1111-4000-a000-000000000001'),
(23, 'e0000023-aaaa-4000-e000-000000000023', '#OPE002', 'OPERATIONAL', 'AWS Hosting', 'Technology', 15000.00, '2026-10-05', '2026-10-15', 'PAID', 1, 'monthly', 'Amazon Web Services', 'CARD', NOW(), NOW(), 'a1b2c3d4-2222-4000-a000-000000000002', 'a1b2c3d4-2222-4000-a000-000000000002'),
(24, 'e0000024-aaaa-4000-e000-000000000024', '#FIX002', 'FIXED', 'Electricity Bill', 'Utilities', 2500.00, '2026-10-12', '2026-10-15', 'PAID', 1, 'monthly', 'City Power', 'UPI', NOW(), NOW(), 'a1b2c3d4-1111-4000-a000-000000000001', 'a1b2c3d4-1111-4000-a000-000000000001'),
(25, 'e0000025-aaaa-4000-e000-000000000025', '#FIX003', 'FIXED', 'Executive Salaries', 'Salaries', 80000.00, '2026-10-10', '2026-10-15', 'PAID', 1, 'monthly', 'Internal', 'BANK_TRANSFER', NOW(), NOW(), 'a1b2c3d4-2222-4000-a000-000000000002', 'a1b2c3d4-2222-4000-a000-000000000002'),
(26, 'e0000026-aaaa-4000-e000-000000000026', '#OPE003', 'OPERATIONAL', 'Accounting Audit', 'Professional Fees', 12000.00, '2026-10-18', '2026-10-20', 'PENDING', 0, NULL, 'Audit Partners', NULL, NOW(), NOW(), NULL, 'a1b2c3d4-1111-4000-a000-000000000001'),
(27, 'e0000027-aaaa-4000-e000-000000000027', '#OPE004', 'OPERATIONAL', 'SaaS Subscriptions', 'Technology', 8500.00, '2026-10-20', '2026-10-25', 'PAID', 1, 'monthly', 'Various', 'CARD', NOW(), NOW(), 'a1b2c3d4-2222-4000-a000-000000000002', 'a1b2c3d4-2222-4000-a000-000000000002'),
(28, 'e0000028-aaaa-4000-e000-000000000028', '#FIX004', 'FIXED', 'Internet Plan', 'Utilities', 1500.00, '2026-10-15', '2026-10-20', 'PAID', 1, 'monthly', 'Airtel', 'UPI', NOW(), NOW(), 'a1b2c3d4-1111-4000-a000-000000000001', 'a1b2c3d4-1111-4000-a000-000000000001'),
(29, 'e0000029-aaaa-4000-e000-000000000029', '#OPE005', 'OPERATIONAL', 'Freelance Design', 'Professional Fees', 5000.00, '2026-10-22', '2026-10-30', 'PENDING', 0, NULL, 'Designer Co', NULL, NOW(), NOW(), NULL, 'a1b2c3d4-2222-4000-a000-000000000002'),
(30, 'e0000030-aaaa-4000-e000-000000000030', '#OPE006', 'OPERATIONAL', 'Software Licenses', 'Technology', 4000.00, '2026-10-25', '2026-10-31', 'REJECTED', 0, NULL, 'Microsoft', NULL, NOW(), NOW(), NULL, 'a1b2c3d4-1111-4000-a000-000000000001');

-- Insert 10 Fake Transactions (DEBITs for PAID expenses, some CREDITs for REVENUE to show balance)
INSERT INTO `Transaction` (`id`, `publicId`, `type`, `category`, `amount`, `currency`, `date`, `description`, `expenseId`, `createdByPublicId`, `createdAt`, `updatedAt`) VALUES
(35, 't0000035-aaaa-4000-a100-000000000035', 'DEBIT', 'EXPENSE', 120000.00, 'INR', '2026-10-01', 'Expense paid: Staff Salaries', 21, 'a1b2c3d4-1111-4000-a000-000000000001', NOW(), NOW()),
(36, 't0000036-aaaa-4000-a100-000000000036', 'DEBIT', 'EXPENSE', 50000.00, 'INR', '2026-10-02', 'Expense paid: Legal Consulting', 22, 'a1b2c3d4-1111-4000-a000-000000000001', NOW(), NOW()),
(37, 't0000037-aaaa-4000-a100-000000000037', 'DEBIT', 'EXPENSE', 15000.00, 'INR', '2026-10-05', 'Expense paid: AWS Hosting', 23, 'a1b2c3d4-2222-4000-a000-000000000002', NOW(), NOW()),
(38, 't0000038-aaaa-4000-a100-000000000038', 'DEBIT', 'EXPENSE', 2500.00, 'INR', '2026-10-12', 'Expense paid: Electricity Bill', 24, 'a1b2c3d4-1111-4000-a000-000000000001', NOW(), NOW()),
(39, 't0000039-aaaa-4000-a100-000000000039', 'DEBIT', 'EXPENSE', 80000.00, 'INR', '2026-10-10', 'Expense paid: Executive Salaries', 25, 'a1b2c3d4-2222-4000-a000-000000000002', NOW(), NOW()),
(40, 't0000040-aaaa-4000-a100-000000000040', 'DEBIT', 'EXPENSE', 8500.00, 'INR', '2026-10-20', 'Expense paid: SaaS Subscriptions', 27, 'a1b2c3d4-2222-4000-a000-000000000002', NOW(), NOW()),
(41, 't0000041-aaaa-4000-a100-000000000041', 'DEBIT', 'EXPENSE', 1500.00, 'INR', '2026-10-15', 'Expense paid: Internet Plan', 28, 'a1b2c3d4-1111-4000-a000-000000000001', NOW(), NOW()),
(42, 't0000042-aaaa-4000-a100-000000000042', 'CREDIT', 'REVENUE', 150000.00, 'INR', '2026-10-03', 'Client Payment from Acme Corp', NULL, 'a1b2c3d4-1111-4000-a000-000000000001', NOW(), NOW()),
(43, 't0000043-aaaa-4000-a100-000000000043', 'CREDIT', 'REVENUE', 75000.00, 'INR', '2026-10-08', 'Consulting Fees', NULL, 'a1b2c3d4-2222-4000-a000-000000000002', NOW(), NOW()),
(44, 't0000044-aaaa-4000-a100-000000000044', 'CREDIT', 'CAPITAL', 200000.00, 'INR', '2026-10-01', 'Initial Capital Investment', NULL, 'a1b2c3d4-1111-4000-a000-000000000001', NOW(), NOW());

-- Insert 2 Fake Contributions
INSERT INTO `Contribution` (`id`, `publicId`, `contributorName`, `amount`, `contributionDate`, `notes`, `color`, `createdAt`, `updatedAt`, `createdByPublicId`) VALUES
(8, 'cn000008-aaaa-4000-f000-000000000008', 'Abraham Clinton', 500000.00, '2026-09-15', 'Initial Founding Capital', '#ef4444', NOW(), NOW(), 'a1b2c3d4-1111-4000-a000-000000000001'),
(9, 'cn000009-aaaa-4000-f000-000000000009', 'DK Tech', 200000.00, '2026-10-01', 'Follow-on Funding', '#3b82f6', NOW(), NOW(), 'a1b2c3d4-2222-4000-a000-000000000002');

-- ============================================================
-- RESET & FINALIZE
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_MODE = @OLD_SQL_MODE;
