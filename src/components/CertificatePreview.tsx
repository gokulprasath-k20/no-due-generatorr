import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Student, Mark, SUBJECTS_BY_YEAR, getSubjectsForYearSem } from '@/types';
import { Layout } from './Layout';
import { ArrowLeft, Download, Printer, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getSubjectColumnConfig } from '@/utils/subject-config';
import { api } from '@/utils/supabase-api';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

// College logo path
const collegeLogo = '/avs-college-logo.png';

interface CertificatePreviewProps {
  student: Student;
  marks: Mark[];
  onBack: () => void;
  onRefresh?: (newMarks: Mark[]) => void;
}

export function CertificatePreview({ student, marks, onBack, onRefresh }: CertificatePreviewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const subjects = getSubjectsForYearSem(student.year, student.semester);
  
  // Check if any subject needs marks columns (IAT1, IAT2, Model)
  const hasAnyMarksColumns = subjects.some(subject => getSubjectColumnConfig(subject).showMarks);
  // Check if any subject needs assignment column
  const hasAnyAssignmentColumns = subjects.some(subject => getSubjectColumnConfig(subject).showAssignment);
  // Check if any subject needs department fees column
  const hasAnyDepartmentFeesColumns = subjects.some(subject => getSubjectColumnConfig(subject).showDepartmentFees);
  // Check if any subject needs due status column
  const hasAnyDueStatusColumns = subjects.some(subject => getSubjectColumnConfig(subject).showDueStatus);
  
  // Debug logging
  console.log('Subjects:', subjects);
  console.log('Has marks columns:', hasAnyMarksColumns);
  console.log('Has assignment columns:', hasAnyAssignmentColumns);
  console.log('Has department fees columns:', hasAnyDepartmentFeesColumns);
  console.log('Has due status columns:', hasAnyDueStatusColumns);
  console.log('Marks data:', marks);
  
  const getDueStatusForSubject = (subject: string, mark: any): 'Completed' | 'Pending' => {
    if (!mark) return 'Pending';
    
    // For Office and Library, only check signature
    if (subject === 'Office' || subject === 'Library') {
      return mark.signed ? 'Completed' : 'Pending';
    }
    
    // For academic subjects, check assignment submission and department fees
    return mark.assignmentSubmitted && mark.departmentFine === 0 ? 'Completed' : 'Pending';
  };

  const getMarkForSubject = (subject: string) => {
    const mark = marks.find(mark => mark.subject === subject);
    // Create a default mark object if not found
    if (!mark) {
      return {
        id: '',
        student_id: '',
        subject,
        iat1: null,
        iat2: null,
        model: null,
        signed: false,
        assignmentSubmitted: false,
        departmentFine: 0,
        created_at: new Date().toISOString()
      };
    }
    // Ensure all required fields are present with proper defaults
    return {
      ...mark,
      signed: mark.signed ?? false,
      assignmentSubmitted: mark.assignmentSubmitted ?? false,
      departmentFine: mark.departmentFine ?? 0
    };
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
          font-size: 11px;
          page-break-inside: avoid;
          border: 1px solid #d1d5db;
        }
        #certificate th, #certificate td {
          padding: 6px 4px;
          border: 1px solid #d1d5db;
          text-align: center;
        }
        #certificate th {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
          font-weight: bold;
          font-size: 10px;
        }
        #certificate td {
          background-color: #ffffff !important;
          color: #374151 !important;
          font-size: 10px;
          height: 35px;
        }
        #certificate .bg-gradient-to-r {
          background: #f8fafc !important;
        }
        #certificate .rounded-full,
        #certificate .rounded-lg,
        #certificate .rounded-xl {
          border-radius: 4px !important;
        }
        #certificate .shadow-lg,
        #certificate .shadow-sm {
          box-shadow: none !important;
        }
        #certificate .border-4 {
          border-width: 2px !important;
        }
        #certificate .text-3xl {
          font-size: 1.5rem !important;
        }
        #certificate .text-4xl {
          font-size: 1.8rem !important;
        }
        .no-print, .no-print * {
          display: none !important;
        }
        @media print {
          #certificate .bg-blue-50,
          #certificate .bg-indigo-50,
          #certificate .bg-green-50,
          #certificate .bg-yellow-50,
          #certificate .bg-orange-50,
          #certificate .bg-purple-50,
          #certificate .bg-red-50 {
            background-color: #f9fafb !important;
          }
          #certificate .bg-blue-100,
          #certificate .bg-green-100,
          #certificate .bg-yellow-100,
          #certificate .bg-red-100,
          #certificate .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          #certificate .text-blue-600,
          #certificate .text-green-600,
          #certificate .text-yellow-600,
          #certificate .text-red-600,
          #certificate .text-gray-600 {
            color: #374151 !important;
          }
          #certificate .bg-blue-600,
          #certificate .bg-indigo-600 {
            background-color: #4b5563 !important;
            color: white !important;
          }
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      const { marks: refreshedMarks } = await api.getStudentByRegNo(student.register_number);
      onRefresh(refreshedMarks);
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
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
      <div className="container mx-auto p-4">
        {/* College Header Image */}
        <div className="mb-6 w-full">
          <img 
            src="/avs-college-header.png" 
            alt="AVS Engineering College"
            className="w-full h-auto max-h-40 object-contain mx-auto"
            onError={(e) => {
              // Fallback to text if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-center py-4';
              fallback.innerHTML = `
                <h1 className="text-2xl font-bold text-blue-800">AVS Engineering College</h1>
                <p className="text-gray-600">Salem, Tamil Nadu</p>
              `;
              target.parentNode?.insertBefore(fallback, target.nextSibling);
            }}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
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
        </div>

        {/* Certificate */}
        <Card id="certificate" className="p-4 sm:p-6 md:p-8 print:p-0 print:shadow-none print:border-0" style={{ 
          width: '100%',
          maxWidth: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          position: 'relative',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          overflowX: 'auto'
        }}>
          {/* Header with Official Logo */}
          <div className="text-center mb-8 print:mb-6 print:pt-8 print:px-8">
            {/* College Logo Header */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Left Logo */}
              <div className="w-16 h-16 flex-shrink-0">
                <div className="w-full h-full bg-orange-500 rounded-full flex items-center justify-center">
                  <div className="text-white font-bold text-lg">AVS</div>
                </div>
              </div>
              
              {/* College Name */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 tracking-wide">
                  AVS ENGINEERING COLLEGE
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Salem, Tamil Nadu
                </div>
              </div>
              
              {/* Right Logo */}
              <div className="w-16 h-16 flex-shrink-0">
                <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center">
                  <div className="text-white font-bold text-xs">LOGO</div>
                </div>
              </div>
            </div>
            
            {/* Department Header */}
            <div className="text-xl font-bold text-black mb-6 border-b-2 border-gray-300 pb-2">
              Department of Information Technology
            </div>
            
            {/* Certificate Title */}
            <h2 className="text-2xl font-bold text-black mb-6 underline">
              NO DUE CERTIFICATE
            </h2>
          </div>

          {/* Student Details */}
          <div className="mb-8 print:mb-6 print:px-8">
            <div className="flex justify-between items-start">
              {/* Left side */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-black mb-1">Name:</p>
                  <p className="text-base text-black">{student.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black mb-1">Register Number:</p>
                  <p className="text-base text-black">{student.register_number}</p>
                </div>
              </div>
              
              {/* Right side */}
              <div className="space-y-4 text-right">
                <div>
                  <p className="text-sm font-medium text-black mb-1">Date:</p>
                  <p className="text-base text-black">{new Date().toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-black mb-1">Year/Sem:</p>
                  <p className="text-base text-black">{student.year === 2 ? '2nd' : '3rd'} / {student.semester ? `${student.semester}th` : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mb-8 print:mb-6 print:px-8 print:mt-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-4 py-3 text-center font-medium text-sm text-black">Subject</th>
                    <th className="border border-gray-400 px-3 py-3 text-center font-medium text-sm text-black">IAT1</th>
                    <th className="border border-gray-400 px-3 py-3 text-center font-medium text-sm text-black">IAT2</th>
                    <th className="border border-gray-400 px-3 py-3 text-center font-medium text-sm text-black">Model</th>
                    <th className="border border-gray-400 px-3 py-3 text-center font-medium text-sm text-black">Assignment Submission</th>
                    <th className="border border-gray-400 px-3 py-3 text-center font-medium text-sm text-black">Department Fees</th>
                    <th className="border border-gray-400 px-3 py-3 text-center font-medium text-sm text-black">Status</th>
                    <th className="border border-gray-400 px-3 py-3 text-center font-medium text-sm text-black">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, index) => {
                    const mark = getMarkForSubject(subject);
                    const config = getSubjectColumnConfig(subject);
                    return (
                      <tr key={subject} className="bg-white">
                        <td className="border border-gray-400 px-4 py-3 text-left text-sm text-black">
                          {subject}
                        </td>
                        <td className="border border-gray-400 px-3 py-3 text-center text-sm text-black">
                          {config.showMarks ? (
                            mark?.iat1 !== null && mark?.iat1 !== undefined ? mark.iat1 : ''
                          ) : ''}
                        </td>
                        <td className="border border-gray-400 px-3 py-3 text-center text-sm text-black">
                          {config.showMarks ? (
                            mark?.iat2 !== null && mark?.iat2 !== undefined ? mark.iat2 : ''
                          ) : ''}
                        </td>
                        <td className="border border-gray-400 px-3 py-3 text-center text-sm text-black">
                          {config.showMarks ? (
                            mark?.model !== null && mark?.model !== undefined ? mark.model : ''
                          ) : ''}
                        </td>
                        <td className="border border-gray-400 px-3 py-3 text-center text-sm text-black">
                          {config.showAssignment ? (
                            mark?.assignmentSubmitted ? 'Submitted' : (
                              <span className="text-red-500 font-bold">X</span>
                            )
                          ) : ''}
                        </td>
                        <td className="border border-gray-400 px-3 py-3 text-center text-sm text-black">
                          {config.showDepartmentFees ? (
                            mark?.departmentFine === 0 ? 'Paid' : (
                              <span className="text-red-500 font-bold">X</span>
                            )
                          ) : ''}
                        </td>
                        <td className="border border-gray-400 px-3 py-3 text-center text-sm text-black">
                          {config.showDueStatus ? (
                            getDueStatusForSubject(subject, mark) === 'Completed' ? 'Completed' : (
                              <span className="text-red-500 font-bold">X</span>
                            )
                          ) : ''}
                        </td>
                        <td className="border border-gray-400 px-3 py-3 text-center text-sm text-black">
                          {mark?.signed ? '' : (
                            <span className="text-red-500 font-bold">X</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 print:mt-12 print:pt-6 print:px-8">
            <div className="flex justify-between items-end">
              <div className="text-center">
                <div className="w-32 border-b border-black mb-2"></div>
                <p className="text-sm font-medium text-black">CC Signature</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-black mb-2"></div>
                <p className="text-sm font-medium text-black">HOD Signature</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default CertificatePreview;