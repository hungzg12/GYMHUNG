import { useState } from 'react';
import Image from '@/src/components/image';
import {
  ArrowRight,
  Activity,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Dumbbell,
  LogIn,
  MapPin,
  Menu,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import './marketing.css';
import './dashboard-theme.css';

const plans = [
  {
    name: 'Linh hoạt',
    price: '399.000',
    note: 'Thanh toán tiền mặt, chuyển khoản hoặc thẻ',
    tone: 'light',
    features: [
      'Tập luyện 24/7 tại chi nhánh đã đăng ký',
      'Miễn phí lớp tập nhóm',
      'Wifi, nước uống và gửi xe',
    ],
  },
  {
    name: 'Toàn hệ thống',
    price: '299.000',
    note: 'Trọn gói 1.799.000đ · Trả góp 0% qua Fundiin',
    tone: 'orange',
    badge: 'Phổ biến nhất',
    features: [
      'Tập mọi chi nhánh trên toàn quốc',
      'Dẫn bạn tập cùng 4 lần mỗi tháng',
      'InBody định kỳ và 2 buổi PT hướng dẫn',
    ],
  },
  {
    name: 'Tự động',
    price: '349.000',
    note: 'Thẻ quốc tế (JCB, VISA, Mastercard) hoặc Fundiin',
    tone: 'cyan',
    badge: 'Tự động gia hạn',
    features: [
      'Tập luyện 24/7 tại chi nhánh đã đăng ký',
      'Không phí đăng ký lại',
      'Dừng gói linh hoạt trên ứng dụng',
    ],
  },
];

const insights = [
  { label: 'Tỷ lệ gia hạn', value: '82%', change: '+6,4%', icon: Activity },
  {
    label: 'Hội viên hoạt động',
    value: '8.426',
    change: '+12,8%',
    icon: Users,
  },
  {
    label: 'Lượt tập hôm nay',
    value: '1.284',
    change: 'Đang cập nhật',
    icon: Dumbbell,
  },
  {
    label: 'Doanh thu tháng',
    value: '2,48 tỷ',
    change: '+8,2%',
    icon: BarChart3,
  },
];

function Logo() {
  return (
    <a className="brand" href="#home" aria-label="GYMHUNG trang chủ">
      <span className="brand-the">GYM</span>
      <span className="brand-name">
        gym<span>hung</span>
      </span>
      <small>Mạnh hơn mỗi ngày</small>
    </a>
  );
}

function Header({ onLogin }) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('gymhung.language') === 'en' ? 'en' : 'vi'; } catch { return 'vi'; }
  });
  const english = language === 'en';
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Logo />
        <button
          className="icon-btn menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label={english ? 'Open menu' : 'Mở menu'}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'main-nav nav-open' : 'main-nav'}>
          <a href="#plans">{english ? 'Memberships' : 'Giá hội viên'}</a>
          <a href="#branches">{english ? 'Find a gym' : 'Tìm phòng tập'}</a>
          <a href="#experience">{english ? 'Facilities' : 'Cơ sở vật chất'}</a>
          <a href="#stories">{english ? 'Training insights' : 'Kiến thức tập luyện'}</a>
        </nav>
        <div className="nav-actions">
          <select className="language language-select" aria-label="Ngôn ngữ / Language" value={language} onChange={event => {
            setLanguage(event.target.value);
            window.dispatchEvent(new CustomEvent('gymhung:language', {detail:event.target.value}));
            try { localStorage.setItem('gymhung.language', event.target.value); } catch { /* Preference is optional. */ }
          }}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
          <button className="button button-login" onClick={onLogin}>
            <LogIn size={15} /> {english ? 'Log in' : 'Đăng nhập'}
          </button>
          <a className="button button-blue" href="#join">
            {english ? 'Join now' : 'Tham gia'}
          </a>
          <a className="button button-orange" href="#join">
            {english ? 'Start your 7-day trial' : 'Đăng ký 7 ngày miễn phí'}
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return <>
    <div className="ticker"><div className="ticker-track">{Array.from({length:6},(_,index)=><span key={index}>•　 GYM CHO MỌI NGƯỜI　 •　 TẬP THEO CÁCH CỦA BẠN　 •　 GYMHUNG　</span>)}</div></div>
    <section className="hero" id="home">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot"/> TẬP LUYỆN THEO CÁCH CỦA BẠN</div>
        <h1>Khỏe hơn mỗi ngày.<br/><em>Vui hơn mỗi buổi tập.</em></h1>
        <p>Phòng tập 24/7, hội viên linh hoạt và công cụ thông minh giúp bạn giữ nhịp trên hành trình của mình.</p>
        <div className="hero-actions">
          <a className="button button-blue" href="#plans">Khám phá gói tập <ArrowRight size={17}/></a>
          <a className="text-link" href="#branches">Tìm phòng tập gần bạn <ArrowRight size={16}/></a>
        </div>
        <div className="hero-proof"><div className="avatar-stack"><i>MA</i><i>TH</i><i>KL</i><i>+</i></div><span><b>15+ chi nhánh</b><br/>trên hành trình khỏe mạnh</span></div>
      </div>
      <div className="hero-art">
        <Image src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=85" alt="Không gian tập sức mạnh với đầy đủ thiết bị" fill priority sizes="(max-width: 640px) 100vw, 55vw"/>
        <div className="hero-sticker"><Sparkles size={19}/><span>Chủ động<br/>bứt phá</span></div>
        <div className="hero-caption"><b>01 / 04</b><span>YOUR BODY, YOUR PROJECT</span></div>
      </div>
      <a className="scroll-cue" href="#plans">Cuộn để khám phá <ChevronDown size={16}/></a>
    </section>
  </>;
}

