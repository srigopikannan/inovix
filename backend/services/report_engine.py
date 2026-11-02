import csv
import io
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from ..config import REPORTS_DIR

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Unicode TrueType font to support Indian Rupee (₹) symbol
REPORT_FONT = "Helvetica"
REPORT_FONT_BOLD = "Helvetica-Bold"

for candidate_font, name_id in [("C:/Windows/Fonts/segoeui.ttf", "SegoeUI"), ("C:/Windows/Fonts/arial.ttf", "Arial")]:
    if os.path.exists(candidate_font):
        try:
            pdfmetrics.registerFont(TTFont(name_id, candidate_font))
            bold_candidate = candidate_font.replace(".ttf", "bd.ttf") if name_id == "Arial" else candidate_font.replace("segoeui.ttf", "segoeuib.ttf")
            if os.path.exists(bold_candidate):
                pdfmetrics.registerFont(TTFont(f"{name_id}-Bold", bold_candidate))
                REPORT_FONT_BOLD = f"{name_id}-Bold"
            else:
                REPORT_FONT_BOLD = name_id
            REPORT_FONT = name_id
            break
        except Exception:
            pass

def format_inr_text(amount: float) -> str:
    """Formats amount using Indian numbering system (e.g. ₹1,23,456.78)."""
    if amount is None:
        return "₹0.00"
    parts = f"{amount:.2f}".split(".")
    integer_part = parts[0]
    decimal_part = f".{parts[1]}"
    is_neg = integer_part.startswith("-")
    if is_neg:
        integer_part = integer_part[1:]
    if len(integer_part) > 3:
        last3 = integer_part[-3:]
        rem = integer_part[:-3]
        groups = []
        while len(rem) > 2:
            groups.insert(0, rem[-2:])
            rem = rem[:-2]
        if rem:
            groups.insert(0, rem)
        formatted = ",".join(groups) + "," + last3
    else:
        formatted = integer_part
    prefix = "-₹" if is_neg else "₹"
    return f"{prefix}{formatted}{decimal_part}"

class ReportEngine:
    """
    Enterprise Report Engine for ROADGUARD AI:
    Produces formal engineering audit documents in PDF and CSV formats.
    """

    NAVY_COLOR = colors.HexColor("#0B132B")
    BLUE_COLOR = colors.HexColor("#1C2541")
    ACCENT_BLUE = colors.HexColor("#2563EB")
    MUTED_GRAY = colors.HexColor("#64748B")
    BORDER_GRAY = colors.HexColor("#E2E8F0")

    @classmethod
    def generate_csv_report(cls, data: List[Dict[str, Any]], fieldnames: List[str], filename_prefix: str) -> str:
        """Writes CSV report and returns filepath."""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.csv"
        filepath = REPORTS_DIR / filename

        with open(filepath, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for row in data:
                writer.writerow(row)

        return f"/reports/{filename}"

    @classmethod
    def generate_pdf_report(
        cls,
        title: str,
        subtitle: str,
        corridor_info: Dict[str, Any],
        summary_metrics: List[Dict[str, str]],
        table_headers: List[str],
        table_rows: List[List[str]],
        methodology_text: str,
        filename_prefix: str
    ) -> str:
        """
        Builds a formal multi-page engineering PDF document using ReportLab.
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.pdf"
        filepath = REPORTS_DIR / filename

        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName=REPORT_FONT_BOLD,
            fontSize=18,
            leading=22,
            textColor=cls.NAVY_COLOR
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName=REPORT_FONT,
            fontSize=10,
            leading=14,
            textColor=cls.MUTED_GRAY
        )
        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Normal"],
            fontName=REPORT_FONT_BOLD,
            fontSize=12,
            leading=16,
            textColor=cls.NAVY_COLOR,
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName=REPORT_FONT,
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#1E293B")
        )
        legal_style = ParagraphStyle(
            "Legal",
            parent=styles["Normal"],
            fontName=REPORT_FONT,
            fontSize=7.5,
            leading=10,
            textColor=cls.MUTED_GRAY
        )

        story = []

        # Header Banner
        header_text = f"<b>ROADGUARD AI // INFRASTRUCTURE SAFETY INTELLIGENCE</b>"
        story.append(Paragraph(header_text, ParagraphStyle("TopTag", fontName=REPORT_FONT_BOLD, fontSize=8, textColor=cls.ACCENT_BLUE)))
        story.append(Spacer(1, 4))
        story.append(Paragraph(title, title_style))
        story.append(Paragraph(f"{subtitle} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=cls.NAVY_COLOR, spaceAfter=12))

        # Corridor Metadata Table
        corridor_data = [
            [Paragraph("<b>Corridor Name:</b>", body_style), Paragraph(str(corridor_info.get("name", "N/A")), body_style),
             Paragraph("<b>Route Code:</b>", body_style), Paragraph(str(corridor_info.get("code", "N/A")), body_style)],
            [Paragraph("<b>Length:</b>", body_style), Paragraph(f"{corridor_info.get('length_km', 10.0)} km", body_style),
             Paragraph("<b>Authority:</b>", body_style), Paragraph(str(corridor_info.get("authority", "State Highway Authority")), body_style)]
        ]
        meta_table = Table(corridor_data, colWidths=[90, 180, 90, 180])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, cls.BORDER_GRAY),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, cls.BORDER_GRAY),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 12))

        # Executive Metrics Summary Block
        story.append(Paragraph("EXECUTIVE SAFETY & INFRASTRUCTURE SUMMARY", section_heading))
        metrics_cells = []
        for m in summary_metrics:
            metrics_cells.append(
                Paragraph(f"<b>{m['label']}</b><br/><font size='12' color='#0B132B'><b>{m['value']}</b></font>", body_style)
            )
        # Pad to row of 4
        while len(metrics_cells) % 4 != 0:
            metrics_cells.append(Paragraph("", body_style))
        
        metrics_table_data = [metrics_cells[i:i+4] for i in range(0, len(metrics_cells), 4)]
        summary_table = Table(metrics_table_data, colWidths=[135, 135, 135, 135])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 1, cls.BORDER_GRAY),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, cls.BORDER_GRAY),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (0, 0), (-1, -1), "CENTER")
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 14))

        # Main Data Table
        story.append(Paragraph("DETAILED AUDIT RECORDS", section_heading))
        formatted_table = [[Paragraph(f"<b>{h}</b>", body_style) for h in table_headers]]
        for row in table_rows:
            formatted_table.append([Paragraph(str(cell), body_style) for cell in row])

        col_w = 540 / len(table_headers)
        data_table = Table(formatted_table, colWidths=[col_w] * len(table_headers), repeatRows=1)
        data_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B132B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BOX", (0, 0), (-1, -1), 0.5, cls.BORDER_GRAY),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, cls.BORDER_GRAY),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(data_table)
        story.append(Spacer(1, 14))

        # Methodology & Statutory Disclaimers
        story.append(Paragraph("STANDARDS, METHODOLOGY & STATUTORY NOTICE", section_heading))
        story.append(Paragraph(methodology_text, legal_style))
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            "OFFICIAL DISCLAIMER: Generated automatically by ROADGUARD AI Engineering Analytics Platform. "
            "Field verifications, physical traffic counts, and geotechnical core sampling should precede capital execution.",
            legal_style
        ))

        doc.build(story)
        return f"/reports/{filename}"
