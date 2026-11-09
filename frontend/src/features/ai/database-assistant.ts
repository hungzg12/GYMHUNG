import type { WorkspaceData } from '@/src/types/entities';

const viDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(`${value.slice(0, 10)}T00:00:00`))
    : 'chưa cập nhật';

const trainerName = (data: WorkspaceData, trainerId?: string | null) => {
  const trainer = data.Trainers.find((item) => item.trainerId === trainerId);
  return data.Users.find((item) => item.userId === trainer?.userId)?.fullName;
};

export function answerFromDatabase(
  data: WorkspaceData,
  memberId: string,
  question: string,
) {
  const normalized = question.toLocaleLowerCase('vi-VN');
  const member = data.Members.find((item) => item.memberId === memberId);
  if (!member)
    return 'Tôi chưa tìm thấy hồ sơ hội viên để trả lời câu hỏi này.';

  if (/đau|chấn thương|chóng mặt|khó thở|tim|bệnh/.test(normalized))
    return 'An toàn là ưu tiên đầu tiên. Hãy dừng bài tập đang gây khó chịu và trao đổi với bác sĩ hoặc chuyên gia y tế trước khi tiếp tục. Tôi chỉ dùng dữ liệu phòng gym để hỗ trợ, không thay thế chẩn đoán y khoa.';

  if (/lịch|buổi tập|đặt lịch|hôm nay|sắp tới/.test(normalized)) {
    const bookings = data.Bookings.filter(
      (item) => item.memberId === memberId && item.status === 'Confirmed',
    )
      .map((booking) => ({
        booking,
        schedule: data.WorkoutSchedules.find(
          (item) => item.workoutScheduleId === booking.workoutScheduleId,
        ),
      }))
      .filter(
        (item) =>
          item.schedule &&
          item.schedule.scheduleDate >= new Date().toISOString().slice(0, 10),
      )
      .sort((a, b) =>
        `${a.schedule!.scheduleDate}${a.schedule!.startTime}`.localeCompare(
          `${b.schedule!.scheduleDate}${b.schedule!.startTime}`,
        ),
      );
    if (!bookings.length)
      return 'Theo dữ liệu đặt lịch, bạn chưa có buổi tập sắp tới đã được xác nhận.';
    const details = bookings.slice(0, 3).map(({ schedule }) => {
      const room = data.Rooms.find((item) => item.roomId === schedule!.roomId);
      return `• ${viDate(schedule!.scheduleDate)}, ${schedule!.startTime.slice(0, 5)}–${schedule!.endTime.slice(0, 5)}: ${schedule!.title ?? 'Buổi tập'} với ${trainerName(data, schedule!.trainerId) ?? 'PT'}, tại ${room?.roomName ?? schedule!.location ?? 'phòng tập'}`;
    });
    return `Theo dữ liệu đặt lịch, bạn có ${bookings.length} buổi sắp tới đã xác nhận:\n${details.join('\n')}`;
  }

  if (/pt|huấn luyện viên|trainer|người hướng dẫn/.test(normalized)) {
    const assignment = data.MemberTrainers.find(
      (item) => item.memberId === memberId && item.status === 'Active',
    );
    const trainer = data.Trainers.find(
      (item) => item.trainerId === assignment?.trainerId,
    );
    return assignment && trainer
      ? `Theo hồ sơ hội viên, PT phụ trách của bạn là ${trainerName(data, trainer.trainerId) ?? 'chưa cập nhật tên'}. Chuyên môn: ${trainer.specialization ?? 'chưa cập nhật'}; kinh nghiệm: ${trainer.experienceYears ?? 0} năm; đánh giá: ${trainer.rating ?? 'chưa có'}.`
      : 'Theo dữ liệu hiện tại, bạn chưa được phân công huấn luyện viên cá nhân.';
  }

  if (/gói|hết hạn|buổi còn|quyền lợi/.test(normalized)) {
    const active = data.MemberPackages.find(
      (item) => item.memberId === memberId && item.status === 'Active',
    );
    const gymPackage = data.Packages.find(
      (item) => item.packageId === active?.packageId,
    );
    return active
      ? `Theo dữ liệu hội viên, bạn đang dùng gói ${gymPackage?.packageName ?? 'đang hoạt động'}, còn ${active.remainingSessions ?? 'không giới hạn'} buổi và hết hạn ngày ${viDate(active.endDate)}.${gymPackage?.benefits ? ` Quyền lợi gồm: ${gymPackage.benefits.replaceAll('\n', ', ')}.` : ''}`
      : 'Theo dữ liệu hiện tại, bạn chưa có gói tập đang hoạt động.';
  }

  if (/tiến độ|cân nặng|mỡ|cơ|vòng eo|thay đổi/.test(normalized)) {
    const progress = data.Progress.filter(
      (item) => item.memberId === memberId,
    ).sort((a, b) => b.recordDate.localeCompare(a.recordDate));
    if (!progress.length)
      return 'Bạn chưa có bản ghi tiến độ nào trong cơ sở dữ liệu.';
    const latest = progress[0];
    const oldest = progress.at(-1)!;
    const delta = (
      current?: number | null,
      previous?: number | null,
      unit = '',
    ) =>
      current != null && previous != null
        ? ` (${current - previous > 0 ? '+' : ''}${(current - previous).toFixed(1)}${unit})`
        : '';
    return `Bản ghi gần nhất ngày ${viDate(latest.recordDate)}: cân nặng ${latest.weight ?? 'chưa có'} kg${delta(latest.weight, oldest.weight, ' kg')}, mỡ cơ thể ${latest.bodyFat ?? 'chưa có'}%${delta(latest.bodyFat, oldest.bodyFat, '%')}, khối lượng cơ ${latest.muscleMass ?? 'chưa có'} kg${delta(latest.muscleMass, oldest.muscleMass, ' kg')}. Mức thay đổi được tính từ bản ghi ngày ${viDate(oldest.recordDate)}.`;
  }

  if (/giáo án|bài tập|tập gì|workout/.test(normalized)) {
    const plan = data.WorkoutPlans.find(
      (item) => item.memberId === memberId && item.status === 'Active',
    );
    if (!plan) return 'Bạn chưa có giáo án đang hoạt động trong cơ sở dữ liệu.';
    const exercises = data.WorkoutPlanDetails.filter(
      (item) => item.planId === plan.planId,
    )
      .sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0))
      .map((detail) => {
        const exercise = data.Exercises.find(
          (item) => item.exerciseId === detail.exerciseId,
        );
        return `• ${exercise?.exerciseName ?? 'Bài tập'}: ${detail.sets ?? '-'} hiệp × ${detail.reps ?? '-'} lần${detail.weight ? `, ${detail.weight} kg` : ''}`;
      });
    return `Giáo án đang hoạt động của bạn là “${plan.planName}” (${plan.goal ?? member.goal ?? 'duy trì tập luyện'}):\n${exercises.join('\n')}`;
  }

  if (/dinh dưỡng|ăn|protein|calo|sau tập|trước tập/.test(normalized)) {
    const latest = data.Progress.filter(
      (item) => item.memberId === memberId,
    ).sort((a, b) => b.recordDate.localeCompare(a.recordDate))[0];
    const weight = Number(latest?.weight ?? member.weight ?? 0);
    return `Dựa trên cân nặng gần nhất${latest ? ` ngày ${viDate(latest.recordDate)}` : ''}${weight ? ` là ${weight} kg` : ''}, mục tiêu protein tham khảo là ${weight ? `${Math.round(weight * 1.4)}–${Math.round(weight * 1.8)} g/ngày` : '1,4–1,8 g/kg/ngày'}. Ưu tiên thực phẩm ít chế biến, uống đủ nước và ăn protein cùng carbohydrate sau tập.`;
  }

  return `Tôi đã đọc hồ sơ tập luyện của bạn. Mục tiêu hiện tại là ${member.goal ?? 'xây dựng thói quen tập đều đặn'}. Bạn có thể hỏi cụ thể về lịch sắp tới, PT phụ trách, gói còn bao nhiêu buổi, tiến độ cân nặng hoặc giáo án hiện tại.`;
}
