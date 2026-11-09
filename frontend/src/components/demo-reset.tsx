'use client';
import { useState } from 'react';
import { getService } from '@/src/api/service';
import { Confirm } from './confirm';
export function DemoReset() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-link demo-reset" onClick={() => setOpen(true)}>
        Khôi phục dữ liệu demo
      </button>
      {open && (
        <Confirm
          title="Khôi phục dữ liệu demo?"
          description="Các thay đổi demo trong trình duyệt này sẽ được thay bằng dữ liệu minh họa ban đầu."
          onClose={() => setOpen(false)}
          onConfirm={async () => {
            await (await getService()).resetDemo?.();
          }}
        />
      )}
    </>
  );
}
