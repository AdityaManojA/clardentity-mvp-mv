"""Reading a PDF that contains a table.

A PDF has no idea it contains a table. The text layer is a bag of
positioned strings, and plenty of generated documents lay a table out
column by column - every brand, then every volume, then every price - so
reading it in order gives "Price 640 780 210", a run of numbers with
nothing to say which belongs to which drink. That is how Kerala alcohol
prices came back: Bevco publishes them as PDF tables and this read them
linearly.

The fixture is built that way on purpose. A row-ordered table comes out of
the text layer correctly by luck, so a test built on one passes whether or
not table detection exists - which the first version of this file did.
"""

import io

import pytest

from app.services.document_ingestion import extract_pages

ROWS = [
    ("Brand", "Volume", "Price"),
    ("Jawan Rum", "750 ml", "640"),
    ("Old Monk", "750 ml", "780"),
    ("Honey Bee", "180 ml", "210"),
]


def _column_ordered_pdf() -> bytes:
    """A ruled price list whose cells are drawn column by column."""
    fpdf = pytest.importorskip("fpdf", reason="fpdf2 builds the fixture")
    pdf = fpdf.FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)
    pdf.set_xy(10, 10)
    pdf.cell(0, 8, "Price list, effective 1 April")
    for column, (x, width) in enumerate(((10, 70), (80, 40), (120, 30))):
        for index, row in enumerate(ROWS):
            pdf.set_xy(x, 24 + index * 8)
            # border=1 draws the rules that table detection follows.
            pdf.cell(width, 8, row[column], border=1)
    return bytes(pdf.output())


class TestATableSurvivesThePdf:
    def test_the_text_layer_alone_really_does_scramble_it(self):
        """The premise of the fix, pinned.

        If this ever stops being true the fixture has stopped reproducing
        the bug, and the test below is passing for the wrong reason.
        """
        from pypdf import PdfReader

        raw = _column_ordered_pdf()
        flat = PdfReader(io.BytesIO(raw)).pages[0].extract_text() or ""
        line_with_rum = next((ln for ln in flat.splitlines() if "Jawan Rum" in ln), "")
        assert "640" not in line_with_rum, (
            "the text layer kept the row together, so this fixture no longer "
            f"reproduces the bug:\n{flat}"
        )

    def test_each_row_keeps_its_own_columns(self):
        number, text = extract_pages(_column_ordered_pdf(), "pdf")[0]
        assert number == 1
        for brand, volume, price in ROWS[1:]:
            line = next(
                (ln for ln in text.splitlines() if brand in ln and price in ln), None
            )
            assert line is not None, f"{brand} and {price} never shared a line:\n{text}"
            assert volume in line, f"{brand} lost its volume column:\n{line}"

    def test_the_prose_around_the_table_is_kept_too(self):
        # Tables are appended to the text layer rather than replacing it:
        # the units, the date and the caveats live in the prose, and an
        # effective date is load-bearing on a price list.
        _, text = extract_pages(_column_ordered_pdf(), "pdf")[0]
        assert "effective 1 April" in text

    def test_a_pdf_with_no_table_still_reads(self):
        fpdf = pytest.importorskip("fpdf")
        pdf = fpdf.FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=12)
        pdf.cell(0, 10, "Just a sentence, ruled by nothing.")
        pages = extract_pages(bytes(pdf.output()), "pdf")
        assert "Just a sentence" in pages[0][1]

    def test_page_numbers_still_line_up(self):
        # Citations point at a page, so a table on page two must not shift
        # anything: the two readers are zipped by position and a mismatch
        # would quote the wrong page.
        fpdf = pytest.importorskip("fpdf")
        pdf = fpdf.FPDF()
        for n in (1, 2, 3):
            pdf.add_page()
            pdf.set_font("Helvetica", size=12)
            pdf.cell(0, 10, f"This is page {n}.")
        pages = extract_pages(bytes(pdf.output()), "pdf")
        assert [n for n, _ in pages] == [1, 2, 3]
        for n, text in pages:
            assert f"This is page {n}." in text

    def test_an_unreadable_pdf_does_not_hang_or_half_return(self):
        with pytest.raises(Exception):
            extract_pages(b"%PDF-1.4 this is not a pdf", "pdf")
