const express = require('express');
const router = express.Router();
const pool = require('../db');
const path = require('path');

// Intentar cargar pdfkit si está instalado
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  PDFDocument = null;
}

function periodRange(year, month) {
  const y = Number(year), m = Number(month);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

function fmtCOP(n) {
  try { return Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }); }
  catch { return `${n}`; }
}

router.get('/monthly/:userId/:year/:month', async (req, res) => {
  const { userId, year, month } = req.params;
  if (!PDFDocument) {
    return res.status(501).json({ error: 'PDF no disponible: falta dependencia pdfkit. Ejecuta npm install pdfkit en el backend.' });
  }
  try {
    const { start, end } = periodRange(year, month);
    const [incomesQ, expensesQ, userQ] = await Promise.all([
      pool.query('SELECT * FROM income WHERE user_id=$1 AND created_at >= $2 AND created_at < $3 ORDER BY created_at', [userId, start.toISOString(), end.toISOString()]),
      pool.query('SELECT * FROM expense WHERE user_id=$1 AND created_at >= $2 AND created_at < $3 ORDER BY created_at', [userId, start.toISOString(), end.toISOString()]),
      pool.query('SELECT first_name, last_name FROM user_account WHERE user_id=$1', [userId])
    ]);

    const incomes = incomesQ.rows || [];
    const expenses = expensesQ.rows || [];
    const userName = ((userQ.rows?.[0]?.first_name || '') + ' ' + (userQ.rows?.[0]?.last_name || '')).trim() || '—';

    const totalInc = incomes.reduce((a, c) => a + Number(c.amount || 0), 0);
    const totalExp = expenses.reduce((a, c) => a + Number(c.amount || 0), 0);
    const balance = totalInc - totalExp;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${year}-${String(month).padStart(2,'0')}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header con logo + marca
    const period = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const logoPath = path.resolve(__dirname, '..', '..', 'jermox-frontend-vite (1)', 'src', 'Logo_jermox.png');
    try {
      doc.image(logoPath, 50, 50, { width: 64, height: 64, fit: [64, 64] });
    } catch (_) {}
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#0a97a1').text('JERMOX FINANCE', 120, 55);
    doc.font('Helvetica').fontSize(10).fillColor('#3a3a3a').text('Financial & Tax Assistance • Education on Financial Intelligence', 120, 75);
    doc.font('Helvetica').fontSize(11).fillColor('#444').text(`Reporte mensual · ${period}`, 120, 95);
    doc.fontSize(10).text(`Usuario: ${userName}`, 120, 110);
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-CO')}`, 120, 124);
    // línea separadora
    doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#cccccc').lineWidth(1).stroke();
    doc.moveDown(2);

    // KPIs (cajas)
    const kpiY = doc.y + 5;
    const kpiW = 160, kpiH = 40, gap = 15;
    function kpiBox(x, title, value) {
      doc.roundedRect(x, kpiY, kpiW, kpiH, 6).fillAndStroke('#f7fbfb', '#e3f0f0');
      doc.fillColor('#5a6e6e').fontSize(10).text(title, x + 10, kpiY + 8);
      doc.fillColor('#0a97a1').font('Helvetica-Bold').fontSize(13).text(value, x + 10, kpiY + 22);
      doc.font('Helvetica');
    }
    kpiBox(50, 'Ingresos del período', fmtCOP(totalInc));
    kpiBox(50 + kpiW + gap, 'Egresos del período', fmtCOP(totalExp));
    kpiBox(50 + (kpiW + gap) * 2, 'Balance', fmtCOP(balance));
    doc.moveDown(5);

    // Tabla helper
    function table(title, rows) {
      const marginLeft = 50, tableWidth = 495;
      const headerH = 20, rowH = 18;
      const colW = [90, 130, 180, 95];
      const colX = [marginLeft, marginLeft + colW[0], marginLeft + colW[0] + colW[1], marginLeft + colW[0] + colW[1] + colW[2]];

      const safeY = () => doc.page.height - doc.page.margins.bottom - 40;
      const ensureSpace = (need) => { if (doc.y + need > safeY()) { doc.addPage(); } };

      doc.moveDown(0.5);
      ensureSpace(headerH + rowH * Math.max(1, rows.length) + 20);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#0a97a1').text(title, marginLeft, doc.y);
      doc.moveDown(0.2);

      // Header background
      const headY = doc.y + 4;
      doc.rect(marginLeft, headY, tableWidth, headerH).fill('#eef6f6');
      doc.fillColor('#3b4a4a').fontSize(10);
      doc.text('Fecha', colX[0] + 6, headY + 6);
      doc.text('Tipo', colX[1] + 6, headY + 6);
      doc.text('Categoría', colX[2] + 6, headY + 6);
      doc.text('Monto', colX[3] + 6, headY + 6, { width: colW[3] - 12, align: 'right' });
      // Border header
      doc.lineWidth(0.5).strokeColor('#cfdede').rect(marginLeft, headY, tableWidth, headerH).stroke();

      let y = headY + headerH;
      doc.font('Helvetica').fillColor('#111').fontSize(10);
      if (!rows.length) {
        doc.text('No hay registros para este período', marginLeft + 8, y + 6);
        y += rowH;
      } else {
        for (const r of rows) {
          ensureSpace(rowH + 6);
          // Row background zebra
          doc.rect(marginLeft, y, tableWidth, rowH).fillOpacity(0.02).fill('#0a97a1').fillOpacity(1);
          const dt = new Date(r.created_at || Date.now()).toLocaleDateString('es-CO');
          doc.fillColor('#111');
          doc.text(dt, colX[0] + 6, y + 5, { width: colW[0] - 12 });
          doc.text(String(r.type || ''), colX[1] + 6, y + 5, { width: colW[1] - 12 });
          doc.text(String(r.category || ''), colX[2] + 6, y + 5, { width: colW[2] - 12 });
          doc.text(fmtCOP(r.amount), colX[3] + 6, y + 5, { width: colW[3] - 12, align: 'right' });
          // Row border
          doc.strokeColor('#e7f0f0').rect(marginLeft, y, tableWidth, rowH).stroke();
          y += rowH;
        }
      }
      doc.moveDown(1.2);
    }

    table('Ingresos', incomes);
    doc.moveDown(0.6);
    table('Egresos', expenses);

    // Footer: nota + numeración de página
    doc.moveDown();
    const footerNote = 'Este documento es un reporte informativo generado por el sistema. Los montos están expresados en COP y corresponden al período indicado. Para fines tributarios consulte fuentes oficiales.';
    doc.fontSize(9).fillColor('#666').text(footerNote, { align: 'left' });
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).fillColor('#666').text(`Página ${i + 1} de ${range.count}`,
        0, doc.page.height - doc.page.margins.bottom + 10, { align: 'center' });
    }

    doc.end();
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
