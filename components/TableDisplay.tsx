import React, { useRef, useState } from 'react';
import { SituacioAprenentatge } from '../types';
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  TextRun, 
  AlignmentType,
  PageOrientation,
  HeadingLevel,
  VerticalAlign,
  PageBreak,
  ShadingType,
  BorderStyle
} from 'docx';
import saveAs from 'file-saver';

interface TableDisplayProps {
  data: SituacioAprenentatge;
  onEdit: (data: SituacioAprenentatge) => void;
}

export const TableDisplay: React.FC<TableDisplayProps> = ({ data, onEdit }) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  /**
   * Normalitza les competències al format estricte CE.X.
   */
  const formatCE = (text: string, index: number) => {
    if (!text) return `CE.${index + 1}.`;
    const cleanText = text.replace(/^(CE\.?\s*\d+\.?\s*:?|Competència\s*específica\s*\d+\.?\s*:?|CE\d+)\s*[-–—]?\s*/i, '').trim();
    return `CE.${index + 1}. ${cleanText}`;
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    const element = pdfRef.current;
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    element.classList.add('is-exporting-pdf');

    const opt = {
      margin: 0,
      filename: `Situacio_Aprenentatge_${titolNet}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        windowWidth: 1122, 
        scrollY: 0,
        x: 0,
        y: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: 'css' }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error PDF:", error);
      alert("Error al generar el PDF.");
    } finally {
      element.classList.remove('is-exporting-pdf');
      setIsExporting(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsExportingWord(true);
    const titolNet = data.identificacio.titol.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const createCell = (text: string, options: { 
      bold?: boolean, 
      width?: number, 
      isHeader?: boolean, 
      italic?: boolean, 
      align?: any,
      size?: number,
      vAlign?: any
    } = {}) => {
      const { 
        bold = false, 
        width = 100, 
        isHeader = false, 
        italic = false, 
        align = AlignmentType.LEFT, 
        size = 20,
        vAlign = VerticalAlign.CENTER
      } = options;
      
      return new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: text || "", bold, italics: italic, size, font: "Arial" })],
          spacing: { before: 140, after: 140 },
          alignment: align
        })],
        width: { size: width, type: WidthType.PERCENTAGE },
        verticalAlign: vAlign,
        shading: isHeader ? { fill: "F9FAFB", type: ShadingType.CLEAR } : undefined,
        margins: { left: 160, right: 160, top: 120, bottom: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        }
      });
    };

    const createSectionTitle = (text: string) => new Paragraph({
      children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })],
      spacing: { before: 400, after: 200 }
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: { size: { orientation: PageOrientation.LANDSCAPE } },
        },
        children: [
          new Paragraph({ 
            children: [new TextRun({ text: "Generalitat de Catalunya", bold: true, size: 28, font: "Arial" })] 
          }),
          new Paragraph({ 
            children: [new TextRun({ text: "Departament d’Educació", bold: true, size: 28, font: "Arial" })],
            spacing: { after: 600 } 
          }),
          new Paragraph({ 
            children: [new TextRun({ text: "Situació d’aprenentatge" })], 
            heading: HeadingLevel.HEADING_1, 
            alignment: AlignmentType.RIGHT, 
            spacing: { after: 1200 } 
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Títol", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.titol, { width: 75 })] }),
              new TableRow({ children: [createCell("Curs (Nivell educatiu)", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.curs, { width: 75 })] }),
              new TableRow({ children: [createCell("Àrea / Matèria / Àmbit", { bold: true, width: 25, isHeader: true }), createCell(data.identificacio.area_materia_ambit, { width: 75 })] }),
            ]
          }),
          new Paragraph({ children: [new PageBreak()] }),
          createSectionTitle("DESCRIPCIÓ (Context + Repte)"),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.descripcio.context_repte)] })] }),
          createSectionTitle("COMPETÈNCIES ESPECÍFIQUES"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("Competències específiques", { bold: true, width: 70, isHeader: true, align: AlignmentType.CENTER }), createCell("Àrea o matèria", { bold: true, width: 30, isHeader: true, align: AlignmentType.CENTER })] }),
              ...data.concrecio_curricular.competencies_especifiques.map((c, i) => 
                new TableRow({ children: [createCell(formatCE(c.descripcio, i), { width: 70 }), createCell(c.area_materia, { width: 30 })] })
              )
            ]
          }),
          createSectionTitle("TRACTAMENT DE LES COMPETÈNCIES TRANSVERSALS"),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [createCell(data.descripcio.competencies_transversals)] })] }),
          new Paragraph({ children: [new PageBreak()] }),
          createSectionTitle("OBJECTIUS D'APRENENTATGE I CRITERIS D'AVALUACIÓ"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("OBJECTIUS D'APRENENTATGE", { bold: true, width: 50, isHeader: true, align: AlignmentType.CENTER }), createCell("CRITERIS D'AVALUACIÓ", { bold: true, width: 50, isHeader: true, align: AlignmentType.CENTER })] }),
              new TableRow({ children: [
                createCell(data.concrecio_curricular.objectius.map((o, i) => `${i+1}. ${o}`).join("\n"), { width: 50 }),
                createCell(data.concrecio_curricular.criteris_avaluacio.map((cr, i) => `${cr.includes('.') ? '' : (i+1) + '. '}${cr}`).join("\n"), { width: 50 })
              ] })
            ]
          }),
          createSectionTitle("SABERS"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [createCell("#", { bold: true, width: 10, isHeader: true, align: AlignmentType.CENTER }), createCell("Saber", { bold: true, width: 60, isHeader: true, align: AlignmentType.CENTER }), createCell("Àrea o matèria", { bold: true, width: 30, isHeader: true, align: AlignmentType.CENTER })] }),
              ...data.concrecio_curricular.sabers.map((s, i) => 
                new TableRow({ children: [createCell((i