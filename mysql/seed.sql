-- App rows for empty production DBs. No OAuth tokens.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- users: 3 rows
INSERT INTO users (`id`, `name`, `email`, `initials`, `color`, `created_at`, `username`, `password_hash`, `role`)
VALUES
('80526ec8-bda9-4c2e-8c74-d918df6d2e70', 'Aeris', 'it@aerisbeaute.com', 'IT', '#3c241c', '2026-09-09 08:11:48.184', 'itaeris', '$2b$10$S07CYotp8EhtQG3bobD6TeG0yAgdkZnda.H7MxFstydMeMaNyaYo.', 'admin'),
('d3d29781-873f-4bbc-8cae-a344f1767c74', 'Dwiki Arlian Maulana', 'dwiki@aerisbeaute.com', 'DM', '#0284c7', '2026-09-09 09:02:21.689', 'dwiki', NULL, 'member'),
('3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'Leo', 'leonardo@aerisbeaute.com', 'LE', '#0284c7', '2026-09-10 03:20:46.538', 'leonardo', NULL, 'member');

-- groups: 0 rows

-- group_members: 0 rows

-- projects: 7 rows
INSERT INTO projects (`id`, `name`, `description`, `color`, `share_code`, `owner_id`, `created_at`, `updated_at`, `access`, `group_id`)
VALUES
('a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'Whatsapp Dashboard', 'Whatsapp Dashboard Commerce', 'fi:fi-brands-whatsapp', '6RWR-YJMG', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-09 17:42:10.198', '2026-09-09 17:42:10.198', 'organization', NULL),
('8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'Fulfillment Dashboard', 'Fulfillment Dashboard Warehouse', 'fi:fi-sr-shop', '2ER8-3S87', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-09 17:45:44.820', '2026-09-09 17:45:44.820', 'organization', NULL),
('2803dd76-63c9-46fe-8426-54265ccca680', 'HR Recruitment Dashboard', 'HR Recruitment Dashboard', 'fi:fi-sr-briefcase', 'PFGP-QC9W', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-09 18:18:56.768', '2026-09-09 18:18:56.768', 'organization', NULL),
('1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', 'AssetHub Project', 'Management IT Assets', 'fi:fi-sr-briefcase', 'GZQ3-HDRM', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 03:23:16.444', '2026-09-10 03:23:16.444', 'organization', NULL),
('4272fcfd-4b16-4617-94b6-c77f182629f1', 'GAssets Project', 'Management GA Assets', 'fi:fi-sr-briefcase', '7HYP-LF3Z', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 03:25:38.734', '2026-09-10 03:25:38.734', 'organization', NULL),
('e27602ea-4e32-4d34-be4e-bbc91907fc23', 'Daily Issue', '', 'fi:fi-sr-briefcase', 'Y4YX-2QEY', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 03:30:53.589', '2026-09-10 03:30:53.589', 'organization', NULL),
('0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'Website Aeris', 'Implementation theme cosmo shopify', 'fi:fi-sr-globe', 'E8WK-8FZP', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-22 04:08:40.314', '2026-09-22 04:08:40.314', 'organization', NULL);

-- project_members: 20 rows
INSERT INTO project_members (`id`, `project_id`, `user_id`, `role`, `joined_at`, `source`)
VALUES
('1e3886eb-f815-4d47-9736-3ee0caf3ab9b', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'owner', '2026-09-09 17:42:10.557', 'owner'),
('c53fc4dc-4648-497e-be9a-153e724ab029', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'owner', '2026-09-09 17:45:45.145', 'owner'),
('4da46891-c8df-4215-a269-c951fb2ca1af', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', '80526ec8-bda9-4c2e-8c74-d918df6d2e70', 'member', '2026-09-09 17:46:14.177', 'access'),
('b88e1e33-0ab6-443f-9015-43d9bce7eb27', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', '80526ec8-bda9-4c2e-8c74-d918df6d2e70', 'member', '2026-09-09 17:46:27.351', 'access'),
('deea3ce7-2559-4dd6-9a9d-04f9a44c4010', '2803dd76-63c9-46fe-8426-54265ccca680', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'owner', '2026-09-09 18:18:57.153', 'owner'),
('6412401a-e5a6-4360-afb4-e6b30e21a437', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'member', '2026-09-10 03:20:57.442', 'access'),
('33fe5d23-b398-4834-80ce-18a4d55ba7c4', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'owner', '2026-09-10 03:23:17.273', 'owner'),
('35f336e9-c14f-49e2-8153-a191d301fa46', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'owner', '2026-09-10 03:25:39.050', 'owner'),
('7133fcb0-f870-4e1d-9f6e-cd200017c9f8', '4272fcfd-4b16-4617-94b6-c77f182629f1', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'member', '2026-09-10 03:28:14.762', 'access'),
('2ccc7c20-e7e1-422f-beb0-c434f03f0173', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'member', '2026-09-10 03:28:36.797', 'access'),
('32f9c824-a352-4c89-bb88-24c5a8dca7a6', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'owner', '2026-09-10 03:30:53.884', 'owner'),
('e0c576e4-5ff4-46de-b98f-96fe225f6bd5', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'member', '2026-09-10 03:31:43.518', 'access'),
('99f1fc65-543f-42de-b407-7f764a0974fc', '4272fcfd-4b16-4617-94b6-c77f182629f1', '80526ec8-bda9-4c2e-8c74-d918df6d2e70', 'member', '2026-09-10 06:14:17.396', 'access'),
('31c61676-94f4-4c69-9386-e911912358d1', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', '80526ec8-bda9-4c2e-8c74-d918df6d2e70', 'member', '2026-09-10 06:14:29.522', 'access'),
('3d02fd2e-1c11-4da6-a2b2-4d312d75d44c', '2803dd76-63c9-46fe-8426-54265ccca680', '80526ec8-bda9-4c2e-8c74-d918df6d2e70', 'member', '2026-09-10 06:27:37.354', 'access'),
('474c7ce8-2531-43ff-8db2-17f10877d08d', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'member', '2026-09-10 08:30:45.484', 'access'),
('c486f6a7-6669-4b19-bf4e-83b8ae88bdec', '2803dd76-63c9-46fe-8426-54265ccca680', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'member', '2026-09-10 08:30:52.225', 'access'),
('765ab8cd-664a-4124-96eb-e42181415c2f', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', '80526ec8-bda9-4c2e-8c74-d918df6d2e70', 'member', '2026-09-14 03:22:09.760', 'access'),
('35423b0f-b2f7-4b5a-8982-d1e1609984ac', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'owner', '2026-09-22 04:08:41.141', 'owner'),
('0b488cf5-a377-4ccb-be1c-69d0ba5682fe', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'member', '2026-09-23 03:27:45.472', 'invite');

-- project_pins: 2 rows
INSERT INTO project_pins (`id`, `user_id`, `project_id`, `created_at`)
VALUES
('4eecae3e-35ab-42aa-ad14-74667a1c483b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', '2026-09-10 06:52:01.170'),
('ae2e7853-e020-4a48-9dd7-010628e443d2', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', '2026-09-18 10:15:51.640');

-- sprints: 6 rows
INSERT INTO sprints (`id`, `project_id`, `name`, `goal`, `start_date`, `end_date`, `status`)
VALUES
('5a28cac9-7cd8-4caa-8f88-9996e3fe6597', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'Integate API Whatsapp API Business', 'Berhasil mendapatkan api whatsapp dan selesai di intergasikan', '2026-09-11 00:00:00', '2026-09-30 00:00:00', 'active'),
('b0ea0225-da20-49ec-81c8-06cf6c518cd8', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'Mendapatkan API Shopee FTI', 'Mendapatkan API Shopee FTI dan menggu approval', '2026-08-04 00:00:00', '2026-09-04 00:00:00', 'completed'),
('5121fbcc-779b-4fdb-9846-7bf576041007', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'Mendapatkan API Tiktok Tokopedia FTI', 'Mendapatkan API Tiktok Tokopedia FTI dan menggu approval', '2026-08-18 00:00:00', '2026-08-19 00:00:00', 'completed'),
('7dbb1f76-371a-4c3a-9a92-606546e3c393', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'Mendapatkan API Jubelio FTI', 'Mendapatkan API Jubelio FTI dengan open api dari jubelio developer', '2026-08-18 00:00:00', '2026-08-19 00:00:00', 'completed'),
('b6c445e9-6128-4ac2-8984-4287f5177131', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'Quality Assurance', 'Features, Scalability, Functional, Bug, Perfomance, & Security', '2026-09-15 00:00:00', '2026-09-19 00:00:00', 'planning'),
('19b2fd7b-3250-4ba6-8157-287752d63356', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'Deployment Theme Cosmo', 'Harus sudah selesai sebelum production di tanggal 7 Oktober', '2026-09-22 00:00:00', '2026-10-06 00:00:00', 'active');

-- tasks: 21 rows
INSERT INTO tasks (`id`, `project_id`, `sprint_id`, `title`, `description`, `status`, `priority`, `type`, `points`, `rank`, `start_date`, `due_date`, `assignee_id`, `created_at`, `updated_at`, `all_day`)
VALUES
('62061ee2-25a5-4ae5-8350-c74e414c31de', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'b6c445e9-6128-4ac2-8984-4287f5177131', 'Menambahkan fitur scanbarcode', 'Menambahkan fitur scanbarcode di pages baru, untuk kebutuhan final validasi, sebelum akan di kirim', 'done', 'medium', 'task', NULL, 1000, '2026-09-14 17:00:00', '2026-09-15 17:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-16 03:03:18.424', '2026-09-17 03:00:14.523', 1),
('24a8993e-5a85-4118-9516-7f782f3addb7', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', '5a28cac9-7cd8-4caa-8f88-9996e3fe6597', '2nd Meeting Integrasi System AERIS Beaute x Mekari Qontak', '2nd Meeting Integrasi System AERIS Beaute x Mekari Qontak', 'done', 'medium', 'story', NULL, 2000, '2026-09-14 00:00:00', '2026-09-14 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 07:14:50.647', '2026-09-14 08:23:37.004', 1),
('792ac216-d8ed-4ffc-9576-f8182c9abfdc', '2803dd76-63c9-46fe-8426-54265ccca680', NULL, 'UAT Dashboard', 'UAT Dashboard', 'todo', 'medium', 'task', NULL, 1000, '2026-09-22 00:00:00', '2026-09-22 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 06:00:08.930', '2026-09-10 07:33:19.068', 1),
('b541373d-ac06-4905-92e5-704beabf004d', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', NULL, 'Menambahkan fitur template form', 'Menambahkan fitur template form, untuk kebutuhan socialmedia, dan ada fitur barcode yang bisa di ganti dan exp yang di customize', 'done', 'low', 'story', 2, 1000, '2026-09-09 00:00:00', '2026-09-10 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-09 17:56:57.783', '2026-09-09 18:21:57.762', 1),
('f6be42b8-42c6-4bf9-aecc-ecf1471882b2', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'b6c445e9-6128-4ac2-8984-4287f5177131', 'Deploy Hosting with Docker at proxmox server', 'CI/CD Pipeline', 'done', 'urgent', 'task', NULL, 5000, NULL, NULL, 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-21 04:53:35.004', '2026-09-25 03:38:56.665', 1),
('8d055d5e-1108-4999-9883-e17402ec9f7f', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', NULL, 'Input User', '', 'done', 'medium', 'task', NULL, 1000, '2026-09-10 00:00:00', '2026-09-10 00:00:00', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 03:38:05.003', '2026-09-10 03:38:05.003', 1),
('d3aaff34-cd8e-4dca-bee3-5bc761ed9cc4', '4272fcfd-4b16-4617-94b6-c77f182629f1', NULL, 'Adding Feature on Assets Page', 'menambahkan fitur pada bagian aset, jadi didalam aset dibagi menjadi 3 yaitu fixed assets, consumables assets, dan marketing assets', 'done', 'medium', 'task', NULL, 1000, '2026-09-10 00:00:00', '2026-09-10 00:00:00', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 03:33:42.692', '2026-09-10 03:41:41.304', 1),
('aaf8dc82-0e4c-4751-956a-6623c5f1a6bb', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', '5121fbcc-779b-4fdb-9846-7bf576041007', 'Membuat pengajuan ke pihak tiktok tokopedia', 'Membuat pengajuan ke pihak tiktok, dengan NIB Perusahaan', 'done', 'low', 'task', NULL, 2000, '2026-08-18 00:00:00', '2026-08-19 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:22:08.166', '2026-09-10 08:22:29.056', 1),
('a657042d-ab0d-40b2-b5da-355e8a2f15e2', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'b0ea0225-da20-49ec-81c8-06cf6c518cd8', 'Membuat pengajuan ke pihak shopee', 'Membuat pengajuan ke pihak shopee, dengan NIB Perusahaan', 'done', 'low', 'task', NULL, 1000, '2026-08-18 00:00:00', '2026-09-04 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:19:38.546', '2026-09-10 08:23:13.569', 1),
('2be67f83-a899-47ca-8e1e-a824eedf12bb', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', NULL, 'Printer for BOD Room', 'Printer sudah disetup dan siap digunakan', 'done', 'urgent', 'story', NULL, 2000, '2026-09-10 00:00:00', '2026-09-10 00:00:00', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:28:09.403', '2026-09-10 08:28:09.403', 1),
('c3337ab2-3b82-4825-a74c-db2147570945', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', '7dbb1f76-371a-4c3a-9a92-606546e3c393', 'Testing API with token login auth at postman', 'Testing API with token login auth at postman', 'done', 'high', 'task', NULL, 3000, '2026-09-01 00:00:00', '2026-09-02 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:33:18.456', '2026-09-10 08:33:18.456', 1),
('b7482147-0c37-4cf5-8738-9ff03c4a8795', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', NULL, 'Internet issue', 'Pergantian ISP dan mengubah broadband ke dedicate, serta penambahan 2 AP untuk ruangan BOD dan Kak Ica', 'todo', 'urgent', 'task', NULL, 3000, '2026-09-10 00:00:00', '2026-10-06 00:00:00', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:30:37.274', '2026-09-10 08:50:41.824', 1),
('09239cba-1719-4171-bdd4-90faa92976ed', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', '5a28cac9-7cd8-4caa-8f88-9996e3fe6597', 'Meeting management perihal vendor whatsapp api business', 'Presentasi dan menjelaskan dari vendor yang sudah di kumpulkan', 'done', 'medium', 'task', 1, 2000, '2026-09-10 00:00:00', '2026-09-10 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-09 17:50:28.317', '2026-09-10 08:51:31.546', 1),
('b00e8787-d327-4000-8bc6-ab3231963e19', '4272fcfd-4b16-4617-94b6-c77f182629f1', NULL, 'Adding Feature for OB', 'membuat form request dan inbound/outbond untuk OB', 'done', 'medium', 'task', NULL, 2000, '2026-09-10 00:00:00', '2026-09-10 00:00:00', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 03:34:51.461', '2026-09-11 08:25:53.263', 1),
('99b5be78-8773-4ddf-892c-09c2491c3cfe', '4272fcfd-4b16-4617-94b6-c77f182629f1', NULL, 'Revision', 'Marketing product page', 'done', 'medium', 'task', NULL, 3000, '2026-09-14 02:00:00', '2026-09-15 02:00:00', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-15 04:03:48.964', '2026-09-15 04:03:48.964', 0),
('30fbad57-eb28-4254-8884-b6899fc75cd3', '2803dd76-63c9-46fe-8426-54265ccca680', NULL, 'Menambahkan AI Analyze Summary', 'Menambahkan AI Analyze Summary', 'in_progress', 'high', 'task', NULL, 1000, '2026-09-13 17:00:00', '2026-09-14 17:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-14 09:31:57.832', '2026-09-17 09:17:38.201', 1),
('4435d304-2cc2-465c-836f-756be2e00c9f', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', NULL, 'Zoom with AERIS Community', 'Nana dan mikha akan mengadakan zoom online session dengan AERIS Community', 'todo', 'medium', 'story', NULL, 1000, NULL, '2026-09-21 17:00:00', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 04:34:41.021', '2026-09-18 08:38:55.769', 1),
('9cfe5bf7-81ce-41b1-ae15-3ad032c0d9a8', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', NULL, 'Fix, voucher barcode harus berbeda jika customer itu sudah daftar sebelumnya', 'Fix, voucher barcode harus berbeda jika customer itu sudah daftar sebelumnya, dan bisa daftar 2x', 'done', 'low', 'bug', NULL, 1000, '2026-09-14 06:00:00', '2026-09-14 07:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-14 03:03:57.337', '2026-09-16 04:25:11.046', 0),
('a8fecdea-979f-41a1-972f-8fdd68c52d72', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', '19b2fd7b-3250-4ba6-8157-287752d63356', 'Fixing Layout website all pages', 'Fixing Layout website all pages shopify', 'in_progress', 'medium', 'task', NULL, 1000, NULL, NULL, 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-22 13:15:59.137', '2026-09-23 03:28:49.206', 1),
('2b54f328-33bf-4857-87de-ebb82019cfa0', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'b6c445e9-6128-4ac2-8984-4287f5177131', 'Migration databases set to singapore', 'Melakukan migrasi databases ke singapura, untuk mengurangi tingginya latency dari database australia', 'done', 'medium', 'task', NULL, 4000, NULL, NULL, 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-18 10:14:16.334', '2026-09-19 03:44:29.497', 1),
('5670758c-3b10-40bb-a436-dc1d48dc9286', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', NULL, 'Setup CI/CD at Github Action', 'Setup CI/CD at Github Action', 'todo', 'high', 'task', NULL, 2000, '2026-09-11 00:00:00', '2026-09-15 00:00:00', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 07:40:48.768', '2026-09-10 08:57:38.282', 1);

-- task_assignees: 26 rows
INSERT INTO task_assignees (`id`, `task_id`, `user_id`, `created_at`)
VALUES
('2d977f5e-4e33-4c88-a628-a61e8db7d324', '792ac216-d8ed-4ffc-9576-f8182c9abfdc', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:47:41.021'),
('5c996df9-27ce-4f41-9f71-bc4df440e699', 'b541373d-ac06-4905-92e5-704beabf004d', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:47:41.021'),
('028670db-3562-4308-885d-83b534ab57bf', '8d055d5e-1108-4999-9883-e17402ec9f7f', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:47:41.021'),
('7685e950-bfba-49cd-8d8c-e74122f3e602', 'd3aaff34-cd8e-4dca-bee3-5bc761ed9cc4', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:47:41.021'),
('fa976099-f233-4175-903e-09b04ede6fba', 'aaf8dc82-0e4c-4751-956a-6623c5f1a6bb', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:47:41.021'),
('ce7cd081-8574-41eb-873e-b9148c3e5f30', 'a657042d-ab0d-40b2-b5da-355e8a2f15e2', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:47:41.021'),
('002b9645-0918-427b-82e5-9167140a8dfc', '2be67f83-a899-47ca-8e1e-a824eedf12bb', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:47:41.021'),
('735d279a-eedc-4dae-b6b7-b1dba095ea4f', 'c3337ab2-3b82-4825-a74c-db2147570945', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:47:41.021'),
('95693774-87b4-43cf-a7cf-b001876c9ce0', 'b7482147-0c37-4cf5-8738-9ff03c4a8795', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:50:42.539'),
('0f6020c5-86c6-4019-b482-bb3878f46ebb', 'b7482147-0c37-4cf5-8738-9ff03c4a8795', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:50:42.539'),
('251d19e0-a724-4dc1-a087-961a2f84c786', '09239cba-1719-4171-bdd4-90faa92976ed', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:51:32.307'),
('b5be20f1-666b-44a7-8b4b-2edc07c2d344', '09239cba-1719-4171-bdd4-90faa92976ed', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:51:32.307'),
('14a1d424-8db6-45fb-98ad-0576ccb35fdb', '24a8993e-5a85-4118-9516-7f782f3addb7', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:52:15.653'),
('d58c0867-7ae8-4391-b08f-649be7a9a16c', '24a8993e-5a85-4118-9516-7f782f3addb7', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:52:15.653'),
('143628d3-6015-4ea2-82a3-ffb85029faaa', '5670758c-3b10-40bb-a436-dc1d48dc9286', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10 08:57:38.998'),
('cad141f4-f669-49d2-bcf0-1082419fb444', '5670758c-3b10-40bb-a436-dc1d48dc9286', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-10 08:57:38.998'),
('29d9c53e-5664-407a-8ce1-20c51e05ca08', 'b00e8787-d327-4000-8bc6-ab3231963e19', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-11 08:25:55.263'),
('05b3a9cf-308a-41f0-b329-24dfae6f42f2', '9cfe5bf7-81ce-41b1-ae15-3ad032c0d9a8', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-14 04:06:48.008'),
('2838fd59-6fc5-4872-ab46-a684083a2b8f', '30fbad57-eb28-4254-8884-b6899fc75cd3', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-14 09:31:58.952'),
('d811a7c5-58d5-4c71-af64-ad03d9198991', '99b5be78-8773-4ddf-892c-09c2491c3cfe', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-15 04:03:50.180'),
('4d28b29c-2674-4529-974b-3555a8bce011', '62061ee2-25a5-4ae5-8350-c74e414c31de', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-16 03:03:19.052'),
('618f9995-7271-487e-a462-d44d4cd3f938', '4435d304-2cc2-465c-836f-756be2e00c9f', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-18 08:38:57.536'),
('6ab80a42-311f-4cb8-8291-628f06598ccb', '2b54f328-33bf-4857-87de-ebb82019cfa0', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-19 03:44:30.267'),
('977ff887-c8d0-4ae2-aa82-26edccc860f6', 'a8fecdea-979f-41a1-972f-8fdd68c52d72', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-23 03:28:49.947'),
('526a4898-f75c-46f2-89da-978e42acb891', 'a8fecdea-979f-41a1-972f-8fdd68c52d72', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', '2026-09-23 03:28:49.947'),
('820ec962-cb6d-4baf-a8d3-d4641c150a77', 'f6be42b8-42c6-4bf9-aecc-ecf1471882b2', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-25 03:38:57.421');

-- comments: 21 rows
INSERT INTO comments (`id`, `task_id`, `user_id`, `body`, `created_at`)
VALUES
('4360dec8-8012-4373-beaa-e86bbb789ffd', 'b541373d-ac06-4905-92e5-704beabf004d', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah di tambahkan fitur', '2026-09-09 18:06:09.419'),
('ffa57e09-fe68-4a3e-9b79-b2568dbd7726', 'b541373d-ac06-4905-92e5-704beabf004d', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah oke', '2026-09-09 18:21:43.699'),
('eed33968-6285-405d-9c86-bf686b21c281', '09239cba-1719-4171-bdd4-90faa92976ed', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah meeting', '2026-09-10 06:03:41.231'),
('386cbda6-a3a8-4135-bc80-d334bc1d7039', 'c3337ab2-3b82-4825-a74c-db2147570945', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah berhasil testing di postman', '2026-09-10 08:56:13.995'),
('ef2fd6d6-4668-4c9f-b698-f58b5f58e369', '9cfe5bf7-81ce-41b1-ae15-3ad032c0d9a8', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '1. Sudah dapat dari kartu fisik, tetap boleh scan digital Orang yang sudah klaim kartu fisik tidak diblokir di Form Digital. 1 nomor = maksimal 1 kode fisik + 1 kode digital Masing-masing platform cuma 1× Scan digital setelah dapat fisik → dapat kode digital yang sedang aktif, terpisah dari kode kartu Contoh: 0812… sudah AERIS15 dari kartu, lalu scan QR digital → dapat kode digital (mis. DIG20). Keduanya tersimpan.', '2026-09-14 04:07:57.303'),
('f26a0cb9-c353-41f3-b274-9ef4e25fcd7a', '9cfe5bf7-81ce-41b1-ae15-3ad032c0d9a8', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2. Nomor yang sama tidak dapat kode lain selain yang pertama Kode pertama di tiap platform dikunci. Ganti kode di sistem (kartu fisik diganti berkala) tidak mengeluarkan kode baru ke nomor lama. Contoh fisik: Kartu AERIS15 → 0812… daftar → dapat AERIS15 (terkunci) Kode sistem diganti AERIS20 Nomor yang sama daftar /daftar lagi → tetap AERIS15 Nomor baru yang belum pernah fisik → dapat AERIS20 Aturan yang sama untuk digital: ganti kode Form Digital tidak mengubah kode digital yang sudah pernah keluar ke nomor itu.', '2026-09-14 04:08:20.988'),
('b0dc7fb2-7754-4c3d-aacd-1740c29222e8', '24a8993e-5a85-4118-9516-7f782f3addb7', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah selesai meeting', '2026-09-14 08:23:54.039'),
('82878674-6c6b-4a1d-ba1d-397d169fd9ee', '30fbad57-eb28-4254-8884-b6899fc75cd3', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah di update dan sudah naik ke prod', '2026-09-14 11:24:46.739'),
('126fc9b8-f018-493e-8830-99d714c4ad32', '5670758c-3b10-40bb-a436-dc1d48dc9286', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Pripering at server infra for CI/CD', '2026-09-15 03:09:52.764'),
('6e104ff2-a5e7-4dd0-8a39-90f052c81ed8', 'b7482147-0c37-4cf5-8738-9ff03c4a8795', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Ubah config wifi HO menjadi dua opsi, Per Network & Mesh wifi', '2026-09-15 03:11:47.533'),
('db2f1f37-425c-4988-91a5-ec4d6d2f6d42', '62061ee2-25a5-4ae5-8350-c74e414c31de', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Menambahkan fitur alert cancel', '2026-09-16 03:06:46.686'),
('042e9633-a848-4cf8-8831-bdaf747858b6', '62061ee2-25a5-4ae5-8350-c74e414c31de', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah di tambahkan', '2026-09-16 03:26:26.448'),
('eac061d8-258b-4eef-93f8-ac1390464140', '9cfe5bf7-81ce-41b1-ae15-3ad032c0d9a8', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah selesai dan di review', '2026-09-16 04:24:53.938'),
('d1907aca-99b6-49f8-922b-1bcd0813df70', '62061ee2-25a5-4ae5-8350-c74e414c31de', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Tinggal review dari ka nurul', '2026-09-17 07:50:38.180'),
('d58feee6-cc3a-47b4-b0ee-dd7981fe70d8', '2b54f328-33bf-4857-87de-ebb82019cfa0', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'proses migrasi', '2026-09-18 10:15:35.494'),
('8ae04fb9-6876-48c5-b462-e5e965e85b7f', '2b54f328-33bf-4857-87de-ebb82019cfa0', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah di migrasi', '2026-09-19 03:44:16.143'),
('79b2375f-52c6-44a4-92b8-8abafaea58ff', 'f6be42b8-42c6-4bf9-aecc-ecf1471882b2', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'progess deployment setup infra with acion runners', '2026-09-21 04:54:14.987'),
('34d3e85d-9ff3-4899-89b8-8bb3cd012345', 'f6be42b8-42c6-4bf9-aecc-ecf1471882b2', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Testing deploy', '2026-09-21 08:43:46.262'),
('4d8b342c-a98a-4624-93cf-3f9e72a9b5bb', 'f6be42b8-42c6-4bf9-aecc-ecf1471882b2', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'sudah ci/cd docker action github', '2026-09-21 10:19:10.200'),
('0eb1b638-3d60-4738-bfa3-c595af3a81b8', 'a8fecdea-979f-41a1-972f-8fdd68c52d72', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Sudah di tambahkan semua', '2026-09-25 06:44:36.882'),
('fa7a9eb3-7a4d-46be-aad4-16a6b3cbfc43', 'a8fecdea-979f-41a1-972f-8fdd68c52d72', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'Rounded images layout all pages', '2026-09-25 08:01:48.234');

-- attachments: 2 rows
INSERT INTO attachments (`id`, `task_id`, `user_id`, `filename`, `mime_type`, `size`, `stored_name`, `created_at`)
VALUES
('e651456b-a310-4687-80b1-112b27867478', 'b541373d-ac06-4905-92e5-704beabf004d', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '20260910-010524.jpg', 'image/jpeg', 382174, 'b541373d-ac06-4905-92e5-704beabf004d/cb23b4c2-d7ec-47dc-9caa-ebaecac97b44-20260910-010524.jpg', '2026-09-09 18:05:46.522'),
('21e21016-556b-4e97-aa69-b30b8721d417', 'd3aaff34-cd8e-4dca-bee3-5bc761ed9cc4', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'Screenshot 2026-09-10 104013.png', 'image/png', 13097, 'd3aaff34-cd8e-4dca-bee3-5bc761ed9cc4/a5b29bf2-eb6c-4770-9cc4-67820bcacc86-Screenshot_2026-09-10_104013.png', '2026-09-10 03:41:31.359');

-- daily_logs: 6 rows
INSERT INTO daily_logs (`id`, `project_id`, `user_id`, `date`, `yesterday`, `today`, `blockers`, `created_at`, `updated_at`)
VALUES
('6f30db5b-4ce3-41e6-913d-7fef5ecc7c25', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-10', 'Selesai Membuat baru di form template, untuk kebutuhan social media', 'Menunggu jawaban dari mekari kontak perihal payment gateway, intergasi net suite dan bisa export bisa csv atau json file untuk shipping', '', '2026-09-09 18:25:39.055', '2026-09-10 08:17:48.27+'),
('3aa69086-7d85-467b-bc06-9c0f2f76e7fe', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-11', '', 'Fix Issue no internet access at HO', '', '2026-09-11 07:22:47.082', '2026-09-11 07:22:46.984'),
('e7934077-2952-45cd-9f4c-247b80731f7f', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-14', '', 'Fix, voucher barcode harus berbeda jika customer itu sudah daftar sebelumnya', '', '2026-09-14 04:09:41.546', '2026-09-14 04:09:40.854'),
('8dcd8369-2717-498a-94f8-b377cf873972', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-17', 'Membuat scan pages scan validation', 'Improvement performance webapp, use nestjs backend and api Fastify & redis', '', '2026-09-17 09:13:51.369', '2026-09-17 09:13:51.262'),
('a0d8e207-7f3f-4452-9a44-44ddbf949d0a', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-18', '', 'Migration databases supabase from ausie to singapore', '', '2026-09-18 10:15:20.117', '2026-09-18 10:15:19.953'),
('86c36d9f-7b97-48eb-b1ad-59ed837dcde7', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-25', '', 'Rounded image layout all pages', '', '2026-09-25 08:01:07.839', '2026-09-25 08:01:07.68+');

-- activities: 92 rows
INSERT INTO activities (`id`, `project_id`, `user_id`, `message`, `created_at`)
VALUES
('d0d5c86d-18ab-4e12-a42e-687080c0ef2c', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created project Whatsapp Dashboard', '2026-09-09 17:42:10.878'),
('dd50848f-d62f-4b64-96fb-a4e76af067bf', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created project Fulfillment Dashboard', '2026-09-09 17:45:46.680'),
('d8b4c678-7e0b-4c53-9af2-263540d5a8dc', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Integate API Whatsapp API Business', '2026-09-09 17:47:55.496'),
('c3b48632-c9e9-4265-ade0-07b4a39fc932', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Meeting management perihal vendor whatsapp api business"', '2026-09-09 17:50:29.126'),
('4ebeab0f-f1ac-4ed2-a506-6226b20993a5', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Meeting management perihal vendor whatsapp api business"', '2026-09-09 17:52:00.645'),
('c3aeaf69-06c4-43c5-84e2-83c174d5df15', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Menambahkan fitur template form"', '2026-09-09 17:56:58.111'),
('51fe26fc-343b-4f13-9c34-73e285244e94', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Meeting management perihal vendor whatsapp api business"', '2026-09-09 17:58:29.567'),
('28463953-a779-48ab-bd61-8e17fcb5d91f', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Menambahkan fitur template form"', '2026-09-09 18:03:52.958'),
('3a74953c-b4d4-494b-b6e1-5af1b2553f50', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengunggah 20260910-010524.jpg ke "Menambahkan fitur template form"', '2026-09-09 18:05:47.100'),
('317f043c-0f36-4325-9753-aa81cf76c439', '2803dd76-63c9-46fe-8426-54265ccca680', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created project HR Recruitment Dashboard', '2026-09-09 18:18:58.097'),
('f91bb0eb-f590-481d-aa16-dc054e039d21', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-10', '2026-09-09 18:25:39.719'),
('3f581e98-e0a1-4088-a4eb-0575bbf0b33a', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'created project AssetHub Project', '2026-09-10 03:23:17.579'),
('0a980f60-e3a0-45bd-909b-614c7d5ff3d2', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'created project GAssets Project', '2026-09-10 03:25:39.344'),
('27ebdf4f-280f-46d7-9bf7-9973377668df', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'created project Daily Issue', '2026-09-10 03:30:54.203'),
('7a3dcf5f-3d85-4389-838c-b6d73dc6b482', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'added "Adding Feature"', '2026-09-10 03:33:43.004'),
('4e08d69a-b36f-4855-bc4e-2e747c4d0013', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'added "Adding Feature"', '2026-09-10 03:34:51.750'),
('a69c6583-d92d-40b8-82c2-048c60abba74', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'updated "Adding Feature"', '2026-09-10 03:35:19.458'),
('fff3271d-1fc1-43b5-93c1-2578eb7fd26b', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'updated "Adding Feature"', '2026-09-10 03:35:50.289'),
('61f8e0b9-ef78-4ae2-829c-0f9c8293a0ef', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'updated "Adding Feature for OB"', '2026-09-10 03:36:04.436'),
('921b8547-6c0d-46b0-abc3-e8ff119db872', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Meeting management perihal vendor whatsapp api business"', '2026-09-10 03:36:51.613'),
('d9303d36-e26d-413c-9748-41d5a690f000', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Meeting management perihal vendor whatsapp api business"', '2026-09-10 03:37:19.563'),
('dc021239-3c2e-4e98-a61d-cdab03c118c4', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'added "Input User"', '2026-09-10 03:38:05.297'),
('3d44f70a-a66e-41b0-ada5-712cc7d8b169', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'mengunggah Screenshot 2026-09-10 104013.png ke "Input User"', '2026-09-10 03:40:33.728'),
('ec4469df-5897-429d-b5ca-fb81e844d82f', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'mengunggah Screenshot 2026-09-10 104013.png ke "Adding Feature on Assets Page"', '2026-09-10 03:41:31.660'),
('a58ec5d0-bf37-454d-92ba-618c4f3b4ac6', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'updated "Adding Feature on Assets Page"', '2026-09-10 03:41:41.739'),
('6897ecbb-f079-4324-a694-9ca2a29a8c73', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Mendapatkan API Shopee FTI', '2026-09-10 04:03:49.290'),
('3078abe7-b459-4015-b997-e22453c5a04d', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Shopee FTI to active', '2026-09-10 04:04:03.432'),
('7a3ef05e-8909-4a1f-bcb4-dec8f1f69bd3', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Integate API Whatsapp API Business to active', '2026-09-10 04:04:18.471'),
('241bacf8-2943-45f4-a739-fb293ec5ec77', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'added "Zoom with AERIS Community"', '2026-09-10 04:34:41.339'),
('c5f7c421-eac4-4d0f-84ae-47f3c5a3dd4c', '2803dd76-63c9-46fe-8426-54265ccca680', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "UAT Dashboard"', '2026-09-10 06:00:09.245'),
('b9569284-6bcf-47d4-8597-b802030b5af4', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Metting Technical with mekari qontak', '2026-09-10 06:05:48.243'),
('0f19ee98-c037-433d-be06-776f4cdbd9e5', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'deleted sprint Metting Technical with mekari qontak', '2026-09-10 07:13:39.212'),
('33e85d48-d331-4e1f-a3ce-590a1e7b1a56', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "2nd Meeting Integrasi System AERIS Beaute x Mekari Qontak"', '2026-09-10 07:14:51.493'),
('a3643892-11c3-4395-805c-db67cfdcdd63', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "2nd Meeting Integrasi System AERIS Beaute x Mekari Qontak"', '2026-09-10 07:16:01.465'),
('50bb331e-4b95-4f55-8651-f791c1b3b3a4', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "2nd Meeting Integrasi System AERIS Beaute x Mekari Qontak"', '2026-09-10 07:16:32.834'),
('317c68a6-9f74-4ea2-a0d4-79b3e99527c3', '2803dd76-63c9-46fe-8426-54265ccca680', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "UAT Dashboard"', '2026-09-10 07:33:19.466'),
('2ed37fc8-fb77-4992-b7ed-1517a01fb381', '4272fcfd-4b16-4617-94b6-c77f182629f1', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Deploy Hosting with Docker at proxmox server', '2026-09-10 07:34:58.859'),
('4fd89ff6-b59b-4e2e-a616-ec231c5a3ae5', '4272fcfd-4b16-4617-94b6-c77f182629f1', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Setup CI/CD at Github Action"', '2026-09-10 07:36:36.015'),
('f04b9ae7-bd9a-422b-8713-3e1ccd0c7d35', '4272fcfd-4b16-4617-94b6-c77f182629f1', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Deploy Hosting with Docker at proxmox server to active', '2026-09-10 07:36:47.352'),
('028d0c03-7aa6-4d4d-b7ce-59128d929350', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Deploy Hosting with Docker at proxmox server', '2026-09-10 07:38:00.330'),
('d25ca366-f15d-4f0e-a156-8e454b8c082e', '4272fcfd-4b16-4617-94b6-c77f182629f1', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'deleted sprint Deploy Hosting with Docker at proxmox server', '2026-09-10 07:38:28.402'),
('46e6fe8f-9bbb-43c3-b5ac-d336a4df2504', '4272fcfd-4b16-4617-94b6-c77f182629f1', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'deleted "Setup CI/CD at Github Action"', '2026-09-10 07:39:37.481'),
('e5fe9004-8f1b-47cc-ad4b-b80545e378f9', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Setup CI/CD at Github Action"', '2026-09-10 07:40:49.572'),
('bb1849e3-64cb-418e-9389-1b85ae3ff279', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Deploy Hosting with Docker at proxmox server to active', '2026-09-10 07:41:22.705'),
('d5cabcfa-b91b-456b-a7ce-518414fc8bae', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Shopee FTI to completed', '2026-09-10 07:46:44.810'),
('8a883754-7463-4ebf-9f8c-cf0f3ebc1832', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-10', '2026-09-10 08:16:53.343'),
('4eeb8651-977c-496d-ba2f-9f7c5d78ac33', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-10', '2026-09-10 08:17:49.287'),
('38f089a1-b0ab-4dd6-9f74-d38a92487339', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Membuat pengajuan ke pihak shopee"', '2026-09-10 08:19:39.358'),
('0a5d7ba7-93a2-4231-bed4-8f412f9d90fe', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Shopee FTI to active', '2026-09-10 08:19:46.231'),
('3cb24b2e-948d-461f-a403-ec591f819f18', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Shopee FTI to completed', '2026-09-10 08:19:58.829'),
('89886efd-238a-4a83-8515-18aa0a5fdf47', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Mendapatkan API Tiktok Tokopedia FTI', '2026-09-10 08:20:59.401'),
('31d7b78f-c770-4707-a889-1777b994febc', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Tiktok Tokopedia FTI to active', '2026-09-10 08:21:08.312'),
('9a822c1c-5bb5-4e83-81b4-0fbfcca287d8', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Membuat pengajuan ke pihak shopee"', '2026-09-10 08:22:08.478'),
('45e6d057-3209-4821-bed6-9312ecd98639', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Membuat pengajuan ke pihak shopee"', '2026-09-10 08:22:30.033'),
('b6e1d5b7-67b8-4385-b01c-ab8d3113ea4f', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Membuat pengajuan ke pihak shopee"', '2026-09-10 08:23:14.037'),
('07036eea-16cf-4a04-a8cb-b083f08ef9bd', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'added "Printer for BOD Room"', '2026-09-10 08:28:09.704'),
('d51b2771-f66b-496a-9758-0326791fb4eb', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Tiktok Tokopedia FTI to completed', '2026-09-10 08:28:37.026'),
('bb6f0f92-52d8-4ed1-abf4-861dc4e60d5c', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'added "Internet issue"', '2026-09-10 08:30:37.580'),
('8b37bd8c-9bf0-4b35-b876-5bed5ea0eefa', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Mendapatkan API Jubelio FTI', '2026-09-10 08:31:59.665'),
('46208ead-3590-4337-bb45-76f272574f7e', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Jubelio FTI to active', '2026-09-10 08:32:11.781'),
('838625cf-a411-4a23-9bad-41824859d4b8', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Testing API with token login auth at postman"', '2026-09-10 08:33:18.761'),
('7a2d8734-e76e-41cd-a7ca-132cfd3d633b', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Mendapatkan API Jubelio FTI to completed', '2026-09-10 08:33:56.632'),
('c17e26f5-2d0c-4f85-8c07-71be70c9d859', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Internet issue"', '2026-09-10 08:50:43.373'),
('5f918591-955c-4a25-b28f-2a3c74d0f88a', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Meeting management perihal vendor whatsapp api business"', '2026-09-10 08:51:32.616'),
('e18d5610-defb-4359-8368-32a28954cff4', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "2nd Meeting Integrasi System AERIS Beaute x Mekari Qontak"', '2026-09-10 08:52:15.971'),
('6b97a0f1-8bbc-47bc-93f1-9ac404aa4d2f', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Setup CI/CD at Github Action"', '2026-09-10 08:57:39.306'),
('c26f056a-2ef0-4c9b-a4ff-8466da7818b1', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-11', '2026-09-11 07:22:47.393'),
('1428da6d-b79b-495a-8910-4b76c3d88535', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'updated "Adding Feature for OB"', '2026-09-11 08:25:55.576'),
('5eab54e9-c44a-42a8-8b5f-84d21eb243c4', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Fix, voucher barcode harus berbeda jika customer itu sudah daftar sebelumnya"', '2026-09-14 03:03:58.328'),
('3386aba4-6ecb-470b-b1f7-af145a5bdf0f', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Fix, voucher barcode harus berbeda jika customer itu sudah daftar sebelumnya"', '2026-09-14 03:37:05.812'),
('6d792c14-cfbc-4785-9323-ccc741028939', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Fix, voucher barcode harus berbeda jika customer itu sudah daftar sebelumnya"', '2026-09-14 04:06:48.820'),
('07c8f15f-a60d-4389-ad69-323b203079d5', 'a40fddbd-9d51-4fb2-8930-dd17ea51ab91', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-14', '2026-09-14 04:09:42.370'),
('30b63a78-264b-49c7-b0dc-d8882a3e1529', '2803dd76-63c9-46fe-8426-54265ccca680', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Menambahkan AI Analyze Summary"', '2026-09-14 09:31:59.253'),
('e3bcc91d-c29f-4992-a8cf-b32ae7a128cb', '4272fcfd-4b16-4617-94b6-c77f182629f1', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'added "Revision"', '2026-09-15 04:03:50.488'),
('7ed2d338-363f-4299-b5c6-3b717b2915c3', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Quality Assurance', '2026-09-16 02:59:05.865'),
('b36bd964-9ede-4bbe-b10b-09a7bbda41af', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Menambahkan fitur scanbarcode"', '2026-09-16 03:03:19.363'),
('4148abdf-1383-45a8-b648-c0a2e66c633b', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-17', '2026-09-17 09:13:51.676'),
('e535a8ac-9804-4d0a-b8e5-a520f2825f1c', 'e27602ea-4e32-4d34-be4e-bbc91907fc23', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'updated "Zoom with AERIS Community"', '2026-09-18 08:38:57.841'),
('70515107-ac9d-49cf-8e31-1cf75b24c5ed', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Migration databases set to singapore"', '2026-09-18 10:14:17.233'),
('0de3fe5f-cfc9-4f88-ab1b-0605febee54d', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Migration databases set to singapore"', '2026-09-18 10:14:44.384'),
('63440330-ffd0-4d1b-ac4c-4da41dfd9d63', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-18', '2026-09-18 10:15:20.438'),
('8bb2d59b-bddf-4ed3-b689-c9bb690ba107', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Migration databases set to singapore"', '2026-09-19 03:44:30.555'),
('6eaa8dee-6ae3-4d2e-988a-6ad5d9956fb8', '1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'deleted sprint Deploy Hosting with Docker at proxmox server', '2026-09-21 04:52:58.577'),
('54740e85-9f4c-4a3e-b051-30ead3add418', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Deploy Hosting with Docker at proxmox server"', '2026-09-21 04:53:36.498'),
('dc6d5ec9-3968-4e2b-8a35-2f94bb6ac6cf', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created project Website Aeris', '2026-09-22 04:08:41.441'),
('f6ec4ca5-f864-49ff-aa17-38c66caf3026', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'created sprint Deployment Theme Cosmo', '2026-09-22 04:12:51.476'),
('884e358b-ea99-4fc2-b82b-eb103d3d7601', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'changed Deployment Theme Cosmo to active', '2026-09-22 13:14:02.353'),
('d947faa8-c3cc-4249-9df9-551ce7ca8464', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'added "Fixing Layout website all pages"', '2026-09-22 13:16:01.630'),
('0334c125-4022-4720-a9ef-d168d0a43c7c', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', '3b2a9d2a-c91a-4431-9242-3bcf5b9c76be', 'joined the project', '2026-09-23 03:27:45.766'),
('ea1f1bb3-4394-44e5-bd6d-4f140fae8694', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Fixing Layout website all pages"', '2026-09-23 03:28:50.270'),
('56e1bc39-734c-4abe-92f0-d3533f8f4ce6', '8134a361-a2f5-4a1a-a95d-0402daa26bb4', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'updated "Deploy Hosting with Docker at proxmox server"', '2026-09-25 03:38:57.723'),
('d3fa5ba3-5fb3-496f-b694-98094cc0e6ab', '0cf9eeec-a207-4b51-bc5c-6cd5877b4f6b', 'd3d29781-873f-4bbc-8cae-a344f1767c74', 'mengisi daily check 2026-09-25', '2026-09-25 08:01:08.672');

-- project_analyses: 4 rows
INSERT INTO project_analyses (`project_id`, `content`, `model`, `created_by`, `created_at`, `updated_at`)
VALUES
('2803dd76-63c9-46fe-8426-54265ccca680', '{"health":"Proyek masih kecil dengan 2 task terbuka, namun 1 task prioritas tinggi sudah overdue sejak 2026-09-15. Tidak ada daily check-in hari ini, sehingga visibilitas progres dan hambatan rendah. Fokus utama adalah menyelesaikan “Menambahkan AI Analyze Summary” sebelum UAT pada 2026-09-22.","risks":["Task prioritas tinggi “Menambahkan AI Analyze Summary” terlambat dan dapat mengganggu kesiapan UAT Dashboard.","Tidak ada daily check-in hari ini, sehingga risiko blocker tidak terangkat tepat waktu.","UAT Dashboard dijadwalkan hanya 1 hari pada 2026-09-22; jika fitur AI belum stabil, UAT berisiko tertunda."],"blockers":["Tidak ada blocker eksplisit tercatat di snapshot."],"next7days":["Hari ini, Dwiki Arlian Maulana perlu update status dan sisa pekerjaan untuk “Menambahkan AI Analyze Summary”.","Selesaikan implementasi dan lakukan self-test untuk “Menambahkan AI Analyze Summary” paling lambat 2026-09-18.","Siapkan hasil atau catatan validasi fitur AI Analyze Summary sebelum UAT Dashboard.","Pada 2026-09-22, jalankan “UAT Dashboard” sesuai jadwal dan dokumentasikan feedback UAT."],"work":[{"title":"Menambahkan AI Analyze Summary","owner":"Dwiki Arlian Maulana","status":"in_progress","priority":"high","start":"2026-09-14","end":"2026-09-15","action":"Segera tuntaskan pekerjaan yang overdue, konfirmasi sisa scope, lakukan testing, dan siapkan hasilnya agar tidak menghambat UAT Dashboard."},{"title":"UAT Dashboard","owner":"Dwiki Arlian Maulana","status":"todo","priority":"medium","start":"2026-09-22","end":"2026-09-22","action":"Siapkan skenario UAT dan pastikan fitur utama, termasuk AI Analyze Summary, sudah siap divalidasi pada tanggal UAT."}]}', 'free-forever', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-16 04:00:26.231', '2026-09-17 09:23:14.048'),
('a40fddbd-9d51-4fb2-8930-dd17ea51ab91', '{"health":"Project Whatsapp Dashboard terlihat selesai untuk snapshot ini: 4/4 task done, tidak ada open task, tidak ada overdue, dan sprint aktif “Integate API Whatsapp API Business” sudah 2/2 done. Namun tidak ada daily check-in hari ini, sehingga visibilitas progres operasional terbaru masih rendah meskipun board bersih. Fokus berikutnya adalah validasi hasil integrasi, dokumentasi, dan konfirmasi item eksternal yang disebut di daily check sebelumnya.","risks":["Tidak ada daily check-in hari ini dari 3 member, sehingga potensi isu terbaru bisa tidak terdeteksi.","Daily check 2026-09-10 menyebut masih menunggu jawaban dari Mekari terkait payment gateway, integrasi NetSuite, dan export CSV/JSON; ini bisa menjadi risiko lanjutan jika masih relevan tetapi belum tercatat sebagai task.","Perbaikan voucher barcode pada 2026-09-14 perlu dipastikan sudah tervalidasi agar tidak muncul regresi pada customer yang sudah pernah daftar."],"blockers":[],"next7days":["Konfirmasi ke tim apakah integrasi Whatsapp API Business sudah diuji end-to-end dan siap digunakan.","Minta daily check-in dari semua member untuk memastikan tidak ada pekerjaan tersisa di luar board.","Validasi hasil fix voucher barcode untuk customer yang sudah daftar sebelumnya.","Follow up status jawaban Mekari terkait payment gateway, integrasi NetSuite, dan opsi export CSV/JSON jika masih menjadi dependensi proyek.","Rapikan board: tutup sprint aktif bila semua hasil sudah diterima dan terdokumentasi."],"work":[]}', 'free-forever', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-16 03:39:06.747', '2026-09-16 04:25:45.523'),
('8134a361-a2f5-4a1a-a95d-0402daa26bb4', '{"health":"Proyek Fulfillment Dashboard saat ini dalam kondisi cukup baik dengan 3 dari 4 tugas telah selesai. Hanya terdapat 1 tugas terbuka yang berstatus ''todo'' dan jatuh tempo hari ini. Kendala utama adalah ketiadaan daily check-in dari anggota tim yang dapat mengurangi visibilitas perkembangan proyek.","risks":["Tugas yang berbatas waktu hari ini (2026-09-16) belum mulai dikerjakan (masih berstatus todo).","Minimnya pemantauan harian akibat tidak adanya daily check-in dari 3 anggota tim."],"blockers":["Tidak ada blocker teknis yang tercatat, namun pengerjaan tugas belum berjalan."],"next7days":["Dwiki Arlian Maulana segera memulai dan menyelesaikan tugas Menambahkan fitur scanbarcode.","Melakukan Quality Assurance terhadap fitur scanbarcode yang telah diimplementasikan.","Mengaktifkan kembali rutinitas daily check-in bagi seluruh anggota tim."],"work":[{"title":"Menambahkan fitur scanbarcode","owner":"Dwiki Arlian Maulana","status":"todo","priority":"medium","start":"2026-09-15","end":"2026-09-16","action":"Segera mulai pengodean fitur scanbarcode dan lakukan pengujian QA sebelum tenggat waktu berakhir."}]}', 'free-forever', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-16 03:45:18.433', '2026-09-16 03:53:53.406'),
('1d0dba02-8733-40d9-8f5a-fcf9eca78d2f', '{"health":"The AssetHub Project is currently at risk as the single active task in the current sprint is overdue. With zero daily check-ins recorded today from the 3 team members, team momentum and execution visibility are critically low. Immediate alignment is required to complete the high-priority CI/CD setup and finish the active sprint.","risks":["The overdue high-priority task ''Setup CI/CD at Github Action'' directly delays the active sprint ''Deploy Hosting with Docker at proxmox server''.","Zero daily check-ins suggest a lack of progress updates and potential unflagged technical blockers."],"blockers":["The task ''Setup CI/CD at Github Action'' is past its due date (2026-09-15) and has not yet been started (still in ''todo'')."],"next7days":["Hold an immediate sync with Dwiki Arlian Maulana and Leo to clear blockers for the CI/CD pipeline setup.","Update the status and revise the target completion date for ''Setup CI/CD at Github Action''.","Establish mandatory daily check-ins to ensure team accountability and task progress visibility."],"work":[{"title":"Setup CI/CD at Github Action","owner":"Dwiki Arlian Maulana, Leo","status":"todo","priority":"high","start":"2026-09-11","end":"2026-09-15","action":"Immediately begin execution on Github Action workflow setup for Proxmox deployment and update task status."}]}', 'free-forever', 'd3d29781-873f-4bbc-8cae-a344f1767c74', '2026-09-16 04:08:46.335', '2026-09-16 04:08:46.198');

SET FOREIGN_KEY_CHECKS = 1;
