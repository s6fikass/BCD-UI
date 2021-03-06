/*
  Copyright 2010-2017 BusinessCode GmbH, Germany

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
-- Oracle
DROP TABLE bcd_log_page CASCADE CONSTRAINTS;
CREATE TABLE bcd_log_page
(
   LOG_TIME     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
   SESSION_ID   VARCHAR2(64),
   PAGE_HASH    VARCHAR2(64),
   REQUEST_URL  VARCHAR2(4000),
   GUI_STATUS   CLOB
);

-- TeraData
drop table bcd_log_page;
CREATE MULTISET TABLE bcd_log_page
(
   LOG_TIME     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   SESSION_ID   VARCHAR(64),
   PAGE_HASH    VARCHAR(64),
   REQUEST_URL  VARCHAR(4000),
   GUI_STATUS   VARCHAR(27000)
);

-- SQLServer
drop table bcd_log_page;
CREATE TABLE bcd_log_page
(
   LOG_TIME     DATETIME DEFAULT CURRENT_TIMESTAMP,
   SESSION_ID   VARCHAR(64),
   PAGE_HASH    VARCHAR(64),
   REQUEST_URL  VARCHAR(4000),
   GUI_STATUS   NVARCHAR(MAX)
);
-- PostgreSQL
drop table bcd_log_page;
CREATE TABLE bcd_log_page
(
   LOG_TIME     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   SESSION_ID   VARCHAR(64),
   PAGE_HASH    VARCHAR(64),
   REQUEST_URL  VARCHAR(4000),
   GUI_STATUS   VARCHAR(27000)
);
