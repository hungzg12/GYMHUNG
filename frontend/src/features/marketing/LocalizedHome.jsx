import { useEffect, useState } from 'react';
import VietnameseHome from './MarketingHome';
import EnglishHome from './MarketingHomeEnglish';

export default function LocalizedHome(props) {
  const [language,setLanguage] = useState(()=>{
    try { return localStorage.getItem('gymhung.language') === 'en' ? 'en' : 'vi'; } catch { return 'vi'; }
  });
  useEffect(()=>{
    const change=event=>setLanguage(event.detail === 'en' ? 'en' : 'vi');
    window.addEventListener('gymhung:language',change);
    return()=>window.removeEventListener('gymhung:language',change);
  },[]);
  useEffect(()=>{document.documentElement.lang=language;},[language]);
  return language==='en'?<EnglishHome {...props}/>:<VietnameseHome {...props}/>;
}
