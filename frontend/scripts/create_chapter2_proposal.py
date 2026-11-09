from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("GYM_CHAPTER2_OUTPUT", str(ROOT / "DeAn_Chuong2_GymHung.docx")))
ASSET_DIR = ROOT / ".tmp-chapter2-proposal" / "generated-diagrams"

BLUE = "1F4E78"
LIGHT_BLUE = "DDEBF7"
PALE_BLUE = "EEF5FB"
GRAY = "D9E2F3"
BORDER = "B7C9D6"
BLACK = RGBColor(0, 0, 0)


def set_font(run, size: float = 12, bold: bool = False, italic: bool = False):
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = BLACK


def set_cell_shading(cell, fill: str):
    tc_pr = cell._tc.get_or_add_tcPr()
    shading = tc_pr.find(qn("w:shd"))
    if shading is None:
        shading = OxmlElement("w:shd")
        tc_pr.append(shading)
    shading.set(qn("w:fill"), fill)


def set_cell_border(cell, color: str = BORDER, sz: str = "6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        element = borders.find(tag)
        if element is None:
            element = OxmlElement(f"w:{edge}")
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), sz)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top: int = 90, start: int = 90, bottom: int = 90, end: int = 90):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    tr_pr.append(header)


def add_page_field(paragraph):
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    separate.append(text)
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, separate, end])
    set_font(run, 10)


def set_update_fields(doc):
    settings = doc.settings.element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")


def paragraph(doc: Document, text: str = "", align=None, before=0, after=6, first_line=True):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY if align is None else align
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = 1.25
    if first_line:
        p.paragraph_format.first_line_indent = Cm(0.75)
    run = p.add_run(text)
    set_font(run)
    return p


def add_title(doc: Document, text: str):
    p = doc.add_paragraph(style="Title")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(14)
    r = p.add_run(text)
    set_font(r, 16, bold=True)
    return p


def add_heading(doc: Document, text: str, level: int):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(12 if level == 1 else 9)
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.15
    if level == 1:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(text.upper())
        set_font(r, 13, bold=True)
    elif level == 2:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(text)
        set_font(r, 12, bold=True)
    else:
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(text)
        set_font(r, 12, bold=True, italic=True)
    return p


def add_bullet(doc: Document, text: str, level: int = 0):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Cm(0.65 + level * 0.45)
    p.paragraph_format.first_line_indent = Cm(-0.35)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    r = p.add_run(text)
    set_font(r)
    return p


def add_caption(doc: Document, number: int, text: str):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(f"Hình 2.{number}: ")
    set_font(r, 11, bold=True)
    r = p.add_run(text)
    set_font(r, 11)
    return p


