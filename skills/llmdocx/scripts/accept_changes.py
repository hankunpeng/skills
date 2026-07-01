"""Accept all tracked changes in a DOCX file using pure Python (no LibreOffice).
"""

import argparse
import logging
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

# Register standard OpenXML namespaces
namespaces = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "m": "http://schemas.openxmlformats.org/officeDocument/2006/math",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "w14": "http://schemas.microsoft.com/office/word/2010/wordml",
    "w15": "http://schemas.microsoft.com/office/word/2012/wordml",
    "w16cex": "http://schemas.microsoft.com/office/word/2018/wordml/cex",
    "w16cid": "http://schemas.microsoft.com/office/word/2016/wordml/cid",
    "w16": "http://schemas.microsoft.com/office/word/2018/wordml",
    "w16du": "http://schemas.microsoft.com/office/word/2023/wordml/word16du",
    "w16sdtdh": "http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash",
    "w16sdtfl": "http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock",
    "w16se": "http://schemas.microsoft.com/office/word/2015/wordml/symex",
    "wpc": "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
    "cx": "http://schemas.microsoft.com/office/drawing/2014/chartex",
    "cx1": "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
    "cx2": "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
    "cx3": "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
    "cx4": "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
    "cx5": "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
    "cx6": "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
    "cx7": "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
    "cx8": "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
    "mc": "http://schemas.openxmlformats.org/markup-compatibility/2006",
    "aink": "http://schemas.microsoft.com/office/drawing/2016/ink",
    "am3d": "http://schemas.microsoft.com/office/drawing/2017/model3d",
    "o": "urn:schemas-microsoft-com:office:office",
    "oel": "http://schemas.microsoft.com/office/2019/extlst",
    "v": "urn:schemas-microsoft-com:vml",
    "wp14": "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
    "w10": "urn:schemas-microsoft-com:office:word",
    "wpg": "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
    "wpi": "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
    "wne": "http://schemas.microsoft.com/office/word/2006/wordml",
    "wps": "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
    "cr": "http://schemas.microsoft.com/office/comments/2020/reactions",
}

for prefix, uri in namespaces.items():
    ET.register_namespace(prefix, uri)

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W_DEL = f"{{{W_NS}}}del"
W_INS = f"{{{W_NS}}}ins"
W_MOVE_FROM = f"{{{W_NS}}}moveFrom"
W_MOVE_TO = f"{{{W_NS}}}moveTo"
W_P = f"{{{W_NS}}}p"
W_PPR = f"{{{W_NS}}}pPr"
W_RPR = f"{{{W_NS}}}rPr"

# Change tracking elements
W_PPR_CHANGE = f"{{{W_NS}}}pPrChange"
W_RPR_CHANGE = f"{{{W_NS}}}rPrChange"
W_TBLPR_CHANGE = f"{{{W_NS}}}tblPrChange"
W_TBLGRID_CHANGE = f"{{{W_NS}}}tblGridChange"
W_TRPR_CHANGE = f"{{{W_NS}}}trPrChange"
W_TCPR_CHANGE = f"{{{W_NS}}}tcPrChange"
W_SECTPR_CHANGE = f"{{{W_NS}}}sectPrChange"

# Range markers
W_MOVE_FROM_RANGE_START = f"{{{W_NS}}}moveFromRangeStart"
W_MOVE_FROM_RANGE_END = f"{{{W_NS}}}moveFromRangeEnd"
W_MOVE_TO_RANGE_START = f"{{{W_NS}}}moveToRangeStart"
W_MOVE_TO_RANGE_END = f"{{{W_NS}}}moveToRangeEnd"
W_CUSTOM_XML_INS_RANGE_START = f"{{{W_NS}}}customXmlInsRangeStart"
W_CUSTOM_XML_INS_RANGE_END = f"{{{W_NS}}}customXmlInsRangeEnd"
W_CUSTOM_XML_DEL_RANGE_START = f"{{{W_NS}}}customXmlDelRangeStart"
W_CUSTOM_XML_DEL_RANGE_END = f"{{{W_NS}}}customXmlDelRangeEnd"
W_CUSTOM_XML_MOVE_FROM_RANGE_START = f"{{{W_NS}}}customXmlMoveFromRangeStart"
W_CUSTOM_XML_MOVE_FROM_RANGE_END = f"{{{W_NS}}}customXmlMoveFromRangeEnd"
W_CUSTOM_XML_MOVE_TO_RANGE_START = f"{{{W_NS}}}customXmlMoveToRangeStart"
W_CUSTOM_XML_MOVE_TO_RANGE_END = f"{{{W_NS}}}customXmlMoveToRangeEnd"


def has_deleted_paragraph_mark(p_elem: ET.Element) -> bool:
    """Check if the paragraph mark itself is marked as deleted."""
    ppr = p_elem.find(W_PPR)
    if ppr is not None:
        rpr = ppr.find(W_RPR)
        if rpr is not None:
            del_elem = rpr.find(W_DEL)
            if del_elem is not None:
                return True
    return False


def set_deleted_paragraph_mark(p_elem: ET.Element, deleted: bool):
    """Set or remove paragraph mark deletion marker."""
    ppr = p_elem.find(W_PPR)
    if ppr is None:
        if not deleted:
            return
        ppr = ET.Element(W_PPR)
        p_elem.insert(0, ppr)

    rpr = ppr.find(W_RPR)
    if rpr is None:
        if not deleted:
            return
        rpr = ET.Element(W_RPR)
        ppr.append(rpr)

    del_elem = rpr.find(W_DEL)
    if deleted:
        if del_elem is None:
            rpr.append(ET.Element(W_DEL))
    else:
        if del_elem is not None:
            rpr.remove(del_elem)


