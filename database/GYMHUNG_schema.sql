IF DB_ID(N'gymhung_demo') IS NULL CREATE DATABASE [gymhung_demo];
GO
USE [gymhung_demo];
GO
CREATE TABLE [dbo].[AIConversationMessages] (
  [MessageId] [bigint] IDENTITY(1,1) NOT NULL,
  [ConversationId] [bigint] NOT NULL,
  [SenderType] [nvarchar](30) NOT NULL,
  [Message] [nvarchar](MAX) NOT NULL,
  [ContextData] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[AIConversations] (
  [ConversationId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [ConversationTitle] [nvarchar](300) NULL,
  [ContextData] [nvarchar](MAX) NULL,
  [StartedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active')
);
GO
CREATE TABLE [dbo].[AIRecommendations] (
  [RecommendationId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [RecommendationType] [nvarchar](100) NOT NULL,
  [Content] [nvarchar](MAX) NOT NULL,
  [ReferenceData] [nvarchar](MAX) NULL,
  [IsRead] [bit] NOT NULL DEFAULT ((0)),
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Attendance] (
  [AttendanceId] [bigint] IDENTITY(1,1) NOT NULL,
  [BookingId] [bigint] NOT NULL,
  [CheckInTime] [datetime2](0) NULL,
  [CheckOutTime] [datetime2](0) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Present'),
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[AuditLogs] (
  [AuditLogId] [bigint] IDENTITY(1,1) NOT NULL,
  [UserId] [bigint] NULL,
  [Action] [nvarchar](100) NOT NULL,
  [EntityName] [nvarchar](200) NULL,
  [EntityId] [bigint] NULL,
  [OldData] [nvarchar](MAX) NULL,
  [NewData] [nvarchar](MAX) NULL,
  [IPAddress] [nvarchar](100) NULL,
  [UserAgent] [nvarchar](1000) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Bookings] (
  [BookingId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [WorkoutScheduleId] [bigint] NOT NULL,
  [BookingTime] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Confirmed'),
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[CheckIns] (
  [CheckInId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [CheckInTime] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [CheckOutTime] [datetime2](0) NULL,
  [Method] [nvarchar](50) NULL,
  [SourceDevice] [nvarchar](200) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'CheckedIn'),
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[ChurnPredictions] (
  [ChurnPredictionId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [PredictionDate] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [RiskScore] [decimal](8,4) NULL,
  [RiskLevel] [nvarchar](50) NULL,
  [Factors] [nvarchar](MAX) NULL,
  [RecommendedActions] [nvarchar](MAX) NULL,
  [ModelVersion] [nvarchar](100) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[EmergencyContacts] (
  [ContactId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [FullName] [nvarchar](150) NOT NULL,
  [Phone] [nvarchar](30) NOT NULL,
  [Relationship] [nvarchar](100) NULL,
  [Notes] [nvarchar](500) NULL
);
GO
CREATE TABLE [dbo].[Equipment] (
  [EquipmentId] [bigint] IDENTITY(1,1) NOT NULL,
  [CategoryId] [bigint] NULL,
  [EquipmentName] [nvarchar](200) NOT NULL,
  [Brand] [nvarchar](200) NULL,
  [SerialNumber] [nvarchar](200) NULL,
  [Location] [nvarchar](500) NULL,
  [PurchaseDate] [date] NULL,
  [Status] [nvarchar](50) NOT NULL DEFAULT (N'Active'),
  [Notes] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[EquipmentCategories] (
  [CategoryId] [bigint] IDENTITY(1,1) NOT NULL,
  [CategoryName] [nvarchar](200) NOT NULL,
  [Description] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Exercises] (
  [ExerciseId] [bigint] IDENTITY(1,1) NOT NULL,
  [ExerciseName] [nvarchar](200) NOT NULL,
  [MuscleGroup] [nvarchar](200) NULL,
  [Description] [nvarchar](MAX) NULL,
  [Instructions] [nvarchar](MAX) NULL,
  [VideoUrl] [nvarchar](1000) NULL,
  [ImageUrl] [nvarchar](1000) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[MaintenanceRecords] (
  [MaintenanceId] [bigint] IDENTITY(1,1) NOT NULL,
  [EquipmentId] [bigint] NOT NULL,
  [StaffId] [bigint] NULL,
  [MaintenanceDate] [date] NOT NULL,
  [MaintenanceType] [nvarchar](200) NULL,
  [Description] [nvarchar](MAX) NULL,
  [Cost] [decimal](19,4) NULL,
  [Status] [nvarchar](50) NOT NULL DEFAULT (N'Completed'),
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[MemberPackages] (
  [MemberPackageId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [PackageId] [bigint] NOT NULL,
  [StartDate] [date] NOT NULL,
  [EndDate] [date] NULL,
  [Price] [decimal](19,4) NOT NULL DEFAULT ((0)),
  [RemainingSessions] [int] NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [Notes] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[Members] (
  [MemberId] [bigint] IDENTITY(1,1) NOT NULL,
  [UserId] [bigint] NOT NULL,
  [Height] [decimal](6,2) NULL,
  [Weight] [decimal](6,2) NULL,
  [Goal] [nvarchar](500) NULL,
  [FitnessLevel] [nvarchar](100) NULL,
  [Address] [nvarchar](500) NULL,
  [JoinDate] [date] NOT NULL DEFAULT (CONVERT([date],getdate())),
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [Notes] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[MemberTrainers] (
  [MemberTrainerId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [TrainerId] [bigint] NOT NULL,
  [StartDate] [date] NULL,
  [EndDate] [date] NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Notifications] (
  [NotificationId] [bigint] IDENTITY(1,1) NOT NULL,
  [UserId] [bigint] NOT NULL,
  [Title] [nvarchar](300) NOT NULL,
  [Message] [nvarchar](MAX) NOT NULL,
  [NotificationType] [nvarchar](100) NULL,
  [IsRead] [bit] NOT NULL DEFAULT ((0)),
  [SentAt] [datetime2](0) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Packages] (
  [PackageId] [bigint] IDENTITY(1,1) NOT NULL,
  [PackageName] [nvarchar](150) NOT NULL,
  [Description] [nvarchar](MAX) NULL,
  [DurationDays] [int] NULL,
  [TotalSessions] [int] NULL,
  [Price] [decimal](19,4) NOT NULL DEFAULT ((0)),
  [Benefits] [nvarchar](MAX) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[Payments] (
  [PaymentId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberPackageId] [bigint] NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [Amount] [decimal](19,4) NOT NULL,
  [PaymentMethod] [nvarchar](50) NULL,
  [TransactionCode] [nvarchar](200) NULL,
  [PaidAt] [datetime2](0) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Pending'),
  [Provider] [nvarchar](100) NULL,
  [Notes] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[PaymentTransactions] (
  [PaymentTransactionId] [bigint] IDENTITY(1,1) NOT NULL,
  [PaymentId] [bigint] NOT NULL,
  [Provider] [nvarchar](100) NOT NULL,
  [TransactionCode] [nvarchar](200) NULL,
  [RequestData] [nvarchar](MAX) NULL,
  [ResponseData] [nvarchar](MAX) NULL,
  [Amount] [decimal](19,4) NULL,
  [TransactionStatus] [nvarchar](50) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Permissions] (
  [PermissionId] [bigint] IDENTITY(1,1) NOT NULL,
  [PermissionCode] [nvarchar](100) NOT NULL,
  [PermissionName] [nvarchar](200) NOT NULL,
  [Description] [nvarchar](500) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Progress] (
  [ProgressId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [RecordDate] [date] NOT NULL,
  [BodyFat] [decimal](6,2) NULL,
  [Weight] [decimal](8,2) NULL,
  [MuscleMass] [decimal](8,2) NULL,
  [Chest] [decimal](8,2) NULL,
  [Waist] [decimal](8,2) NULL,
  [Hip] [decimal](8,2) NULL,
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[RolePermissions] (
  [RoleId] [bigint] NOT NULL,
  [PermissionId] [bigint] NOT NULL,
  [AssignedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Roles] (
  [RoleId] [bigint] IDENTITY(1,1) NOT NULL,
  [RoleName] [nvarchar](50) NOT NULL,
  [Description] [nvarchar](500) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Rooms] (
  [RoomId] [bigint] IDENTITY(1,1) NOT NULL,
  [RoomName] [nvarchar](150) NOT NULL,
  [Location] [nvarchar](500) NULL,
  [Capacity] [int] NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [Description] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[Staffs] (
  [StaffId] [bigint] IDENTITY(1,1) NOT NULL,
  [UserId] [bigint] NOT NULL,
  [Position] [nvarchar](100) NULL,
  [HireDate] [date] NULL,
  [Notes] [nvarchar](MAX) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[Trainers] (
  [TrainerId] [bigint] IDENTITY(1,1) NOT NULL,
  [UserId] [bigint] NOT NULL,
  [Specialization] [nvarchar](500) NULL,
  [ExperienceYears] [int] NULL,
  [Bio] [nvarchar](MAX) NULL,
  [Certificate] [nvarchar](1000) NULL,
  [Rating] [decimal](4,2) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[TrainerSchedules] (
  [TrainerScheduleId] [bigint] IDENTITY(1,1) NOT NULL,
  [TrainerId] [bigint] NOT NULL,
  [WorkDate] [date] NOT NULL,
  [StartTime] [time](7) NOT NULL,
  [EndTime] [time](7) NOT NULL,
  [IsAvailable] [bit] NOT NULL DEFAULT ((1)),
  [Note] [nvarchar](500) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[UserRoles] (
  [UserId] [bigint] NOT NULL,
  [RoleId] [bigint] NOT NULL,
  [AssignedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[Users] (
  [UserId] [bigint] IDENTITY(1,1) NOT NULL,
  [Username] [nvarchar](100) NOT NULL,
  [Email] [nvarchar](255) NOT NULL,
  [PasswordHash] [nvarchar](500) NOT NULL,
  [FullName] [nvarchar](150) NOT NULL,
  [Phone] [nvarchar](30) NULL,
  [AvatarUrl] [nvarchar](1000) NULL,
  [Gender] [nvarchar](30) NULL,
  [DateOfBirth] [date] NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [LastLoginAt] [datetime2](0) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[WorkoutPlanDetails] (
  [PlanDetailId] [bigint] IDENTITY(1,1) NOT NULL,
  [PlanId] [bigint] NOT NULL,
  [ExerciseId] [bigint] NOT NULL,
  [Sets] [int] NULL,
  [Reps] [int] NULL,
  [Weight] [decimal](10,2) NULL,
  [RestTime] [int] NULL,
  [OrderNo] [int] NULL,
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[WorkoutPlans] (
  [PlanId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [TrainerId] [bigint] NULL,
  [PlanName] [nvarchar](200) NOT NULL,
  [Goal] [nvarchar](500) NULL,
  [StartDate] [date] NULL,
  [EndDate] [date] NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Active'),
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
CREATE TABLE [dbo].[WorkoutResults] (
  [ResultId] [bigint] IDENTITY(1,1) NOT NULL,
  [MemberId] [bigint] NOT NULL,
  [ExerciseId] [bigint] NOT NULL,
  [PlanId] [bigint] NULL,
  [WorkoutDate] [date] NOT NULL,
  [Sets] [int] NULL,
  [Reps] [int] NULL,
  [Weight] [decimal](10,2) NULL,
  [DurationMinutes] [int] NULL,
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime())
);
GO
CREATE TABLE [dbo].[WorkoutSchedules] (
  [WorkoutScheduleId] [bigint] IDENTITY(1,1) NOT NULL,
  [TrainerId] [bigint] NOT NULL,
  [RoomId] [bigint] NULL,
  [PlanId] [bigint] NULL,
  [Title] [nvarchar](200) NULL,
  [ScheduleDate] [date] NOT NULL,
  [StartTime] [time](7) NOT NULL,
  [EndTime] [time](7) NOT NULL,
  [Capacity] [int] NULL,
  [CurrentParticipants] [int] NOT NULL DEFAULT ((0)),
  [Location] [nvarchar](500) NULL,
  [Status] [nvarchar](30) NOT NULL DEFAULT (N'Available'),
  [Note] [nvarchar](MAX) NULL,
  [CreatedAt] [datetime2](0) NOT NULL DEFAULT (sysdatetime()),
  [UpdatedAt] [datetime2](0) NULL
);
GO
ALTER TABLE [dbo].[AIConversationMessages] ADD CONSTRAINT [PK__AIConver__C87C0C9CF7445042] PRIMARY KEY ([MessageId]);
GO
ALTER TABLE [dbo].[AIConversations] ADD CONSTRAINT [PK__AIConver__C050D8777C972314] PRIMARY KEY ([ConversationId]);
GO
ALTER TABLE [dbo].[AIRecommendations] ADD CONSTRAINT [PK__AIRecomm__AA15BEE4F1B2C9DB] PRIMARY KEY ([RecommendationId]);
GO
ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [PK__Attendan__8B69261C25B7AA23] PRIMARY KEY ([AttendanceId]);
GO
ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [UQ__Attendan__73951AECDBC6C95F] UNIQUE ([BookingId]);
GO
ALTER TABLE [dbo].[AuditLogs] ADD CONSTRAINT [PK__AuditLog__EB5F6CBD4777F8E3] PRIMARY KEY ([AuditLogId]);
GO
ALTER TABLE [dbo].[Bookings] ADD CONSTRAINT [PK__Bookings__73951AED6F536D09] PRIMARY KEY ([BookingId]);
GO
ALTER TABLE [dbo].[CheckIns] ADD CONSTRAINT [PK__CheckIns__E649768488F5BE4F] PRIMARY KEY ([CheckInId]);
GO
ALTER TABLE [dbo].[ChurnPredictions] ADD CONSTRAINT [PK__ChurnPre__DBC03384EC1BC227] PRIMARY KEY ([ChurnPredictionId]);
GO
ALTER TABLE [dbo].[EmergencyContacts] ADD CONSTRAINT [PK__Emergenc__5C66259B42135DE0] PRIMARY KEY ([ContactId]);
GO
ALTER TABLE [dbo].[Equipment] ADD CONSTRAINT [PK__Equipmen__34474479564AA0D3] PRIMARY KEY ([EquipmentId]);
GO
ALTER TABLE [dbo].[EquipmentCategories] ADD CONSTRAINT [PK__Equipmen__19093A0B07D0C393] PRIMARY KEY ([CategoryId]);
GO
ALTER TABLE [dbo].[Exercises] ADD CONSTRAINT [PK__Exercise__A074AD2F3B0BE323] PRIMARY KEY ([ExerciseId]);
GO
ALTER TABLE [dbo].[MaintenanceRecords] ADD CONSTRAINT [PK__Maintena__E60542D5E8B06D02] PRIMARY KEY ([MaintenanceId]);
GO
ALTER TABLE [dbo].[MemberPackages] ADD CONSTRAINT [PK__MemberPa__0CF8CBE8A4315B85] PRIMARY KEY ([MemberPackageId]);
GO
ALTER TABLE [dbo].[Members] ADD CONSTRAINT [PK__Members__0CF04B189EA17840] PRIMARY KEY ([MemberId]);
GO
ALTER TABLE [dbo].[Members] ADD CONSTRAINT [UQ__Members__1788CC4D1795FE41] UNIQUE ([UserId]);
GO
ALTER TABLE [dbo].[MemberTrainers] ADD CONSTRAINT [PK__MemberTr__647FA7FD091D8CA5] PRIMARY KEY ([MemberTrainerId]);
GO
ALTER TABLE [dbo].[Notifications] ADD CONSTRAINT [PK__Notifica__20CF2E128FF3BC15] PRIMARY KEY ([NotificationId]);
GO
ALTER TABLE [dbo].[Packages] ADD CONSTRAINT [PK__Packages__322035CC0FBE7F0F] PRIMARY KEY ([PackageId]);
GO
ALTER TABLE [dbo].[Payments] ADD CONSTRAINT [PK__Payments__9B556A389EA91784] PRIMARY KEY ([PaymentId]);
GO
ALTER TABLE [dbo].[PaymentTransactions] ADD CONSTRAINT [PK__PaymentT__C22AEFE01FF220ED] PRIMARY KEY ([PaymentTransactionId]);
GO
ALTER TABLE [dbo].[Permissions] ADD CONSTRAINT [PK__Permissi__EFA6FB2F03A1498D] PRIMARY KEY ([PermissionId]);
GO
ALTER TABLE [dbo].[Permissions] ADD CONSTRAINT [UQ__Permissi__91FE57501ED0528B] UNIQUE ([PermissionCode]);
GO
ALTER TABLE [dbo].[Progress] ADD CONSTRAINT [PK__Progress__BAE29CA50DE33EEB] PRIMARY KEY ([ProgressId]);
GO
ALTER TABLE [dbo].[RolePermissions] ADD CONSTRAINT [PK__RolePerm__6400A1A88CDF4BCB] PRIMARY KEY ([RoleId],[PermissionId]);
GO
ALTER TABLE [dbo].[Roles] ADD CONSTRAINT [PK__Roles__8AFACE1AD24B8561] PRIMARY KEY ([RoleId]);
GO
ALTER TABLE [dbo].[Roles] ADD CONSTRAINT [UQ__Roles__8A2B6160B5B88847] UNIQUE ([RoleName]);
GO
ALTER TABLE [dbo].[Rooms] ADD CONSTRAINT [PK__Rooms__32863939706A57DD] PRIMARY KEY ([RoomId]);
GO
ALTER TABLE [dbo].[Staffs] ADD CONSTRAINT [PK__Staffs__96D4AB17E5E84ED6] PRIMARY KEY ([StaffId]);
GO
ALTER TABLE [dbo].[Staffs] ADD CONSTRAINT [UQ__Staffs__1788CC4DDBE1F9ED] UNIQUE ([UserId]);
GO
ALTER TABLE [dbo].[Trainers] ADD CONSTRAINT [PK__Trainers__366A1A7CCD19F605] PRIMARY KEY ([TrainerId]);
GO
ALTER TABLE [dbo].[Trainers] ADD CONSTRAINT [UQ__Trainers__1788CC4DC3EA9865] UNIQUE ([UserId]);
GO
ALTER TABLE [dbo].[TrainerSchedules] ADD CONSTRAINT [PK__TrainerS__E9AEB9C6DB1C61C4] PRIMARY KEY ([TrainerScheduleId]);
GO
ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [PK__UserRole__AF2760AD9D5C8B06] PRIMARY KEY ([UserId],[RoleId]);
GO
ALTER TABLE [dbo].[Users] ADD CONSTRAINT [PK__Users__1788CC4CBF8E4C29] PRIMARY KEY ([UserId]);
GO
ALTER TABLE [dbo].[Users] ADD CONSTRAINT [UQ__Users__536C85E491CE5D32] UNIQUE ([Username]);
GO
ALTER TABLE [dbo].[Users] ADD CONSTRAINT [UQ__Users__A9D10534B4D35993] UNIQUE ([Email]);
GO
ALTER TABLE [dbo].[WorkoutPlanDetails] ADD CONSTRAINT [PK__WorkoutP__B7E7452D3F4B034A] PRIMARY KEY ([PlanDetailId]);
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD CONSTRAINT [PK__WorkoutP__755C22B7A41BAB9E] PRIMARY KEY ([PlanId]);
GO
ALTER TABLE [dbo].[WorkoutResults] ADD CONSTRAINT [PK__WorkoutR__9769020845D0CD1C] PRIMARY KEY ([ResultId]);
GO
ALTER TABLE [dbo].[WorkoutSchedules] ADD CONSTRAINT [PK__WorkoutS__5C5C8F92CDDA611E] PRIMARY KEY ([WorkoutScheduleId]);
GO
ALTER TABLE [dbo].[PaymentTransactions] ADD CONSTRAINT [FK_PaymentTransactions_Payments] FOREIGN KEY ([PaymentId]) REFERENCES [dbo].[Payments] ([PaymentId]);
GO
ALTER TABLE [dbo].[WorkoutSchedules] ADD CONSTRAINT [FK_WorkoutSchedules_Rooms] FOREIGN KEY ([RoomId]) REFERENCES [dbo].[Rooms] ([RoomId]);
GO
ALTER TABLE [dbo].[Bookings] ADD CONSTRAINT [FK_Bookings_WorkoutSchedules] FOREIGN KEY ([WorkoutScheduleId]) REFERENCES [dbo].[WorkoutSchedules] ([WorkoutScheduleId]);
GO
ALTER TABLE [dbo].[Attendance] ADD CONSTRAINT [FK_Attendance_Bookings] FOREIGN KEY ([BookingId]) REFERENCES [dbo].[Bookings] ([BookingId]);
GO
ALTER TABLE [dbo].[WorkoutPlanDetails] ADD CONSTRAINT [FK_WorkoutPlanDetails_Exercises] FOREIGN KEY ([ExerciseId]) REFERENCES [dbo].[Exercises] ([ExerciseId]);
GO
ALTER TABLE [dbo].[WorkoutResults] ADD CONSTRAINT [FK_WorkoutResults_Exercises] FOREIGN KEY ([ExerciseId]) REFERENCES [dbo].[Exercises] ([ExerciseId]);
GO
ALTER TABLE [dbo].[WorkoutPlanDetails] ADD CONSTRAINT [FK_WorkoutPlanDetails_Plans] FOREIGN KEY ([PlanId]) REFERENCES [dbo].[WorkoutPlans] ([PlanId]);
GO
ALTER TABLE [dbo].[WorkoutResults] ADD CONSTRAINT [FK_WorkoutResults_Plans] FOREIGN KEY ([PlanId]) REFERENCES [dbo].[WorkoutPlans] ([PlanId]);
GO
ALTER TABLE [dbo].[WorkoutSchedules] ADD CONSTRAINT [FK_WorkoutSchedules_Plans] FOREIGN KEY ([PlanId]) REFERENCES [dbo].[WorkoutPlans] ([PlanId]);
GO
ALTER TABLE [dbo].[Equipment] ADD CONSTRAINT [FK_Equipment_Categories] FOREIGN KEY ([CategoryId]) REFERENCES [dbo].[EquipmentCategories] ([CategoryId]);
GO
ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Roles] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles] ([RoleId]);
GO
ALTER TABLE [dbo].[RolePermissions] ADD CONSTRAINT [FK_RolePermissions_Roles] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles] ([RoleId]);
GO
ALTER TABLE [dbo].[MaintenanceRecords] ADD CONSTRAINT [FK_Maintenance_Equipment] FOREIGN KEY ([EquipmentId]) REFERENCES [dbo].[Equipment] ([EquipmentId]);
GO
ALTER TABLE [dbo].[RolePermissions] ADD CONSTRAINT [FK_RolePermissions_Permissions] FOREIGN KEY ([PermissionId]) REFERENCES [dbo].[Permissions] ([PermissionId]);
GO
ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
GO
ALTER TABLE [dbo].[Notifications] ADD CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
GO
ALTER TABLE [dbo].[Members] ADD CONSTRAINT [FK_Members_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
GO
ALTER TABLE [dbo].[Trainers] ADD CONSTRAINT [FK_Trainers_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
GO
ALTER TABLE [dbo].[AuditLogs] ADD CONSTRAINT [FK_AuditLogs_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
GO
ALTER TABLE [dbo].[Staffs] ADD CONSTRAINT [FK_Staffs_Users] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([UserId]);
GO
ALTER TABLE [dbo].[AIConversationMessages] ADD CONSTRAINT [FK_AIConversationMessages_Conversations] FOREIGN KEY ([ConversationId]) REFERENCES [dbo].[AIConversations] ([ConversationId]);
GO
ALTER TABLE [dbo].[MemberPackages] ADD CONSTRAINT [FK_MemberPackages_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[Payments] ADD CONSTRAINT [FK_Payments_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[Bookings] ADD CONSTRAINT [FK_Bookings_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[CheckIns] ADD CONSTRAINT [FK_CheckIns_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD CONSTRAINT [FK_WorkoutPlans_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[WorkoutResults] ADD CONSTRAINT [FK_WorkoutResults_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[Progress] ADD CONSTRAINT [FK_Progress_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[AIConversations] ADD CONSTRAINT [FK_AIConversations_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[AIRecommendations] ADD CONSTRAINT [FK_AIRecommendations_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[EmergencyContacts] ADD CONSTRAINT [FK_EmergencyContacts_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[ChurnPredictions] ADD CONSTRAINT [FK_ChurnPredictions_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[MemberTrainers] ADD CONSTRAINT [FK_MemberTrainers_Members] FOREIGN KEY ([MemberId]) REFERENCES [dbo].[Members] ([MemberId]);
GO
ALTER TABLE [dbo].[TrainerSchedules] ADD CONSTRAINT [FK_TrainerSchedules_Trainers] FOREIGN KEY ([TrainerId]) REFERENCES [dbo].[Trainers] ([TrainerId]);
GO
ALTER TABLE [dbo].[WorkoutSchedules] ADD CONSTRAINT [FK_WorkoutSchedules_Trainers] FOREIGN KEY ([TrainerId]) REFERENCES [dbo].[Trainers] ([TrainerId]);
GO
ALTER TABLE [dbo].[WorkoutPlans] ADD CONSTRAINT [FK_WorkoutPlans_Trainers] FOREIGN KEY ([TrainerId]) REFERENCES [dbo].[Trainers] ([TrainerId]);
GO
ALTER TABLE [dbo].[MemberTrainers] ADD CONSTRAINT [FK_MemberTrainers_Trainers] FOREIGN KEY ([TrainerId]) REFERENCES [dbo].[Trainers] ([TrainerId]);
GO
ALTER TABLE [dbo].[MaintenanceRecords] ADD CONSTRAINT [FK_Maintenance_Staffs] FOREIGN KEY ([StaffId]) REFERENCES [dbo].[Staffs] ([StaffId]);
GO
ALTER TABLE [dbo].[MemberPackages] ADD CONSTRAINT [FK_MemberPackages_Packages] FOREIGN KEY ([PackageId]) REFERENCES [dbo].[Packages] ([PackageId]);
GO
ALTER TABLE [dbo].[Payments] ADD CONSTRAINT [FK_Payments_MemberPackages] FOREIGN KEY ([MemberPackageId]) REFERENCES [dbo].[MemberPackages] ([MemberPackageId]);
GO
