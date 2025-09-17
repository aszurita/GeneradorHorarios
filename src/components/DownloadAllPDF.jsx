import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function DownloadAllPDF() {
  const handleDownloadAll = async () => {
    const weekly = document.getElementById("weekly-schedule");
    const exam = document.getElementById("exam-schedule");
    if (!weekly || !exam) {
      alert("No se encontraron las secciones de horario.");
      return;
    }

    // Buscar las tablas internas
    const weeklyTable = weekly.querySelector("table");
    const examTable = exam.querySelector("table");
    if (!weeklyTable || !examTable) {
      alert("No se pudo localizar el contenido de las tablas de horario.");
      return;
    }

    try {
      console.log("Iniciando generación de PDF");
      // Crear PDF en orientación horizontal
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - (margin * 2);
      const imageScale = 0.8; // reduce ancho para que sea más proporcional

      // **PRIMERA PÁGINA: Horario Semanal**
      console.log("Capturando horario semanal");
      const weeklyCanvas = await html2canvas(weeklyTable, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true
      });

      const weeklyImgData = weeklyCanvas.toDataURL('image/jpeg', 0.95);
      const weeklyImgHeight = (weeklyCanvas.height * availableWidth) / weeklyCanvas.width;

      // Título semanal centrado y en negrita
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Horario Semanal', pageWidth / 2, margin + 5, { align: 'center' });
      pdf.setFont(undefined, 'normal');

      // Imagen semanal reducida y centrada
      const weeklyDrawWidth = availableWidth * imageScale;
      const weeklyDrawHeight = Math.min(
        weeklyImgHeight * imageScale,
        pageHeight - margin - 15
      );
      const weeklyX = (pageWidth - weeklyDrawWidth) / 2;
      const weeklyY = margin + 10;
      pdf.addImage(
        weeklyImgData,
        'JPEG',
        weeklyX,
        weeklyY,
        weeklyDrawWidth,
        weeklyDrawHeight
      );

      // **SEGUNDA PÁGINA: Horario de Exámenes**
      console.log("Capturando horario de exámenes");
      pdf.addPage(); // Nueva página

      const examCanvas = await html2canvas(examTable, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true
      });
      const examImgData = examCanvas.toDataURL('image/jpeg', 0.95);
      const examImgHeight = (examCanvas.height * availableWidth) / examCanvas.width;
      // Título exámenes centrado y en negrita
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Horario de Exámenes', pageWidth / 2, margin + 5, { align: 'center' });
      pdf.setFont(undefined, 'normal');

      // Imagen exámenes reducida y centrada
      const examDrawWidth = availableWidth * imageScale;
      const examDrawHeight = Math.min(
        examImgHeight * imageScale,
        pageHeight - margin - 15
      );
      const examX = (pageWidth - examDrawWidth) / 2;
      const examY = margin + 10;
      pdf.addImage(
        examImgData,
        'JPEG',
        examX,
        examY,
        examDrawWidth,
        examDrawHeight
      );
      // Guardar el PDF
      console.log("Guardando PDF...");
      pdf.save('Horario-ESPOL.pdf');
      
      console.log("PDF generado exitosamente");

    } catch (error) {
      console.error("Error detallado:", error);
      alert(`Error generando PDF: ${error.message}`);
    }
  };

  return (
    <button
      onClick={handleDownloadAll}
      className="text-white px-6 py-3 rounded flex items-center gap-3"
      style={{ backgroundColor: '#001c43' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#002a5c')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#001c43')}
      title="Descargar ambos horarios en un solo PDF"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
         className="w-7 h-7 block shrink-0 self-center"
      >
        <path d="M12 3a1 1 0 0 1 1 1v9.586l3.293-3.293a1 1 0 1 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-5-5A1 1 0 0 1 7.707 10.293L11 13.586V4a1 1 0 0 1 1-1zm-7 14a1 1 0 1 1 0-2h14a1 1 0 1 1 0 2H5z" />
      </svg>
  
      <span className="text-lg leading-none">Descargar</span>
    </button>
  );
  
}