def merge_deleted_paragraphs(container: ET.Element):
    """Merge paragraphs separated by deleted paragraph marks."""
    children = list(container)
    i = 0
    while i < len(children) - 1:
        elem = children[i]
        if elem.tag == W_P and has_deleted_paragraph_mark(elem):
            next_p_idx = i + 1
            if next_p_idx < len(children) and children[next_p_idx].tag == W_P:
                next_p = children[next_p_idx]
                next_p_deleted = has_deleted_paragraph_mark(next_p)

                # Merge next_p's children into elem
                for child in list(next_p):
                    if child.tag != W_PPR:
                        elem.append(child)

                # Update elem's paragraph mark deletion state to next_p's state
                set_deleted_paragraph_mark(elem, next_p_deleted)

                # Remove next_p
                container.remove(next_p)
                children.remove(next_p)
                continue
        i += 1


def merge_all_paragraphs(root: ET.Element):
    """Traverse the XML and merge deleted paragraph marks inside all containers."""
    for elem in root.iter():
        if any(child.tag == W_P for child in elem):
            merge_deleted_paragraphs(elem)


def process_element(elem: ET.Element) -> ET.Element | list[ET.Element] | None:
    """Recursively process tree nodes, accepting insertions/deletions and removing track markup."""
    tag = elem.tag

    # 1. Discard deleted elements
    if tag in (W_DEL, W_MOVE_FROM):
        return None

    # 2. Discard change tracking elements
    if tag in (
        W_PPR_CHANGE,
        W_RPR_CHANGE,
        W_TBLPR_CHANGE,
        W_TBLGRID_CHANGE,
        W_TRPR_CHANGE,
        W_TCPR_CHANGE,
        W_SECTPR_CHANGE,
    ):
        return None

    # 3. Discard range markers
    if tag in (
        W_MOVE_FROM_RANGE_START,
        W_MOVE_FROM_RANGE_END,
        W_MOVE_TO_RANGE_START,
        W_MOVE_TO_RANGE_END,
        W_CUSTOM_XML_INS_RANGE_START,
        W_CUSTOM_XML_INS_RANGE_END,
        W_CUSTOM_XML_DEL_RANGE_START,
        W_CUSTOM_XML_DEL_RANGE_END,
        W_CUSTOM_XML_MOVE_FROM_RANGE_START,
        W_CUSTOM_XML_MOVE_FROM_RANGE_END,
        W_CUSTOM_XML_MOVE_TO_RANGE_START,
        W_CUSTOM_XML_MOVE_TO_RANGE_END,
    ):
        return None

    # 4. Inline insertions (keep children, discard the wrapper tag)
    if tag in (W_INS, W_MOVE_TO):
        inlined = []
        for child in elem:
            res = process_element(child)
            if res is None:
                continue
            elif isinstance(res, list):
                inlined.extend(res)
            else:
                inlined.append(res)
        return inlined

    # 5. Regular elements: process children recursively
    new_children = []
    for child in elem:
        res = process_element(child)
        if res is None:
            continue
        elif isinstance(res, list):
            new_children.extend(res)
        else:
            new_children.append(res)

    elem[:] = new_children
    return elem


def accept_xml_changes(xml_data: bytes) -> bytes:
    """Accept tracked changes in raw XML data."""
    root = ET.fromstring(xml_data)

    # 1. Merge paragraphs with deleted paragraph marks
    merge_all_paragraphs(root)

    # 2. Process all other tracked changes recursively
    process_element(root)

    return ET.tostring(root, encoding="utf-8")


def accept_docx_changes(input_file: Path, output_file: Path):
    """Accept tracked changes in a DOCX archive."""
    with zipfile.ZipFile(input_file, "r") as jin:
        with zipfile.ZipFile(output_file, "w", zipfile.ZIP_DEFLATED) as jout:
            for item in jin.infolist():
                data = jin.read(item.filename)
                # Process XML files in the word/ directory
                if item.filename.startswith("word/") and item.filename.endswith(".xml"):
                    try:
                        # Extract XML declaration to preserve it
                        xml_decl = b""
                        if data.startswith(b"<?xml"):
                            end_idx = data.find(b"?>")
                            if end_idx != -1:
                                xml_decl = data[: end_idx + 2] + b"\n"

                        processed = accept_xml_changes(data)

                        if xml_decl and not processed.startswith(b"<?xml"):
                            data = xml_decl + processed
                        else:
                            data = processed
                    except Exception as e:
                        logger.warning(f"Failed to process {item.filename}: {e}")
                jout.writestr(item, data)


def accept_changes(
    input_file: str,
    output_file: str,
) -> tuple[None, str]:
    """Accept all tracked changes in a DOCX file."""
    input_path = Path(input_file)
    output_path = Path(output_file)

    if not input_path.exists():
        return None, f"Error: Input file not found: {input_file}"

    if not input_path.suffix.lower() == ".docx":
        return None, f"Error: Input file is not a DOCX file: {input_file}"

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        accept_docx_changes(input_path, output_path)
    except Exception as e:
        return None, f"Error: Failed to accept tracked changes: {e}"

    return (
        None,
        f"Successfully accepted all tracked changes: {input_file} -> {output_file}",
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Accept all tracked changes in a DOCX file"
    )
    parser.add_argument("input_file", help="Input DOCX file with tracked changes")
    parser.add_argument(
        "output_file", help="Output DOCX file (clean, no tracked changes)"
    )
    args = parser.parse_args()

    _, message = accept_changes(args.input_file, args.output_file)
    print(message)

    if "Error" in message:
        raise SystemExit(1)
