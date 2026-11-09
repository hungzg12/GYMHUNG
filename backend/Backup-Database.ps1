param([string]$Server = '.\SQLEXPRESS')
$ErrorActionPreference = 'Stop'
$query = @'
DECLARE @file nvarchar(4000)=CONVERT(nvarchar(4000),SERVERPROPERTY('InstanceDefaultBackupPath'))+N'\gymhung_demo_'+REPLACE(REPLACE(CONVERT(nvarchar(19),GETDATE(),126),':',''),'-','')+N'.bak';
BACKUP DATABASE [gymhung_demo] TO DISK=@file WITH COPY_ONLY,CHECKSUM;
RESTORE VERIFYONLY FROM DISK=@file WITH CHECKSUM;
PRINT @file;
'@
& sqlcmd -S $Server -E -C -b -Q $query
if ($LASTEXITCODE -ne 0) { throw 'Database backup or verification failed.' }
