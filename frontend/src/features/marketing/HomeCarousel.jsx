import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import './home-carousel.css';

const slides = [
  {label:'01 / YOUR NEXT CHAPTER',title:'GYM HUNG',line:'Mạnh hơn. Mỗi ngày.',copy:'Dành thời gian cho chính mình. Bắt đầu hành trình tập luyện theo nhịp sống của bạn.',image:'photo-1534438327276-14e5300c3a48',action:'Khám phá gói tập',href:'#plans',tag:'MOVE · TRAIN · REPEAT'},
  {label:'02 / STRENGTH',title:'XÂY NỀN SỨC MẠNH',line:'Từng lần nâng. Từng bước tiến.',copy:'Không gian tập sức mạnh cho những mục tiêu lớn và những tiến bộ nhỏ mỗi ngày.',image:'photo-1581009146145-b5ef050c2e1e',action:'Khám phá không gian',href:'#experience',tag:'STRONGER THAN YESTERDAY'},
  {label:'03 / CARDIO',title:'TÌM NHỊP CỦA BẠN',line:'Thêm năng lượng cho ngày mới.',copy:'Chạy, đạp xe và vận động theo tốc độ của riêng bạn.',image:'photo-1538805060514-97d9cc17730c',action:'Tìm phòng tập',href:'#branches',tag:'MAKE YOUR MOVE'},
  {label:'04 / TOGETHER',title:'TẬP CÙNG NHAU',line:'Năng lượng được lan tỏa.',copy:'Khám phá những buổi tập kết nối và tìm thêm động lực từ cộng đồng.',image:'photo-1518611012118-696072aa579a',action:'Bắt đầu trải nghiệm',href:'#join',tag:'GOOD ENERGY. GREAT COMPANY.'},
  {label:'05 / PERSONAL TRAINING',title:'MỤC TIÊU CỦA BẠN',line:'Có người đồng hành.',copy:'Trao đổi với huấn luyện viên để xây dựng hướng tập phù hợp với mục tiêu và thể lực.',image:'photo-1571019613454-1cb2f99b2d8b',action:'Đăng ký tư vấn',href:'#join',tag:'YOUR GOALS. YOUR JOURNEY.'},
  {label:'06 / YOUR SPACE',title:'KHÔNG GIAN BỨT PHÁ',line:'Một nơi để trở lại mỗi ngày.',copy:'Thiết bị, không gian và những tiện ích giúp bạn tập trung trọn vẹn vào buổi tập.',image:'photo-1534438327276-14e5300c3a48',action:'Xem cơ sở vật chất',href:'#experience',tag:'ROOM TO GROW'},
  {label:'07 / START TODAY',title:'BẮT ĐẦU HÔM NAY',line:'Phiên bản mới bắt đầu từ bạn.',copy:'Chọn gói tập phù hợp và đăng ký trải nghiệm để tìm nhịp tập luyện của mình.',image:'photo-1517836357463-d25dfeac3438',action:'Đăng ký trải nghiệm',href:'#join',tag:'THIS IS YOUR MOMENT'},
];
export default function HomeCarousel() {
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  const hovered=false;
  const [reduced,setReduced]=useState(true);
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{if(paused||hovered||reduced)return;const timer=setInterval(()=>setActive(index=>(index+1)%slides.length),6500);return()=>clearInterval(timer);},[paused,hovered,reduced,active]);
  const slide=slides[active];
  const move=direction=>setActive(index=>(index+direction+slides.length)%slides.length);
  return <section id="home" className="gym-carousel" aria-label="Khám phá GYM HUNG" aria-roledescription="carousel">
    <div className="gym-carousel-media" aria-hidden="true">{slides.map((item,index)=><img key={item.label} className={index===active?'is-active':''} src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=1920&q=85`} alt="" loading={index===0?'eager':'lazy'} onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src='/assets/facility.png';}}/>)}</div>
    <div className="gym-carousel-content" aria-live={paused||hovered?'polite':'off'}>
      <span className="gym-slide-label">{slide.label}</span>
      <h1>{slide.title}</h1><h2>{slide.line}</h2><p>{slide.copy}</p>
      <a className="gym-slide-cta" href={slide.href}>{slide.action}<ArrowRight size={19}/></a>
    </div>
    <div className="gym-slide-rail"><span>{slide.tag}</span><a href="#plans">KHÁM PHÁ THÊM <ArrowRight size={15}/></a></div>
    <div className="gym-carousel-controls">
      <div className="gym-slide-dots" aria-label="Chọn slide">{slides.map((item,index)=><button type="button" key={item.label} aria-label={`Slide ${index+1}: ${item.title}`} aria-current={index===active?'true':undefined} onClick={()=>setActive(index)}><span className={index===active?'selected':''}/></button>)}</div>
      <div className="gym-slide-nav"><span>{String(active+1).padStart(2,'0')} <small>/ 07</small></span><button type="button" aria-label="Slide trước" title="Slide trước" onClick={()=>move(-1)}><ArrowLeft size={20}/></button><button type="button" aria-label="Slide tiếp theo" title="Slide tiếp theo" onClick={()=>move(1)}><ArrowRight size={20}/></button><button type="button" aria-label={paused?'Tiếp tục trình chiếu':'Tạm dừng trình chiếu'} title={paused?'Tiếp tục':'Tạm dừng'} onClick={()=>setPaused(!paused)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button></div>
    </div>
  </section>;
}
