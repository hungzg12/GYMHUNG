using System;
using System.Collections.Generic;
using GymManagement.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace GymManagement.Api.Data;

public partial class GymDbContext : DbContext
{
    public GymDbContext(DbContextOptions<GymDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AIConversation> AIConversations
    {
        get; set;
    }

    public virtual DbSet<AIConversationMessage> AIConversationMessages
    {
        get; set;
    }

    public virtual DbSet<AIRecommendation> AIRecommendations
    {
        get; set;
    }

    public virtual DbSet<Attendance> Attendances
    {
        get; set;
    }

    public virtual DbSet<AuditLog> AuditLogs
    {
        get; set;
    }

    public virtual DbSet<Booking> Bookings
    {
        get; set;
    }

    public virtual DbSet<CheckIn> CheckIns
    {
        get; set;
    }

    public virtual DbSet<ChurnPrediction> ChurnPredictions
    {
        get; set;
    }

    public virtual DbSet<EmergencyContact> EmergencyContacts
    {
        get; set;
    }

    public virtual DbSet<Equipment> Equipment
    {
        get; set;
    }

    public virtual DbSet<EquipmentCategory> EquipmentCategories
    {
        get; set;
    }

    public virtual DbSet<Exercise> Exercises
    {
        get; set;
    }

    public virtual DbSet<MaintenanceRecord> MaintenanceRecords
    {
        get; set;
    }

    public virtual DbSet<Member> Members
    {
        get; set;
    }

    public virtual DbSet<MemberPackage> MemberPackages
    {
        get; set;
    }

    public virtual DbSet<MemberTrainer> MemberTrainers
    {
        get; set;
    }

    public virtual DbSet<Notification> Notifications
    {
        get; set;
    }

    public virtual DbSet<Package> Packages
    {
        get; set;
    }

    public virtual DbSet<Payment> Payments
    {
        get; set;
    }

    public virtual DbSet<PaymentTransaction> PaymentTransactions
    {
        get; set;
    }

    public virtual DbSet<Permission> Permissions
    {
        get; set;
    }

    public virtual DbSet<Progress> Progresses
    {
        get; set;
    }

    public virtual DbSet<Role> Roles
    {
        get; set;
    }

    public virtual DbSet<RolePermission> RolePermissions
    {
        get; set;
    }

    public virtual DbSet<Room> Rooms
    {
        get; set;
    }

    public virtual DbSet<Staff> Staffs
    {
        get; set;
    }

    public virtual DbSet<Trainer> Trainers
    {
        get; set;
    }

    public virtual DbSet<TrainerSchedule> TrainerSchedules
    {
        get; set;
    }

    public virtual DbSet<User> Users
    {
        get; set;
    }

    public virtual DbSet<UserRole> UserRoles
    {
        get; set;
    }

    public virtual DbSet<WorkoutPlan> WorkoutPlans
    {
        get; set;
    }

    public virtual DbSet<WorkoutPlanDetail> WorkoutPlanDetails
    {
        get; set;
    }

    public virtual DbSet<WorkoutResult> WorkoutResults
    {
        get; set;
    }

    public virtual DbSet<WorkoutSchedule> WorkoutSchedules
    {
        get; set;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AIConversation>(entity =>
        {
            entity.HasKey(e => e.ConversationId).HasName("PK__AIConver__C050D8777C972314");

            entity.Property(e => e.ConversationTitle).HasMaxLength(300);
            entity.Property(e => e.StartedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.Member).WithMany(p => p.AIConversations)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AIConversations_Members");
        });

        modelBuilder.Entity<AIConversationMessage>(entity =>
        {
            entity.HasKey(e => e.MessageId).HasName("PK__AIConver__C87C0C9CF7445042");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.SenderType).HasMaxLength(30);

            entity.HasOne(d => d.Conversation).WithMany(p => p.AIConversationMessages)
                .HasForeignKey(d => d.ConversationId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AIConversationMessages_Conversations");
        });

        modelBuilder.Entity<AIRecommendation>(entity =>
        {
            entity.HasKey(e => e.RecommendationId).HasName("PK__AIRecomm__AA15BEE4F1B2C9DB");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.RecommendationType).HasMaxLength(100);

            entity.HasOne(d => d.Member).WithMany(p => p.AIRecommendations)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AIRecommendations_Members");
        });

        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(e => e.AttendanceId).HasName("PK__Attendan__8B69261C25B7AA23");

            entity.ToTable("Attendance");

            entity.HasIndex(e => e.BookingId, "UQ__Attendan__73951AECDBC6C95F").IsUnique();

            entity.Property(e => e.CheckInTime).HasPrecision(0);
            entity.Property(e => e.CheckOutTime).HasPrecision(0);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Present");

            entity.HasOne(d => d.Booking).WithOne(p => p.Attendance)
                .HasForeignKey<Attendance>(d => d.BookingId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attendance_Bookings");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.AuditLogId).HasName("PK__AuditLog__EB5F6CBD4777F8E3");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_AuditLogs_UserId_CreatedAt");

            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.EntityName).HasMaxLength(200);
            entity.Property(e => e.IPAddress).HasMaxLength(100);
            entity.Property(e => e.UserAgent).HasMaxLength(1000);

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_AuditLogs_Users");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.BookingId).HasName("PK__Bookings__73951AED6F536D09");

