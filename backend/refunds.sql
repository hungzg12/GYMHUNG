SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
IF OBJECT_ID('dbo.RefundRequests','U') IS NULL
BEGIN
CREATE TABLE dbo.RefundRequests (
 RefundId bigint IDENTITY PRIMARY KEY,
 PaymentId bigint NOT NULL REFERENCES dbo.Payments(PaymentId),
 Amount decimal(19,4) NOT NULL CHECK(Amount>0),
 Reason nvarchar(500) NOT NULL,
 Status varchar(20) NOT NULL DEFAULT 'Pending' CHECK(Status IN ('Pending','Approved','Rejected')),
 RequestedBy bigint NOT NULL REFERENCES dbo.Users(UserId),
 ReviewedBy bigint NULL REFERENCES dbo.Users(UserId),
 CreatedAt datetime2 NOT NULL,
 ReviewedAt datetime2 NULL,
 RequestKey uniqueidentifier NOT NULL UNIQUE
);
END;
IF COL_LENGTH('dbo.RefundRequests','PaidAt') IS NULL
BEGIN
ALTER TABLE dbo.RefundRequests ADD PaidAt datetime2 NULL, PaidBy bigint NULL REFERENCES dbo.Users(UserId), PayoutReference nvarchar(100) NULL;
END;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.RefundRequests') AND name='UX_RefundPayoutReference')
EXEC(N'CREATE UNIQUE INDEX UX_RefundPayoutReference ON dbo.RefundRequests(PayoutReference) WHERE PayoutReference IS NOT NULL');
