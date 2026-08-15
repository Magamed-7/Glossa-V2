"""
PDF export service for Glossa user data.
Generates a styled Neo-Retro Editorial PDF report.
"""
import io
from datetime import date, datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

from app.core.cefr_benchmarks import CEFR_VOCAB_BENCHMARK

# ── Brand colours ────────────────────────────────────────────────────────────
CRIMSON = colors.HexColor("#B90538")
CREAM = colors.HexColor("#FCF9F6")
BLACK = colors.HexColor("#0D0D0D")
LIGHT_GRAY = colors.HexColor("#E8E3DC")
WHITE = colors.white

PAGE_W, PAGE_H = A4

# Base-14 PDF fonts (Helvetica etc.) have no Cyrillic glyphs — every ru/tg string in
# this report was silently dropping to tofu/blank. Register a Unicode font (Noto
# Sans, OFL-licensed, bundled in app/data/fonts) covering Cyrillic + the extended
# Tajik letters (Ғ ғ Қ қ Ӯ ӯ Ҳ ҳ Ҷ ҷ), and use it everywhere instead.
_FONTS_DIR = Path(__file__).resolve().parents[1] / 'data' / 'fonts'
FONT_REGULAR = 'NotoSans'
FONT_BOLD = 'NotoSans-Bold'

if FONT_REGULAR not in pdfmetrics.getRegisteredFontNames():
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(_FONTS_DIR / 'NotoSans-Regular.ttf')))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, str(_FONTS_DIR / 'NotoSans-Bold.ttf')))
    pdfmetrics.registerFontFamily(FONT_REGULAR, normal=FONT_REGULAR, bold=FONT_BOLD)


def _draw_sunburst(canvas, doc):
    """Draw the crimson/white sunburst background behind the page."""
    canvas.saveState()

    cx = PAGE_W / 2
    cy = PAGE_H / 2
    radius = max(PAGE_W, PAGE_H) * 1.2

    import math

    n_rays = 24  # total slices → 12 crimson + 12 white
    angle_step = 360 / n_rays
    for i in range(n_rays):
        a1 = math.radians(i * angle_step - 90)
        a2 = math.radians((i + 1) * angle_step - 90)
        canvas.setFillColor(CRIMSON if i % 2 == 0 else WHITE)
        p = canvas.beginPath()
        p.moveTo(cx, cy)
        # approximate arc with many short segments
        steps = 20
        for s in range(steps + 1):
            frac = s / steps
            angle = a1 + frac * (a2 - a1)
            p.lineTo(cx + radius * math.cos(angle), cy + radius * math.sin(angle))
        p.close()
        canvas.drawPath(p, fill=1, stroke=0)

    # Cream page rectangle with thick black border + offset shadow
    margin = 15 * mm
    rx = margin
    ry = margin
    rw = PAGE_W - 2 * margin
    rh = PAGE_H - 2 * margin

    # Shadow
    canvas.setFillColor(BLACK)
    canvas.rect(rx + 5, ry - 5, rw, rh, fill=1, stroke=0)

    # Page background
    canvas.setFillColor(CREAM)
    canvas.setStrokeColor(BLACK)
    canvas.setLineWidth(3)
    canvas.rect(rx, ry, rw, rh, fill=1, stroke=1)

    canvas.restoreState()


def _fmt_date(value) -> str:
    if value is None:
        return "—"
    if isinstance(value, (datetime, date)):
        return value.strftime("%d.%m.%Y")
    return str(value)[:10]


def _val(v, fallback="—"):
    if v is None:
        return fallback
    return str(v)


def _approx_vocab_size(profile: dict, languages: list) -> int:
    """Always returns a rough word-count estimate for the PDF, even if the user
    never took/confirmed the vocabulary-size test — falls back to the CEFR
    benchmark for their current target-language level."""
    confirmed = profile.get("estimated_vocabulary_size")
    if confirmed:
        return int(confirmed)

    target_level = None
    for lang in languages or []:
        if lang.get("is_target"):
            target_level = (lang.get("level") or "").upper()
            break

    return CEFR_VOCAB_BENCHMARK.get(target_level, CEFR_VOCAB_BENCHMARK["A1"])


