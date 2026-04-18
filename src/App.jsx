// ⭐ 將您從 Google Apps Script 部署取得的 Web App URL 貼在這裡
// 如果保持空白 ("")，系統會自動啟動「本地快取模式」，方便您在未連線資料庫時也能測試 UI
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyMEAxjXMloN5TrtufJ6DwRE1bLvnSbEpjuFbRHdbeD1ZbntoQA5TaOMqmpEzfLFLAh/exec"; 

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Package, Search, User, LogOut, CheckCircle, XCircle, Plus, 
  Menu, X, AlertCircle, Trash2, AlertTriangle, ShieldCheck, 
  Lock, Calendar, ShoppingCart, Printer, FileDown, Upload,
  Filter, Settings, Tag, Users, Eye, BarChart3, Edit, FileText,
  TrendingUp, Activity
} from 'lucide-react';

// === API 串接與本地雙軌模式服務 ===
const api = {
  async getInventory() {
    if (GAS_API_URL) {
      const res = await fetch(`${GAS_API_URL}?action=getInventory`);
      return await res.json();
    } else {
      // 本地快取模式
      const data = JSON.parse(localStorage.getItem('mockDB') || 'null');
      if (data) return data;
      const initial = {
        types: ['攝影器材', '收音設備', '配件', '其他'],
        items: [{ id: 'IT1001', name: 'MacBook Pro M2', type: '筆記型電腦', qty: 3, status: 'available' }],
        users: [
          { id: 'U_00000_0', name: '管理員測試', phoneLast5: '00000', role: 'admin', status: 'active' },
          { id: 'U_11111_1', name: '會員測試', phoneLast5: '11111', role: 'user', status: 'active' }
        ],
        reservations: []
      };
      localStorage.setItem('mockDB', JSON.stringify(initial));
      return initial;
    }
  },
  async addReservation(reservation) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addReservation', reservation })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.reservations.push(reservation);
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async updateStatus(resId, status) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStatus', resId, status })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      const target = db.reservations.find(r => r.id === resId);
      if(target) target.status = status;
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async addUser(user) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addUser', user })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.users.push(user);
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async addItem(item) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addItem', item })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.items.push(item);
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  }
};

const LOGO_FULL_URL = "種種影像淺色.png"; 
const LOGO_ICON_URL = "種種影像圖案.png"; 

