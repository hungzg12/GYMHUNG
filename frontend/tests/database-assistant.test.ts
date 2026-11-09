import { describe, expect, it } from 'vitest';
import { createSeed } from '@/src/api/mock/seed';
import { answerFromDatabase } from '@/src/features/ai/database-assistant';

describe('database assistant', () => {
  const data = createSeed();

  it('joins booking, schedule, trainer and room data', () => {
    const answer = answerFromDatabase(data, '1', 'Lịch tập sắp tới của tôi');
    expect(answer).toContain('buổi sắp tới');
    expect(answer).toMatch(/Studio|Zone/);
    expect(answer).toContain('với');
  });

  it('answers package questions with member package data', () => {
    const answer = answerFromDatabase(data, '1', 'Gói tập còn bao nhiêu buổi?');
    expect(answer).toContain('GYM BASIC');
    expect(answer).toContain(`${data.MemberPackages.find(p=>p.memberId==='1'&&p.status==='Active')!.remainingSessions} buổi`);
  });

  it('calculates progress from stored measurements', () => {
    const answer = answerFromDatabase(data, '1', 'Tiến độ cân nặng thế nào?');
    expect(answer).toContain('61 kg');
    expect(answer).toContain('-2.0 kg');
    expect(answer).toContain('khối lượng cơ');
  });

  it('returns the active workout plan and its exercises', () => {
    const answer = answerFromDatabase(data, '1', 'Cho tôi xem giáo án');
    expect(answer).toContain('Xây nền thể lực');
    expect(answer).toContain('Barbell Squat');
  });
});