function SectionHeading({ kicker, title, description, dark = false }) {
  return (
    <div className={`section-heading ${dark ? 'heading-light' : ''}`}>
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function Plans() {
  const selected = 'Toàn hệ thống';
  const accountUrl = (plan) => `/login?mode=register&returnTo=%2Fpackages&plan=${encodeURIComponent(plan.name)}`;
  return (
    <section className="section plans-section" id="plans">
      <div className="container">
        <SectionHeading
          kicker="HỘI VIÊN GYMHUNG"
          title="Chọn gói tập hợp với bạn"
          description="Tập tự do theo nhu cầu, bắt đầu với 7 ngày trải nghiệm miễn phí."
        />
        <div className="plan-grid">
          {plans.map((plan) => (
            <article
              className={`plan-card ${plan.tone} ${selected === plan.name ? 'plan-selected' : ''}`}
              key={plan.name}
            >
              {plan.badge && (
                <span className="plan-badge">
                  {plan.badge === 'Phổ biến nhất' && <Sparkles size={14} />}{' '}
                  {plan.badge}
                </span>
              )}
              <div className="plan-top">
                <span className="plan-kicker">GÓI 1 THÁNG</span>
                <span className="plan-tag">{plan.name}</span>
              </div>
              <h3>
                {plan.name === 'Toàn hệ thống'
                  ? 'Tập không giới hạn'
                  : `Gói ${plan.name.toLowerCase()}`}
              </h3>
              <p className="plan-branch">
                {plan.name === 'Toàn hệ thống'
                  ? 'Tập mọi chi nhánh trên toàn quốc'
                  : '1 chi nhánh'}
              </p>
              <div className="price">
                <strong>{plan.price}</strong>
                <span>
                  VNĐ<small>/Tháng</small>
                </span>
              </div>
              <p className="price-note">{plan.note}</p>
              <a
                className="button plan-choose"
                href={accountUrl(plan)}
              >
                Chọn gói này{' '}
                <ArrowRight size={17} />
              </a>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} />
                    {feature}
                  </li>
                ))}
              </ul>
              <a className="text-link" href={accountUrl(plan)}>
                Xem chi tiết <ArrowRight size={16} />
              </a>
            </article>
          ))}
        </div>
        <div className="plan-footnote">
          * Giá tham khảo theo chi nhánh. Liên hệ phòng tập để biết ưu đãi hiện
          hành.
        </div>
      </div>
    </section>
  );
}