// === 系統全域樣式 (CSS) ===
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif+TC:wght@200..900&family=Sekuya&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap');

  body {
    background-color: #0b0b0e;
    margin: 0;
    color: #f1f5f9; 
    font-family: 'Kosugi Maru', 'Noto Sans', sans-serif;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image: url("https://i.pinimg.com/736x/fa/1c/ea/fa1ceaa99d579a7663a329c5714eae3d.jpg");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }

  body::after {
    content: "";
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.1; 
    pointer-events: none; 
    z-index: 9999;
  }

  .font-tc1 { font-family: 'Noto Serif TC', 'Sekuya', serif; }
  .font-tc2 { font-family: 'Kosugi Maru', 'Noto Sans', sans-serif; }
  
  .shadow-glass { box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0, 0, 0, 0.5); }
  .shadow-btn { box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 6px 18px rgba(14, 165, 233, 0.14); }
  .shadow-btn-danger { box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 6px 18px rgba(138, 114, 123, 0.14); }
  .shadow-btn-success { box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 6px 18px rgba(118, 141, 131, 0.14); }

  .space-light-ball {
    position: absolute;
    border-radius: 50%;
    background: #ffffff;
    filter: blur(4px);
    box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.9), 
                0 0 25px 8px rgba(255, 255, 255, 0.5),
                0 0 60px 15px rgba(255, 255, 255, 0.2); 
    z-index: 1; 
  }

  .flicker-1 { animation: breathingFlicker 4.5s infinite alternate ease-in-out; }
  .flicker-2 { animation: breathingFlicker 6.5s infinite alternate-reverse ease-in-out; }
  .flicker-3 { animation: breathingFlicker 5.5s infinite alternate ease-in-out; }

  @keyframes breathingFlicker {
    0% { opacity: 0.6; transform: scale(0.85); box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.6), 0 0 20px 5px rgba(255, 255, 255, 0.3); }
    50% { opacity: 1; transform: scale(1.15); box-shadow: 0 0 15px 4px rgba(255, 255, 255, 1), 0 0 35px 12px rgba(255, 255, 255, 0.7); }
    100% { opacity: 0.75; transform: scale(0.95); box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8), 0 0 25px 8px rgba(255, 255, 255, 0.4); }
  }

  ::-webkit-scrollbar { width: 10px; }
  ::-webkit-scrollbar-track { background: #3e4f6d; }
  ::-webkit-scrollbar-thumb { background: #f9ca65; border-radius: 10px; }
  
  ::-webkit-calendar-picker-indicator { filter: invert(1); }

  /* 彈跳回饋核心類別：套用在各類按鈕上 */
  .click-pop {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
    will-change: transform;
  }
  .click-pop:active:not(:disabled) {
    transform: scale(0.92) !important;
    /* 按下時瞬間壓縮，不帶延遲 */
    transition: transform 0.05s ease-out, background-color 0.05s ease, box-shadow 0.05s ease !important;
  }

  @keyframes popBadge {
    0% { transform: scale(1); }
    30% { transform: scale(1.6); background-color: #f87171; box-shadow: 0 0 20px rgba(239, 68, 68, 0.9); }
    70% { transform: scale(1.3); background-color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.7); }
    100% { transform: scale(1); }
  }

  /* 小視窗彈跳進場 */
  @keyframes windowPopIn {
    0% { opacity: 0; transform: scale(0.9) translateY(15px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  .window-pop-in {
    animation: windowPopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    will-change: transform, opacity;
  }

  /* 小視窗縮小退場 */
  @keyframes windowPopOut {
    0% { opacity: 1; transform: scale(1) translateY(0); }
    100% { opacity: 0; transform: scale(0.9) translateY(-15px); }
  }
  .window-pop-out {
    animation: windowPopOut 0.3s cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
    will-change: transform, opacity;
  }

  /* 背景淡入與淡出 */
  @keyframes backdropFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes backdropFadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
  .backdrop-fade-in { animation: backdropFadeIn 0.3s ease-out forwards; }
  .backdrop-fade-out { animation: backdropFadeOut 0.3s ease-out forwards; }

  @keyframes pageReveal { 0% { opacity: 0; } 100% { opacity: 1; } }
  .page-reveal { animation: pageReveal 0.72s ease-out; will-change: opacity; }

  @keyframes contentReveal { 0% { opacity: 0; transform: translateY(18px); } 100% { opacity: 1; transform: translateY(0); } }
  .content-reveal { animation: contentReveal 0.82s cubic-bezier(0.22, 1, 0.36, 1); will-change: opacity, transform; }

  @keyframes searchFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
  .search-fade { animation: searchFadeIn 0.42s ease-in-out; will-change: opacity; pointer-events: none; }
  .search-fade .toolbar-shell, .search-fade .toolbar-leading, .search-fade .toolbar-morph, .search-fade .circle-add-btn, .search-fade input, .search-fade select, .search-fade button { pointer-events: auto; }
  
  .circle-add-btn {
    padding: 0 !important; min-width: 2.75rem !important; max-width: 2.75rem !important; width: 2.75rem !important;
    min-height: 2.75rem !important; height: 2.75rem !important; max-height: 2.75rem !important; line-height: 1 !important;
    aspect-ratio: 1 / 1 !important; border-radius: 9999px !important; background: transparent !important;
    border: 1px solid rgba(255,255,255,0.16) !important; color: rgba(237,247,255,0.88) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.14) !important;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s, box-shadow 0.2s, border-color 0.2s, color 0.2s !important;
    will-change: transform;
  }
  .circle-add-btn:hover:not(:disabled) { border-color: rgba(125, 168, 201, 0.28) !important; color: rgba(245,250,255,0.98) !important; }
  .circle-add-btn:active:not(:disabled) {
    background: rgba(14, 165, 233, 0.88) !important; border-color: rgba(14, 165, 233, 0.92) !important; color: #ffffff !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(14,165,233,0.24), 0 0 14px rgba(14,165,233,0.22) !important;
    transform: scale(0.85) !important;
    transition: transform 0.05s ease-out, background-color 0.05s, box-shadow 0.05s, border-color 0.05s !important;
  }

  .press-reveal-btn {
    background: transparent !important; border: 1px solid rgba(255,255,255,0.12) !important;
    color: rgba(233,240,247,0.90) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.14) !important;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s, box-shadow 0.2s, border-color 0.2s, color 0.2s !important;
    will-change: transform;
  }
  .press-reveal-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.18) !important; color: #ffffff !important; }
  .press-reveal-btn:active:not(:disabled) {
    background: rgba(14, 165, 233, 0.88) !important; border-color: rgba(14, 165, 233, 0.92) !important; color: #ffffff !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(14,165,233,0.24), 0 0 14px rgba(14,165,233,0.22) !important;
    transform: scale(0.92) !important;
    transition: transform 0.05s ease-out, background-color 0.05s, box-shadow 0.05s, border-color 0.05s !important;
  }

  .toolbar-shell { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:nowrap; min-width:0; }
  .search-fade .toolbar-shell { justify-content: flex-end; background: transparent !important; border: 0 !important; box-shadow: none !important; }
  .toolbar-leading { display:flex; align-items:center; gap:0.75rem; min-width:0; flex:1; }
  .search-fade .toolbar-leading { justify-content: flex-end; margin-left: auto; }
  
  .search-fade .toolbar-morph {
    display: flex; align-items: center; justify-content: flex-end; width: 2.75rem; min-width: 2.75rem; height: 2.75rem;
    border-radius: 9999px; overflow: hidden; flex-shrink: 0; transition: width 0.34s cubic-bezier(0.22, 0.61, 0.36, 1), background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    background: transparent; border: 1px solid rgba(255,255,255,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.14);
    position: relative; /* 加入相對定位，讓 select 可以絕對定位覆蓋 */
  }
  .search-fade .toolbar-morph.is-open { width: 12.5rem; background: rgba(0,0,0,0.38); border-color: rgba(255,255,255,0.2); }
  
  /* 移除這邊原本多餘的 pointer-events: none; 讓搜尋鈕恢復點擊 */
  .search-fade .toolbar-morph-btn { width: 2.75rem; min-width: 2.75rem; height: 2.75rem; display: flex; align-items: center; justify-content: center; border: 0; background: transparent; color: rgba(237,247,255,0.88); cursor: pointer; flex-shrink: 0; padding: 0; position: relative; z-index: 1; }
  
  .search-fade .toolbar-morph-field {
    width: 0; opacity: 0; border: 0; outline: none; background: transparent; color: #fff; pointer-events: none;
    transition: opacity 0.18s ease, width 0.34s cubic-bezier(0.22, 0.61, 0.36, 1); font-size: 13px; letter-spacing: 0.08em; padding: 0; appearance: none; -webkit-appearance: none; -moz-appearance: none;
    position: relative; z-index: 2;
  }
  .search-fade .toolbar-morph.is-open .toolbar-morph-field { width: calc(100% - 2.75rem); opacity: 1; pointer-events: auto; padding-right: 0.9rem; }
  
  /* 針對 Select 的特殊覆蓋處理：未展開時覆蓋在按鈕上方，透明度 0 但可點擊 */
  .search-fade .toolbar-morph-select.is-closed-cover {
    position: absolute; right: 0; top: 0; width: 2.75rem; height: 2.75rem; opacity: 0 !important; pointer-events: auto !important; cursor: pointer;
  }

  @media (max-width: 767px) {
    .search-fade .toolbar-morph, .search-fade .toolbar-morph-btn { width: 2.5rem; min-width: 2.5rem; height: 2.5rem; }
    .search-fade .toolbar-morph.is-open { width: min(11rem, calc(100vw - 9rem)); }
    .search-fade .toolbar-morph.is-open .toolbar-morph-field { width: calc(100% - 2.5rem); }
    .search-fade .toolbar-morph-select.is-closed-cover { width: 2.5rem; height: 2.5rem; }
    .toolbar-shell { gap:0.5rem; } .toolbar-leading { gap:0.5rem; }
  }
`;

// === 輔助函式 ===
const isDateOverlap = (startD1, startT1, endD1, endT1, startD2, startT2, endD2, endT2) => {
  const dtStart1 = new Date(`${startD1}T${startT1 || '00:00'}`).getTime();
  const dtEnd1 = new Date(`${endD1}T${endT1 || '23:59'}`).getTime();
  const dtStart2 = new Date(`${startD2}T${startT2 || '00:00'}`).getTime();
  const dtEnd2 = new Date(`${endD2}T${endT2 || '23:59'}`).getTime();
  return dtStart1 < dtEnd2 && dtEnd1 > dtStart2; 
};

const generateResId = (reservations) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `ch${yyyy}${mm}${dd}`;
  
  const todayRes = reservations.filter(r => r?.id?.startsWith(prefix));
  const maxNum = todayRes.reduce((max, r) => {
    const numStr = r.id.replace(prefix, '');
    const num = parseInt(numStr, 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  
  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`;
};

// === 元件定義 ===
const Button = ({ children, onClick, variant = 'primary', className = '', type = "button", ...props }) => {
  // 將基底樣式加上 click-pop 以支援果凍彈跳回饋
  const baseStyle = "click-pop px-4 py-2 rounded-full font-medium tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-[13px] md:text-[15px]";
  const variants = {
    // 增加 active 時的光暈感，配合縮放更有按壓的實感
    primary: "bg-sky-500/[0.34] text-[#edf7ff] hover:bg-sky-500/[0.28] active:bg-sky-500 active:shadow-[0_0_14px_rgba(14,165,233,0.4)] border border-sky-500/20 shadow-btn",
    secondary: "bg-white/[0.045] text-gray-200 border border-white/8 hover:bg-white/[0.07] active:bg-white/[0.05]",
    danger: "bg-[#5b4f55]/[0.34] text-[#eadfe3] hover:bg-[#5b4f55]/[0.28] active:bg-[#5b4f55]/[0.22] active:shadow-[0_0_14px_rgba(138,114,123,0.4)] border border-[#8d7a83]/[0.18] shadow-btn-danger",
    success: "bg-[#53635d]/[0.34] text-[#e4efe9] hover:bg-[#53635d]/[0.28] active:bg-[#53635d]/[0.22] active:shadow-[0_0_14px_rgba(118,141,131,0.4)] border border-[#83958d]/[0.18] shadow-btn-success",
    ghost: "bg-transparent text-gray-300 hover:bg-white/[0.06] hover:text-white"
  };
  return <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ status, type = 'item' }) => {
  const styles = {
    available: "bg-[#33463f]/30 text-[#b6c9bf] border-[#5d7469]/22",
    borrowed: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    maintenance: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    inquire: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    active: "bg-sky-500/[0.18] text-[#bfe6ff] border-sky-500/24",
    returned: "bg-white/[0.04] text-gray-400 border-white/10",
    renewable: "bg-[#33463f]/30 text-[#b6c9bf] border-[#5d7469]/22",
    '審核中': "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    '已借出': "bg-sky-500/[0.18] text-[#bfe6ff] border-sky-500/24",
    '已退回': "bg-white/[0.04] text-gray-400 border-white/10",
    '已歸還': "bg-white/[0.04] text-gray-400 border-white/10",
    admin: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    user: "bg-white/[0.04] text-gray-400 border-white/10"
  };

  const labels = {
    available: "在架上", borrowed: "已出借", maintenance: "維修中",
    inquire: "請洽詢", active: "使用中", returned: "已歸還",
    renewable: "可續借", '審核中': "審核中", '已借出': "已借出",
    '已退回': "已退回", '已歸還': "已歸還", admin: "管理員", user: "一般用戶"
  };

  let label = labels[status] || status;
  if (type === 'user') {
    if (status === 'active') label = '已啟用';
    if (status === 'pending') label = '待審核';
  }

  return <span className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-medium tracking-wider border whitespace-nowrap leading-none ${styles[status] || styles.available}`}>{label}</span>;
};

const Modal = ({ isOpen, onClose, title, children, type = "default", size = "md", placement = "center" }) => {
  const [render, setRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
      setIsClosing(false);
    } else if (render) {
      setIsClosing(true);
      const timer = setTimeout(() => setRender(false), 300); // 配合 CSS 退場動畫時間
      return () => clearTimeout(timer);
    }
  }, [isOpen, render]);

  if (!render) return null;
  const headerColor = type === "danger" ? "text-[#c4a8b2]" : "text-white";
  const maxWidth = size === "lg" ? "max-w-2xl" : (size === "sm" ? "max-w-md" : "max-w-lg");
  return (
    <div className={`fixed inset-0 z-[60] flex ${placement === "top" ? "items-start justify-center pt-24 md:pt-28" : "items-center justify-center"} p-4 bg-black/70 backdrop-blur-sm print:hidden ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}>
      <div className={`bg-black/60 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto transform transition-all ${isClosing ? 'window-pop-out' : 'window-pop-in'}`}>
        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-black/40 z-10">
          <h3 className={`text-lg md:text-xl font-bold tracking-wider whitespace-nowrap ${headerColor} flex items-center gap-2`}>
            {type === "danger" && <AlertTriangle size={24} />}
            {title}
          </h3>
          <button onClick={onClose} className="click-pop text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 text-gray-200">{children}</div>
      </div>
    </div>
  );
};

