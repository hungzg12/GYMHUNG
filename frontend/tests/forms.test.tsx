import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createSeed } from '@/src/api/mock/seed';
import { demoPermissions } from '@/src/app/permissions';
import { EntityEditor } from '@/src/features/resources/entity-form';
import { asRecord } from '@/src/types/entities';
const mutations = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock('@/src/app/provider', () => ({
  useApp: () => ({
    data: createSeed(),
    session: {
      userId: '1',
      role: 'Admin',
      permissions: demoPermissions('Admin'),
    },
    mutate: mutations.mutate,
  }),
}));
describe('Management forms', () => {
  it('locks purchase history fields while allowing package status and notes edits', () => {
    render(<EntityEditor table="MemberPackages" row={asRecord(createSeed().MemberPackages[0])} onClose={() => {}} />);
    for (const label of [/Gói tập/, /Ngày bắt đầu/, /Ngày kết thúc/, /Giá/, /Số buổi còn lại/]) {
      expect(screen.getByLabelText(label)).toBeDisabled();
    }
    expect(screen.getByLabelText(/Trạng thái/)).not.toBeDisabled();
    expect(screen.getByLabelText(/Ghi chú/)).not.toBeDisabled();
  });
  it('shows Vietnamese errors and does not save an empty member form', async () => {
    render(<EntityEditor table="Members" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }));
    expect(await screen.findByText('Vui lòng nhập họ và tên.')).toBeVisible();
    expect(await screen.findByText('Vui lòng nhập email.')).toBeVisible();
    expect(mutations.mutate).not.toHaveBeenCalled();
  });
  it('validates the time interval in the visible schedule modal', async () => {
    render(<EntityEditor table="WorkoutSchedules" onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Bắt đầu/), {
      target: { value: '18:00' },
    });
    fireEvent.change(screen.getByLabelText(/Kết thúc/), {
      target: { value: '17:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }));
    expect(
      await screen.findByText('Giờ kết thúc phải sau giờ bắt đầu.'),
    ).toBeVisible();
    expect(mutations.mutate).not.toHaveBeenCalled();
  });
});
