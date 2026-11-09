'use client';
import { useState, useRef, useEffect, type SubmitEvent } from 'react';
import Link from '@/src/routes/link';
import {
  Sparkles,
  Plus,
  Send,
  MessageSquare,
  Check,
  HeartPulse,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { PageHeading, Badge, EmptyState } from '@/src/components/common';
import { ModuleTabs } from '@/src/components/module-tabs';
import { useApp } from '@/src/app/provider';
import { can } from '@/src/app/permissions';
import { EntityEditor } from '@/src/features/resources/entity-form';
import { EntityTable } from '@/src/features/resources/entity-table';
import { lookup } from '@/src/features/resources/config';
import { date, initials } from '@/src/utils/format';
import {apiRequest} from '@/src/api/production';
import {Confirm} from '@/src/components/confirm';
import {localDate} from '@/src/utils/format';
import { isMock } from '@/src/api/service';
import { errorText } from '@/src/api/client';
export function AiPage() {
  const { data, session, mutate } = useApp();
  const [selectedConversationId, setConversationId] = useState(
      data?.AIConversations[0]?.conversationId ?? '',
    ),
    [adding, setAdding] = useState(false),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const conversationId = data?.AIConversations.some(c => c.conversationId === selectedConversationId)
    ? selectedConversationId : data?.AIConversations[0]?.conversationId ?? '';
  const messages =
    data?.AIConversationMessages.filter(
      (m) => m.conversationId === conversationId,
    ).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) ?? [];
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [conversationId, messages.length]);
  if (!data) return null;
  const conversation = data.AIConversations.find(
    (c) => c.conversationId === conversationId,
  );
  async function send(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || !conversation) return;
    setBusy(true);
    setError('');
    try {
      await mutate(
        (s) => s.sendMessage(conversation.conversationId, message),
        isMock ? 'Trợ lý đã trả lời từ dữ liệu demo.' : '',
      );
      setMessage('');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const chat = (
    <div className="chat-layout panel">
      <aside className="conversation-sidebar">
        <div className="conversation-heading">
          <h2>Hội thoại</h2>
          {can(session, 'ai.write') && (
            <button
              className="icon-button"
              aria-label="Cuộc trò chuyện mới"
              onClick={() => setAdding(true)}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
        {data.AIConversations.toSorted((a, b) =>
          (b.updatedAt ?? b.startedAt).localeCompare(
            a.updatedAt ?? a.startedAt,
          ),
        ).map((c) => (
          <button
            className={`conversation-item ${conversationId === c.conversationId ? 'active' : ''}`}
            key={c.conversationId}
            onClick={() => {
              setConversationId(c.conversationId);
              setError('');
            }}
          >
            <MessageSquare size={17} />
            <span>
              <strong>{c.conversationTitle ?? 'Cuộc trò chuyện mới'}</strong>
              <small>{date(c.startedAt)}</small>
            </span>
          </button>
        ))}
        {!data.AIConversations.length && (
          <p className="inline-empty">Chưa có hội thoại.</p>
        )}
        <div className="ai-disclosure">
          <Sparkles size={19} />
          <p>
            {isMock
              ? 'Trợ lý trả lời từ cơ sở dữ liệu demo trên máy của bạn.'
              : 'AI demo: phản hồi theo quy tắc ở backend, chưa cấu hình mô hình AI thật.'}
          </p>
        </div>
      </aside>
      <section className="chat-main">
        <header>
          <span className="ai-orb">
            <Sparkles size={20} />
          </span>
          <div>
            <h2>{conversation?.conversationTitle ?? 'Trợ lý tập luyện'}</h2>
            <p>
              {conversation
                ? lookup('memberId', conversation.memberId, data)
                : 'Bắt đầu một cuộc trò chuyện mới'}
            </p>
          </div>
          <span className="demo-chip">AI DEMO</span>
        </header>
        <div
          className="chat-messages"
          role="log"
          aria-label="Lịch sử hội thoại"
          aria-live="polite"
        >
          {messages.length ? (
            messages.map((m) => (
              <div
                key={m.messageId}
                className={`chat-message ${m.senderType === 'User' ? 'from-user' : 'from-ai'}`}
              >
                <span className="avatar small">
                  {m.senderType === 'User' ? (
                    initials(session?.fullName ?? 'Bạn')
                  ) : (
                    <Sparkles size={15} />
                  )}
                </span>
                <div>
                  <small>
                    {m.senderType === 'User' ? 'Bạn' : 'Trợ lý AI'} ·{' '}
                    {date(m.createdAt, true)}
                  </small>
                  <p>{m.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="chat-welcome">
              <Sparkles size={40} />
              <h2>Bắt đầu từ mục tiêu của bạn</h2>
              <p>Trao đổi về lịch tập, giáo án hoặc dinh dưỡng.</p>
              <div>
                {[
                  'Xem lại lịch tập của tôi',
                  'Gói tập của tôi còn bao nhiêu buổi?',
                  'Tiến độ cân nặng của tôi thế nào?',
                  'Cho tôi xem giáo án hiện tại',
                ].map((text) => (
                  <button
                    key={text}
                    disabled={!conversation}
                    onClick={() => setMessage(text)}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          )}
          {busy && (
            <output className="typing">AI đang phân tích dữ liệu…</output>
          )}
          <div ref={bottom} />
        </div>
        <form className="chat-composer" onSubmit={send}>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div>
            <Textarea
              aria-label="Tin nhắn cho trợ lý AI"
              placeholder={
                conversation
                  ? 'Nhập câu hỏi của bạn…'
                  : 'Tạo hoặc chọn cuộc trò chuyện trước'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!conversation || busy || !can(session, 'ai.write')}
              rows={2}
              maxLength={4000}
            />
            <Button
              type="submit"
              aria-label="Gửi tin nhắn"
              disabled={
                !conversation ||
                !message.trim() ||
                busy ||
                !can(session, 'ai.write')
              }
            >
              <Send size={19} />
            </Button>
          </div>
          <small>
            {isMock
              ? 'Chế độ demo · Câu trả lời được tạo từ dữ liệu lưu trên máy.'
              : 'Thông tin AI không thay thế hướng dẫn chuyên môn.'}
          </small>
        </form>
      </section>
    </div>
  );
  return (
    <>
      <PageHeading
        eyebrow="GYM HUNG · AI DEMO"
        title="Trợ lý AI"
        description="Một nơi cho câu hỏi, mục tiêu và những gợi ý dành cho bạn."
      >
        {can(session, 'ai.write') && (
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} />
            Cuộc trò chuyện mới
          </Button>
        )}
      </PageHeading>
      <ModuleTabs
        tabs={[
          { id: 'chat', title: 'Trò chuyện', content: chat },
          {
            id: 'recommendations',
            title: 'Gợi ý dành cho bạn',
            content: <Recommendations />,
          },
        ]}
      />
      {adding && (
        <EntityEditor
          table="AIConversations"
          fixed={session?.memberId ? { memberId: session.memberId } : undefined}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  );
}
export function Recommendations() {
  const { data, session, mutate } = useApp();
  const [type, setType] = useState(''),
    [busy, setBusy] = useState<string | null>(null),
    [proposal,setProposal] = useState<import('@/src/types/entities').AIRecommendations|null>(null),
    [planName] = useState('Giáo án được đề xuất từ AI demo');
  if (!data) return null;
  const items = data.AIRecommendations.filter(
    (r) => !type || r.recommendationType === type,
  );
  return (
    <>
      <div className="recommendation-filter">
        <NativeSelect
          aria-label="Loại gợi ý AI"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <NativeSelectOption value="">Tất cả gợi ý</NativeSelectOption>
          <NativeSelectOption value="Workout">Tập luyện</NativeSelectOption>
          <NativeSelectOption value="Nutrition">Dinh dưỡng</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="recommendation-grid">
        {items.map((item) => (
          <article
            className="panel recommendation-card"
            key={item.recommendationId}
          >
            <div className="recommendation-head">
              <Sparkles size={23} />
              <span>
                {item.recommendationType === 'Workout'
                  ? 'Tập luyện'
                  : item.recommendationType === 'Nutrition'
                    ? 'Dinh dưỡng'
                    : item.recommendationType}
              </span>
              {item.isRead && <Check size={16} />}
            </div>
            <p>{item.content}</p>
            <small>
              {lookup('memberId', item.memberId, data)} · {date(item.createdAt)}
            </small>
            {item.recommendationType==='Workout'&&can(session,'ai.write')&&(!isMock||can(session,'workouts.write'))&&<Button variant="outline" onClick={()=>setProposal(item)}>Xem và xác nhận giáo án đề xuất</Button>}
            {!item.isRead && can(session, 'ai.write') && (
              <Button
                variant="outline"
                disabled={busy === item.recommendationId}
                onClick={async () => {
                  setBusy(item.recommendationId);
                  try {
                    await mutate(
                      (s) =>
                        s.markRead('AIRecommendations', item.recommendationId),
                      'Đã đánh dấu đã đọc',
                    );
                  } catch {
                    /* Toast handles error. */
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Đánh dấu đã đọc
              </Button>
            )}
          </article>
        ))}
      </div>
      {proposal&&<Confirm title="Xác nhận lưu giáo án đề xuất?" description={`Hội viên: ${lookup('memberId',proposal.memberId,data)}. Nội dung AI demo: ${proposal.content}. Giáo án chỉ được tạo khi bạn xác nhận, sau đó PT cần bổ sung bài tập phù hợp.`} onClose={()=>setProposal(null)} onConfirm={()=>mutate(async service=>{const draft={planName,goal:proposal.content.slice(0,500),memberId:proposal.memberId,startDate:localDate(),status:'Active',note:'Đề xuất AI demo đã được người dùng xác nhận. PT cần hoàn thiện bài tập.'};if(isMock)return service.save('WorkoutPlans',null,draft);return apiRequest(`/api/ai/recommendations/${proposal.recommendationId}/accept-plan`,{method:'POST',body:JSON.stringify({...draft,confirmed:true})});},'Đã lưu giáo án đã xác nhận')}/>} 
      {!items.length && (
        <EmptyState
          title="Chưa có gợi ý phù hợp"
          description="Gợi ý sẽ xuất hiện khi dịch vụ AI gửi kết quả."
        />
      )}
    </>
  );
}
export function ChurnPage() {
  const { data } = useApp();
  if (!data) return null;
  const latest=[...new Map(data.ChurnPredictions.toSorted((a,b)=>a.predictionDate.localeCompare(b.predictionDate)).map(p=>[p.memberId,p])).values()];
  return (
    <>
      <PageHeading
        eyebrow="GIỮ CHÂN HỘI VIÊN"
        title="Dự đoán nguy cơ rời bỏ"
        description="Tìm hiểu tín hiệu thay đổi để đồng hành với hội viên kịp thời."
      />
      <div className="summary-row">
        {['High', 'Medium', 'Low'].map((level) => (
          <div key={level}>
            <HeartPulse />
            <span>
              {level === 'High'
                ? 'Rủi ro cao'
                : level === 'Medium'
                  ? 'Rủi ro trung bình'
                  : 'Rủi ro thấp'}
              <strong>
                {
                  latest.filter((p) => p.riskLevel === level)
                    .length
                }
              </strong>
            </span>
          </div>
        ))}
      </div>
      {(
        <p className="notice-box">
          Dự báo demo theo quy tắc công khai, thang điểm 0–100; xem ModelVersion, yếu tố và hành động của từng bản ghi. Chỉ số tổng quan dùng dự báo mới nhất của mỗi hội viên; bảng giữ lịch sử.
        </p>
      )}
      <EntityTable table="ChurnPredictions" />
      <div className="risk-grid">
        {latest.filter((p) => p.riskLevel === 'High').map(
          (p) => (
            <article key={p.churnPredictionId} className="panel risk-card">
              <div>
                <span className="avatar">
                  {initials(lookup('memberId', p.memberId, data))}
                </span>
                <h2>{lookup('memberId', p.memberId, data)}</h2>
                <Badge value={p.riskLevel} />
              </div>
              <p>{p.recommendedActions}</p>
              <Link href={`/members/${p.memberId}`} className="text-link">
                Xem hồ sơ hội viên
                <ArrowUpRight size={16} />
              </Link>
            </article>
          ),
        )}
      </div>
    </>
  );
}