const Dialog = ({ dialog, closeDialog }) => {
  const [render, setRender] = useState(dialog.isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (dialog.isOpen) {
      setRender(true);
      setIsClosing(false);
    } else if (render) {
      setIsClosing(true);
      const timer = setTimeout(() => setRender(false), 300); // 配合 CSS 退場動畫時間
      return () => clearTimeout(timer);
    }
  }, [dialog.isOpen, render]);

  if (!render) return null;
  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}>
      <div className={`bg-black/60 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 ${isClosing ? 'window-pop-out' : 'window-pop-in'}`}>
        <h3 className="text-[15px] md:text-[17px] font-bold tracking-wider mb-3 flex items-center gap-2 text-white whitespace-nowrap">
          {dialog.type === 'confirm' ? <AlertTriangle className="text-[#c4a8b2]" size={24}/> : <AlertCircle className="text-sky-500" size={24}/>}
          {dialog.type === 'confirm' ? '請確認操作' : '系統提示'}
        </h3>
        <p className="text-[13px] md:text-[15px] text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed tracking-wider">{dialog.message}</p>
        <div className="flex justify-end gap-3">
          {dialog.type === 'confirm' && (
            <Button variant="secondary" onClick={closeDialog}>取消</Button>
          )}
          <Button variant={dialog.type === 'confirm' ? 'danger' : 'primary'} onClick={() => {
            if (dialog.onConfirm) dialog.onConfirm();
            closeDialog();
          }}>
            確定
          </Button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, onRegister, authError, authSuccess, clearAuthMsg }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', phoneLast5: '' });
  const [loginCode, setLoginCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(loginCode);
    } else {
      onRegister(form);
      setMode('login');
      setForm({ name: '', phoneLast5: '' }); 
      setLoginCode('');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent flex items-center justify-center p-4 relative">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-glass w-full max-w-md transition-all duration-300 z-10 window-pop-in">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="h-16 md:h-20 w-auto flex items-center justify-center mb-4 relative">
            <img src={LOGO_ICON_URL} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          </div>
          <p className="text-gray-400 mt-2 text-sm tracking-widest">{mode === 'login' ? '請輸入密碼' : '註冊新帳號'}</p>
        </div>

        {authSuccess && <div className="mb-4 p-3 bg-[#61756c]/[0.34] border border-[#83958d]/[0.34] text-[#d7e7df] text-sm tracking-wider rounded-xl flex items-center gap-2"><CheckCircle size={16} />{authSuccess}</div>}
        {authError && <div className="mb-4 p-3 bg-[#66545c]/[0.34] border border-[#8a727b]/[0.34] text-[#eadce2] text-sm tracking-wider rounded-xl flex items-center gap-2"><AlertCircle size={16} />{authError}</div>}
        
        {/* 利用 key={mode} 強制 React 重新掛載此區塊，觸發切換彈跳動畫 */}
        <form key={mode} onSubmit={handleSubmit} className="space-y-4 window-pop-in">
          {mode === 'login' ? (
             <div>
               <div className="relative">
                 <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
                 <input 
                   type="text" 
                   maxLength="5"
                   pattern="\d{5}"
                   value={loginCode} 
                   onChange={(e) => setLoginCode(e.target.value)} 
                   className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-center text-xl md:text-2xl tracking-widest font-bold text-white placeholder-gray-600 transition-all shadow-inner" 
                   placeholder="_____" 
                   required 
                 />
               </div>
             </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-widest">會員名稱</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="w-full px-4 py-2 bg-black/40 text-white border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-inner" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-widest">會員密碼</label>
                <input 
                  type="text" 
                  maxLength="5"
                  pattern="\d{5}"
                  value={form.phoneLast5} 
                  onChange={(e) => setForm({...form, phoneLast5: e.target.value})} 
                  className="w-full px-4 py-2 bg-black/40 text-white border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-inner" 
                  placeholder="例如: 12345"
                  required 
                />
              </div>
            </>
          )}
          
          {/* 已移除寫死的動畫類別，全面改吃 click-pop 果凍動畫 */}
          <Button type="submit" className="w-full mt-8 py-3 text-[15px] md:text-[17px]">
            {mode === 'login' ? '登入' : '送出註冊'}
          </Button>

          <div className="text-center mt-6">
            <span className="text-sm text-gray-400 tracking-wider">{mode === 'login' ? '找不到帳號？' : '已經有帳號？'}</span>
            <button 
              type="button" 
              onClick={() => { 
                setMode(mode === 'login' ? 'register' : 'login'); 
                clearAuthMsg(); 
                setForm({ name: '', phoneLast5: '' });
                setLoginCode('');
              }} 
              className="ml-2 text-sm text-sky-500 font-bold tracking-wider hover:text-sky-300 hover:underline transition-all whitespace-nowrap"
            >
              {mode === 'login' ? '申請加入' : '返回登入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ItemCard = ({ item, reservations, onAddToCart, currentUser }) => {
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const pressTimer = useRef(null);
  const isPressing = useRef(false);

  const handleTouchStart = () => {
    isPressing.current = false;
    pressTimer.current = setTimeout(() => {
      setShowMobileDetails(true);
      isPressing.current = true;
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 300); 
  };

  const handleTouchMove = () => {};

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setShowMobileDetails(false);
    isPressing.current = false;
  };

  const handleMouseDown = () => {
    isPressing.current = false;
    pressTimer.current = setTimeout(() => {
      setShowMobileDetails(true);
      isPressing.current = true;
    }, 300);
  };

  const handleMouseMove = () => {};

  const handleMouseUpOrLeave = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setShowMobileDetails(false);
    isPressing.current = false;
  };

  const itemReservations = reservations
    .filter(r => r.status === '已借出')
    .flatMap(r => r.items
      .filter(i => i.itemId === item.id || i.name === item.name)
      .map(i => ({ ...i, userId: r.userId, userName: r.userName }))
    );

  const now = new Date();
  const currentUses = itemReservations
    .filter(i => {
      const start = new Date(`${i.startDate}T${i.startTime || '00:00'}`);
      const effectiveStart = new Date(start.getTime() - 2 * 60 * 60 * 1000);
      const end = new Date(`${i.endDate}T${i.endTime || '23:59'}`);
      return now >= effectiveStart && now <= end;
    });

  const currentlyUsedQty = currentUses.reduce((sum, i) => sum + (i.borrowQty || 1), 0);
  const currentRemainingQty = item.qty - currentlyUsedQty;
  const isOutOfStock = currentRemainingQty <= 0;
  
  const isCurrentlyBorrowedByMe = currentUses.some(i => i.userId === currentUser?.id || i.userName === currentUser?.name);
  
  let displayStatus = item.status;
  if (displayStatus !== 'maintenance' && displayStatus !== 'inquire') {
    if (isCurrentlyBorrowedByMe) {
      displayStatus = 'renewable';
    } else {
      displayStatus = isOutOfStock ? 'borrowed' : 'available';
    }
  }

  return (
    <div 
      className={`bg-white/5 backdrop-blur-xl rounded-3xl shadow-glass border border-white/10 p-4 md:p-6 flex flex-col hover:-translate-y-1 hover:bg-white/10 transition-all select-none ${displayStatus !== 'available' && displayStatus !== 'renewable' ? 'opacity-80' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onContextMenu={(e) => { 
        if (window.innerWidth < 768) e.preventDefault(); 
      }}
    >
      <div className="flex flex-col gap-2.5 md:gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <h3 className="font-bold text-[15px] md:text-[17px] text-white tracking-wider line-clamp-2 leading-snug whitespace-normal break-words flex-1 min-w-0">
                {item.name}
              </h3>
              <button 
                className={`circle-add-btn flex-shrink-0 flex items-center justify-center text-2xl font-bold ${displayStatus === 'available' || displayStatus === 'renewable' ? '' : 'text-gray-500 border-white/10 cursor-not-allowed opacity-60'}`}
                disabled={displayStatus !== 'available' && displayStatus !== 'renewable'} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (displayStatus === 'available' || displayStatus === 'renewable') {
                    onAddToCart && onAddToCart(item); 
                  }
                }}
                title={displayStatus === 'available' ? '加入預約單' : (displayStatus === 'renewable' ? '申請續借' : '暫不可借用')}
                aria-label={displayStatus === 'available' ? '加入預約單' : (displayStatus === 'renewable' ? '申請續借' : '暫不可借用')}
              >
                {displayStatus === 'available' || displayStatus === 'renewable' ? <Plus size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center bg-black/40 text-gray-300 border border-white/10 text-[11px] md:text-xs px-3 py-1 rounded-full shadow-sm tracking-wider whitespace-nowrap leading-none">{item.type}</span>
          <span className={`inline-flex items-center text-[11px] md:text-xs font-semibold px-3 py-1 rounded-full border shadow-sm tracking-wider whitespace-nowrap leading-none ${isOutOfStock ? 'text-[#eadce2] bg-[#66545c]/[0.38] border-[#8a727b]/[0.34]' : 'text-[#d4eeff] bg-sky-500/[0.22] border-sky-500/[0.28]'}`}>
            剩餘: {currentRemainingQty > 0 ? currentRemainingQty : 0} / {item.qty}
          </span>
          <Badge status={displayStatus} />
        </div>
      </div>

      <div className={`grid md:flex ${showMobileDetails ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} md:opacity-100 mt-4 md:mt-4 transition-all duration-500 ease-in-out border-t md:border-t-0 border-white/10 pt-4 md:pt-0 flex-1 overflow-hidden`}>
        <div className="min-h-0">
          <p className="text-xs md:text-sm text-gray-400 mb-3 line-clamp-2 tracking-wider">配件: {item.accessories || '無'}</p>
          
          {itemReservations.length > 0 && (
            <div className="mb-4 bg-[#4d3c43]/30 border border-[#7c666d]/40 p-3 rounded-2xl text-xs md:text-sm text-[#c2acb3]">
              <p className="font-bold mb-1 flex items-center gap-1 tracking-wider whitespace-nowrap"><Calendar size={12}/> 已被預約時段：</p>
              <ul className="list-disc pl-4 space-y-1">
                {itemReservations.map((ir, idx) => (
                  <li key={idx} className="tracking-wider">{ir.startDate} {ir.startTime || '00:00'} ~ {ir.endDate} {ir.endTime || '23:59'} <span className="font-bold whitespace-nowrap">(借 {ir.borrowQty} 件)</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserDashboard = ({ items = [], itemTypes = [], reservations = [], onAddToCart, isSimulatingUser, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);

  const openSearchMorph = () => {
    setIsSearchOpen(true);
    setIsFilterOpen(false); // 展開搜尋時，強制收攏類型選單
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearchMorph = () => {
    if (!searchTerm.trim()) setIsSearchOpen(false);
  };

  const handleFilterClick = () => {
    setIsFilterOpen(true);
    setIsSearchOpen(false); // 展開類型選單時，強制收攏搜尋
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full">
      <div className="search-fade fixed left-0 right-0 z-40 bg-transparent py-3 transition-opacity" style={{top: "64px"}}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 toolbar-shell">
          <div className="toolbar-leading">
            <div className={`toolbar-morph ${isFilterOpen ? 'is-open' : ''}`}>
              {/* 將 pointer-events-none 單獨加在篩選鈕上，確保點擊穿透給下方的 select */}
              <button type="button" className="toolbar-morph-btn pointer-events-none" aria-label="展開類型選單">
                <Filter size={18} />
              </button>
              <select 
                className={`toolbar-morph-field toolbar-morph-select ${!isFilterOpen ? 'is-closed-cover' : ''}`}
                value={filterType}
                onClick={handleFilterClick}
                onChange={(e) => setFilterType(e.target.value)}
                onBlur={() => setIsFilterOpen(false)}
              >
                <option value="all">所有類型</option>
                {itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
              {/* 拿掉之前無效的 pointer-events-auto，並讓 onClick 恢復運作 */}
              <button type="button" className="click-pop toolbar-morph-btn" onClick={openSearchMorph} aria-label="展開搜尋欄">
                <Search size={18} />
              </button>
              <input 
                ref={searchInputRef}
                className="toolbar-morph-field toolbar-morph-input"
                placeholder="搜尋物件名稱..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="content-reveal pt-28 md:pt-28 space-y-6 relative z-10">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl py-16 rounded-3xl border border-white/10 shadow-glass px-4">
            <Package size={64} className="text-gray-600 mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-gray-300 tracking-wider text-center whitespace-nowrap">目前沒有符合的器材</h3>
            <p className="text-gray-500 mt-2 text-xs md:text-sm max-w-md text-center tracking-wider">
              若是剛開啟系統，資料可能還在載入中；或者您可以嘗試更換上方的關鍵字與分類。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                reservations={reservations} 
                onAddToCart={onAddToCart} 
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = ({ items = [], users = [], reservations = [] }) => {
  const stats = useMemo(() => {
    const itemCounts = {}; 
    const userRequestCounts = {}; 
    const userDistinctItems = {};

    reservations.filter(r => r.status === '已借出' || r.status === '已歸還').forEach(r => {
      userRequestCounts[r.userId] = (userRequestCounts[r.userId] || 0) + 1;
      if (!userDistinctItems[r.userId]) userDistinctItems[r.userId] = new Set();
      r.items.forEach(item => {
        const idToUse = item.itemId || item.name;
        itemCounts[idToUse] = (itemCounts[idToUse] || 0) + (item.borrowQty || 1);
        userDistinctItems[r.userId].add(idToUse);
      });
    });

    const topItems = Object.keys(itemCounts)
      .map(id => ({ name: items.find(i => i.id === id || i.name === id)?.name || id, count: itemCounts[id] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    
    const topUserRequests = Object.keys(userRequestCounts)
      .map(id => ({ name: users.find(u => u.id === id)?.name || id, count: userRequestCounts[id] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    const topUserDistinct = Object.keys(userDistinctItems)
      .map(id => ({ name: users.find(u => u.id === id)?.name || id, count: userDistinctItems[id].size }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    const maxItemCount = Math.max(...topItems.map(i => i.count), 1);
    const maxReqCount = Math.max(...topUserRequests.map(u => u.count), 1);
    const maxDistCount = Math.max(...topUserDistinct.map(u => u.count), 1);

    return { topItems, topUserRequests, topUserDistinct, maxItemCount, maxReqCount, maxDistCount };
  }, [items, reservations, users]);

  const BarChart = ({ data, max, color = "bg-sky-500", labelSuffix = "次" }) => (
    <div className="space-y-3">
      {data.length > 0 ? data.map((d, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-24 md:w-28 text-xs md:text-sm text-gray-300 truncate text-right font-medium tracking-wider">{d.name}</div>
          <div className="flex-1 h-3 md:h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div 
              className={`h-full ${color} rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor] opacity-90`} 
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <div className="w-10 md:w-12 text-[10px] md:text-xs text-gray-400 tracking-widest whitespace-nowrap">{d.count} {labelSuffix}</div>
        </div>
      )) : <p className="text-center text-gray-500 text-sm py-4 tracking-widest">尚無數據</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="content-reveal grid md:grid-cols-2 gap-6 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><TrendingUp size={18} className="text-sky-500"/> 熱門器材 (總借出件數)</h3>
          <BarChart data={stats.topItems} max={stats.maxItemCount} color="bg-sky-500" labelSuffix="件" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><Users size={18} className="text-[#b1c8be]"/> 會員活躍度 (申請次數)</h3>
          <BarChart data={stats.topUserRequests} max={stats.maxReqCount} color="bg-[#61756c]" labelSuffix="次" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10 md:col-span-2">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><Activity size={18} className="text-[#c4a8b2]"/> 探索廣度 (借過不同物件數)</h3>
          <BarChart data={stats.topUserDistinct} max={stats.maxDistCount} color="bg-[#66545c]" labelSuffix="種" />
        </div>
      </div>
    </div>
  );
};

const AdminUsers = ({ users = [], onUpdateUser, onAddUser, showAlert }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', phoneLast5: '', role: 'user', department: '' });

  const openSearchMorph = () => {
    setIsSearchOpen(true);
    setIsFilterOpen(false); // 展開搜尋時，強制收攏類型選單
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearchMorph = () => {
    if (!searchTerm.trim()) setIsSearchOpen(false);
  };

  const handleFilterClick = () => {
    setIsFilterOpen(true);
    setIsSearchOpen(false); // 展開類型選單時，強制收攏搜尋
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || (user.phoneLast5 || '').includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (user = null) => {
    // 點擊新增會員時，強制收攏所有展開的常駐欄位
    setIsSearchOpen(false);
    setIsFilterOpen(false);
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, phoneLast5: user.phoneLast5, role: user.role, department: user.department || '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', phoneLast5: '', role: 'user', department: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData });
    } else {
      onAddUser(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="search-fade fixed left-0 right-0 z-40 bg-transparent py-3 transition-opacity" style={{top: "64px"}}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 toolbar-shell">
          <div className="toolbar-leading">
            <div className={`toolbar-morph ${isFilterOpen ? 'is-open' : ''}`}>
              {/* 將 pointer-events-none 單獨加在篩選鈕上 */}
              <button type="button" className="toolbar-morph-btn pointer-events-none" aria-label="展開類型選單">
                <Filter size={18} />
              </button>
              <select
                className={`toolbar-morph-field toolbar-morph-select ${!isFilterOpen ? 'is-closed-cover' : ''}`}
                value={filterRole}
                onClick={handleFilterClick}
                onChange={e => setFilterRole(e.target.value)}
                onBlur={() => setIsFilterOpen(false)}
              >
                <option value="all">所有類型</option>
                <option value="user">一般使用者</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
              {/* 拿掉之前無效的 pointer-events-auto，並讓 onClick 恢復運作 */}
              <button type="button" className="click-pop toolbar-morph-btn" onClick={openSearchMorph} aria-label="展開搜尋欄">
                <Search size={18} />
              </button>
              <input
                ref={searchInputRef}
                className="toolbar-morph-field toolbar-morph-input"
                placeholder="搜尋會員姓名或密碼..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
            <Button onClick={() => handleOpenModal()} title="新增會員" aria-label="新增會員" className="circle-add-btn shrink-0"><Plus size={18} /></Button>
          </div>
        </div>
      </div>

      <div className="content-reveal mt-6 bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] md:text-[15px] whitespace-nowrap tracking-wider">
            <thead className="bg-black/40 border-b border-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">姓名</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">手機末五碼</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">狀態</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">權限</th>
                <th className="p-4 text-right font-semibold">編輯</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-white">{user.name}</td>
                  <td className="px-4 py-3.5 font-mono text-gray-400">{user.phoneLast5 || '未設定'}</td>
                  <td className="px-4 py-3.5"><Badge status={user.status} type="user" /></td>
                  <td className="px-4 py-3.5"><Badge status={user.role} type="user" /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleOpenModal(user)} className="click-pop text-gray-400 hover:text-sky-500" title="編輯">
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "編輯會員" : "新增會員"} placement="top">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="姓名" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input maxLength="5" pattern="\d{5}" className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="手機末五碼" value={formData.phoneLast5} onChange={e => setFormData({...formData, phoneLast5: e.target.value})} />
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1 tracking-widest">權限</label>
            <select className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none appearance-none cursor-pointer shadow-inner tracking-wider text-[13px] md:text-[15px]" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="user" className="bg-gray-900">一般使用者</option>
              <option value="admin" className="bg-gray-900">管理員</option>
            </select>
          </div>
          <Button type="submit" className="w-full justify-center mt-4 text-[14px] md:text-[15px]">{editingUser ? "儲存變更" : "新增"}</Button>
        </form>
      </Modal>
    </div>
  );
};

const ReservationCard = ({ res, isAdmin, onUpdateStatus }) => {
  const firstItem = res.items[0] || {};
  const timePeriod = `${firstItem.startDate || ''} ${firstItem.startTime || '00:00'} ~ ${firstItem.endDate || ''} ${firstItem.endTime || '23:59'}`;
  const itemsStr = res.items.map(i => `${i.name} x${i.borrowQty || 1}`).join('、');

  return (
    <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10 transition-all hover:border-sky-500/[0.24] hover:bg-white/10 hover:shadow-[0_0_18px_rgba(125,168,201,0.08)] mb-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 border-b border-white/10 pb-4">
         <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[15px] md:text-[17px] text-sky-500 tracking-wider whitespace-nowrap">{res.id}</span>
            <span className="text-gray-200 font-medium flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/10 tracking-widest text-xs md:text-sm whitespace-nowrap"><User size={14} className="text-gray-400"/>{res.userName}</span>
            <Badge status={res.status} type="res" />
         </div>
         <div className="text-xs md:text-sm text-gray-400 font-mono tracking-wider whitespace-nowrap">申請日：{res.submitDate}</div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 text-[11px] md:text-sm bg-black/20 p-3 md:p-3 rounded-xl border border-white/5 mb-4 shadow-inner">
        <div className="text-gray-300 font-mono flex items-center gap-2 shrink-0 tracking-wider whitespace-nowrap">
          <Calendar size={16} className="text-sky-500"/>
          {timePeriod}
        </div>
        <div className="hidden md:block text-gray-600">|</div>
        <div className="font-medium flex items-center gap-2 text-gray-200 break-all leading-relaxed tracking-wider">
          <Package size={16} className="text-sky-500/70 shrink-0"/>
          {itemsStr}
        </div>
      </div>

      {isAdmin && res.status !== '已歸還' && res.status !== '已退回' && (
        <div className="flex flex-row flex-wrap sm:flex-nowrap justify-end gap-2 pt-3">
          {res.status === '審核中' && (
            <>
              <Button variant="danger" onClick={() => onUpdateStatus(res.id, '已退回')} className="press-reveal-btn press-danger py-2.5 px-5 w-auto">退回申請</Button>
              <Button variant="success" onClick={() => onUpdateStatus(res.id, '已借出')} className="press-reveal-btn press-success py-2.5 px-5 w-auto">核准借出</Button>
            </>
          )}
          {res.status === '已借出' && (
            <Button variant="primary" onClick={() => onUpdateStatus(res.id, '已歸還')} className="press-reveal-btn press-primary py-2.5 px-5 w-auto">確認歸還</Button>
          )}
        </div>
      )}
    </div>
  );
};

const AdminReservations = ({ reservations = [], onUpdateStatus }) => {
  const visibleRes = reservations.filter(r => r.status !== '已歸還');

  return (
    <div className="space-y-6">
      <div className="content-reveal space-y-4 relative z-10">
        {visibleRes.map(res => (
          <ReservationCard key={res.id} res={res} isAdmin={true} onUpdateStatus={onUpdateStatus} />
        ))}
        {visibleRes.length === 0 && (
          <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-16 shadow-glass px-4">
            <CheckCircle className="mx-auto text-[#b1c8be]/80 mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" size={56} />
            <p className="text-[15px] md:text-[17px] text-gray-300 font-bold tracking-wider whitespace-nowrap">目前沒有需要處理的預約單，太棒了！</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UserCart = ({ cart = [], onRemoveFromCart, onUpdateCartItem, onUpdateAllCartDates, onSubmitReservation }) => {
  // 從第一個項目取得共用的全局日期
  const globalDates = cart[0] || {};

  return (
    <div className="content-reveal max-w-3xl mx-auto space-y-6 relative z-10">
      {cart.length === 0 ? (
        <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-16 shadow-glass px-4">
          <p className="text-[15px] md:text-[17px] text-gray-300 font-bold tracking-wider whitespace-nowrap">預約單是空的，快去器材庫逛逛吧！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 共用借用期間卡片 */}
          <div className="bg-white/5 backdrop-blur-xl p-5 md:p-6 rounded-3xl shadow-glass border border-white/10">
            <h3 className="font-bold text-[15px] md:text-[17px] text-sky-500 mb-4 flex items-center gap-2 tracking-wider">
              <Calendar size={18}/> 借用期間設定
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2 text-gray-200">
                <span className="text-gray-500 shrink-0 text-xs md:text-sm tracking-wider">起</span>
                <input type="date" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[8.6rem] md:w-[9.5rem] shrink-0 transition-colors shadow-inner" value={globalDates.startDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => onUpdateAllCartDates('startDate', e.target.value)} />
                <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[5.5rem] md:w-[6rem] shrink-0 transition-colors shadow-inner" value={globalDates.startTime} onChange={(e) => onUpdateAllCartDates('startTime', e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(time => <option key={time} value={time} className="bg-gray-900">{time}</option>)}
                </select>
              </div>
              <div className="text-gray-600 hidden md:block px-2">—</div>
              <div className="flex items-center gap-2 text-gray-200">
                <span className="text-gray-500 shrink-0 text-xs md:text-sm tracking-wider">迄</span>
                <input type="date" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[8.6rem] md:w-[9.5rem] shrink-0 transition-colors shadow-inner" value={globalDates.endDate} min={globalDates.startDate} onChange={(e) => onUpdateAllCartDates('endDate', e.target.value)} />
                <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-sky-500 text-[13px] md:text-sm w-[5.5rem] md:w-[6rem] shrink-0 transition-colors shadow-inner" value={globalDates.endTime} onChange={(e) => onUpdateAllCartDates('endTime', e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(time => <option key={time} value={time} className="bg-gray-900">{time}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 極簡化預約器材清單 */}
          <div className="bg-white/5 backdrop-blur-xl p-5 md:p-6 rounded-3xl shadow-glass border border-white/10">
            <h3 className="font-bold text-[15px] md:text-[17px] text-gray-200 mb-4 flex items-center gap-2 tracking-wider">
              <Package size={18}/> 預約器材清單
            </h3>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20 p-3 md:p-4 rounded-xl border border-white/5 shadow-inner transition-colors hover:border-white/10 hover:bg-black/30 group">
                  
                  <span className="font-bold text-[14px] md:text-[15px] text-gray-200 truncate flex-1 pr-4 tracking-wider text-sky-100">{item.name}</span>
                  
                  <div className="flex items-center justify-end gap-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 tracking-wider shrink-0">數量</span>
                      <select className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500 text-white text-center text-[13px] min-w-[70px] shadow-inner transition-colors" value={item.borrowQty} onChange={(e) => onUpdateCartItem(index, 'borrowQty', parseInt(e.target.value) || 1)}>
                        {Array.from({ length: item.maxQty }, (_, i) => i + 1).map(q => <option key={q} value={q} className="bg-gray-900">{q} / {item.maxQty}</option>)}
                      </select>
                    </div>
                    <button onClick={() => onRemoveFromCart(index)} className="click-pop text-gray-500 hover:text-[#f87171] p-2 hover:bg-white/[0.05] rounded-xl transition-colors shrink-0">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-6 mt-2 border-t border-white/10">
              <Button onClick={onSubmitReservation} className="px-6 md:px-8 py-3 w-full md:w-auto text-[14px] md:text-[15px]">
                送出預約申請
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminItems = ({ items = [], itemTypes = [], onAddItem, reservations = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [newItem, setNewItem] = useState({ name: '', type: itemTypes[0] || '其他', accessories: '', lifespan: '', id: '', qty: 1 });

  const openSearchMorph = () => {
    setIsSearchOpen(true);
    setIsFilterOpen(false); // 展開搜尋時，強制收攏類型選單
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearchMorph = () => {
    if (!searchTerm.trim()) setIsSearchOpen(false);
  };

  const handleFilterClick = () => {
    setIsFilterOpen(true);
    setIsSearchOpen(false); // 展開類型選單時，強制收攏搜尋
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddItem(newItem);
    setIsModalOpen(false);
    setNewItem({ name: '', type: itemTypes[0] || '其他', accessories: '', lifespan: '', id: '', qty: 1 });
  };

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="search-fade fixed left-0 right-0 z-40 bg-transparent py-3 transition-opacity" style={{top: "64px"}}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 toolbar-shell">
          <div className="toolbar-leading">
            <div className={`toolbar-morph ${isFilterOpen ? 'is-open' : ''}`}>
              {/* 將 pointer-events-none 單獨加在篩選鈕上 */}
              <button type="button" className="toolbar-morph-btn pointer-events-none" aria-label="展開類型選單">
                <Filter size={18} />
              </button>
              <select 
                className={`toolbar-morph-field toolbar-morph-select ${!isFilterOpen ? 'is-closed-cover' : ''}`}
                value={filterType} 
                onClick={handleFilterClick}
                onChange={(e) => setFilterType(e.target.value)} 
                onBlur={() => setIsFilterOpen(false)}
              >
                <option value="all">所有類型</option>
                {itemTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
              {/* 拿掉之前無效的 pointer-events-auto，並讓 onClick 恢復運作 */}
              <button type="button" className="click-pop toolbar-morph-btn" onClick={openSearchMorph} aria-label="展開搜尋欄">
                <Search size={18} />
              </button>
              <input
                ref={searchInputRef}
                className="toolbar-morph-field toolbar-morph-input"
                placeholder="搜尋器材名稱..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
            {/* 點擊新增按鈕時，同步收攏搜尋與類型選單 */}
            <Button onClick={() => { setIsSearchOpen(false); setIsFilterOpen(false); setIsModalOpen(true); }} title="新增器材" aria-label="新增器材" className="circle-add-btn shrink-0"><Plus size={18}/></Button>
          </div>
        </div>
      </div>

      <div className="content-reveal mt-6 bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap tracking-wider text-[13px] md:text-[15px]">
            <thead className="bg-black/40 border-b border-white/10 text-gray-300">
              <tr><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">名稱</th><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">類型</th><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">數量 (剩餘/總數)</th><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">當前狀態</th></tr>
            </thead>
            <tbody className="text-gray-200">
              {filteredItems.map(item => {
                const itemReservations = reservations
                  .filter(r => r.status === '已借出')
                  .flatMap(r => r.items.filter(i => i.itemId === item.id || i.name === item.name));

                const now = new Date();
                const currentlyUsedQty = itemReservations.filter(i => {
                    const start = new Date(`${i.startDate}T${i.startTime || '00:00'}`);
                    const effectiveStart = new Date(start.getTime() - 2 * 60 * 60 * 1000);
                    const end = new Date(`${i.endDate}T${i.endTime || '23:59'}`);
                    return now >= effectiveStart && now <= end;
                  }).reduce((sum, i) => sum + (i.borrowQty || 1), 0);

                const currentRemainingQty = item.qty - currentlyUsedQty;
                const isOutOfStock = currentRemainingQty <= 0;
                let displayStatus = item.status;
                if (displayStatus !== 'maintenance' && displayStatus !== 'inquire') { displayStatus = isOutOfStock ? 'borrowed' : 'available'; }

                return (
                  <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white tracking-widest">{item.name}</td>
                    <td className="px-4 py-3.5 text-gray-400">{item.type}</td>
                    <td className="px-4 py-3.5"><span className={`font-bold ${isOutOfStock ? 'text-[#c4a8b2]' : 'text-sky-500'}`}>{currentRemainingQty > 0 ? currentRemainingQty : 0}</span><span className="text-gray-500 text-xs font-mono"> / {item.qty}</span></td>
                    <td className="px-4 py-3.5"><Badge status={displayStatus} /></td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-bold tracking-wider">此分類目前沒有任何物件</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增器材" placement="top">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="名稱" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
          <select className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none appearance-none cursor-pointer shadow-inner tracking-wider text-[13px] md:text-[15px]" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
            {itemTypes.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
          </select>
          <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="總數量" type="number" min="1" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} />
          <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="配件 (選填)" value={newItem.accessories} onChange={e => setNewItem({...newItem, accessories: e.target.value})} />
          <Button type="submit" className="w-full justify-center mt-4 text-[14px] md:text-[15px]">上架</Button>
        </form>
      </Modal>
    </div>
  );
};

const SpaceLightBalls = () => {
  // 利用 useMemo 在元件首次渲染時同步計算，避免畫面閃爍
  const elapsed = useMemo(() => {
    if (typeof sessionStorage === 'undefined') return 0;
    
    // 取得最初的載入時間
    let startTime = sessionStorage.getItem('lightBallsStartTime');
    if (!startTime) {
      startTime = Date.now().toString();
      sessionStorage.setItem('lightBallsStartTime', startTime);
    }
    
    // 計算自首次訪問以來經過的秒數
    return (Date.now() - parseInt(startTime, 10)) / 1000;
  }, []);

  // 重點技巧：透過 CSS 負延遲 (negative animation-delay)，
  // 讓瀏覽器直接將動畫「快轉」到經過的時間點，達成跨重整的無縫接續
  const delayStyle = { animationDelay: `-${elapsed}s` };

  const cssKeyframes = `
    /* 光球 1: 初始位置 */
    @keyframes moveX1 { 0% { transform: translateX(18vw); } 100% { transform: translateX(65vw); } }
    @keyframes moveY1 { 0% { transform: translateY(28vh); } 100% { transform: translateY(75vh); } }
    
    /* 光球 2: 初始位置 */
    @keyframes moveX2 { 0% { transform: translateX(78vw); } 100% { transform: translateX(25vw); } }
    @keyframes moveY2 { 0% { transform: translateY(58vh); } 100% { transform: translateY(15vh); } }
    
    /* 光球 3: 初始位置 */
    @keyframes moveX3 { 0% { transform: translateX(52vw); } 100% { transform: translateX(85vw); } }
    @keyframes moveY3 { 0% { transform: translateY(76vh); } 100% { transform: translateY(25vh); } }
    
    .track-x-1 { animation: moveX1 17s infinite alternate ease-in-out; position: absolute; top:0; left:0; }
    .track-y-1 { animation: moveY1 23s infinite alternate ease-in-out; }
    
    .track-x-2 { animation: moveX2 19s infinite alternate ease-in-out; position: absolute; top:0; left:0; }
    .track-y-2 { animation: moveY2 13s infinite alternate ease-in-out; }
    
    .track-x-3 { animation: moveX3 14s infinite alternate ease-in-out; position: absolute; top:0; left:0; }
    .track-y-3 { animation: moveY3 29s infinite alternate ease-in-out; }

    /* 電腦版的預設尺寸 */
    .ball-1 { width: 30px; height: 30px; }
    .ball-2 { width: 80px; height: 80px; }
    .ball-3 { width: 52px; height: 52px; }
    
    @media (max-width: 767px) {
      /* 手機版的尺寸與位置微調 */
      .ball-1 { width: 36px; height: 36px; } 
      .ball-2 { width: 60px; height: 60px; } 
      .track-x-3 { display: none; } /* 手機版隱藏第三顆球以節省效能 */
      
      @keyframes moveX1 { 0% { transform: translateX(24vw); } 100% { transform: translateX(75vw); } }
      @keyframes moveY1 { 0% { transform: translateY(34vh); } 100% { transform: translateY(85vh); } }
      
      @keyframes moveX2 { 0% { transform: translateX(72vw); } 100% { transform: translateX(15vw); } }
      @keyframes moveY2 { 0% { transform: translateY(62vh); } 100% { transform: translateY(25vh); } }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssKeyframes }} />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* 將 delayStyle 套用至每一個層級，確保 X軸、Y軸與閃爍(flicker) 都處於同一條時間軸上 */}
        <div className="track-x-1" style={delayStyle}>
          <div className="track-y-1" style={delayStyle}>
            <div className="ball-1 space-light-ball flicker-1" style={delayStyle} />
          </div>
        </div>
        
        <div className="track-x-2" style={delayStyle}>
          <div className="track-y-2" style={delayStyle}>
            <div className="ball-2 space-light-ball flicker-2" style={delayStyle} />
          </div>
        </div>
        
        <div className="track-x-3" style={delayStyle}>
          <div className="track-y-3" style={delayStyle}>
            <div className="ball-3 space-light-ball flicker-3" style={delayStyle} />
          </div>
        </div>
      </div>
    </>
  );
};