def _lang_level_label(lang: dict) -> str:
    lvl = lang.get("level") or ""
    is_native = lvl.lower() in ("native", "родной", "а0")
    label = "Родной" if is_native else lvl.upper()
    return f"{lang.get('language', '?')} — {label}"


def build_pdf(export_data: dict, user: object) -> bytes:
    """
    Build a styled PDF from export_data (output of data_export.build_user_export)
    plus the raw user object (id, username, email, is_verified, created_at).
    Returns raw bytes.
    """
    buf = io.BytesIO()
    margin = 20 * mm
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=margin + 15 * mm,
        rightMargin=margin + 15 * mm,
        topMargin=margin + 15 * mm,
        bottomMargin=margin + 15 * mm,
        onFirstPage=_draw_sunburst,
        onLaterPages=_draw_sunburst,
    )

    styles = getSampleStyleSheet()

    # ── Custom styles ─────────────────────────────────────────────────────
    def _style(name, **kw):
        s = ParagraphStyle(name, parent=styles["Normal"], **kw)
        return s

    logo_style = _style("Logo", fontSize=26, textColor=CRIMSON, fontName=FONT_BOLD,
                         spaceAfter=0, leading=30)
    eyebrow_style = _style("Eyebrow", fontSize=8, textColor=BLACK, fontName=FONT_REGULAR,
                            spaceAfter=0, leading=10)
    title_style = _style("Title", fontSize=22, textColor=BLACK, fontName=FONT_BOLD,
                          spaceAfter=2, leading=26, spaceBefore=6)
    subtitle_style = _style("Subtitle", fontSize=9, textColor=BLACK, fontName=FONT_REGULAR,
                             spaceAfter=8, leading=12)
    block_label_style = _style("BlockLabel", fontSize=7, textColor=CRIMSON,
                                fontName=FONT_BOLD, spaceAfter=2, leading=9,
                                textTransform="uppercase")
    block_value_style = _style("BlockValue", fontSize=9, textColor=BLACK,
                                fontName=FONT_REGULAR, spaceAfter=1, leading=12)
    footer_style = _style("Footer", fontSize=7, textColor=BLACK, fontName=FONT_REGULAR,
                           leading=9)

    # ── Gather data ───────────────────────────────────────────────────────
    profile = export_data.get("profile", {})
    streak = export_data.get("streak", {})
    deck_stats = export_data.get("deck", {}).get("stats", {})
    achiev = export_data.get("achievements", [])
    subscription = export_data.get("subscription", {})
    wallet = export_data.get("wallet", {})
    stories = export_data.get("authored_stories", [])
    social = export_data.get("social", {})
    languages = export_data.get("languages", [])

    plan_code = subscription.get("plan_code") or "Free"
    balance = wallet.get("balance", 0)

    published_stories = [s for s in stories if not s.get("is_draft")]
    draft_stories = [s for s in stories if s.get("is_draft")]

    telegram_connected = "✓ подключён" if export_data.get("account", {}).get("telegram_chat_id") else "—"

    # ── Build flowables ───────────────────────────────────────────────────
    elems = []

    # ── Header row ────────────────────────────────────────────────────────
    header_data = [
        [Paragraph("GLOSSA", logo_style),
         Paragraph("ЭКСПОРТ ДАННЫХ", eyebrow_style)],
    ]
    header_table = Table(header_data, colWidths=["60%", "40%"])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elems.append(header_table)
    elems.append(HRFlowable(width="100%", thickness=2, color=BLACK, spaceAfter=6))

    # ── Title ─────────────────────────────────────────────────────────────
    username_display = _val(getattr(user, "username", None))
    plan_display = plan_code.replace("_", " ").title()
    today = datetime.now().strftime("%d.%m.%Y")

    elems.append(Paragraph("ОТЧЁТ ПОЛЬЗОВАТЕЛЯ", title_style))
    elems.append(Paragraph(
        f"{username_display}  ·  {plan_display}  ·  {today}",
        subtitle_style,
    ))
    elems.append(Spacer(1, 4 * mm))

    # ── Helper to build a data block cell ────────────────────────────────
    def _block(label: str, lines: list[str]) -> list:
        """Returns a list of Paragraph flowables for one info block."""
        cell = [Paragraph(label, block_label_style)]
        for line in lines:
            cell.append(Paragraph(line, block_value_style))
        return cell

    # ── 2-column grid of blocks ───────────────────────────────────────────
    lang_lines = [_lang_level_label(l) for l in languages] if languages else ["—"]

    unlocked = len([a for a in achiev if a.get("unlocked")]) if isinstance(achiev, list) else 0

    block_data = [
        [
            _block("ПРОФИЛЬ И ПРИВАТНОСТЬ", [
                f"Имя: {username_display}",
                f"Email: {_val(getattr(user, 'email', None))}",
                f"Регистрация: {_fmt_date(getattr(user, 'created_at', None))}",
                f"Email подтверждён: {'✓' if getattr(user, 'is_verified', False) else '✗'}",
            ]),
            _block("ЯЗЫКИ И ОБУЧЕНИЕ", lang_lines + [
                f"Цель: {_val(export_data.get('settings', {}).get('daily_goal'))} слов/день",
                f"Сложность: {_val(export_data.get('settings', {}).get('difficulty'))}",
            ]),
        ],
        [
            _block("ИСТОРИЯ СЕРИЙ", [
                f"Лучшая серия: {_val(streak.get('best_streak'))} дней",
                f"Текущая серия: {_val(streak.get('current_streak'))} дней",
                f"Последняя активность: {_fmt_date(streak.get('last_activity_date'))}",
            ]),
            _block("СЛОВАРНАЯ КОЛОДА", [
                f"Всего карточек: {_val(deck_stats.get('cards_total'))}",
                f"Слов выучено: {_val(deck_stats.get('learned_count'))}",
                f"Удержание: {_val(deck_stats.get('retention_rate'))}%",
                f"Примерный словарный запас: ~{_approx_vocab_size(profile, languages):,} слов".replace(",", " "),
            ]),
        ],
        [
            _block("ДОСТИЖЕНИЯ", [
                f"Получено: {unlocked} достижений",
                "★" * min(unlocked, 12) or "—",
            ]),
            _block("ПОДПИСКА И КОШЕЛЁК", [
                f"Тариф: {plan_display}",
                f"Баланс: {balance} TJS",
                f"Истекает: {_fmt_date(subscription.get('expires_at'))}",
            ]),
        ],
        [
            _block("ВАШИ ИСТОРИИ", [
                f"Опубликовано: {len(published_stories)}",
                f"Черновики: {len(draft_stories)}",
            ]),
            _block("СОЦИАЛЬНЫЕ СВЯЗИ", [
                f"Подписчики: {len(social.get('followers', []))}",
                f"Подписки: {len(social.get('following', []))}",
                f"Друзья: {len(social.get('friends', []))}",
            ]),
        ],
    ]

    col_w = (doc.width - 6 * mm) / 2
    CELL_STYLE = TableStyle([
        ("BOX", (0, 0), (-1, -1), 2, BLACK),
        ("BACKGROUND", (0, 0), (-1, -1), CREAM),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ])

    for row in block_data:
        t = Table([row], colWidths=[col_w, col_w], hAlign="LEFT")
        t.setStyle(CELL_STYLE)
        elems.append(t)
        elems.append(Spacer(1, 3 * mm))

    # ── Footer ─────────────────────────────────────────────────────────────
    elems.append(Spacer(1, 4 * mm))
    elems.append(HRFlowable(width="100%", thickness=1, color=BLACK, spaceAfter=4))
    elems.append(Paragraph(
        f"Glossa · glossa.app · Создано {today}",
        footer_style,
    ))

    doc.build(elems)
    buf.seek(0)
    return buf.read()