def add_table(doc: Document, headers: list[str], rows: list[list[str]], widths: list[float] | None = None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    header = table.rows[0]
    set_repeat_table_header(header)
    for i, value in enumerate(headers):
        cell = header.cells[i]
        cell.text = ""
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        set_cell_shading(cell, BLUE)
        set_cell_border(cell)
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        r = p.add_run(value)
        set_font(r, 10.5, bold=True)
        r.font.color.rgb = RGBColor(255, 255, 255)
    for row_index, values in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(values):
            cell = cells[i]
            cell.text = ""
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_shading(cell, "FFFFFF" if row_index % 2 == 0 else PALE_BLUE)
            set_cell_border(cell)
            set_cell_margins(cell)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER if i == 0 and len(value) <= 18 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            r = p.add_run(value)
            set_font(r, 10.5)
    if widths:
        for row in table.rows:
            for cell, width in zip(row.cells, widths):
                cell.width = Inches(width)
    doc.add_paragraph().paragraph_format.space_after = Pt(3)
    return table


FONT_PATHS = [
    Path("C:/Windows/Fonts/times.ttf"),
    Path("C:/Windows/Fonts/arial.ttf"),
]


def image_font(size: int, bold: bool = False):
    candidates = ([Path("C:/Windows/Fonts/timesbd.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")] if bold else []) + FONT_PATHS
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def wrap_text(draw, text: str, font, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        proposal = word if not line else f"{line} {word}"
        if draw.textbbox((0, 0), proposal, font=font)[2] <= max_width:
            line = proposal
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines or [""]


def center_text(draw, box, text: str, font, fill=(0, 0, 0), max_width=None, spacing=4):
    x1, y1, x2, y2 = box
    max_width = max_width or (x2 - x1 - 16)
    lines = wrap_text(draw, text, font, max_width)
    line_heights = [draw.textbbox((0, 0), line, font=font)[3] for line in lines]
    total = sum(line_heights) + spacing * (len(lines) - 1)
    y = y1 + max(0, (y2 - y1 - total) // 2)
    for line, height in zip(lines, line_heights):
        w = draw.textbbox((0, 0), line, font=font)[2]
        draw.text((x1 + (x2 - x1 - w) // 2, y), line, font=font, fill=fill)
        y += height + spacing


def rounded(draw, box, fill, outline=(31, 78, 120), radius=18, width=3):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def arrow(draw, start, end, fill=(31, 78, 120), width=3):
    draw.line([start, end], fill=fill, width=width)
    x1, y1 = start
    x2, y2 = end
    dx, dy = x2 - x1, y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    tip = (x2, y2)
    base = (x2 - ux * 14, y2 - uy * 14)
    draw.polygon([tip, (base[0] + px * 6, base[1] + py * 6), (base[0] - px * 6, base[1] - py * 6)], fill=fill)


def actor(draw, center, label):
    x, y = center
    color = (31, 78, 120)
    draw.ellipse((x - 13, y, x + 13, y + 26), outline=color, width=3)
    draw.line((x, y + 26, x, y + 72), fill=color, width=3)
    draw.line((x - 30, y + 45, x + 30, y + 45), fill=color, width=3)
    draw.line((x, y + 72, x - 23, y + 100), fill=color, width=3)
    draw.line((x, y + 72, x + 23, y + 100), fill=color, width=3)
    center_text(draw, (x - 70, y + 108, x + 70, y + 145), label, image_font(21, True), max_width=140)


def save_image(name: str, draw_fn, size=(1600, 980)) -> Path:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", size, "white")
    draw = ImageDraw.Draw(image)
    draw_fn(draw, size)
    path = ASSET_DIR / name
    image.save(path, "PNG", optimize=True)
    return path


def use_case_overview(draw, size):
    w, h = size
    draw.rounded_rectangle((290, 55, w - 90, h - 55), radius=22, outline=(31, 78, 120), width=4)
    draw.text((320, 75), "HỆ THỐNG QUẢN LÝ PHÒNG GYM GYMHƯNG", font=image_font(28, True), fill=(31, 78, 120))
    actor(draw, (110, 150), "Quản trị viên")
    actor(draw, (110, 405), "Nhân viên")
    actor(draw, (110, 660), "Huấn luyện viên")
    actor(draw, (1470, 420), "Hội viên")
    cases = [
        (440, 150, "Quản lý tài khoản và phân quyền"),
        (730, 150, "Quản lý hội viên và huấn luyện viên"),
        (1020, 150, "Quản lý gói tập và thanh toán"),
        (440, 420, "Quản lý lịch tập, phòng và đặt chỗ"),
        (730, 420, "Điểm danh và check in"),
        (1020, 420, "Lập giáo án và ghi kết quả"),
        (560, 680, "Theo dõi tiến độ, AI và thông báo"),
        (940, 680, "Quản lý thiết bị và nhật ký hoạt động"),
    ]
    for x, y, label in cases:
        box = (x - 120, y - 48, x + 120, y + 48)
        rounded(draw, box, (238, 245, 251))
        center_text(draw, box, label, image_font(20), max_width=210)
    for y in (150, 420, 680):
        arrow(draw, (180, y + 45), (320, y + 45), width=2)
    for point in [(1350, 465), (1140, 420), (1140, 680)]:
        arrow(draw, (point[0], point[1]), (1415, 465), width=2)


def use_case_booking(draw, size):
    w, h = size
    draw.rounded_rectangle((260, 50, w - 80, h - 50), radius=22, outline=(31, 78, 120), width=4)
    draw.text((300, 72), "PHÂN HỆ LỊCH TẬP, ĐẶT CHỖ VÀ ĐIỂM DANH", font=image_font(27, True), fill=(31, 78, 120))
    actor(draw, (100, 230), "Hội viên")
    actor(draw, (100, 600), "Nhân viên")
    actor(draw, (1470, 410), "Huấn luyện viên")
    cases = [
        (510, 200, "Xem lịch tập"), (790, 200, "Đặt hoặc hủy chỗ"), (1080, 200, "Nhận thông báo"),
        (510, 470, "Tạo lịch tập"), (790, 470, "Cập nhật sức chứa"), (1080, 470, "Check in và check out"),
        (650, 700, "Ghi nhận điểm danh"), (970, 700, "Xem danh sách tham gia"),
    ]
    for x, y, label in cases:
        box = (x - 112, y - 42, x + 112, y + 42)
        rounded(draw, box, (238, 245, 251))
        center_text(draw, box, label, image_font(20), max_width=198)
    for a, b in [((175, 280), (395, 200)), ((175, 280), (675, 200)), ((175, 280), (970, 200)), ((175, 650), (395, 470)), ((175, 650), (965, 470)), ((1345, 460), (1195, 470)), ((1345, 460), (1080, 700))]:
        arrow(draw, a, b, width=2)


def use_case_workout(draw, size):
    w, h = size
    draw.rounded_rectangle((260, 50, w - 80, h - 50), radius=22, outline=(31, 78, 120), width=4)
    draw.text((300, 72), "PHÂN HỆ GIÁO ÁN, KẾT QUẢ VÀ TIẾN ĐỘ", font=image_font(27, True), fill=(31, 78, 120))
    actor(draw, (110, 210), "Huấn luyện viên")
    actor(draw, (110, 620), "Hội viên")
    cases = [
        (500, 190, "Quản lý bài tập"), (790, 190, "Lập giáo án"), (1080, 190, "Sắp xếp bài tập"),
        (500, 470, "Ghi kết quả tập"), (790, 470, "Ghi chỉ số tiến độ"), (1080, 470, "Xem biểu đồ tiến độ"),
        (640, 700, "Trò chuyện với trợ lý AI"), (980, 700, "Nhận gợi ý tập luyện"),
    ]
    for x, y, label in cases:
        box = (x - 112, y - 42, x + 112, y + 42)
        rounded(draw, box, (238, 245, 251))
        center_text(draw, box, label, image_font(20), max_width=198)
    for a, b in [((180, 265), (388, 190)), ((180, 265), (678, 190)), ((180, 265), (968, 190)), ((180, 675), (388, 470)), ((180, 675), (678, 470)), ((180, 675), (968, 470)), ((180, 675), (528, 700)), ((180, 675), (868, 700))]:
        arrow(draw, a, b, width=2)


def use_case_payment(draw, size):
    w, h = size
    draw.rounded_rectangle((260, 50, w - 80, h - 50), radius=22, outline=(31, 78, 120), width=4)
    draw.text((300, 72), "PHÂN HỆ GÓI TẬP VÀ THANH TOÁN", font=image_font(27, True), fill=(31, 78, 120))
    actor(draw, (100, 230), "Nhân viên")
    actor(draw, (100, 620), "Quản trị viên")
    actor(draw, (1470, 410), "Hội viên")
    cases = [
        (500, 190, "Quản lý gói tập"), (790, 190, "Cấp gói cho hội viên"), (1080, 190, "Ghi nhận thanh toán"),
        (500, 470, "Đối soát giao dịch"), (790, 470, "Xem lịch sử thanh toán"), (1080, 470, "Xem gói tập hiện có"),
        (785, 700, "Theo dõi trạng thái thanh toán"),
    ]
    for x, y, label in cases:
        box = (x - 112, y - 42, x + 112, y + 42)
        rounded(draw, box, (238, 245, 251))
        center_text(draw, box, label, image_font(20), max_width=198)
    for a, b in [((175, 280), (388, 190)), ((175, 280), (678, 190)), ((175, 280), (968, 190)), ((175, 670), (388, 470)), ((175, 670), (678, 470)), ((175, 670), (673, 700)), ((1345, 460), (1195, 470)), ((1345, 460), (897, 700))]:
        arrow(draw, a, b, width=2)


def sequence_login(draw, size):
    names = ["Người dùng", "Giao diện React", "API ASP.NET Core", "SQL Server"]
    xs = [160, 540, 980, 1380]
    for x, name in zip(xs, names):
        rounded(draw, (x - 115, 45, x + 115, 105), (221, 235, 247))
        center_text(draw, (x - 110, 50, x + 110, 100), name, image_font(20, True))
        draw.line((x, 108, x, 895), fill=(140, 140, 140), width=2)
    events = [
        (170, 0, 1, "Nhập tên đăng nhập và mật khẩu"),
        (280, 1, 2, "POST /api/auth/login"),
        (390, 2, 3, "Tra cứu Users, UserRoles, Permissions"),
        (500, 3, 2, "Trả tài khoản và vai trò hợp lệ"),
        (610, 2, 2, "Tạo JWT và dữ liệu phiên"),
        (720, 2, 1, "200 token, userId, role, permissions"),
        (830, 1, 0, "Lưu phiên cục bộ và chuyển đến trang phù hợp"),
    ]
    for y, source, target, label in events:
        arrow(draw, (xs[source], y), (xs[target], y))
        mid = (xs[source] + xs[target]) // 2
        draw.text((mid - 155, y - 34), label, font=image_font(17), fill=(0, 0, 0))
    draw.text((130, 925), "Nhánh lỗi: thông tin thiếu trả 400; tài khoản sai hoặc không hoạt động trả 401.", font=image_font(18, False), fill=(90, 90, 90))


def sequence_booking(draw, size):
    names = ["Hội viên", "Giao diện React", "API ASP.NET Core", "SQL Server"]
    xs = [160, 540, 980, 1380]
    for x, name in zip(xs, names):
        rounded(draw, (x - 115, 45, x + 115, 105), (221, 235, 247))
        center_text(draw, (x - 110, 50, x + 110, 100), name, image_font(20, True))
        draw.line((x, 108, x, 895), fill=(140, 140, 140), width=2)
    events = [
        (170, 0, 1, "Chọn buổi tập"),
        (280, 1, 2, "PUT /api/workspace/Bookings"),
        (390, 2, 3, "Kiểm tra lịch, trạng thái và chỗ còn lại"),
        (500, 3, 2, "Trả kết quả kiểm tra"),
        (610, 2, 3, "Tạo Booking, cập nhật số người tham gia"),
        (720, 3, 2, "Xác nhận giao dịch"),
        (830, 2, 1, "Trả booking đã xác nhận"),
        (900, 1, 0, "Hiển thị kết quả và thông báo"),
    ]
    for y, source, target, label in events:
        arrow(draw, (xs[source], y), (xs[target], y))
        mid = (xs[source] + xs[target]) // 2
        draw.text((mid - 160, y - 34), label, font=image_font(17), fill=(0, 0, 0))
    draw.text((120, 940), "Nếu lịch không hợp lệ, hết chỗ hoặc hội viên đã đặt, API trả lỗi nghiệp vụ và giao diện hiển thị thông báo.", font=image_font(17), fill=(90, 90, 90))


def activity_booking(draw, size):
    font = image_font(22)
    bold = image_font(22, True)
    center_x = size[0] // 2
    draw.ellipse((center_x - 18, 35, center_x + 18, 71), fill=(31, 78, 120))
    steps = [
        ("Hội viên chọn lịch tập", 105),
        ("Hệ thống kiểm tra trạng thái tài khoản và quyền đặt chỗ", 215),
        ("Kiểm tra lịch còn hiệu lực, còn chỗ và chưa có booking trùng", 325),
        ("Tạo booking đã xác nhận, cập nhật số người tham gia", 610),
        ("Trả kết quả và gửi thông báo", 735),
    ]
    for text, y in steps:
        rounded(draw, (center_x - 280, y, center_x + 280, y + 75), (238, 245, 251))
        center_text(draw, (center_x - 270, y + 4, center_x + 270, y + 70), text, font, max_width=530)
    for y1, y2 in [(71, 105), (180, 215), (290, 325), (685, 735)]:
        arrow(draw, (center_x, y1), (center_x, y2))
    arrow(draw, (center_x, 400), (center_x, 445))
    diamond = [(center_x, 445), (center_x + 130, 505), (center_x, 565), (center_x - 130, 505)]
    draw.polygon(diamond, fill=(255, 242, 204), outline=(31, 78, 120))
    center_text(draw, (center_x - 105, 475, center_x + 105, 540), "Đủ điều kiện?", bold, max_width=200)
    arrow(draw, (center_x + 130, 505), (center_x + 380, 505))
    rounded(draw, (center_x + 390, 460, center_x + 690, 550), (252, 228, 214), outline=(192, 80, 77))
    center_text(draw, (center_x + 400, 465, center_x + 680, 545), "Thông báo lý do không thể đặt", font, max_width=260)
    draw.text((center_x + 170, 475), "Không", font=image_font(18, True), fill=(192, 80, 77))
    draw.text((center_x + 22, 575), "Có", font=image_font(18, True), fill=(31, 78, 120))
    arrow(draw, (center_x, 565), (center_x, 610))
    draw.ellipse((center_x - 20, 875, center_x + 20, 915), outline=(31, 78, 120), width=4)
    arrow(draw, (center_x, 830), (center_x, 875))


def activity_checkin(draw, size):
    font = image_font(22)
    bold = image_font(22, True)
    cx = size[0] // 2
    draw.ellipse((cx - 18, 35, cx + 18, 71), fill=(31, 78, 120))
    steps = [
        ("Nhân viên chọn hội viên hoặc quét mã tại quầy", 115),
        ("Hệ thống kiểm tra trạng thái hội viên và gói tập", 250),
        ("Ghi thời gian check in hoặc check out", 505),
        ("Cập nhật trạng thái và nhật ký thao tác", 650),
    ]
    for text, y in steps:
        rounded(draw, (cx - 290, y, cx + 290, y + 78), (238, 245, 251))
        center_text(draw, (cx - 280, y + 4, cx + 280, y + 73), text, font, max_width=550)
    arrow(draw, (cx, 71), (cx, 115))
    arrow(draw, (cx, 193), (cx, 250))
    diamond = [(cx, 360), (cx + 130, 420), (cx, 480), (cx - 130, 420)]
    draw.polygon(diamond, fill=(255, 242, 204), outline=(31, 78, 120))
    center_text(draw, (cx - 105, 390, cx + 105, 450), "Gói còn hiệu lực?", bold, max_width=200)
    arrow(draw, (cx, 328), (cx, 360))
    arrow(draw, (cx, 480), (cx, 505))
    arrow(draw, (cx + 130, 420), (cx + 380, 420))
    rounded(draw, (cx + 390, 375, cx + 690, 465), (252, 228, 214), outline=(192, 80, 77))
    center_text(draw, (cx + 400, 380, cx + 680, 460), "Từ chối check in và nêu lý do", font, max_width=260)
    draw.text((cx + 170, 390), "Không", font=image_font(18, True), fill=(192, 80, 77))
    draw.text((cx + 22, 490), "Có", font=image_font(18, True), fill=(31, 78, 120))
    arrow(draw, (cx, 583), (cx, 650))
    draw.ellipse((cx - 20, 790, cx + 20, 830), outline=(31, 78, 120), width=4)
    arrow(draw, (cx, 728), (cx, 790))


def class_diagram(draw, size):
    font = image_font(18)
    bold = image_font(20, True)
    def cls(box, title, fields):
        x1, y1, x2, y2 = box
        draw.rectangle(box, fill=(255, 255, 255), outline=(31, 78, 120), width=3)
        draw.rectangle((x1, y1, x2, y1 + 40), fill=(31, 78, 120))
        center_text(draw, (x1 + 4, y1 + 3, x2 - 4, y1 + 38), title, bold, fill=(255, 255, 255))
        yy = y1 + 53
        for field in fields:
            draw.text((x1 + 12, yy), f"• {field}", font=font, fill=(0, 0, 0))
            yy += 27
    cls((50, 80, 355, 270), "Users", ["userId, username, email", "status, lastLoginAt", "1 - 1 Member / Trainer / Staff"])
    cls((425, 80, 700, 270), "Roles và Permissions", ["roleId, permissionId", "UserRoles", "RolePermissions"])
    cls((785, 65, 1100, 285), "Members và Trainers", ["MemberTrainers", "hồ sơ, mục tiêu", "chuyên môn, lịch làm việc"])
    cls((1195, 75, 1535, 275), "Packages và Payments", ["MemberPackages", "Payments", "PaymentTransactions"])
    cls((110, 600, 455, 835), "WorkoutSchedules và Bookings", ["Rooms", "capacity, currentParticipants", "Attendance, CheckIns"])
    cls((620, 570, 975, 850), "WorkoutPlans", ["WorkoutPlanDetails", "Exercises", "WorkoutResults, Progress"])
    cls((1130, 590, 1510, 835), "Hỗ trợ vận hành", ["Equipment, MaintenanceRecords", "Notifications, AuditLogs", "AIConversations, AIRecommendations"])
    rels = [
        ((355, 175), (425, 175), "n-n"), ((700, 175), (785, 175), "1-n"), ((1100, 175), (1195, 175), "1-n"),
        ((940, 285), (800, 570), "1-n"), ((260, 270), (285, 600), "1-n"), ((1300, 275), (1330, 590), "1-n"),
        ((455, 720), (620, 720), "n-1"), ((975, 710), (1130, 710), "1-n"),
    ]
    for start, end, label in rels:
        arrow(draw, start, end, width=2)
        mx, my = (start[0] + end[0]) // 2, (start[1] + end[1]) // 2
        draw.text((mx - 18, my - 18), label, font=image_font(15, True), fill=(31, 78, 120))
    draw.text((60, 915), "Sơ đồ lớp ở mức miền nghiệp vụ, rút gọn từ mô hình dữ liệu 34 bảng của hệ thống.", font=image_font(18), fill=(90, 90, 90))


def add_picture(doc: Document, image_path: Path, number: int, caption: str, width: float = 6.15):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(0)
    p.add_run().add_picture(str(image_path), width=Inches(width))
    add_caption(doc, number, caption)


def add_use_case_spec(doc: Document, number: str, name: str, actor_name: str, pre: str, main: Iterable[str], alt: str, post: str):
    add_heading(doc, f"{number}. {name}", 3)
    rows = [
        ["Tác nhân", actor_name],
        ["Tiền điều kiện", pre],
        ["Luồng chính", "\n".join(f"{i + 1}. {item}" for i, item in enumerate(main))],
        ["Ngoại lệ", alt],
        ["Hậu điều kiện", post],
    ]
    add_table(doc, ["Thuộc tính", "Mô tả"], rows, [1.4, 5.1])


def build_document():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11)
    sec.left_margin = Inches(1.25)
    sec.right_margin = Inches(1.0)
    sec.top_margin = Inches(0.58)
    sec.bottom_margin = Inches(0.78)

    for style in (doc.styles["Normal"], doc.styles["Body Text"], doc.styles["List Paragraph"]):
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
        style._element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(12)

    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.paragraph_format.space_before = Pt(6)
    footer.add_run("Trang ")
    set_font(footer.runs[0], 10)
    add_page_field(footer)
    set_update_fields(doc)

    add_title(doc, "PHÂN TÍCH HỆ THỐNG GYMHƯNG")
    add_heading(doc, "CHƯƠNG 2. PHÂN TÍCH HỆ THỐNG", 1)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(18)
    r = p.add_run("Đề tài: Xây dựng hệ thống quản lý phòng Gym GymHưng")
    set_font(r, 12, italic=True)

    paragraph(
        doc,
        "Chương này phân tích các tác nhân, chức năng, luồng xử lý và các lớp miền nghiệp vụ của hệ thống quản lý phòng Gym GymHưng. Nội dung được xây dựng từ phiên bản hiện có của dự án: giao diện React, API ASP.NET Core, cơ sở dữ liệu SQL Server, xác thực JWT và phân quyền theo vai trò.",
    )

    add_heading(doc, "2.1. Danh sách tác nhân", 2)
    paragraph(doc, "Hệ thống xác định bốn tác nhân chính. Mỗi tác nhân chỉ được tiếp cận các chức năng phù hợp với vai trò và phạm vi dữ liệu được cấp.")
    add_table(doc, ["Tác nhân", "Mô tả", "Nhóm chức năng chính"], [
        ["Quản trị viên", "Quản lý toàn bộ hệ thống, tài khoản, phân quyền và dữ liệu vận hành.", "Tài khoản; hội viên; nhân sự; gói tập; thanh toán; lịch; thiết bị; báo cáo; nhật ký."],
        ["Nhân viên", "Nhân sự vận hành quầy và hỗ trợ nghiệp vụ hằng ngày.", "Hội viên; gói tập; thanh toán; lịch; đặt chỗ; check in; thiết bị; thông báo."],
        ["Huấn luyện viên", "Theo dõi hội viên được giao và xây dựng quá trình tập luyện.", "Lịch cá nhân; giáo án; kết quả tập; chỉ số tiến độ; thông báo."],
        ["Hội viên", "Người sử dụng dịch vụ phòng gym thông qua khu vực cá nhân.", "Xem gói và lịch; đặt chỗ; ghi kết quả; xem tiến độ; nhận thông báo; dùng trợ lý AI."],
    ], [1.15, 2.15, 3.2])

    add_heading(doc, "2.2. Danh sách use case", 2)
    paragraph(doc, "Các use case được gom theo phân hệ để bảo đảm việc phân tích bám sát cấu trúc chức năng và mô hình dữ liệu của dự án.")
    add_table(doc, ["Nhóm", "Use case tiêu biểu", "Tác nhân"], [
        ["Xác thực và phân quyền", "Đăng nhập; đăng ký hội viên ở môi trường phát triển; cập nhật hồ sơ; kiểm soát truy cập theo quyền.", "Tất cả tác nhân; Quản trị viên."],
        ["Hồ sơ và nhân sự", "Quản lý hội viên; liên hệ khẩn cấp; huấn luyện viên; nhân viên; phân công huấn luyện viên.", "Quản trị viên; Nhân viên; Huấn luyện viên."],
        ["Gói tập và thanh toán", "Quản lý gói tập; cấp gói cho hội viên; ghi nhận thanh toán; theo dõi giao dịch.", "Quản trị viên; Nhân viên; Hội viên xem dữ liệu của mình."],
        ["Lịch và điểm danh", "Quản lý phòng; ca làm; lịch tập; đặt hoặc hủy chỗ; điểm danh; check in và check out.", "Quản trị viên; Nhân viên; Huấn luyện viên; Hội viên."],
        ["Tập luyện và tiến độ", "Quản lý bài tập; lập giáo án; sắp xếp bài tập; ghi kết quả; ghi chỉ số cơ thể; xem tiến độ.", "Huấn luyện viên; Hội viên; Quản trị viên."],
        ["Vận hành và hỗ trợ", "Quản lý thiết bị và bảo trì; thông báo; hội thoại AI; gợi ý AI; dự báo rời bỏ; nhật ký hoạt động.", "Quản trị viên; Nhân viên; Huấn luyện viên; Hội viên tùy phạm vi."],
    ], [1.35, 3.55, 1.6])

    add_heading(doc, "2.3. Biểu đồ use case", 2)
    add_heading(doc, "2.3.1. Use case tổng quát", 3)
    add_picture(doc, save_image("use_case_overview.png", use_case_overview), 1, "Use case tổng quát của hệ thống GymHưng")
    paragraph(doc, "Biểu đồ tổng quát thể hiện các nhóm chức năng cấp cao. Quản trị viên có phạm vi quản lý rộng nhất; nhân viên tập trung vào vận hành; huấn luyện viên phụ trách nghiệp vụ tập luyện; hội viên sử dụng các chức năng tự phục vụ trong phạm vi dữ liệu của mình.")

    add_heading(doc, "2.3.2. Use case lịch tập, đặt chỗ và điểm danh", 3)
    add_picture(doc, save_image("use_case_booking.png", use_case_booking), 2, "Use case lịch tập, đặt chỗ và điểm danh")
    paragraph(doc, "Khi đặt chỗ, hệ thống kiểm tra lịch tập, trạng thái và sức chứa trước khi xác nhận. Khi check in, hệ thống kiểm tra điều kiện hội viên và gói tập để hạn chế việc ghi nhận không hợp lệ.")

    add_heading(doc, "2.3.3. Use case giáo án, kết quả và tiến độ", 3)
    add_picture(doc, save_image("use_case_workout.png", use_case_workout), 3, "Use case giáo án, kết quả và tiến độ")

    add_heading(doc, "2.4. Đặc tả một số use case trọng tâm", 2)
    paragraph(doc, "Phần đặc tả lựa chọn các luồng trực tiếp ảnh hưởng đến phiên làm việc, lịch tập và trải nghiệm tập luyện của hội viên.")
    add_use_case_spec(doc, "2.4.1", "Đăng nhập", "Tất cả tác nhân", "Người dùng có tài khoản ở trạng thái hoạt động.", [
        "Người dùng nhập tên đăng nhập và mật khẩu.",
        "Giao diện gửi yêu cầu POST đến /api/auth/login.",
        "API kiểm tra thông tin tài khoản, trạng thái, vai trò và quyền.",
        "API tạo JWT, trả dữ liệu phiên; giao diện lưu phiên cục bộ và điều hướng người dùng.",
    ], "Thiếu dữ liệu trả 400; sai mật khẩu hoặc tài khoản không hoạt động trả 401.", "Người dùng có phiên hợp lệ và chỉ nhìn thấy các chức năng được cấp quyền.")
    add_use_case_spec(doc, "2.4.2", "Đặt lịch tập", "Hội viên", "Hội viên đã đăng nhập và có quyền đặt chỗ.", [
        "Hội viên xem danh sách lịch tập còn hiệu lực.",
        "Hội viên chọn một lịch và gửi yêu cầu tạo booking.",
        "Hệ thống kiểm tra lịch, sức chứa và booking trùng.",
        "Hệ thống tạo booking, cập nhật số người tham gia và trả kết quả.",
    ], "Lịch không hợp lệ, hết chỗ hoặc trùng booking thì hệ thống từ chối và nêu lý do.", "Booking được lưu ở trạng thái xác nhận; giao diện cập nhật kết quả.")
    add_use_case_spec(doc, "2.4.3", "Lập giáo án", "Huấn luyện viên", "Huấn luyện viên đã đăng nhập và có quyền với hội viên được phân công.", [
        "Huấn luyện viên chọn hội viên và tạo giáo án.",
        "Huấn luyện viên thêm các bài tập, số hiệp, số lần, mức tạ, thời gian nghỉ và thứ tự.",
        "Hệ thống kiểm tra dữ liệu liên kết và quyền ghi.",
        "Giáo án và chi tiết bài tập được lưu để hội viên theo dõi.",
    ], "Nếu hội viên hoặc bài tập không tồn tại, hoặc nằm ngoài phạm vi quyền, hệ thống từ chối thao tác.", "Giáo án khả dụng để ghi kết quả và theo dõi tiến độ.")
    add_use_case_spec(doc, "2.4.4", "Check in hội viên", "Nhân viên", "Nhân viên đã đăng nhập; hội viên tồn tại trong hệ thống.", [
        "Nhân viên chọn hội viên tại quầy.",
        "Hệ thống kiểm tra trạng thái hội viên và gói tập còn hiệu lực.",
        "Hệ thống tạo bản ghi check in kèm thời điểm và nguồn thực hiện.",
        "Khi rời phòng, nhân viên cập nhật check out cho bản ghi tương ứng.",
    ], "Tài khoản không hoạt động hoặc gói tập không hợp lệ thì không cho check in.", "Lịch sử ra vào được lưu để phục vụ vận hành.")
    add_use_case_spec(doc, "2.4.5", "Ghi nhận thanh toán gói tập", "Nhân viên", "Nhân viên đã đăng nhập; hội viên và gói tập đã tồn tại.", [
        "Nhân viên chọn hội viên, gói tập đã đăng ký và nhập số tiền thanh toán.",
        "Hệ thống đối chiếu hội viên với gói tập và kiểm tra quyền thao tác của nhân viên.",
        "Hệ thống lưu bản ghi thanh toán kèm phương thức, mã giao dịch, thời điểm và trạng thái.",
        "Khi có dữ liệu đối soát, hệ thống lưu giao dịch chi tiết liên kết với bản ghi thanh toán.",
    ], "Nếu gói tập không thuộc hội viên, số tiền không hợp lệ hoặc dữ liệu liên kết không tồn tại, hệ thống từ chối lưu.", "Thông tin thanh toán được lưu để phục vụ tra cứu, đối soát và thống kê doanh thu.")
    add_picture(doc, save_image("use_case_payment.png", use_case_payment), 4, "Use case gói tập và thanh toán")

    add_heading(doc, "2.5. Sơ đồ tuần tự", 2)
    paragraph(doc, "Sơ đồ tuần tự làm rõ trao đổi giữa người dùng, giao diện, API và cơ sở dữ liệu. Hai luồng dưới đây dùng đúng các điểm vào và các kiểm tra nghiệp vụ hiện có trong dự án.")
    add_heading(doc, "2.5.1. Sơ đồ tuần tự đăng nhập", 3)
    add_picture(doc, save_image("sequence_login.png", sequence_login), 5, "Sơ đồ tuần tự đăng nhập")
    add_heading(doc, "2.5.2. Sơ đồ tuần tự đặt lịch tập", 3)
    add_picture(doc, save_image("sequence_booking.png", sequence_booking), 6, "Sơ đồ tuần tự đặt lịch tập")

    add_heading(doc, "2.6. Sơ đồ hoạt động", 2)
    add_heading(doc, "2.6.1. Sơ đồ hoạt động đặt lịch tập", 3)
    add_picture(doc, save_image("activity_booking.png", activity_booking), 7, "Sơ đồ hoạt động đặt lịch tập")
    add_heading(doc, "2.6.2. Sơ đồ hoạt động check in", 3)
    add_picture(doc, save_image("activity_checkin.png", activity_checkin), 8, "Sơ đồ hoạt động check in hội viên")

    add_heading(doc, "2.7. Sơ đồ lớp miền nghiệp vụ", 2)
    paragraph(doc, "Sơ đồ lớp khái quát các nhóm thực thể chính. Nó rút gọn mô hình dữ liệu 34 bảng để thể hiện các liên kết quan trọng, thay vì liệt kê toàn bộ thuộc tính kỹ thuật.")
    add_picture(doc, save_image("class_diagram.png", class_diagram), 9, "Sơ đồ lớp miền nghiệp vụ của GymHưng")

    add_heading(doc, "Kết chương 2", 2)
    paragraph(doc, "Chương 2 đã xác định bốn tác nhân, các nhóm use case, các luồng đăng nhập, đặt lịch và check in, cùng mô hình lớp miền nghiệp vụ của GymHưng. Đây là cơ sở để trình bày thiết kế cơ sở dữ liệu ở chương tiếp theo và đối chiếu các giao diện triển khai với chức năng đã phân tích.")

    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build_document()
