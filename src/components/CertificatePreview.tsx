import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Student, Mark, SUBJECTS_BY_YEAR } from '@/types';
import { Layout } from './Layout';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// College logo path
const collegeLogo = '/avs-college-logo.png';

interface CertificatePreviewProps {
  student: Student;
  marks: Mark[];
  onBack: () => void;
}

export function CertificatePreview({ student, marks, onBack }: CertificatePreviewProps) {
  const subjects = SUBJECTS_BY_YEAR[student.year as keyof typeof SUBJECTS_BY_YEAR];
  
  const getMarkForSubject = (subject: string) => {
    const mark = marks.find(mark => mark.subject === subject);
    // Ensure the mark has a signed property with a default of false if not present
    return mark ? { ...mark, signed: mark.signed ?? false } : undefined;
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm !important;
          min-height: 297mm !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body * {
          visibility: hidden;
        }
        #certificate, #certificate * {
          visibility: visible;
        }
        #certificate {
          position: relative;
          width: 210mm !important;
          min-height: 297mm !important;
          margin: 0 !important;
          padding: 10mm 15mm !important;
          box-sizing: border-box;
          background: white;
          box-shadow: none;
          font-size: 12px;
          line-height: 1.2;
          page-break-after: always;
        }
        #certificate h2 {
          font-size: 1.8em;
          margin: 0.5em 0;
        }
        #certificate table {
          width: 100% !important;
          border-collapse: collapse;
          font-size: 13px;
          page-break-inside: avoid;
          border: 2px solid #1e40af;
        }
        #certificate th, #certificate td {
          padding: 8px 12px;
          border: 1px solid #94a3b8;
        }
        #certificate th {
          background-color: #dbeafe;
          color: #1e40af;
          font-weight: 600;
        }
        #certificate tr:nth-child(even) {
          background-color: #f8fafc;
        }
        #certificate tr:hover {
          background-color: #f1f5f9;
        }
        .no-print, .no-print * {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('certificate');
    if (!element) return;

    // Get the dimensions of the content
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    
    // Calculate the aspect ratio for A4
    const a4Width = 210; // A4 width in mm
    const a4Height = 297; // A4 height in mm
    const imgWidth = a4Width - 20; // Add margins
    const imgHeight = (height * imgWidth) / width;

    // Create a canvas for the PDF
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add the image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(
      imgData,
      'PNG',
      10, // x position (10mm margin)
      10, // y position (10mm margin)
      imgWidth,
      imgHeight
    );

    // Save the PDF
    pdf.save(`no-due-certificate-${student.register_number}.pdf`);
  };

  return (
    <Layout showHeader={false}>
      <div className="max-w-4xl mx-auto space-y-4 print:max-w-none print:space-y-0 print:bg-white">
        {/* Control buttons */}
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Certificate */}
        <Card id="certificate" className="p-8 print:p-0 print:shadow-none print:border-0" style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          margin: '0 auto',
          position: 'relative',
          boxSizing: 'border-box',
          backgroundColor: 'white'
        }}>
          {/* Header */}
          <div className="text-center mb-6 print:mb-4 print:pt-8 print:px-8">
            <div className="flex flex-col items-center mb-4">
              <div className="text-2xl font-bold text-blue-800 mb-2">AVS Engineering College</div>
              <div className="w-32 h-1 bg-blue-600 mb-2"></div>
              <div className="text-sm text-gray-600">Salem, Tamil Nadu</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 print:text-3xl">
              NO DUE CERTIFICATE
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto mb-6 print:mb-4"></div>
          </div>

          {/* Student Details */}
          <div className="mb-8 print:mb-6 print:px-8">
            <div className="grid grid-cols-2 gap-8 print:gap-12">
              {/* Left side - Name and Register Number */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-base">{student.name}</p>
                </div>
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Register Number</p>
                  <p className="text-base font-mono">{student.register_number}</p>
                </div>
              </div>
              
              {/* Right side - Date, Department and Year */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-base">{new Date().toLocaleDateString()}</p>
                </div>
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-base">{student.department}</p>
                </div>
                <div className="border-b border-gray-200 pb-1">
                  <p className="text-xs text-gray-500">Year</p>
                  <p className="text-base">{student.year === 2 ? '2nd Year' : '3rd Year'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mb-6 print:mb-4 print:px-8 print:mt-8">
            <table className="w-full border-collapse border-2 border-gray-300 print:text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border-2 border-gray-300 px-4 py-3 text-left font-bold print:px-3 print:py-2">Subject</th>
                  <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold print:px-3 print:py-2">IAT1</th>
                  <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold print:px-3 print:py-2">IAT2</th>
                  <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold print:px-3 print:py-2">Model</th>
                  <th className="border-2 border-gray-300 px-4 py-3 text-center font-bold print:px-3 print:py-2">Signature</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const mark = getMarkForSubject(subject);
                  return (
                    <tr key={subject} className="hover:bg-gray-50">
                      <td className="border-2 border-gray-300 px-4 py-3 text-sm print:px-3 print:py-2">{subject}</td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm print:px-3 print:py-2">
                        {mark?.iat1 !== undefined ? mark.iat1 : '-'}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm print:px-3 print:py-2">
                        {mark?.iat2 !== undefined ? mark.iat2 : '-'}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm print:px-3 print:py-2">
                        {mark?.model !== undefined ? mark.model : '-'}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-3 text-center text-sm print:px-3 print:py-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${mark?.signed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {mark?.signed ? '✓' : '✗'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 print:mt-8 print:pt-6 print:px-8 print:absolute print:bottom-8 print:left-0 print:right-0">
            <div className="flex justify-between items-end">
              <div className="text-center">
                <div className="w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-sm font-medium">CC Signature</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-sm font-medium">HOD Signature</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}