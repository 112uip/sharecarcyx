-- 为 cars 表添加 座位数、每小时价格、品牌、类型 字段并初始化全部车辆数据
USE car_share;

-- 1. 添加新列（若已存在报错可忽略）
ALTER TABLE cars ADD COLUMN seats INT NOT NULL DEFAULT 5 COMMENT '座位数';
ALTER TABLE cars ADD COLUMN price_per_hour INT NOT NULL DEFAULT 35 COMMENT '每小时价格(元)';
ALTER TABLE cars ADD COLUMN brand VARCHAR(64) NULL COMMENT '品牌';
ALTER TABLE cars ADD COLUMN type VARCHAR(64) NULL COMMENT '类型';

-- 2. 写入全部 19 辆车数据（已存在的会被 UPDATE，不存在的会被 INSERT）
INSERT INTO cars (id, model, plate, battery, location, status, seats, price_per_hour, brand, type)
VALUES
  ('CAR-001','BYD Dolphin','粤A12345',81,'南山科技园','available',5,35,'比亚迪','小型纯电轿车'),
  ('CAR-002','Tesla Model 3','粤B22334',63,'福田中心区','available',5,55,'特斯拉','中型纯电轿车'),
  ('CAR-003','AION Y','粤C33445',48,'罗湖口岸','maintenance',5,40,'埃安','紧凑型纯电SUV'),
  ('CAR-004','NIO ET5','粤D44556',75,'宝安中心','available',5,65,'蔚来','中型纯电轿车'),
  ('CAR-005','Xpeng P7','粤E55667',92,'龙岗万达广场','available',5,50,'小鹏','中型纯电轿车'),
  ('CAR-006','Li Auto L8','粤F66778',68,'福田CBD','available',6,80,'理想','中大型增程SUV'),
  ('CAR-007','Maybach S-Class','粤G77889',85,'南山万象城','available',4,200,'奔驰','大型豪华轿车'),
  ('CAR-008','Xiaomi SU7','粤H88990',95,'前海深港合作区','available',5,60,'小米','中大型纯电轿车'),
  ('CAR-009','Porsche Taycan','粤J99001',78,'华侨城','available',4,180,'保时捷','中大型纯电轿跑'),
  ('CAR-010','Hongguang Mini EV','粤K00112',72,'龙华壹方城','available',4,15,'五菱','超小型纯电轿车'),
  ('CAR-011','Ora Good Cat','粤L01223',88,'南山海岸城','available',5,30,'欧拉','小型纯电轿车'),
  ('CAR-012','BYD Seal','粤M02334',91,'福田cocopark','available',5,50,'比亚迪','中型纯电轿车'),
  ('CAR-013','Tesla Model Y','粤N03445',82,'罗湖万象城','available',5,65,'特斯拉','中型纯电SUV'),
  ('CAR-014','BMW iX3','粤P04556',77,'南山万象天地','available',5,70,'宝马','中型纯电SUV'),
  ('CAR-015','Mercedes EQS','粤Q05667',93,'福田香格里拉','available',5,150,'奔驰','大型纯电轿车'),
  ('CAR-016','Audi e-tron GT','粤R06778',86,'华侨城洲际酒店','available',4,160,'奥迪','中大型纯电轿跑'),
  ('CAR-017','NIO ES8','粤S07889',79,'深圳湾体育中心','available',6,90,'蔚来','中大型纯电SUV'),
  ('CAR-018','Zeekr 001','粤T08990',90,'宝安壹方城','available',5,75,'极氪','中大型纯电猎装轿跑'),
  ('CAR-019','Li Auto L9','粤U09001',83,'南山欢乐海岸','available',6,120,'理想','大型增程SUV')
ON DUPLICATE KEY UPDATE
  model = VALUES(model), plate = VALUES(plate), battery = VALUES(battery),
  location = VALUES(location), status = VALUES(status),
  seats = VALUES(seats), price_per_hour = VALUES(price_per_hour),
  brand = VALUES(brand), type = VALUES(type);