// === 根元件 App ===
export default function App() {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 
  
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role === 'admin' ? 'admin_dashboard' : 'items';
      } catch (e) {
        return 'items';
      }
    }
    return 'items';
  }); 

  const [isSimulatingUser, setIsSimulatingUser] = useState(false);
  const [cart, setCart] = useState([]);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [cartAnimObj, setCartAnimObj] = useState(null);

  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  const [pageTransitionKey, setPageTransitionKey] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const showAlert = useCallback((message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: null }), []);
  const showConfirm = useCallback((message, onConfirm) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm }), []);
  const closeDialog = useCallback(() => setDialog(prev => ({ ...prev, isOpen: false })), []);

  useEffect(() => { setPageTransitionKey(k => k + 1); }, [activeTab]);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // 登入超時檢查機制
  useEffect(() => {
    if (!currentUser) return;
    const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
    const handleInactivityLogout = () => {
      setCurrentUser(null); localStorage.removeItem('currentUser'); localStorage.removeItem('lastActivity');
      setIsSimulatingUser(false); setCart([]); setActiveTab('dashboard');
      showAlert("因您已閒置超過 60 分鐘，系統已為您自動登出保護帳號安全。");
    };

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_LIMIT_MS) handleInactivityLogout();
    };

    const updateActivity = () => localStorage.setItem('lastActivity', Date.now().toString());

    checkInactivity(); updateActivity();
    window.addEventListener('mousemove', updateActivity); window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity); window.addEventListener('scroll', updateActivity);

    const intervalId = setInterval(checkInactivity, 60000);
    return () => {
      window.removeEventListener('mousemove', updateActivity); window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity); window.removeEventListener('scroll', updateActivity);
      clearInterval(intervalId);
    };
  }, [currentUser, showAlert]);

  // 載入資料 (透過 API)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getInventory();
        setItems(data.items || []);
        setItemTypes(data.types || []);
        setUsers(data.users || []);
        setReservations(data.reservations || []);
      } catch (error) {
        console.error("載入資料失敗:", error);
        showAlert("無法連接到伺服器載入資料，請稍後再試。");
      }
      setIsLoading(false);
    };
    loadData();
  }, [showAlert]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && activeTab.startsWith('admin_')) setActiveTab('dashboard');
  }, [currentUser, activeTab]);

  useEffect(() => { setIsUserMenuOpen(false); }, [activeTab, currentUser, isSimulatingUser]);

  const handleLogin = (phoneLast5) => {
    if (!phoneLast5) return setAuthError('請輸入末五碼');
    const matchedUsers = users.filter(u => u.phoneLast5 === phoneLast5);
    if (matchedUsers.length === 1) {
      const user = matchedUsers[0];
      if (user.status === 'pending') return setAuthError('帳號審核中');
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('lastActivity', Date.now().toString()); 
      setIsSimulatingUser(false);
      setActiveTab(user.role === 'admin' ? 'admin_dashboard' : 'items');
    } else if (matchedUsers.length > 1) setAuthError('有多位使用者使用相同密碼，請聯繫管理員');
    else setAuthError('找不到此代碼的帳號');
  };

  const handleLogout = () => { 
    setCurrentUser(null); localStorage.removeItem('currentUser'); localStorage.removeItem('lastActivity'); 
    setIsSimulatingUser(false); setCart([]); setActiveTab('dashboard'); 
  };

  const handleRegister = async (form) => {
    if (users.some(u => u.phoneLast5 === form.phoneLast5)) { setAuthError('此手機末五碼已被註冊'); return false; }
    const newUser = { ...form, id: 'U_' + form.phoneLast5 + '_new', role: 'user', status: 'pending' };
    
    try {
      await api.addUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setAuthSuccess('申請成功！請等待審核');
      return true;
    } catch (e) {
      setAuthError('註冊失敗，請重試');
      return false;
    }
  };

  const handleUpdateUser = (updatedUser) => {
    const isDuplicate = users.some(u => u.id !== updatedUser.id && u.phoneLast5 === updatedUser.phoneLast5);
    if (isDuplicate) return showAlert('手機末五碼重複！更新失敗');
    // 若有需要，可以擴充 update API
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    showAlert('會員資料已更新');
  };

  const handleAddUser = async (newUserForm) => {
    if (users.some(u => u.phoneLast5 === newUserForm.phoneLast5)) return showAlert('手機末五碼重複！新增失敗');
    const newUser = { ...newUserForm, id: 'U_' + newUserForm.phoneLast5 + '_new', status: 'active' };
    try {
      await api.addUser(newUser);
      setUsers(prev => [...prev, newUser]);
      showAlert('會員已新增');
    } catch (e) {
      showAlert('新增失敗');
    }
  };

  const handleUpdateResStatus = async (resId, status) => {
    if (status === '已借出') {
      const targetRes = reservations.find(r => r.id === resId);
      if (!targetRes) return;
      const approvedRes = reservations.filter(r => r.status === '已借出' && r.id !== resId);
      
      for (const reqItem of targetRes.items) {
        const itemTotalQty = items.find(i => i.id === reqItem.itemId || i.name === reqItem.name)?.qty || 1;
        let overlappingQty = 0;

        approvedRes.forEach(ar => {
          ar.items.forEach(ai => {
            if ((ai.itemId === reqItem.itemId || ai.name === reqItem.name) && isDateOverlap(reqItem.startDate, reqItem.startTime, reqItem.endDate, reqItem.endTime, ai.startDate, ai.startTime, ai.endDate, ai.endTime)) {
              overlappingQty += (ai.borrowQty || 1);
            }
          });
        });

        if (overlappingQty + (reqItem.borrowQty || 1) > itemTotalQty) {
          showAlert(`核准失敗！數量不足。\n\n物件：${reqItem.name}\n衝突時段內已出借：${overlappingQty}件\n欲借：${reqItem.borrowQty || 1}件\n總庫存僅有：${itemTotalQty}件。`);
          return false;
        }
      }
    }
    
    try {
      await api.updateStatus(resId, status);
      setReservations(reservations.map(r => r.id === resId ? { ...r, status } : r));
      return true;
    } catch (e) {
      showAlert('更新狀態失敗');
      return false;
    }
  };

  const toggleSimulation = () => { 
    if (!currentUser || currentUser.role !== 'admin') return; 
    setIsSimulatingUser(!isSimulatingUser); 
    setActiveTab(!isSimulatingUser ? 'items' : 'admin_dashboard'); 
  };
  
  const normalizeHourTime = (value) => {
    if (!value) return '00:00';
    const [hour = '00'] = value.split(':');
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const addToCart = (item) => { 
    if (cart.find(c => c.id === item.id)) return showAlert('已在預約單中，請勿重複加入！'); 
    
    let startD, startT, endD, endT;

    if (cart.length > 0) {
      // 若購物車已有物品，自動繼承全局設定的時間
      startD = cart[0].startDate;
      startT = cart[0].startTime;
      endD = cart[0].endDate;
      endT = cart[0].endTime;
    } else {
      // 第一筆物品，產生預設時間
      const now = new Date(); const nextHour = new Date(now); nextHour.setHours(now.getHours() + 1); nextHour.setMinutes(0); nextHour.setSeconds(0); nextHour.setMilliseconds(0);
      startD = `${nextHour.getFullYear()}-${String(nextHour.getMonth() + 1).padStart(2, '0')}-${String(nextHour.getDate()).padStart(2, '0')}`;
      startT = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
      const endNextHour = new Date(nextHour.getTime() + 60 * 60 * 1000);
      endD = `${endNextHour.getFullYear()}-${String(endNextHour.getMonth() + 1).padStart(2, '0')}-${String(endNextHour.getDate()).padStart(2, '0')}`;
      endT = `${String(endNextHour.getHours()).padStart(2, '0')}:00`;
    }

    setCart([...cart, { ...item, startDate: startD, startTime: startT, endDate: endD, endTime: endT, borrowQty: 1, maxQty: item.qty }]); 
    setCartAnimObj(Date.now());
  };
  
  const updateCartItem = (i, f, v) => { 
    const c = [...cart]; 
    let newItem = { ...c[i] };
    
    if (f === 'borrowQty') { 
      if (v > newItem.maxQty) v = newItem.maxQty; 
      if (v < 1) v = 1; 
    }
    newItem[f] = v; 
    c[i] = newItem; 
    setCart(c); 
  };

  // 統一更新購物車內所有物品的時間
  const updateAllCartDates = (field, value) => {
    if (field === 'startTime' || field === 'endTime') value = normalizeHourTime(value);

    setCart(prevCart => prevCart.map(item => {
      let newItem = { ...item };
      newItem[field] = value;

      if (['startDate', 'startTime', 'endDate', 'endTime'].includes(field)) {
        const startDt = new Date(`${newItem.startDate}T${newItem.startTime || '00:00'}`);
        const endDt = new Date(`${newItem.endDate}T${newItem.endTime || '00:00'}`);
        
        if (startDt > endDt) {
           const newEndDt = new Date(startDt.getTime() + 60 * 60 * 1000);
           newItem.endDate = `${newEndDt.getFullYear()}-${String(newEndDt.getMonth() + 1).padStart(2, '0')}-${String(newEndDt.getDate()).padStart(2, '0')}`;
           newItem.endTime = `${String(newEndDt.getHours()).padStart(2, '0')}:00`; 
        }
      }
      return newItem;
    }));
  };
  
  const submitReservation = async () => { 
    if(cart.length===0) return; 
    
    const newResId = generateResId(reservations); 
    const newReservation = { 
      id: newResId, 
      userId: currentUser.id, 
      userName: currentUser.name, 
      items: cart.map(i=>({itemId:i.id, name:i.name, startDate:i.startDate, startTime:i.startTime, endDate:i.endDate, endTime:i.endTime, borrowQty: i.borrowQty})), 
      status: '審核中', 
      submitDate: new Date().toISOString().split('T')[0] 
    };
    
    try {
      await api.addReservation(newReservation);
      setReservations(prev => [...prev, newReservation]); 
      setCart([]); 
      showAlert(`預約單已送出，請等待管理員審核。\n您的預約單號為：${newResId}`); 
      setActiveTab('my_history'); 
    } catch (e) {
      showAlert('送出申請失敗');
    }
  };
  
  const addItem = async (d) => {
    const newItem = {...d, id: d.id||`IT${Date.now()}`, status: 'available'};
    try {
      await api.addItem(newItem);
      setItems(prev => [...prev, newItem]);
      showAlert('上架成功');
    } catch (e) {
      showAlert('上架失敗');
    }
  };

  const userHistoryReservations = reservations.filter(r => r.userId === currentUser?.id || r.userName === currentUser?.name);

  let pendingCount = 0;
  if (currentUser) {
    if (currentUser.role === 'admin' && !isSimulatingUser) {
      pendingCount = reservations.filter(r => r.status === '審核中').length;
    } else {
      const pendingUserRes = reservations.filter(r => (r.userId === currentUser.id || r.userName === currentUser.name) && r.status === '審核中').length;
      pendingCount = cart.length + pendingUserRes;
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      <SpaceLightBalls />
      <Dialog dialog={dialog} closeDialog={closeDialog} />

      {isLoading ? (
        <div className="min-h-[100dvh] bg-transparent flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
            <div className="w-24 h-24 md:w-32 md:h-32 animate-bounce">
              <img src={LOGO_ICON_URL} alt="Loading" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        <div className="relative z-10">
          <LoginScreen onLogin={handleLogin} onRegister={handleRegister} authError={authError} authSuccess={authSuccess} clearAuthMsg={() => { setAuthError(''); setAuthSuccess(''); }} />
        </div>
      ) : (
        <div className="min-h-[100dvh] bg-transparent flex flex-col font-tc2 text-gray-200 overflow-x-hidden relative z-10">
          
          {isSimulatingUser && <div className="bg-sky-500/[0.72] backdrop-blur-md text-white border-b border-sky-500 text-center font-bold flex justify-center items-center gap-4 fixed top-0 left-0 right-0 h-[40px] z-[60] shadow-[0_4px_15px_rgba(14,165,233,0.3)]"><Eye size={20} /><span className="tracking-widest text-[13px] md:text-[15px] whitespace-nowrap">模擬會員視角中</span><button onClick={toggleSimulation} className="click-pop bg-gray-900/80 text-sky-500 hover:text-white px-3 py-1 rounded border border-gray-600 hover:border-white transition-colors text-xs tracking-wider whitespace-nowrap">退出模擬</button></div>}

          <header className={`fixed ${isSimulatingUser ? 'top-[40px]' : 'top-0'} left-0 right-0 z-50 bg-[#05050A]/84 backdrop-blur-lg border-b border-white/10 shadow-[0_2px_20px_rgba(0,0,0,0.8)] h-[64px] flex items-center justify-between px-4 md:px-6 transition-all`}>
            <div className="flex items-center gap-3 md:gap-6 h-full w-full max-w-full overflow-hidden">
              <div 
                className="flex items-center cursor-pointer hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all shrink-0" 
                onClick={() => {
                  if (currentUser?.role === 'admin' && !isSimulatingUser) {
                    setActiveTab('admin_dashboard');
                  } else {
                    setActiveTab('items');
                  }
                }}
              >
                <img src={LOGO_FULL_URL} alt="Logo" className="h-10 md:h-12 w-auto shrink-0 object-contain drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
              </div>
            </div>

            {currentUser && (
              <div className="flex items-center gap-4 h-full shrink-0 relative">
                <div ref={userMenuRef} className="relative h-full flex items-center">
                  
                  <button type="button" onClick={() => setIsUserMenuOpen(v => !v)} className="click-pop flex items-center gap-2 md:gap-3 bg-white/[0.07] px-3 md:px-4 py-1.5 rounded-full border border-white/10 shadow-inner cursor-pointer hover:bg-white/10 relative">
                    {pendingCount > 0 && (
                      <span 
                        key={cartAnimObj} 
                        className={`absolute -top-1.5 -right-1 bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-[11px] min-w-[18px] md:min-w-[20px] h-4 md:h-5 px-1 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(120,102,110,0.18)] font-bold z-20 border border-[#05050A] ${cartAnimObj ? 'animate-[popBadge_0.5s_ease-out]' : ''}`}
                      >
                        {pendingCount}
                      </span>
                    )}
                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-sky-500/[0.42] text-[#edf7ff] flex items-center justify-center font-bold font-tc1 text-xs md:text-sm shadow-[0_0_10px_rgba(125,168,201,0.18)] shrink-0">
                      {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                    </div>
                    <span className="font-bold font-tc1 text-gray-200 text-xs md:text-sm tracking-widest md:tracking-wider whitespace-nowrap max-w-[80px] md:max-w-[150px] truncate">{currentUser?.name || 'User'}</span>
                    <svg className={`w-3 h-3 md:w-4 md:h-4 text-gray-400 transition-transform shrink-0 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  
                  <div className={`absolute top-[50px] right-0 w-48 md:w-52 transition-all duration-300 transform origin-top z-50 ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}`}>
                    <div className="bg-[#05050A]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden py-2 flex flex-col gap-1 px-2 mt-2">
                      
                      {(!currentUser || currentUser.role !== 'admin' || isSimulatingUser) ? (
                        <>
                          <button onClick={() => setActiveTab('items')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'items' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            器材列表
                          </button>
                          <button onClick={() => setActiveTab('cart')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all flex justify-between items-center whitespace-nowrap ${activeTab === 'cart' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            預約申請
                            {(cart && cart.length > 0) && <span key={cartAnimObj} className={`bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-xs px-2 py-0.5 rounded-full shadow-btn ${cartAnimObj ? 'animate-[popBadge_0.5s_ease-out]' : ''}`}>{cart.length}</span>}
                          </button>
                          <button onClick={() => setActiveTab('my_history')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all flex justify-between items-center whitespace-nowrap ${activeTab === 'my_history' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            我的紀錄
                            {(userHistoryReservations.filter(r => r.status === '審核中').length > 0) && <span className="bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-xs px-2 py-0.5 rounded-full shadow-btn">{userHistoryReservations.filter(r => r.status === '審核中').length}</span>}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setActiveTab('admin_dashboard')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'admin_dashboard' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>數據統計</button>
                          <button onClick={() => setActiveTab('admin_res')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all flex justify-between items-center whitespace-nowrap ${activeTab === 'admin_res' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            預約管理
                            {(reservations.filter(r => r.status === '審核中').length > 0) && <span className="bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-xs px-2 py-0.5 rounded-full shadow-btn">{reservations.filter(r => r.status === '審核中').length}</span>}
                          </button>
                          <button onClick={() => setActiveTab('admin_items')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'admin_items' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>器材管理</button>
                          <button onClick={() => setActiveTab('admin_users')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'admin_users' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>會員管理</button>
                        </>
                      )}
                      
                      <div className="h-px bg-white/10 my-1 mx-2"></div>
                      <button onClick={handleLogout} className="click-pop px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all hover:bg-white/[0.06] text-[#eadce2] flex items-center gap-2 whitespace-nowrap">
                        <LogOut size={16} /> 登出
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </header>

          <main className={`flex-1 overflow-auto ${isSimulatingUser ? 'pt-[168px]' : 'pt-32'} pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full z-0 relative`}>
            <div key={`${activeTab}-${pageTransitionKey}`} className="page-reveal">
              {activeTab === 'dashboard' && <UserDashboard items={items} itemTypes={itemTypes} reservations={reservations} onAddToCart={addToCart} isSimulatingUser={isSimulatingUser} currentUser={currentUser} />}
              {activeTab === 'items' && <UserDashboard items={items} itemTypes={itemTypes} reservations={reservations} onAddToCart={addToCart} isSimulatingUser={isSimulatingUser} currentUser={currentUser} />}
              
              {/* 傳入新增的 onUpdateAllCartDates 函數 */}
              {activeTab === 'cart' && <UserCart cart={cart} onRemoveFromCart={(idx) => setCart(cart.filter((_, i) => i !== idx))} onUpdateCartItem={updateCartItem} onUpdateAllCartDates={updateAllCartDates} onSubmitReservation={submitReservation} />}
              
              {activeTab === 'my_history' && (
                // 加上 content-reveal 與相對定位
                <div className="content-reveal space-y-6 relative z-10">
                  <div className="space-y-4">
                    {(userHistoryReservations && userHistoryReservations.length === 0) ? (
                      <p className="text-gray-400 bg-white/5 backdrop-blur-xl p-12 text-center rounded-3xl border border-white/10 shadow-glass font-bold tracking-wider text-[13px] md:text-[15px] whitespace-nowrap">尚無預約紀錄</p>
                    ) : (
                      userHistoryReservations?.map(r => (
                        <ReservationCard key={r.id} res={r} isAdmin={false} />
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'admin_res' && <AdminReservations reservations={reservations} onUpdateStatus={handleUpdateResStatus} />}
              {activeTab === 'admin_dashboard' && <AdminDashboard items={items} users={users} reservations={reservations} />}
              {activeTab === 'admin_items' && <AdminItems items={items} itemTypes={itemTypes} onAddItem={addItem} reservations={reservations} />}
              {activeTab === 'admin_users' && <AdminUsers users={users} onUpdateUser={handleUpdateUser} onAddUser={handleAddUser} showAlert={showAlert} />}
            </div>
          </main>
          
        </div>
      )}
    </>
  );
}