function Experience() {
  const [active, setActive] = useState(0);
  const features = [
    'Khu vực cardio & sức bền',
    'Thiết bị tập sức mạnh',
    'Không gian tập luyện 24/7',
  ];
  return (
    <section className="experience-section" id="experience">
      <div className="container experience-grid">
        <div className="experience-image">
          <Image
            src={[
              'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=85',
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
              'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
            ][active]}
            alt="Không gian và tiện ích phòng tập"
            fill
            sizes="(max-width: 640px) 100vw, 45vw"
          />
          <div className="image-label">
            <span>THIẾT KẾ CHO BẠN</span>
            <b>
              Không gian
              <br />
              năng lượng mới
            </b>
          </div>
        </div>
        <div className="experience-copy">
          <SectionHeading
            kicker="KHÔNG GIAN TẬP LUYỆN"
            title="Bắt đầu hành trình hôm nay"
            description="Đầy đủ thiết bị, không gian hiện đại và tiện ích để mỗi buổi tập đều là thời gian dành cho bạn."
          />
          <div className="feature-list">
            {features.map((f, i) => (
              <button
                className={active === i ? 'feature-row active' : 'feature-row'}
                key={f}
                onClick={() => setActive(i)}
              >
                <span className="feature-number">0{i + 1}</span>
                <span>{f}</span>
                {active === i ? (
                  <span className="feature-indicator">−</span>
                ) : (
                  <span className="feature-indicator">+</span>
                )}
              </button>
            ))}
          </div>
          <a className="button button-outline" href="#branches">
            Tìm phòng tập <MapPin size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Branches() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const branches = [
    'Quận 7 - Sunrise',
    'Tân Bình - Cộng Hòa',
    'Bình Thạnh - Pearl',
    'Gò Vấp - Nguyễn Oanh',
  ];
  const filtered = branches.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="branches-section" id="branches">
      <div className="container branch-layout">
        <div>
          <SectionHeading
            kicker="LUÔN Ở GẦN BẠN"
            title="Tìm phòng tập gần nhất"
            description="Chọn địa điểm thuận tiện cho lịch trình của bạn."
          />
          <div className="search-box">
            <Search size={18} />
            <input
              aria-label="Tìm phòng tập theo địa điểm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearched(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && setSearched(true)}
              placeholder="Nhập quận, thành phố hoặc mã bưu điện"
            />
            <button onClick={() => setSearched(true)} aria-label="Tìm kiếm">
              <ArrowRight size={18} />
            </button>
          </div>
          {searched && (
            <p className="search-result">
              Tìm thấy {filtered.length} phòng tập phù hợp.
            </p>
          )}
        </div>
        <div className="branch-list">
          {filtered.slice(0, 3).map((branch, i) => (
            <div className="branch-item" key={branch}>
              <span className="branch-map">
                <MapPin size={18} />
              </span>
              <div>
                <b>{branch}</b>
                <small>
                  {i === 0
                    ? 'Mở cửa 24/7 · Cách bạn 1,2 km'
                    : 'Mở cửa 24/7 · Cách bạn 3,5 km'}
                </small>
              </div>
              <ArrowRight size={17} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stories() {
  const items = [
    {
      tag: 'HƯỚNG DẪN',
      title: '8 động tác giãn cơ giúp cơ thể phục hồi tốt hơn',
      className: 'story-one',
    },
    {
      tag: 'KIẾN THỨC',
      title: 'Tập luyện sức mạnh: bắt đầu từ đâu?',
      className: 'story-two',
    },
    {
      tag: 'DINH DƯỠNG',
      title: 'Ăn uống cân bằng cho những ngày tập luyện',
      className: 'story-three',
    },
  ];
  return (
    <section className="section stories-section" id="stories">
      <div className="container">
        <div className="stories-top">
          <SectionHeading
            kicker="KIẾN THỨC & CẢM HỨNG"
            title="Mỗi ngày thêm khỏe"
            description="Mẹo tập luyện và cảm hứng giúp bạn tiến gần hơn với mục tiêu."
          />
          <a className="text-link desktop-link" href="#join">
            Xem tất cả bài viết <ArrowRight size={16} />
          </a>
        </div>
        <div className="story-grid">
          {items.map((item) => (
            <article className="story-card" key={item.title}>
              <div className={`story-image ${item.className}`}>
                <Image
                  src={[
                    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=700&q=80',
                    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80',
                    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=700&q=80',
                  ][items.indexOf(item)]}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 90vw, 30vw"
                />
                <span>{item.tag}</span>
              </div>
              <div className="story-body">
                <small>18 THÁNG 9, 2026 · 5 PHÚT ĐỌC</small>
                <h3>{item.title}</h3>
                <a href="#join" aria-label={`Đọc ${item.title}`}>
                  <ArrowRight size={18} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Management() {
  return (
    <section className="management-section" id="management">
      <div className="container">
        <div className="management-head">
          <div>
            <span className="kicker">GYM MANAGEMENT + AI DATABASE</span>
            <h2>
              Vận hành phòng tập
              <br />
              <em>trên một nền tảng.</em>
            </h2>
            <p>
              Dữ liệu hội viên, phân quyền nhân sự và gợi ý thông minh được kết
              nối trong một bảng điều khiển.
            </p>
          </div>
          <div className="ai-chip">
            <Sparkles size={17} />
            <span>
              <b>AI insights</b>
              <small>Cập nhật vừa xong</small>
            </span>
            <span className="live-dot" />
          </div>
        </div>
        <div className="metric-grid">
          {insights.map(({ label, value, change, icon: Icon }) => (
            <article className="metric-card" key={label}>
              <div className="metric-top">
                <span>{label}</span>
                <Icon size={19} />
              </div>
              <strong>{value}</strong>
              <small className="metric-change">{change}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function JoinAndFooter() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <>
      <section className="join-section" id="join">
        <div className="container join-inner">
          <div>
            <span className="kicker">BẮT ĐẦU NGAY HÔM NAY</span>
            <h2>
              Sẵn sàng cho phiên bản
              <br />
              khỏe hơn của bạn?
            </h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <input
              aria-label="Số điện thoại"
              type="tel"
              required
              placeholder="Số điện thoại của bạn"
            />
            <button className="button button-orange" type="submit">
              {submitted ? 'Đã nhận thông tin' : 'Đăng ký tập thử miễn phí'}{' '}
              <ArrowRight size={16} />
            </button>
            <small>
              {submitted
                ? 'Đội ngũ GYMHUNG sẽ liên hệ với bạn sớm.'
                : 'Không mất phí · Không cam kết dài hạn'}
            </small>
          </form>
        </div>
      </section>
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <Logo />
            <a className="button button-white" href="/login?returnTo=%2Fpackages">
              Đăng ký tập thử <ArrowRight size={16} />
            </a>
          </div>
          <div className="footer-columns">
            <div>
              <b>THÔNG TIN</b>
              <a href="#home">Về chúng tôi</a>
              <a href="#experience">Hệ thống phòng tập</a>
              <a href="#stories">Tin tức</a>
            </div>
            <div>
              <b>PHÒNG TẬP</b>
              <a href="#plans">Giá hội viên</a>
              <a href="#branches">Cơ sở vật chất</a>
              <a href="#branches">Tìm chi nhánh</a>
            </div>
            <div>
              <b>CHÍNH SÁCH</b>
              <a href="#join">Chính sách bảo mật</a>
              <a href="#join">Điều khoản sử dụng</a>
              <a href="#join">Chính sách membership</a>
            </div>
            <div className="footer-contact">
              <b>GYMHUNG</b>
              <p>
                Hành trình khỏe mạnh
                <br />
                bắt đầu từ hôm nay.
              </p>
              <a href="tel:1900636920">1900 636 920</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 GYMHUNG. All rights reserved.</span>
            <span>
              Made for every body <Dumbbell size={15} />
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

function FloatingHelp() {
  const [show, setShow] = useState(true);
  return (
    <>
      <div className="floating-left">
        <a href="tel:1900636920" aria-label="Gọi điện">
          <Activity size={19} />
        </a>
        <button aria-label="Trợ giúp">
          <CircleHelp size={19} />
        </button>
      </div>
      {show && (
        <div className="chat-widget">
          <button
            className="chat-close"
            aria-label="Đóng"
            onClick={() => setShow(false)}
          >
            <X size={14} />
          </button>
          <span className="chat-avatar">
            <Sparkles size={15} />
          </span>
          <p>Xin chào! Bạn cần tư vấn gói tập hay tìm phòng tập?</p>
          <a href="#join">
            Tư vấn ngay <ArrowRight size={14} />
          </a>
        </div>
      )}
    </>
  );
}

export default function MarketingHome({ onLogin }) {
  return (
    <div className="marketing-site">
      <Header onLogin={onLogin} />
      <main>
        <Hero />
        <Plans />
        <Experience />
        <Branches />
        <Stories />
        <Management />
        <JoinAndFooter />
      </main>
      <FloatingHelp />
    </div>
  );
}