            entity.HasIndex(e => e.MemberId, "IX_Bookings_MemberId");

            entity.HasIndex(e => e.WorkoutScheduleId, "IX_Bookings_ScheduleId");

            entity.Property(e => e.BookingTime)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Confirmed");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.Member).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bookings_Members");

            entity.HasOne(d => d.WorkoutSchedule).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.WorkoutScheduleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bookings_WorkoutSchedules");
        });

        modelBuilder.Entity<CheckIn>(entity =>
        {
            entity.HasKey(e => e.CheckInId).HasName("PK__CheckIns__E649768488F5BE4F");

            entity.HasIndex(e => new { e.MemberId, e.CheckInTime }, "IX_CheckIns_MemberId_CheckInTime");

            entity.Property(e => e.CheckInTime)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.CheckOutTime).HasPrecision(0);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Method).HasMaxLength(50);
            entity.Property(e => e.SourceDevice).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("CheckedIn");

            entity.HasOne(d => d.Member).WithMany(p => p.CheckIns)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CheckIns_Members");
        });

        modelBuilder.Entity<ChurnPrediction>(entity =>
        {
            entity.HasKey(e => e.ChurnPredictionId).HasName("PK__ChurnPre__DBC03384EC1BC227");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.ModelVersion).HasMaxLength(100);
            entity.Property(e => e.PredictionDate)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.RiskLevel).HasMaxLength(50);
            entity.Property(e => e.RiskScore).HasColumnType("decimal(8, 4)");

            entity.HasOne(d => d.Member).WithMany(p => p.ChurnPredictions)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ChurnPredictions_Members");
        });

        modelBuilder.Entity<EmergencyContact>(entity =>
        {
            entity.HasKey(e => e.ContactId).HasName("PK__Emergenc__5C66259B42135DE0");

            entity.Property(e => e.FullName).HasMaxLength(150);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Phone).HasMaxLength(30);
            entity.Property(e => e.Relationship).HasMaxLength(100);

            entity.HasOne(d => d.Member).WithMany(p => p.EmergencyContacts)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EmergencyContacts_Members");
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.EquipmentId).HasName("PK__Equipmen__34474479564AA0D3");

            entity.Property(e => e.Brand).HasMaxLength(200);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.EquipmentName).HasMaxLength(200);
            entity.Property(e => e.Location).HasMaxLength(500);
            entity.Property(e => e.SerialNumber).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.Category).WithMany(p => p.Equipment)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK_Equipment_Categories");
        });

        modelBuilder.Entity<EquipmentCategory>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__Equipmen__19093A0B07D0C393");

            entity.Property(e => e.CategoryName).HasMaxLength(200);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
        });

        modelBuilder.Entity<Exercise>(entity =>
        {
            entity.HasKey(e => e.ExerciseId).HasName("PK__Exercise__A074AD2F3B0BE323");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.ExerciseName).HasMaxLength(200);
            entity.Property(e => e.ImageUrl).HasMaxLength(1000);
            entity.Property(e => e.MuscleGroup).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.VideoUrl).HasMaxLength(1000);
        });

        modelBuilder.Entity<MaintenanceRecord>(entity =>
        {
            entity.HasKey(e => e.MaintenanceId).HasName("PK__Maintena__E60542D5E8B06D02");

            entity.Property(e => e.Cost).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.MaintenanceType).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasMaxLength(50)
                .HasDefaultValue("Completed");

            entity.HasOne(d => d.Equipment).WithMany(p => p.MaintenanceRecords)
                .HasForeignKey(d => d.EquipmentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Maintenance_Equipment");

            entity.HasOne(d => d.Staff).WithMany(p => p.MaintenanceRecords)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("FK_Maintenance_Staffs");
        });

        modelBuilder.Entity<Member>(entity =>
        {
            entity.HasKey(e => e.MemberId).HasName("PK__Members__0CF04B189EA17840");

            entity.HasIndex(e => e.UserId, "IX_Members_UserId");

            entity.HasIndex(e => e.UserId, "UQ__Members__1788CC4D1795FE41").IsUnique();

            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.FitnessLevel).HasMaxLength(100);
            entity.Property(e => e.Goal).HasMaxLength(500);
            entity.Property(e => e.Height).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.JoinDate).HasDefaultValueSql("(CONVERT([date],getdate()))");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);
            entity.Property(e => e.Weight).HasColumnType("decimal(6, 2)");

            entity.HasOne(d => d.User).WithOne(p => p.Member)
                .HasForeignKey<Member>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Members_Users");
        });

        modelBuilder.Entity<MemberPackage>(entity =>
        {
            entity.HasKey(e => e.MemberPackageId).HasName("PK__MemberPa__0CF8CBE8A4315B85");

            entity.HasIndex(e => e.MemberId, "IX_MemberPackages_MemberId");

            entity.HasIndex(e => e.PackageId, "IX_MemberPackages_PackageId");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Price).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.Member).WithMany(p => p.MemberPackages)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MemberPackages_Members");

            entity.HasOne(d => d.Package).WithMany(p => p.MemberPackages)
                .HasForeignKey(d => d.PackageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MemberPackages_Packages");
        });

        modelBuilder.Entity<MemberTrainer>(entity =>
        {
            entity.HasKey(e => e.MemberTrainerId).HasName("PK__MemberTr__647FA7FD091D8CA5");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");

            entity.HasOne(d => d.Member).WithMany(p => p.MemberTrainers)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MemberTrainers_Members");

            entity.HasOne(d => d.Trainer).WithMany(p => p.MemberTrainers)
                .HasForeignKey(d => d.TrainerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MemberTrainers_Trainers");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId).HasName("PK__Notifica__20CF2E128FF3BC15");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.NotificationType).HasMaxLength(100);
            entity.Property(e => e.SentAt).HasPrecision(0);
            entity.Property(e => e.Title).HasMaxLength(300);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_Users");
        });

        modelBuilder.Entity<Package>(entity =>
        {
            entity.HasKey(e => e.PackageId).HasName("PK__Packages__322035CC0FBE7F0F");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.PackageName).HasMaxLength(150);
            entity.Property(e => e.Price).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__Payments__9B556A389EA91784");

            entity.HasIndex(e => e.MemberId, "IX_Payments_MemberId");

            entity.Property(e => e.Amount).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.PaidAt).HasPrecision(0);
            entity.Property(e => e.PaymentMethod).HasMaxLength(50);
            entity.Property(e => e.Provider).HasMaxLength(100);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TransactionCode).HasMaxLength(200);

            entity.HasOne(d => d.Member).WithMany(p => p.Payments)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Members");

            entity.HasOne(d => d.MemberPackage).WithMany(p => p.Payments)
                .HasForeignKey(d => d.MemberPackageId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_MemberPackages");
        });

        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasKey(e => e.PaymentTransactionId).HasName("PK__PaymentT__C22AEFE01FF220ED");

            entity.Property(e => e.Amount).HasColumnType("decimal(19, 4)");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Provider).HasMaxLength(100);
            entity.Property(e => e.TransactionCode).HasMaxLength(200);
            entity.Property(e => e.TransactionStatus).HasMaxLength(50);

            entity.HasOne(d => d.Payment).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.PaymentId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PaymentTransactions_Payments");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.PermissionId).HasName("PK__Permissi__EFA6FB2F03A1498D");

            entity.HasIndex(e => e.PermissionCode, "UQ__Permissi__91FE57501ED0528B").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.PermissionCode).HasMaxLength(100);
            entity.Property(e => e.PermissionName).HasMaxLength(200);
        });

        modelBuilder.Entity<Progress>(entity =>
        {
            entity.HasKey(e => e.ProgressId).HasName("PK__Progress__BAE29CA50DE33EEB");

            entity.ToTable("Progress");

            entity.Property(e => e.BodyFat).HasColumnType("decimal(6, 2)");
            entity.Property(e => e.Chest).HasColumnType("decimal(8, 2)");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Hip).HasColumnType("decimal(8, 2)");
            entity.Property(e => e.MuscleMass).HasColumnType("decimal(8, 2)");
            entity.Property(e => e.Waist).HasColumnType("decimal(8, 2)");
            entity.Property(e => e.Weight).HasColumnType("decimal(8, 2)");

            entity.HasOne(d => d.Member).WithMany(p => p.Progresses)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Progress_Members");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__Roles__8AFACE1AD24B8561");

            entity.HasIndex(e => e.RoleName, "UQ__Roles__8A2B6160B5B88847").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(e => new { e.RoleId, e.PermissionId }).HasName("PK__RolePerm__6400A1A88CDF4BCB");

            entity.Property(e => e.AssignedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.Permission).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.PermissionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RolePermissions_Permissions");

            entity.HasOne(d => d.Role).WithMany(p => p.RolePermissions)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RolePermissions_Roles");
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.RoomId).HasName("PK__Rooms__32863939706A57DD");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Location).HasMaxLength(500);
            entity.Property(e => e.RoomName).HasMaxLength(150);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);
        });

        modelBuilder.Entity<Staff>(entity =>
        {
            entity.HasKey(e => e.StaffId).HasName("PK__Staffs__96D4AB17E5E84ED6");

            entity.HasIndex(e => e.UserId, "IX_Staffs_UserId");

            entity.HasIndex(e => e.UserId, "UQ__Staffs__1788CC4DDBE1F9ED").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Position).HasMaxLength(100);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.User).WithOne(p => p.Staff)
                .HasForeignKey<Staff>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Staffs_Users");
        });

        modelBuilder.Entity<Trainer>(entity =>
        {
            entity.HasKey(e => e.TrainerId).HasName("PK__Trainers__366A1A7CCD19F605");

            entity.HasIndex(e => e.UserId, "IX_Trainers_UserId");

            entity.HasIndex(e => e.UserId, "UQ__Trainers__1788CC4DC3EA9865").IsUnique();

            entity.Property(e => e.Certificate).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Rating).HasColumnType("decimal(4, 2)");
            entity.Property(e => e.Specialization).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.User).WithOne(p => p.Trainer)
                .HasForeignKey<Trainer>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Trainers_Users");
        });

        modelBuilder.Entity<TrainerSchedule>(entity =>
        {
            entity.HasKey(e => e.TrainerScheduleId).HasName("PK__TrainerS__E9AEB9C6DB1C61C4");

            entity.HasIndex(e => new { e.TrainerId, e.WorkDate }, "IX_TrainerSchedules_TrainerId_WorkDate");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.IsAvailable).HasDefaultValue(true);
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasOne(d => d.Trainer).WithMany(p => p.TrainerSchedules)
                .HasForeignKey(d => d.TrainerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TrainerSchedules_Trainers");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__Users__1788CC4CBF8E4C29");

            entity.HasIndex(e => e.Username, "UQ__Users__536C85E491CE5D32").IsUnique();

            entity.HasIndex(e => e.Email, "UQ__Users__A9D10534B4D35993").IsUnique();

            entity.Property(e => e.AvatarUrl).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.FullName).HasMaxLength(150);
            entity.Property(e => e.Gender).HasMaxLength(30);
            entity.Property(e => e.LastLoginAt).HasPrecision(0);
            entity.Property(e => e.PasswordHash).HasMaxLength(500);
            entity.Property(e => e.Phone).HasMaxLength(30);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);
            entity.Property(e => e.Username).HasMaxLength(100);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId }).HasName("PK__UserRole__AF2760AD9D5C8B06");

            entity.Property(e => e.AssignedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Roles");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Users");
        });

        modelBuilder.Entity<WorkoutPlan>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PK__WorkoutP__755C22B7A41BAB9E");

            entity.HasIndex(e => e.MemberId, "IX_WorkoutPlans_MemberId");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Goal).HasMaxLength(500);
            entity.Property(e => e.PlanName).HasMaxLength(200);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Active");
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.Member).WithMany(p => p.WorkoutPlans)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WorkoutPlans_Members");

            entity.HasOne(d => d.Trainer).WithMany(p => p.WorkoutPlans)
                .HasForeignKey(d => d.TrainerId)
                .HasConstraintName("FK_WorkoutPlans_Trainers");
        });

        modelBuilder.Entity<WorkoutPlanDetail>(entity =>
        {
            entity.HasKey(e => e.PlanDetailId).HasName("PK__WorkoutP__B7E7452D3F4B034A");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Weight).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Exercise).WithMany(p => p.WorkoutPlanDetails)
                .HasForeignKey(d => d.ExerciseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WorkoutPlanDetails_Exercises");

            entity.HasOne(d => d.Plan).WithMany(p => p.WorkoutPlanDetails)
                .HasForeignKey(d => d.PlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WorkoutPlanDetails_Plans");
        });

        modelBuilder.Entity<WorkoutResult>(entity =>
        {
            entity.HasKey(e => e.ResultId).HasName("PK__WorkoutR__9769020845D0CD1C");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Weight).HasColumnType("decimal(10, 2)");

            entity.HasOne(d => d.Exercise).WithMany(p => p.WorkoutResults)
                .HasForeignKey(d => d.ExerciseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WorkoutResults_Exercises");

            entity.HasOne(d => d.Member).WithMany(p => p.WorkoutResults)
                .HasForeignKey(d => d.MemberId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WorkoutResults_Members");

            entity.HasOne(d => d.Plan).WithMany(p => p.WorkoutResults)
                .HasForeignKey(d => d.PlanId)
                .HasConstraintName("FK_WorkoutResults_Plans");
        });

        modelBuilder.Entity<WorkoutSchedule>(entity =>
        {
            entity.HasKey(e => e.WorkoutScheduleId).HasName("PK__WorkoutS__5C5C8F92CDDA611E");

            entity.HasIndex(e => e.ScheduleDate, "IX_WorkoutSchedules_Date");

            entity.HasIndex(e => new { e.TrainerId, e.ScheduleDate }, "IX_WorkoutSchedules_Trainer");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Location).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Available");
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.UpdatedAt).HasPrecision(0);

            entity.HasOne(d => d.Plan).WithMany(p => p.WorkoutSchedules)
                .HasForeignKey(d => d.PlanId)
                .HasConstraintName("FK_WorkoutSchedules_Plans");

            entity.HasOne(d => d.Room).WithMany(p => p.WorkoutSchedules)
                .HasForeignKey(d => d.RoomId)
                .HasConstraintName("FK_WorkoutSchedules_Rooms");

            entity.HasOne(d => d.Trainer).WithMany(p => p.WorkoutSchedules)
                .HasForeignKey(d => d.TrainerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_WorkoutSchedules_Trainers");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
